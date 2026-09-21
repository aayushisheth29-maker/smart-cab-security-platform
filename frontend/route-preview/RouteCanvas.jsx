import { useRef, useState } from "react";
import { Plus, Minus, LocateFixed, Layers2 } from "lucide-react";

// An offline illustration, NOT a navigation map. No map provider sees any coordinates.
const bounds = { west: 72.539, east: 72.579, south: 23.016, north: 23.039 };
function xy(point) {
  return [
    ((point.lng - bounds.west) / (bounds.east - bounds.west)) * 900,
    500 - ((point.lat - bounds.south) / (bounds.north - bounds.south)) * 500,
  ];
}
const path = (points) => points.map((p) => xy(p).join(",")).join(" ");

export default function RouteCanvas({ scenario, index, warning, playing }) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState([0, 0]);
  const drag = useRef(null);
  const points = scenario.samples.slice(0, index + 1);
  const [x, y] = xy(points.at(-1));
  const [sx, sy] = xy(scenario.plannedRoute[0]);
  const [ex, ey] = xy(scenario.plannedRoute.at(-1));
  const color = warning ? "#d49a24" : "#118b76";
  const recenter = () => {
    setPan([0, 0]);
    setZoom(1);
  };
  return (
    <div className="route-canvas" data-testid="route-canvas">
      <div className="map-top">
        <span className="map-pill">
          <span className={`status-dot ${playing ? "pulse" : ""}`} />
          SIMULATED GPS
        </span>
        <span className="map-place">AHMEDABAD · PRACTICE AREA</span>
      </div>
      <svg
        viewBox="0 0 900 500"
        role="img"
        aria-label="Illustrative planned route and synthetic vehicle position. Not a navigation map."
        onPointerDown={(event) => {
          drag.current = { x: event.clientX, y: event.clientY, pan };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (drag.current) {
            const scale =
              900 / event.currentTarget.getBoundingClientRect().width;
            setPan([
              drag.current.pan[0] + (event.clientX - drag.current.x) * scale,
              drag.current.pan[1] + (event.clientY - drag.current.y) * scale,
            ]);
          }
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
      >
        <defs>
          <pattern
            id="blocks"
            width="126"
            height="102"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(-12)"
          >
            <rect width="126" height="102" fill="#edf0e9" />
            <rect x="10" y="10" width="48" height="35" rx="6" fill="#e4e8df" />
            <rect x="66" y="10" width="49" height="80" rx="5" fill="#e5e8e0" />
            <rect x="10" y="53" width="48" height="37" rx="5" fill="#e2e7dd" />
            <path d="M0 0H126M0 0V102" stroke="#fff" strokeWidth="9" />
          </pattern>
          <filter
            id="marker-shadow"
            x="-100%"
            y="-100%"
            width="300%"
            height="300%"
          >
            <feDropShadow dx="0" dy="3" stdDeviation="5" floodOpacity=".23" />
          </filter>
        </defs>
        <rect width="900" height="500" fill="#edf0e9" />
        <g
          transform={`translate(${450 + pan[0]} ${250 + pan[1]}) scale(${zoom}) translate(-450 -250)`}
        >
          <rect
            x="-800"
            y="-800"
            width="2500"
            height="2000"
            fill="url(#blocks)"
          />
          <path
            d="M805-90C711 66 785 185 754 257S678 456 735 592"
            fill="none"
            stroke="#d1e4e7"
            strokeWidth="100"
          />
          <path
            d="M809-90C715 66 789 185 758 257S682 456 739 592"
            fill="none"
            stroke="#c5dce1"
            strokeWidth="48"
          />
          <path
            d="M-20 350 262 275 416 323 620 237 938 307M150-30 245 104 343 229 394 523M545-30 532 121 460 266 560 570"
            fill="none"
            stroke="#dce0d7"
            strokeWidth="21"
          />
          <path
            d="M-20 350 262 275 416 323 620 237 938 307M150-30 245 104 343 229 394 523M545-30 532 121 460 266 560 570"
            fill="none"
            stroke="#fffefa"
            strokeWidth="15"
          />
          <rect
            x="156"
            y="102"
            width="119"
            height="81"
            rx="20"
            fill="#d0e2d0"
            transform="rotate(-12 214 143)"
          />
          <rect
            x="516"
            y="352"
            width="125"
            height="72"
            rx="20"
            fill="#d0e2d0"
            transform="rotate(-12 579 388)"
          />
          <text x="193" y="151" className="map-label">
            PARK
          </text>
          <text x="555" y="395" className="map-label">
            GARDEN
          </text>
          <text x="80" y="230" className="map-area-label">
            WEST DISTRICT
          </text>
          <text x="550" y="64" className="map-area-label">
            RIVER QUARTER
          </text>
          <polyline
            points={path(scenario.plannedRoute)}
            fill="none"
            stroke="#fff"
            strokeWidth="14"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <polyline
            points={path(scenario.plannedRoute)}
            fill="none"
            stroke="#86b8a8"
            strokeWidth="7"
            strokeLinejoin="round"
            strokeLinecap="round"
            strokeDasharray="2 10"
          />
          <polyline
            points={path(points)}
            fill="none"
            stroke={color}
            strokeWidth="7"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <circle
            cx={sx}
            cy={sy}
            r="8"
            fill="#fff"
            stroke="#243d37"
            strokeWidth="4"
          />
          <g transform={`translate(${ex},${ey})`}>
            <circle r="13" fill="#233d38" stroke="white" strokeWidth="4" />
            <path
              d="M-3-5V6M-3-5H5V1H-3"
              stroke="white"
              strokeWidth="1.8"
              fill="none"
            />
          </g>
          <g transform={`translate(${x},${y})`}>
            <circle
              r="32"
              fill={color}
              opacity=".12"
              className={playing ? "marker-pulse" : ""}
            />
            <circle
              r="20"
              fill="#213f39"
              stroke="#fff"
              strokeWidth="4"
              filter="url(#marker-shadow)"
            />
            <path d="m0-10 8 19-8-5-8 5Z" fill="#fff" strokeLinejoin="round" />
          </g>
        </g>
      </svg>
      <div className="map-controls">
        <button
          aria-label="Zoom in"
          onClick={() => setZoom((z) => Math.min(2.5, z + 0.3))}
        >
          <Plus size={17} />
        </button>
        <button
          aria-label="Zoom out"
          onClick={() => setZoom((z) => Math.max(0.7, z - 0.3))}
        >
          <Minus size={17} />
        </button>
        <span />
        <button aria-label="Recenter illustration" onClick={recenter}>
          <LocateFixed size={17} />
        </button>
      </div>
      <div className="map-legend">
        <span>
          <i className="legend-line" />
          Recorded samples
        </span>
        <span>
          <i className="legend-line dotted" />
          Planned route
        </span>
      </div>
      <div className="map-attribution">
        <Layers2 size={12} /> Offline illustration · not navigation
      </div>
    </div>
  );
}
