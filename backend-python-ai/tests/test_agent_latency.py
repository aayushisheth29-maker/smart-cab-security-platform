"""Issue #9: local fast paths, bounded/cancellable AI calls and latency telemetry.

No live Gemini calls or API key required. SDK integration checks skip if the
optional LLM packages are absent; routing/fallback/cancellation tests still run.
"""
import asyncio
import builtins
import logging
import threading
import time
import uuid
from types import SimpleNamespace
from unittest.mock import Mock

import pytest
from fastapi.testclient import TestClient

import main

client = TestClient(main.app)


@pytest.fixture(autouse=True)
def isolated_agent(monkeypatch):
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    monkeypatch.delenv("GOOGLE_API_KEY", raising=False)
    monkeypatch.setattr(main, "_safety_agent", None)
    monkeypatch.setattr(main, "_safety_agent_error", None)
    monkeypatch.setattr(main, "_AGENT_CAPACITY", threading.BoundedSemaphore(4))
    monkeypatch.setattr(main, "_AGENT_TIMEOUT_SECONDS", 60.0)
    monkeypatch.setattr(main, "_AGENT_MODEL_TIMEOUT_SECONDS", 20.0)
    monkeypatch.setattr(main, "TRIPS", [])
    monkeypatch.setattr(main, "SHARE_LINKS", {})
    monkeypatch.setattr(main, "EMERGENCIES", [])
    monkeypatch.setattr(main, "SUPPORT_REQUESTS", [])
    monkeypatch.setattr(main, "_next_id", dict(main._next_id))
    monkeypatch.setattr(main, "_persist_core_data", lambda *args: None)
    main._RATE_BUCKETS.clear()
    yield
    main._RATE_BUCKETS.clear()


def _post(message, language="en", **kwargs):
    return client.post("/api/agent", json={"message": message, "language": language, **kwargs})


class FakeAgent:
    def __init__(self, reply="Your driver is on the way.", error=None):
        self.reply = reply
        self.error = error
        self.calls = []

    async def ainvoke(self, messages, config):
        self.calls.append((messages, config))
        if self.error is not None:
            raise self.error
        return {"messages": [{"content": self.reply}]}


# All informational UI chips, NOT the imperative report-driver chip.
QUICK_FAQS = [
    (suggestions[index], lang, intent)
    for lang, suggestions in main._ASSISTANT_SUGGESTIONS.items()
    for index, intent in ((0, "book"), (1, "sos"), (3, "driver_app"), (4, "contact"))
]


@pytest.mark.parametrize("message,language,intent", QUICK_FAQS + [
    ("  HI!!! 👋  ", "en", "greeting"),
    ("Hello, how do I book a ride?", "en", "book"),
    ("how   are fares calculated?", "en", "fare"),
    ("What is SOS?", "en", "sos"),
    ("How do I cancel a ride?", "en", "cancel"),
    ("How do I report a driver?", "en", "report_driver"),
    ("How do I change the language?", "en", "language"),
    ("Thanks!", "en", "thanks"),
    ("Привет!", "ru", "greeting"),
    ("こんにちは！", "ja", "greeting"),
    ("你好！", "zh-CN", "greeting"),
    ("Bonjour !", "fr", "greeting"),
    ("Danke!", "de", "thanks"),
    ("Hello", "unsupported", "greeting"),
])
def test_fast_paths_never_initialize_or_call_gemini(monkeypatch, message, language, intent):
    initializer = Mock(side_effect=AssertionError("fast path must not load Gemini"))
    monkeypatch.setattr(main, "_get_safety_agent", initializer)
    # Preserve ride context even when the response itself is informational.
    main.TRIPS.append({"id": 99, "rideCode": "SC-99", "status": "IN_PROGRESS"})
    response = _post(message, language, rideCode="SC-99")
    assert response.status_code == 200, response.text
    body = response.json()
    lang = main._normalize_assistant_lang(language)
    assert body == {
        "reply": main._ASSISTANT_REPLIES[intent][lang],
        "engine": "scripted", "model": None, "fallbackReason": None,
        "language": lang, "activeRideCode": "SC-99",
        "suggestions": main._ASSISTANT_SUGGESTIONS[lang],
    }
    initializer.assert_not_called()
    assert main._safety_agent_error is None
    assert not main.EMERGENCIES and not main.SUPPORT_REQUESTS


@pytest.mark.parametrize("message,language", [
    ("Where is my driver?", "en"),
    ("What is the fare for my ride?", "en"),
    ("Book a ride for me from Gota to Saraspur", "en"),
    ("SOS", "en"),
    ("Hi, I'm scared; the driver is speeding", "en"),
    ("this driver is threatening me", "en"),  # contains the substring 'hi'
    ("Hey, share my live location with family", "en"),
    ("Contact support because my driver threatened me", "en"),
    ("Thanks, trigger SOS now", "en"),
    ("How do I book a ride? Also I feel unsafe, call for help", "en"),
    ("Is SOS real? Activate it now", "en"),
    ("Hello, I need to report the driver", "en"),
    ("你好，司机超速了，请帮我报警", "zh"),
    ("Bonjour, le chauffeur me menace", "fr"),
    ("Помогите, мне страшно", "ru"),
    ("助けて、危険です", "ja"),
    ("Hallo, ich brauche Hilfe, der Fahrer bedroht mich", "de"),
    ("Can you explain something not in the FAQ?", "en"),
] + [(suggestions[2], lang) for lang, suggestions in main._ASSISTANT_SUGGESTIONS.items()])
def test_actions_mixed_messages_and_unknowns_still_use_agent(monkeypatch, message, language):
    agent = FakeAgent()
    monkeypatch.setattr(main, "_safety_agent", agent)
    response = _post(message, language)
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["engine"] == "ai"
    assert body["reply"] == agent.reply
    assert body["fallbackReason"] is None
    assert body["model"] == main.GEMINI_MODEL
    assert len(agent.calls) == 1
    messages, config = agent.calls[0]
    assert messages["messages"][1][1].startswith(message + "\n\n[Context]")
    assert config["recursion_limit"] == 10
    assert config["metadata"]["agent_request_id"]


def test_missing_key_keeps_scripted_fallback():
    message = "Trigger SOS for my ride"
    response = _post(message)
    assert response.status_code == 200
    body = response.json()
    assert body["engine"] == "fallback"
    assert "GEMINI_API_KEY" in body["fallbackReason"]
    assert body["reply"] == main._scripted_assistant_reply(message, "en")[1]
    assert "not a phone call" in body["reply"]


def test_missing_optional_llm_packages_keeps_fallback(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "test-only-not-a-real-key")
    original_import = builtins.__import__

    def missing_import(name, *args, **kwargs):
        if name.startswith("langchain_core"):
            raise ModuleNotFoundError("langchain_core is not installed")
        return original_import(name, *args, **kwargs)

    monkeypatch.setattr(builtins, "__import__", missing_import)
    response = _post("Where is my driver?")
    assert response.status_code == 200
    assert response.json()["engine"] == "fallback"
    assert "not installed" in response.json()["fallbackReason"]
    assert response.json()["reply"]


@pytest.mark.parametrize("error,reason", [
    (RuntimeError("upstream unavailable"), "agent_error"),
    (TimeoutError(), "agent_timeout"),  # str(TimeoutError()) is empty in the production logs
])
def test_failures_have_explicit_reason_and_timing_and_release_capacity(monkeypatch, caplog, error, reason):
    monkeypatch.setattr(main, "_AGENT_CAPACITY", threading.BoundedSemaphore(1))
    monkeypatch.setattr(main, "_safety_agent", FakeAgent(error=error))
    with caplog.at_level(logging.INFO, logger="smartcab"):
        response = _post("Share my live location")
    body = response.json()
    assert response.status_code == 200
    assert body["engine"] == "fallback" and body["fallbackReason"] == reason
    assert body["reply"] == main._scripted_assistant_reply("Share my live location", "en")[1]
    assert f"error_type={type(error).__name__}" in caplog.text
    assert "elapsed_ms=" in caplog.text and "request_id=" in caplog.text
    monkeypatch.setattr(main, "_safety_agent", FakeAgent())
    assert _post("Where is my driver?").json()["engine"] == "ai"


def test_deadline_cancels_slow_agent_before_late_steps(monkeypatch):
    cancelled = threading.Event()
    late_action = threading.Event()

    class SlowAgent:
        async def ainvoke(self, *args, **kwargs):
            try:
                await asyncio.sleep(10)
                late_action.set()
                return {"messages": [{"content": "too late"}]}
            except asyncio.CancelledError:
                cancelled.set()
                raise

    monkeypatch.setattr(main, "_AGENT_TIMEOUT_SECONDS", 0.03)
    monkeypatch.setattr(main, "_safety_agent", SlowAgent())
    started = time.monotonic()
    response = _post("Where is my driver?")
    assert time.monotonic() - started < 1.0  # no real 30/60-second waits in the suite
    assert response.status_code == 200
    assert response.json()["engine"] == "fallback"
    assert response.json()["fallbackReason"] == "agent_timeout"
    assert response.json()["reply"]
    assert cancelled.is_set()
    assert not late_action.is_set()
    monkeypatch.setattr(main, "_safety_agent", FakeAgent())
    assert _post("Where is my driver?").json()["engine"] == "ai"


def test_overload_falls_back_without_queueing_but_faqs_still_work(monkeypatch):
    capacity = threading.BoundedSemaphore(1)
    capacity.acquire()
    monkeypatch.setattr(main, "_AGENT_CAPACITY", capacity)
    initializer = Mock(side_effect=AssertionError("no queueing or model initialization under overload"))
    monkeypatch.setattr(main, "_get_safety_agent", initializer)
    try:
        response = _post("Where is my driver?")
        assert response.status_code == 200
        assert response.json()["fallbackReason"] == "agent_busy"
        assert response.json()["reply"]
        assert _post("Hi!").json()["engine"] == "scripted"
        initializer.assert_not_called()
    finally:
        capacity.release()


def test_empty_input_and_rate_limit_still_apply_to_fast_paths():
    assert _post("  ").status_code == 400
    main._RATE_BUCKETS.clear()
    for _ in range(8):
        assert _post("Hi").status_code == 200
    assert _post("Hi").status_code == 429


@pytest.mark.parametrize("model,thinking,temperature", [
    ("gemini-3.6-flash", {"thinking_level": "low"}, 1.0),
    ("models/gemini-3-flash-preview", {"thinking_level": "low"}, 1.0),
    ("gemini-3.1-pro-preview", {"thinking_level": "low"}, 1.0),
    ("gemini-2.5-flash", {"thinking_budget": 0}, 0.2),
    ("gemini-2.5-flash-lite", {"thinking_budget": 0}, 0.2),
    ("gemini-2.5-pro", {}, 0.2),
    ("gemini-2.0-flash", {}, 0.2),
])
def test_model_specific_thinking_settings(model, thinking, temperature):
    assert main._agent_model_options(model) == {
        "temperature": temperature, "timeout": 20.0, "max_retries": 1, **thinking,
    }


@pytest.mark.parametrize("value,expected", [
    (None, 60.0), ("45", 45.0), (" 12.5 ", 12.5), ("", 60.0),
    ("oops", 60.0), ("0", 60.0), ("-3", 60.0), ("nan", 60.0),
    ("inf", 60.0), ("-inf", 60.0),
])
def test_timeout_environment_validation(monkeypatch, value, expected):
    name = "SMARTCAB_AGENT_TIMEOUT_SECONDS"
    if value is None:
        monkeypatch.delenv(name, raising=False)
    else:
        monkeypatch.setenv(name, value)
    assert main._agent_timeout_setting(name, 60.0) == expected


def test_agent_constructor_applies_tuning_once_without_changing_model(monkeypatch):
    genai = pytest.importorskip("langchain_google_genai")
    prebuilt = pytest.importorskip("langgraph.prebuilt")
    monkeypatch.setenv("GEMINI_API_KEY", "test-only-not-a-real-key")
    monkeypatch.setattr(main, "GEMINI_MODEL", "gemini-3.6-flash")
    constructor, builder = Mock(), Mock()
    monkeypatch.setattr(genai, "ChatGoogleGenerativeAI", constructor)
    monkeypatch.setattr(prebuilt, "create_react_agent", builder)
    assert main._get_safety_agent() is builder.return_value
    assert main._get_safety_agent() is builder.return_value
    constructor.assert_called_once()
    kwargs = constructor.call_args.kwargs
    assert kwargs["model"] == "gemini-3.6-flash"
    assert kwargs["thinking_level"] == "low" and kwargs["temperature"] == 1.0
    assert kwargs["timeout"] == 20.0 and kwargs["max_retries"] == 1
    assert "thinking_budget" not in kwargs
    assert len(kwargs["callbacks"]) == 1
    assert len(builder.call_args.args[1]) == 5


@pytest.mark.parametrize("model", ["gemini-3.6-flash", "gemini-2.5-flash"])
def test_real_sdk_serializes_thinking_timeout_and_no_retries(model):
    genai = pytest.importorskip("langchain_google_genai")
    from langchain_core.messages import HumanMessage

    # Construct/serialize only; never send an HTTP request. Guards against an SDK
    # silently ignoring unknown kwargs or seconds being passed as milliseconds.
    llm = genai.ChatGoogleGenerativeAI(
        model=model, api_key="test-only-not-a-real-key", vertexai=False,
        **main._agent_model_options(model),
    )
    config = llm._prepare_request([HumanMessage(content="test")])["config"]
    assert config.http_options.timeout == 20_000
    assert config.http_options.retry_options.attempts == 1
    if model.startswith("gemini-3"):
        assert config.thinking_config.thinking_level.value.lower() == "low"
    else:
        assert config.thinking_config.thinking_budget == 0


def test_step_telemetry_logs_counts_not_thoughts_or_messages(caplog):
    pytest.importorskip("langchain_core")
    handler = main._agent_latency_callback()
    run_id = uuid.uuid4()
    message = SimpleNamespace(
        content=[{"type": "thinking", "thinking": "SECRET-THOUGHT", "signature": "SECRET-SIGNATURE"}],
        usage_metadata={"output_tokens": 50, "output_token_details": {"reasoning": 12}},
    )
    with caplog.at_level(logging.INFO, logger="smartcab"):
        handler.on_chat_model_start({}, ["SECRET-USER-MESSAGE"], run_id=run_id,
                                    metadata={"agent_request_id": "test-run", "langgraph_step": 1})
        handler.on_llm_end(SimpleNamespace(generations=[[SimpleNamespace(message=message)]]), run_id=run_id)
        handler.on_chat_model_start({}, [], run_id=run_id, metadata={"agent_request_id": "test-run"})
        handler.on_llm_error(TimeoutError(), run_id=run_id)
    assert "output_tokens=50 reasoning_tokens=12" in caplog.text
    assert "request_id=test-run step=1 elapsed_ms=" in caplog.text
    assert "error_type=TimeoutError" in caplog.text
    assert "SECRET-" not in caplog.text
    assert not handler._starts


def test_real_langgraph_async_loop_still_executes_sos_tool(monkeypatch, caplog):
    pytest.importorskip("langgraph.prebuilt")
    from langchain_core.language_models.chat_models import BaseChatModel
    from langchain_core.messages import AIMessage
    from langchain_core.outputs import ChatGeneration, ChatResult
    from langgraph.prebuilt import create_react_agent
    from langchain_core.tools import tool

    class ToolCallingModel(BaseChatModel):
        calls: int = 0

        @property
        def _llm_type(self):
            return "test-async-model"

        def bind_tools(self, tools, **kwargs):
            return self

        def _generate(self, *args, **kwargs):
            raise AssertionError("must use native async model execution")

        async def _agenerate(self, *args, **kwargs):
            self.calls += 1
            if self.calls == 1:
                message = AIMessage(content="", tool_calls=[{
                    "id": "sos-test", "name": "agent_trigger_sos",
                    "args": {"ride_code": "SC-99", "reason": "rider is scared"},
                }])
            else:
                message = AIMessage(content="SOS fired for SC-99 and logged in the owner portal.")
            return ChatResult(generations=[ChatGeneration(message=message)])

    model = ToolCallingModel(callbacks=[main._agent_latency_callback()])
    graph = create_react_agent(model, [tool(main.agent_trigger_sos)])
    monkeypatch.setattr(main, "_safety_agent", graph)
    main.TRIPS.append({"id": 99, "rideCode": "SC-99", "status": "IN_PROGRESS"})
    with caplog.at_level(logging.INFO, logger="smartcab"):
        response = _post("Hi, I'm scared, trigger SOS", rideCode="SC-99")
    assert response.status_code == 200, response.text
    assert response.json()["engine"] == "ai"
    assert main.TRIPS[0]["status"] == "DANGER"
    assert len(main.EMERGENCIES) == 1
    assert model.calls == 2
    assert caplog.text.count("Safety agent LLM step") == 2
    assert "request_id=None" not in caplog.text


@pytest.mark.parametrize("failure", ["deadline", "sdk_timeout"])
def test_real_sdk_async_request_cancellation_and_network_fallback(monkeypatch, failure, caplog):
    genai = pytest.importorskip("langchain_google_genai")
    pytest.importorskip("langgraph.prebuilt")
    from google.genai.models import AsyncModels, Models
    from langchain_core.tools import tool
    from langgraph.prebuilt import create_react_agent
    from httpx import ReadTimeout

    cancelled = threading.Event()
    requests = []

    async def generate_content(*args, **kwargs):
        requests.append(kwargs)
        if failure == "sdk_timeout":
            raise ReadTimeout("")
        try:
            await asyncio.sleep(10)
        except asyncio.CancelledError:
            cancelled.set()
            raise

    monkeypatch.setattr(AsyncModels, "generate_content", generate_content)
    monkeypatch.setattr(Models, "generate_content", Mock(side_effect=AssertionError("sync I/O is forbidden")))
    llm = genai.ChatGoogleGenerativeAI(
        model="gemini-3.6-flash", api_key="test-only-not-a-real-key", vertexai=False,
        callbacks=[main._agent_latency_callback()], **main._agent_model_options("gemini-3.6-flash"),
    )
    graph = create_react_agent(llm, [tool(main.agent_trigger_sos)])
    monkeypatch.setattr(main, "_safety_agent", graph)
    monkeypatch.setattr(main, "_AGENT_TIMEOUT_SECONDS", 0.1)
    main.TRIPS.append({"id": 99, "rideCode": "SC-99", "status": "IN_PROGRESS"})
    with caplog.at_level(logging.INFO, logger="smartcab"):
        response = _post("Trigger SOS now", rideCode="SC-99")
    assert response.status_code == 200
    assert response.json()["engine"] == "fallback"
    assert response.json()["reply"] == main._scripted_assistant_reply("Trigger SOS now", "en")[1]
    assert len(requests) == 1
    assert requests[0]["config"].http_options.timeout == 20_000
    if failure == "deadline":
        assert cancelled.is_set()
        assert response.json()["fallbackReason"] == "agent_timeout"
    else:
        assert response.json()["fallbackReason"] == "agent_error"
        assert "error_type=ReadTimeout" in caplog.text
    assert main.TRIPS[0]["status"] == "IN_PROGRESS"
    assert not main.EMERGENCIES  # no late graph step can fire SOS after fallback


def test_four_in_flight_calls_do_not_block_fast_paths_or_health(monkeypatch):
    import httpx

    async def scenario():
        all_started, release = asyncio.Event(), asyncio.Event()

        class WaitingAgent:
            calls = 0

            async def ainvoke(self, *args, **kwargs):
                self.calls += 1
                if self.calls == 4:
                    all_started.set()
                await release.wait()
                return {"messages": [{"content": "Done"}]}

        agent = WaitingAgent()
        monkeypatch.setattr(main, "_safety_agent", agent)
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=main.app), base_url="http://test") as ac:
            pending = [asyncio.create_task(ac.post("/api/agent", json={"message": "Where is my driver?"}))
                       for _ in range(4)]
            try:
                await asyncio.wait_for(all_started.wait(), timeout=1)
                overloaded = await ac.post("/api/agent", json={"message": "Share my location"})
                assert overloaded.json()["fallbackReason"] == "agent_busy"
                faq = await ac.post("/api/agent", json={"message": "Is SOS real?"})
                assert faq.json()["engine"] == "scripted"
                assert (await ac.get("/api/health")).status_code == 200
                assert agent.calls == 4
            finally:
                release.set()
                responses = await asyncio.gather(*pending)
            assert all(response.json()["engine"] == "ai" for response in responses)

    asyncio.run(scenario())
