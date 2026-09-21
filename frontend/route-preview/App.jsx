import { useEffect, useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";
import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  Bell,
  BookOpen,
  Check,
  CheckCheck,
  CheckCircle2,
  ChevronRight,
  Code2,
  Compass,
  Copy,
  CornerUpRight,
  Database,
  FlaskConical,
  Gauge,
  Info,
  LockKeyhole,
  Pause,
  Play,
  RotateCcw,
  Satellite,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Timer,
  TriangleAlert,
  Waypoints,
  WifiOff,
  X,
} from "lucide-react";
import { previewRequest } from "./api";
import RouteCanvas from "./RouteCanvas";
import "./styles.css";

const NAV = [
  { id: "monitor", label: "Route monitor", icon: Compass },
  { id: "model", label: "Model lab", icon: Sparkles },
  { id: "guide", label: "Build & learn", icon: BookOpen },
];
const scenarioIcons = {
  typical: Waypoints,
  detour: CornerUpRight,
  stop: Timer,
  weak_gps: Satellite,
};
const clock = (index) =>
  `${String(Math.floor((index * 10) / 60)).padStart(2, "0")}:${String((index * 10) % 60).padStart(2, "0")}`;

function Brand() {
  return (
    <div className="brand">
      <span className="brand-mark">
        <ShieldCheck size={25} strokeWidth={2.2} />
      </span>
      <span>
        SmartCab<span className="brand-sub">ROUTE LAB</span>
      </span>
    </div>
  );
}
function Tag({ children, tone = "", dot = false }) {
  return (
    <span className={`tag ${tone}`}>
      {dot && <span className="status-dot" />}
      {children}
    </span>
  );
}
function Stat({ icon: Icon, label, value, unit, detail }) {
  return (
    <div className="stat">
      <span className="stat-label">
        <Icon size={15} />
        {label}
      </span>
      <strong>
        {value ?? "—"}
        <small>{value != null && unit}</small>
      </strong>
      <span className="stat-detail">{detail}</span>
    </div>
  );
}
function Code({ children }) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);
  return (
    <div className="code-block">
      <pre>{children}</pre>
      <button
        aria-label="Copy command"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(children);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
          } catch {
            setError(true);
          }
        }}
      >
        {copied ? <Check size={16} /> : <Copy size={16} />}
      </button>
      {error && <small>Select and copy the command manually.</small>}
    </div>
  );
}
function CheckIn({ onClose, onChoice }) {
  const dialog = useRef(null);
  useEffect(() => {
    dialog.current.showModal();
  }, []);
  return (
    <dialog
      ref={dialog}
      className="checkin-dialog"
      onCancel={onClose}
      aria-labelledby="checkin-title"
    >
      <button
        className="dialog-close icon-button"
        aria-label="Close check-in"
        onClick={onClose}
      >
        <X size={20} />
      </button>
      <span className="dialog-icon">
        <Bell size={25} />
      </span>
      <Tag tone="yellow">SIMULATION ONLY</Tag>
      <h2 id="checkin-title">A check-in, not a conclusion.</h2>
      <p>
        A route change or a stop can have an ordinary explanation. This
        demonstrates a confirmation step without contacting anyone.
      </p>
      <button
        className="button primary wide"
        onClick={() =>
          onChoice("Demo check-in acknowledged locally. No messages were sent.")
        }
      >
        <CheckCheck size={18} />
        I’m okay — demo response
      </button>
      <button
        className="button secondary wide"
        onClick={() =>
          onChoice(
            "In a real emergency, contact your local emergency services directly. This preview did not call or notify anyone.",
          )
        }
      >
        <Info size={17} />
        See emergency guidance
      </button>
      <p className="dialog-footnote">
        <LockKeyhole size={13} />
        No police alerts, recordings, or vehicle controls.
      </p>
    </dialog>
  );
}

function Monitor({
  boot,
  scenario,
  index,
  setIndex,
  chooseScenario,
  playing,
  setPlaying,
  result,
  busy,
  error,
  navigate,
}) {
  const [dialog, setDialog] = useState(false);
  const [notice, setNotice] = useState("");
  const a = result?.assessment;
  const ml = result?.ml;
  const warning = a?.status === "check_in";
  const limited = a?.status === "insufficient_data" || !!error;
  const StatusIcon = warning ? Bell : limited ? Satellite : ShieldCheck;
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <span />A LITTLE CONTEXT GOES A LONG WAY
          </div>
          <h1>Every turn. More perspective.</h1>
          <p>Explore smarter route warnings, one practice ride at a time.</p>
        </div>
        <button
          className="button secondary desktop-button"
          onClick={() => navigate("guide")}
        >
          <BookOpen size={16} />
          How it works
          <ArrowUpRight size={15} />
        </button>
      </div>
      <div className="demo-notice">
        <FlaskConical size={17} />
        <span>
          <strong>A safe place to experiment.</strong> All GPS data is
          synthetic. No live rides, recordings, or emergency actions.
        </span>
        <Tag>PREVIEW</Tag>
      </div>
      <div
        id="route-observation-summary"
        className={`mobile-assessment-summary ${warning ? "summary-warning" : limited ? "summary-limited" : ""}`}
        aria-live="polite"
      >
        <StatusIcon size={23} />
        <div>
          <strong>
            {error
              ? "No assessment available"
              : busy
                ? "Reading this sample…"
                : a?.headline || "Loading observations"}
          </strong>
          <small>Rule-based observation · simulation only</small>
        </div>
        <button
          className="icon-button"
          aria-label="Read route observations"
          onClick={() =>
            document
              .getElementById("route-observations")
              ?.scrollIntoView({ behavior: "smooth", block: "center" })
          }
        >
          <ChevronRight size={20} />
        </button>
      </div>
      <div className="monitor-grid">
        <section className="trip-panel card">
          <div className="card-heading">
            <div className="section-icon">
              <Waypoints size={20} />
            </div>
            <div>
              <h2>Practice ride</h2>
              <p>Ahmedabad · illustrative city route</p>
            </div>
            <Tag tone="mint" dot>
              Demo trip
            </Tag>
          </div>
          <div className="trip-stops">
            <div>
              <span className="stop-mark start" />
              <span>
                <small>PICKUP</small>
                <strong>Sample pickup</strong>
              </span>
            </div>
            <span className="stops-line" />
            <div>
              <span className="stop-mark end" />
              <span>
                <small>DESTINATION</small>
                <strong>Sample drop-off</strong>
              </span>
            </div>
            <span className="trip-code">LAB–024</span>
          </div>
          <RouteCanvas
            key={scenario.id}
            scenario={scenario}
            index={index}
            warning={warning}
            playing={playing}
          />
          <div className="playback">
            <div className="playback-row">
              <button
                className="play-button"
                aria-label={playing ? "Pause replay" : "Play replay"}
                onClick={() => {
                  if (index >= scenario.samples.length - 1) setIndex(0);
                  setPlaying(!playing);
                }}
              >
                {playing ? (
                  <Pause size={17} fill="currentColor" />
                ) : (
                  <Play size={17} fill="currentColor" />
                )}
              </button>
              <div>
                <strong>
                  {playing
                    ? "Replaying samples"
                    : index === scenario.samples.length - 1
                      ? "Replay complete"
                      : "Explore the timeline"}
                </strong>
                <span>10 simulated seconds per sample</span>
              </div>
              <button
                className="icon-button"
                aria-label="Restart replay"
                onClick={() => {
                  setIndex(0);
                  setPlaying(false);
                }}
              >
                <RotateCcw size={17} />
              </button>
              <span className="timecode">
                {clock(index)}
                <small> / {clock(scenario.samples.length - 1)}</small>
              </span>
            </div>
            <input
              aria-label="Replay timeline"
              type="range"
              min="0"
              max={scenario.samples.length - 1}
              value={index}
              style={{
                "--progress": `${(index / (scenario.samples.length - 1)) * 100}%`,
              }}
              onChange={(event) => {
                setPlaying(false);
                setIndex(Number(event.target.value));
              }}
            />
            <div className="timeline-labels">
              <span>START OF SAMPLE</span>
              <span>NO LIVE TRACKING</span>
            </div>
          </div>
          <div className="stats-grid">
            <Stat
              icon={CornerUpRight}
              label="Route offset"
              value={a?.offsetMeters}
              unit="m"
              detail="Nearest planned segment"
            />
            <Stat
              icon={Gauge}
              label="Sample speed"
              value={a?.speedKph}
              unit="km/h"
              detail="Synthetic observation"
            />
            <Stat
              icon={Timer}
              label="Stationary time"
              value={a?.stationarySeconds}
              unit="s"
              detail="Continuous usable samples"
            />
            <Stat
              icon={Satellite}
              label="GPS accuracy"
              value={a?.accuracyMeters ? `±${a.accuracyMeters}` : null}
              unit="m"
              detail={
                a?.quality === "good" ? "Usable signal" : "Quality gate applies"
              }
            />
          </div>
        </section>
        <aside className="insights-column">
          <section
            id="route-observations"
            className={`assessment-card card ${warning ? "warning-card" : limited ? "limited-card" : ""}`}
            aria-live="polite"
            aria-busy={busy}
          >
            <div className="panel-kicker">
              <span>ROUTE OBSERVATIONS</span>
              <span className={`status-orb ${busy ? "busy" : ""}`} />
            </div>
            <div className="assessment-icon">
              <StatusIcon size={29} strokeWidth={1.6} />
            </div>
            <Tag tone={warning ? "yellow" : "mint"}>
              {error
                ? "SERVICE UNAVAILABLE"
                : busy
                  ? "ASSESSING SAMPLE"
                  : warning
                    ? "WORTH A CHECK-IN"
                    : limited
                      ? "ASSESSMENT PAUSED"
                      : "RULE-BASED MONITOR"}
            </Tag>
            <h2 data-testid="assessment-headline">
              {error
                ? "No assessment available"
                : busy
                  ? "Reading this sample…"
                  : a?.headline || "Waiting for the preview"}
            </h2>
            <p>
              {error ||
                a?.qualityReason ||
                a?.summary ||
                "The preview is loading synthetic route observations."}
            </p>
            <div className="observation-checks">
              <div>
                <span>
                  {a?.quality === "good" ? (
                    <CheckCircle2 size={16} />
                  ) : (
                    <Info size={16} />
                  )}
                  Location quality
                </span>
                <strong>
                  {a?.quality === "good" ? "Usable" : "Not confirmed"}
                </strong>
              </div>
              <div>
                <span>
                  <Waypoints size={16} />
                  Deviation persistence
                </span>
                <strong>{a ? `${a.deviationSeconds}s` : "—"}</strong>
              </div>
              <div>
                <span>
                  <LockKeyhole size={16} />
                  Automatic actions
                </span>
                <strong>Off</strong>
              </div>
            </div>
            {!!a?.warnings.length && (
              <ul className="warning-reasons">
                {a.warnings.map((w) => (
                  <li key={w.type}>
                    <strong>{w.title}</strong>
                    <span>{w.detail}</span>
                  </li>
                ))}
              </ul>
            )}
            <button
              className={`button wide ${warning ? "amber" : "secondary"}`}
              onClick={() => setDialog(true)}
              disabled={!a || busy}
            >
              <Bell size={16} />
              Try a check-in
              <span className="button-end">
                Demo
                <ChevronRight size={14} />
              </span>
            </button>
            <p className="fine-print">
              A warning is not proof of danger. An absence of warnings is not a
              safety guarantee.
            </p>
          </section>
          <section className="model-peek card">
            <div className="model-peek-top">
              <span className="small-icon">
                <Sparkles size={18} />
              </span>
              <h3>Another perspective</h3>
              <Tag>ML DEMO</Tag>
            </div>
            <p>
              An Isolation Forest compares the sample with patterns in its
              synthetic training data.
            </p>
            <div className="ml-result">
              <span
                className={`status-dot ${ml?.unusual ? "amber-dot" : ""}`}
              />
              <strong>
                {busy ? "Waiting for assessment" : ml?.label || "Not assessed"}
              </strong>
            </div>
            {ml?.available && (
              <p className="score-line">
                Raw model score <code>{ml.score.toFixed(4)}</code>
                <span>Not a probability or danger score.</span>
              </p>
            )}
            <button className="text-link" onClick={() => navigate("model")}>
              Open the model lab
              <ArrowUpRight size={15} />
            </button>
          </section>
        </aside>
      </div>
      <section className="scenario-section">
        <div className="section-row">
          <div>
            <h2>Change the scenario</h2>
            <p>Same sample route. A different story to understand.</p>
          </div>
          <span className="scenario-hint">
            <FlaskConical size={14} />
            Nothing here affects a real ride
          </span>
        </div>
        <div className="scenario-grid">
          {boot.scenarios.map((item) => {
            const Icon = scenarioIcons[item.id];
            return (
              <button
                key={item.id}
                className={`scenario-card ${scenario.id === item.id ? "selected" : ""}`}
                aria-pressed={scenario.id === item.id}
                onClick={() => chooseScenario(item)}
              >
                <span className="scenario-icon">
                  <Icon size={22} strokeWidth={1.7} />
                </span>
                <span className="scenario-copy">
                  <strong>{item.name}</strong>
                  <span>{item.description}</span>
                </span>
                <span className="scenario-select">
                  {scenario.id === item.id ? (
                    <Check size={13} />
                  ) : (
                    <ArrowUpRight size={14} />
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </section>
      {notice && (
        <div className="local-notice" role="status">
          <Info size={18} />
          <span>{notice}</span>
          <button
            className="icon-button"
            aria-label="Dismiss demo response"
            onClick={() => setNotice("")}
          >
            <X size={16} />
          </button>
        </div>
      )}
      <div className="bottom-note">
        <ShieldCheck size={16} />
        <span>Designed to support human judgment. Never to replace it.</span>
        <button onClick={() => navigate("guide")}>
          Privacy & limitations
          <ArrowRight size={14} />
        </button>
      </div>
      {dialog && (
        <CheckIn
          onClose={() => setDialog(false)}
          onChoice={(message) => {
            setNotice(message);
            setDialog(false);
          }}
        />
      )}
    </>
  );
}

function ModelLab({ model, navigate }) {
  const r = model?.report;
  const download = () => {
    if (!r) return;
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(r, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "smartcab-synthetic-model-card.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <span />
            EXPERIMENT, MEASURE, UNDERSTAND
          </div>
          <h1>A model. Not a crystal ball.</h1>
          <p>Look inside the small ML experiment powering this preview.</p>
        </div>
        <button className="button secondary" disabled={!r} onClick={download}>
          <ArrowDownToLine size={17} />
          Download model card
        </button>
      </div>
      <div className="demo-notice">
        <Info size={17} />
        <span>
          <strong>Synthetic data only.</strong> These results demonstrate the
          training pipeline. They do not measure real-world safety accuracy.
        </span>
      </div>
      <div className="model-page-grid">
        <section className="card model-overview">
          <div className="section-row">
            <span className="large-icon">
              <Sparkles size={27} />
            </span>
            <Tag tone={r ? "mint" : "yellow"}>
              {r ? "DEMO MODEL LOADED" : "MODEL NOT LOADED"}
            </Tag>
          </div>
          <h2>Isolation Forest</h2>
          <p>
            Learns which combinations of movement features are unusual. It
            cannot determine criminal intent, identify a dangerous person, or
            confirm that a passenger is safe.
          </p>
          <div className="model-facts">
            <div>
              <span>Training data</span>
              <strong>Generated feature windows</strong>
            </div>
            <div>
              <span>Feature count</span>
              <strong>4 numeric observations</strong>
            </div>
            <div>
              <span>Production ready</span>
              <strong>No — experimental</strong>
            </div>
            <div>
              <span>Last trained</span>
              <strong>
                {r
                  ? new Date(r.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "Not trained yet"}
              </strong>
            </div>
          </div>
          <h3>What the model sees</h3>
          <div className="feature-list">
            {[
              "Route offset · metres",
              "Speed · km/h",
              "Stationary time · seconds",
              "Change in route offset · metres",
            ].map((f, i) => (
              <span key={f}>
                <small>0{i + 1}</small>
                {f}
              </span>
            ))}
          </div>
          <p className="fine-print">
            No faces, names, phone numbers, neighborhood “safety ratings,” or
            demographic attributes.
          </p>
        </section>
        <div className="model-details">
          <section className="card split-card">
            <div className="panel-kicker">
              <span>A CLEAN SEPARATION</span>
              <Database size={16} />
            </div>
            <h2>
              Train on one trip.
              <br />
              Test on another.
            </h2>
            <p>
              All windows from a trip stay in one split. Adjacent samples never
              leak across training and evaluation.
            </p>
            <div className="split-bar">
              <span />
              <span />
              <span />
            </div>
            <div className="split-legend">
              <div>
                <i />
                <strong>{r?.splits.trainingTrips ?? "144"}</strong>
                <span>Training trips</span>
              </div>
              <div>
                <i />
                <strong>{r?.splits.calibrationTrips ?? "48"}</strong>
                <span>Calibration trips</span>
              </div>
              <div>
                <i />
                <strong>{r?.splits.testTrips ?? "48"}</strong>
                <span>Held-out test trips</span>
              </div>
            </div>
            <small>
              {r
                ? `${r.sampleCount.toLocaleString()} generated windows · ${r.tripCount} imaginary trips`
                : "Planned configuration — run training to create the artifact"}
            </small>
          </section>
          <section className="card evaluation-card">
            <div className="section-row">
              <h2>What the demo measured</h2>
              <Tag>SYNTHETIC TEST</Tag>
            </div>
            {r ? (
              <>
                <div className="evaluation-row">
                  <span>Injected unusual windows detected</span>
                  <strong>{r.testMetrics.truePositives}</strong>
                </div>
                <div className="evaluation-row">
                  <span>Injected unusual windows missed</span>
                  <strong>{r.testMetrics.falseNegatives}</strong>
                </div>
                <div className="evaluation-row">
                  <span>Nominal windows incorrectly flagged</span>
                  <strong>{r.testMetrics.falsePositives}</strong>
                </div>
                <div className="evaluation-row">
                  <span>Nominal windows not flagged</span>
                  <strong>{r.testMetrics.trueNegatives}</strong>
                </div>
                <p className="evaluation-note">
                  <TriangleAlert size={16} />
                  Invented data can make a model look better than it is. Never
                  use these counts as a safety-performance claim.
                </p>
              </>
            ) : (
              <p>
                {model?.error ||
                  "Model information is unavailable. Route rules work independently."}
              </p>
            )}
          </section>
        </div>
      </div>
      <div className="training-cta">
        <span className="large-icon">
          <Code2 size={26} />
        </span>
        <div>
          <h2>Train it yourself. Understand every step.</h2>
          <p>
            The reproducible training command uses no personal data or paid API.
          </p>
        </div>
        <button className="button primary" onClick={() => navigate("guide")}>
          Open the build guide
          <ArrowRight size={17} />
        </button>
      </div>
    </>
  );
}

function Guide() {
  const [platform, setPlatform] = useState("android");
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <span />
            YOUR NEXT CHAPTER
          </div>
          <h1>From idea to a careful prototype.</h1>
          <p>
            A practical path to training the model and testing on Android and
            iPhone.
          </p>
        </div>
        <Tag tone="mint">
          <Smartphone size={14} />
          MOBILE PROJECTS PREPARED
        </Tag>
      </div>
      <div className="guide-grid">
        <section className="card guide-main">
          <div className="section-row">
            <h2>Train the demo model</h2>
            <Tag>LOCAL · NO API KEY</Tag>
          </div>
          <div className="guide-step">
            <span>01</span>
            <div>
              <h3>Install the separate preview dependencies</h3>
              <p>
                Use Python 3.11 or later. Run these from the repository root;
                the preview is independent of your live backend.
              </p>
              <Code>
                {
                  "python -m venv .venv\n.venv/bin/python -m pip install -r backend-python-ai/requirements-route-preview.txt"
                }
              </Code>
              <small>
                Windows: use .venv\\Scripts\\python instead of .venv/bin/python.
              </small>
            </div>
          </div>
          <div className="guide-step">
            <span>02</span>
            <div>
              <h3>Generate data, train, calibrate, evaluate</h3>
              <p>
                The script creates imaginary trips, trains on nominal windows,
                calibrates a threshold on separate trips, then evaluates an
                untouched test split.
              </p>
              <Code>
                {
                  "cd backend-python-ai\n../.venv/bin/python -m route_lab.train --seed 42"
                }
              </Code>
              <p>
                It saves <code>model.joblib</code> and <code>report.json</code>{" "}
                to the ignored <code>.cache/route-model/</code> folder. Never
                load someone else’s joblib/pickle file.
              </p>
            </div>
          </div>
          <div className="guide-step">
            <span>03</span>
            <div>
              <h3>Start the preview and inspect the result</h3>
              <p>
                Restart the preview API after retraining so it loads the new
                artifact. Do not run this process as your production backend.
              </p>
              <Code>
                {
                  "../.venv/bin/python -m uvicorn route_lab.api:app --host 0.0.0.0 --port 8001"
                }
              </Code>
              <p>In another terminal, from the frontend folder:</p>
              <Code>
                {"npm install\nnpm run dev:route-preview -- --port 5173"}
              </Code>
            </div>
          </div>
        </section>
        <aside className="guide-side">
          <section className="card mobile-guide">
            <div className="panel-kicker">
              <span>TAKE IT TO A PHONE</span>
              <Smartphone size={18} />
            </div>
            <h2>
              One React preview.
              <br />
              Two native shells.
            </h2>
            <p>
              Capacitor packages this prototype for device testing. It is not a
              published or signed store release.
            </p>
            <div className="platform-tabs">
              <button
                className={platform === "android" ? "active" : ""}
                onClick={() => setPlatform("android")}
              >
                Android
              </button>
              <button
                className={platform === "ios" ? "active" : ""}
                onClick={() => setPlatform("ios")}
              >
                iPhone
              </button>
            </div>
            <p>
              {platform === "android"
                ? "Install Android Studio, its supported JDK, and the SDK requested by the project. Use an emulator or a test phone."
                : "Use a Mac with Xcode and the iOS SDK. Signing requires your Apple development team; App Store distribution requires membership."}
            </p>
            <p>
              First provide a reachable HTTPS <strong>staging</strong> API. The
              prepare script verifies that it is the synthetic-only service.
            </p>
            <Code>
              {"VITE_ROUTE_PREVIEW_API_URL=https://YOUR-STAGING-API npm run mobile:prepare\n" +
                (platform === "android"
                  ? "npm run mobile:android"
                  : "npm run mobile:ios")}
            </Code>
            <small>
              Run from frontend/. onrender.com hosts also require
              SMARTCAB_CONFIRM_STAGING=1. The browser preview URL is temporary,
              not permanent hosting.
            </small>
          </section>
          <section className="privacy-card">
            <LockKeyhole size={24} />
            <h3>
              Small data footprint.
              <br />
              Clear boundaries.
            </h3>
            <p>
              This preview does not request camera or GPS permissions, accept
              live coordinates, store rider records, or send alerts.
            </p>
            <p>
              Your existing website and production settings are not connected to
              this service.
            </p>
          </section>
        </aside>
      </div>
      <section className="card next-data">
        <div className="section-row">
          <div>
            <h2>Before using real data</h2>
            <p>Good ML starts with evidence, not a bigger confidence number.</p>
          </div>
          <Tag tone="yellow">FUTURE WORK</Tag>
        </div>
        <div className="next-data-grid">
          <div>
            <span>1</span>
            <h3>Consent & minimize</h3>
            <p>
              Collect only permitted trip data. Remove identifiers and set short
              retention and access rules.
            </p>
          </div>
          <div>
            <span>2</span>
            <h3>Label events, not danger</h3>
            <p>
              Review route changes and stops with context. Include normal
              traffic and authorized diversions.
            </p>
          </div>
          <div>
            <span>3</span>
            <h3>Validate beyond the demo</h3>
            <p>
              Separate drivers, trips, routes, and time periods. Measure missed
              events and false alerts per trip.
            </p>
          </div>
          <div>
            <span>4</span>
            <h3>Observe before acting</h3>
            <p>
              Start in shadow mode with human review. Keep manual SOS
              independent. No automatic police or vehicle controls.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

export default function App() {
  const [page, setPage] = useState(
    NAV.some((n) => `#${n.id}` === location.hash)
      ? location.hash.slice(1)
      : "monitor",
  );
  const [boot, setBoot] = useState(null);
  const [model, setModel] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [revision, setRevision] = useState(0);
  const [selected, setSelected] = useState("typical");
  const [index, setIndex] = useState(18);
  const [playRequested, setPlaying] = useState(false);
  const [responseState, setResponseState] = useState({
    key: null,
    data: null,
    error: "",
  });
  const scenario = boot?.scenarios.find((s) => s.id === selected);
  const requestKey = `${selected}:${index}:${revision}`;
  const result = responseState.key === requestKey ? responseState.data : null;
  const error = responseState.key === requestKey ? responseState.error : "";
  const busy = !!scenario && responseState.key !== requestKey;
  const playing =
    playRequested && !!scenario && index < scenario.samples.length - 1;
  const navigate = (target) => {
    setPage(target);
    window.history.pushState(null, "", `#${target}`);
    if (target !== "monitor") setPlaying(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  useEffect(() => {
    const handler = () => {
      const next = location.hash.slice(1);
      if (NAV.some((n) => n.id === next)) {
        setPage(next);
        if (next !== "monitor") setPlaying(false);
      }
    };
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const health = await previewRequest("health", {
          signal: controller.signal,
        });
        if (
          health.environment !== "synthetic-preview" ||
          health.acceptsLiveGps !== false ||
          health.automaticActions !== false
        )
          throw new Error(
            "This is not a synthetic-only preview service. Connection blocked.",
          );
        const [config, info] = await Promise.all(
          ["scenarios", "model"].map((path) =>
            previewRequest(path, { signal: controller.signal }),
          ),
        );
        if (!controller.signal.aborted) {
          setBoot(config);
          setModel(info);
        }
      } catch (e) {
        if (!controller.signal.aborted)
          setLoadError(
            e.name === "AbortError"
              ? "The preview service timed out. No assessment is available."
              : e.message,
          );
      }
    }
    load();
    return () => controller.abort();
  }, [revision]);
  useEffect(() => {
    if (!scenario) return;
    const controller = new AbortController();
    previewRequest("analyze", {
      signal: controller.signal,
      body: { scenario: selected, sampleIndex: index },
    })
      .then((data) => {
        if (!controller.signal.aborted)
          setResponseState({ key: requestKey, data, error: "" });
      })
      .catch((e) => {
        if (!controller.signal.aborted) {
          setResponseState({
            key: requestKey,
            data: null,
            error:
              e.name === "AbortError"
                ? "The preview service timed out. No assessment is available."
                : e.message,
          });
          setPlaying(false);
        }
      });
    return () => controller.abort();
  }, [scenario, selected, index, revision, requestKey]);
  useEffect(() => {
    if (!playing || !scenario || busy || error) return;
    const timer = setTimeout(() => setIndex((i) => i + 1), 850);
    return () => clearTimeout(timer);
  }, [playing, scenario, index, busy, error]);
  const chooseScenario = (item) => {
    setPlaying(false);
    setSelected(item.id);
    setIndex(item.focusIndex);
    document
      .getElementById("route-observation-summary")
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  };
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Brand />
        <div className="workspace-label">
          YOUR WORKSPACE<Tag>LAB</Tag>
        </div>
        <nav aria-label="Primary navigation">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={page === id ? "active" : ""}
              onClick={() => navigate(id)}
              aria-current={page === id ? "page" : undefined}
            >
              <Icon size={19} />
              <span>{label}</span>
              {page === id && <span className="nav-active-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-divider" />
        <div className="sidebar-context">
          <span className="status-dot" />
          <div>
            <strong>Separate by design</strong>
            <p>Your live app is untouched.</p>
          </div>
        </div>
        <div className="sidebar-bottom">
          <div className="mobile-note">
            <Smartphone size={22} />
            <strong>Made to go with you.</strong>
            <p>
              Android + iPhone projects.
              <br />
              Preview first. Release later.
            </p>
            <button onClick={() => navigate("guide")}>
              Explore mobile setup
              <ArrowUpRight size={14} />
            </button>
          </div>
          <div className="profile">
            <span>AS</span>
            <div>
              <strong>Aayushi’s workspace</strong>
              <small>Prototype environment</small>
            </div>
            <LockKeyhole size={15} />
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="mobile-brand">
            <Brand />
          </div>
          <div className="breadcrumb">
            Workspace
            <ChevronRight size={13} />
            <strong>{NAV.find((n) => n.id === page)?.label}</strong>
          </div>
          <div className="topbar-right">
            <span
              className={`connection ${loadError || error ? "disconnected" : ""}`}
            >
              <span className="status-dot" />
              {loadError || error
                ? "Preview unavailable"
                : boot
                  ? "Preview connected"
                  : "Connecting preview"}
            </span>
            <span className="topbar-divider" />
            <Tag>
              <Smartphone size={13} />
              {Capacitor.isNativePlatform()
                ? Capacitor.getPlatform()
                : "Android + iOS"}
            </Tag>
          </div>
        </header>
        <main>
          {loadError ? (
            <div className="empty-state card">
              <WifiOff size={36} />
              <h1>Let’s reconnect the preview.</h1>
              <p>{loadError}</p>
              <p>The live SmartCab service is not used as a fallback.</p>
              <button
                className="button primary"
                onClick={() => {
                  setLoadError("");
                  setRevision((r) => r + 1);
                }}
              >
                <RotateCcw size={16} />
                Retry connection
              </button>
              <button className="text-link" onClick={() => navigate("guide")}>
                Open setup instructions
                <ArrowRight size={16} />
              </button>
            </div>
          ) : !boot ? (
            <div className="empty-state">
              <span className="loading-spinner" />
              <h2>Preparing your practice ride</h2>
              <p>
                Loading synthetic samples from the separate preview service.
              </p>
            </div>
          ) : page === "monitor" ? (
            <Monitor
              key={scenario.id}
              {...{
                boot,
                scenario,
                index,
                setIndex,
                chooseScenario,
                playing,
                setPlaying,
                result,
                busy,
                error,
                navigate,
              }}
            />
          ) : page === "model" ? (
            <ModelLab model={model} navigate={navigate} />
          ) : (
            <Guide />
          )}
          {loadError && page === "guide" && <Guide />}
        </main>
        <footer className="app-footer">
          <span>
            SmartCab Route Lab <span>·</span> v0.1 preview
          </span>
          <span>Built for learning. Not a safety-certified service.</span>
        </footer>
      </div>
      <nav className="mobile-nav" aria-label="Mobile navigation">
        {NAV.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={page === id ? "active" : ""}
            onClick={() => navigate(id)}
            aria-current={page === id ? "page" : undefined}
          >
            <Icon size={21} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
