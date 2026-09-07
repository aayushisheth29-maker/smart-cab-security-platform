"""
Regression tests for the AI chatbot reply formatting fix.

Bug: ai_safety_agent did `str(last.content)`. Gemini 3+ via
langchain-google-genai returns `content` as a LIST of blocks
(e.g. [{'type': 'text', 'text': '...', 'extras': {'signature': ...}}]
plus internal thinking/reasoning blocks), so riders saw raw
dictionaries and thought signatures in the chat widget.

Fix: _extract_agent_reply_text() only keeps plain strings and blocks
whose type is exactly "text" (their `text` field only). Everything
else — thinking/reasoning/tool_use, extras, signatures, metadata —
is dropped, and the endpoint falls back to the scripted assistant
when no readable text remains.

Run:  pip install -r requirements-dev.txt && pytest tests/ -q
"""
import pytest
from fastapi.testclient import TestClient

import main as main_mod
from main import (
    app,
    USERS,
    TRIPS,
    EMERGENCIES,
    ROUTE_CHECKS,
    SHARE_LINKS,
    SUPPORT_REQUESTS,
    _extract_agent_reply_text,
)

client = TestClient(app)


@pytest.fixture(autouse=True)
def fresh_state():
    USERS.clear()
    TRIPS.clear()
    EMERGENCIES.clear()
    ROUTE_CHECKS.clear()
    SHARE_LINKS.clear()
    SUPPORT_REQUESTS.clear()
    from main import seed_samples, _RATE_BUCKETS, _drop_admin_credentials

    main_mod._safety_agent = None
    main_mod._safety_agent_error = None
    _RATE_BUCKETS.clear()
    _drop_admin_credentials()
    seed_samples(force=True)
    yield
    main_mod._safety_agent = None
    main_mod._safety_agent_error = None


# ---------------------------------------------------------------------------
# Helpers to fake the LangGraph agent without an LLM API key
# ---------------------------------------------------------------------------
class _FakeMessage:
    """Mimics langchain_core.messages.AIMessage (only .content matters)."""

    def __init__(self, content):
        self.content = content


class _FakeAgent:
    def __init__(self, content):
        self._content = content

    def invoke(self, *args, **kwargs):
        return {"messages": [_FakeMessage(self._content)]}


def _use_fake_agent(content):
    main_mod._safety_agent = _FakeAgent(content)
    main_mod._safety_agent_error = None


def _post_agent(message="Hello, is SOS real?"):
    return client.post("/api/agent", json={"message": message, "language": "en"})


BANNED_SUBSTRINGS = (
    "{'type'",
    '{"type"',
    '"type":',
    "'text':",
    "signature",
    "EpoWCpc",
    "SECRET-",
    "reasoning",
    "thinking",
    "internal chain-of-thought",
    "extras",
    "metadata",
    "thoughtSignature",
)


def _assert_no_leak(reply: str):
    lowered = reply.lower()
    for banned in BANNED_SUBSTRINGS:
        assert banned.lower() not in lowered, f"leaked {banned!r} in reply: {reply[:300]}"


# ---------------------------------------------------------------------------
# Unit tests for _extract_agent_reply_text
# ---------------------------------------------------------------------------
def test_extract_plain_string_passthrough():
    assert _extract_agent_reply_text("  Hello rider!  ") == "Hello rider!"
    assert _extract_agent_reply_text("") == ""
    assert _extract_agent_reply_text("   ") == ""


def test_extract_gemini3_text_block_with_signature():
    # Exact shape Gemini 3 returns via langchain-google-genai.
    content = [
        {"type": "text", "text": "Hello!", "extras": {"signature": "EpoWCpcSECRET-123"}}
    ]
    assert _extract_agent_reply_text(content) == "Hello!"


def test_extract_skips_thinking_and_reasoning_blocks():
    content = [
        {"type": "thinking", "thinking": "internal chain-of-thought, must stay hidden"},
        {"type": "text", "text": "Visible answer", "extras": {"signature": "SECRET-xyz"}},
        {"type": "reasoning", "reasoning": "more hidden reasoning"},
    ]
    reply = _extract_agent_reply_text(content)
    assert reply == "Visible answer"
    _assert_no_leak(reply)


def test_extract_ignores_non_text_block_types_and_metadata():
    content = [
        {"type": "tool_use", "name": "get_ride_status", "input": {"ride_code": "SC-1"}},
        {"type": "image", "source": "s3://bucket/photo.jpg"},
        {"type": "text", "text": "Safe answer"},
        {"foo": "bar", "metadata": {"model": "gemini-3.6-flash"}},
    ]
    reply = _extract_agent_reply_text(content)
    assert reply == "Safe answer"
    _assert_no_leak(reply)


def test_extract_mixed_str_and_text_blocks():
    content = [
        "Hello ",
        {"type": "text", "text": "rider!"},
        {"type": "reasoning", "reasoning": "hidden"},
    ]
    assert _extract_agent_reply_text(content) == "Hello rider!"


def test_extract_no_readable_text_returns_empty():
    assert _extract_agent_reply_text(None) == ""
    assert _extract_agent_reply_text([]) == ""
    assert _extract_agent_reply_text([{"type": "thinking", "thinking": "hmm"}]) == ""
    assert _extract_agent_reply_text([{"type": "reasoning", "reasoning": "hmm"}]) == ""
    # A bare dict must NEVER be str()-ified into the reply.
    assert _extract_agent_reply_text({"type": "text", "text": "not-a-list"}) == ""
    assert _extract_agent_reply_text(12345) == ""
    # text field must be a string; non-string text is ignored.
    assert _extract_agent_reply_text([{"type": "text", "text": None}]) == ""
    assert _extract_agent_reply_text([{"type": "text", "text": 42}]) == ""


def test_extract_object_style_blocks():
    class _Obj:
        def __init__(self, type_, text=""):
            self.type = type_
            self.text = text

    content = [_Obj("thinking", "hidden"), _Obj("text", "Object reply")]
    assert _extract_agent_reply_text(content) == "Object reply"


def test_extract_matches_langchain_text_when_available():
    """Our helper must agree with LangChain's AIMessage.text on real shapes."""
    pytest.importorskip("langchain_core.messages")
    from langchain_core.messages import AIMessage

    cases = [
        "plain hello",
        [{"type": "text", "text": "Hello!", "extras": {"signature": "EpoWCpcSECRET"}}],
        [
            {"type": "thinking", "thinking": "secret"},
            {"type": "text", "text": "Visible", "extras": {"signature": "s"}},
        ],
    ]
    for content in cases:
        expected = str(AIMessage(content=content).text).strip()
        assert _extract_agent_reply_text(content) == expected


# ---------------------------------------------------------------------------
# Endpoint tests with a mocked agent (no GEMINI_API_KEY needed)
# ---------------------------------------------------------------------------
def test_agent_endpoint_plain_string_still_works():
    _use_fake_agent("  Your driver is Rahul S.  ")
    res = _post_agent("Where is my driver?")
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["engine"] == "ai"
    assert body["reply"] == "Your driver is Rahul S."
    _assert_no_leak(body["reply"])


def test_agent_endpoint_structured_blocks_render_only_text():
    _use_fake_agent(
        [
            {"type": "thinking", "thinking": "internal chain-of-thought, must stay hidden"},
            {
                "type": "text",
                "text": "Your ride is on the way. 🚕",
                "extras": {"signature": "EpoWCpcSECRET-123"},
            },
            {"type": "reasoning", "reasoning": "hidden reasoning"},
        ]
    )
    res = _post_agent("Where is my driver?")
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["engine"] == "ai"
    assert body["reply"] == "Your ride is on the way. 🚕"
    _assert_no_leak(body["reply"])


def test_agent_endpoint_reasoning_only_falls_back_without_leak():
    _use_fake_agent(
        [
            {"type": "thinking", "thinking": "internal chain-of-thought"},
            {"type": "reasoning", "reasoning": "hidden", "extras": {"signature": "SECRET-1"}},
        ]
    )
    res = _post_agent("How do I book a ride?")
    assert res.status_code == 200, res.text
    body = res.json()
    # No readable text -> scripted fallback keeps the chatbot working.
    assert body["engine"] == "fallback"
    assert body["fallbackReason"] == "agent_error"
    assert "open the Ride tab" in body["reply"]
    _assert_no_leak(body["reply"])


def test_agent_endpoint_empty_and_garbage_content_falls_back():
    for bad in (None, "", "   ", [], {}, {"type": "text", "text": "x"}):
        _use_fake_agent(bad)
        res = _post_agent("How do I book a ride?")
        assert res.status_code == 200, res.text
        body = res.json()
        assert body["engine"] == "fallback", f"content={bad!r} gave {body}"
        _assert_no_leak(body["reply"])


def test_agent_endpoint_dict_message_shape_supported():
    """LangGraph may return plain dict messages; content must still be filtered."""

    class _DictAgent:
        def invoke(self, *args, **kwargs):
            return {
                "messages": [
                    {
                        "content": [
                            {"type": "text", "text": "Dict-shape reply"},
                            {"type": "thinking", "thinking": "hidden"},
                        ]
                    }
                ]
            }

    main_mod._safety_agent = _DictAgent()
    main_mod._safety_agent_error = None
    res = _post_agent("hi")
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["engine"] == "ai"
    assert body["reply"] == "Dict-shape reply"
    _assert_no_leak(body["reply"])
