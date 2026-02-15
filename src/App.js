import { useState, useEffect, useRef, useCallback } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────
const YEAR = new Date().getFullYear();
const THEME_COLORS = [
  { name: "Frost",    value: "#7dd3fc" },
  { name: "Sage",     value: "#86efac" },
  { name: "Amber",    value: "#fcd34d" },
  { name: "Rose",     value: "#fda4af" },
  { name: "Lavender", value: "#c4b5fd" },
  { name: "Coral",    value: "#fb923c" },
  { name: "Mint",     value: "#5eead4" },
  { name: "Gold",     value: "#e5c07b" },
];

const TRACKERS = [
  {
    id: "year",
    label: "Year",
    sublabel: "every day",
    description: "A dot for each day of the year",
    accent: "#7dd3fc",
  },
  {
    id: "workout",
    label: "Workout",
    sublabel: "365 sessions",
    description: "Track your training streak",
    accent: "#86efac",
  },
  {
    id: "better",
    label: "Better",
    sublabel: "than yesterday",
    description: "Was today better than yesterday?",
    accent: "#c4b5fd",
  },
];

function getCurrentDay() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now - start) / (1000 * 60 * 60 * 24));
}

function getDayDate(dayNumber) {
  const date = new Date(YEAR, 0, dayNumber);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─── Dot Component ────────────────────────────────────────────────────────────
function Dot({ dayNumber, currentDay, isSpecial, specialColor, isChecked, trackerType, onTap, onLongPress, animDelay }) {
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);
  const longPressRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), animDelay);
    return () => clearTimeout(t);
  }, [animDelay]);

  const isPast   = dayNumber < currentDay;
  const isToday  = dayNumber === currentDay;

  let opacity = 0.45;
  let color   = "#475569";
  let glow    = "none";

  if (trackerType === "year") {
    if (isSpecial) {
      opacity = 1;
      color   = specialColor;
      glow    = `0 0 10px ${specialColor}80`;
    } else if (isToday) {
      opacity = 1;
      color   = "#7dd3fc";
      glow    = "0 0 16px #7dd3fc60";
    } else if (isPast) {
      opacity = 0.08;
      color   = "#475569";
    } else {
      // Future — muted blue tint
      opacity = 0.22;
      color   = "#2e6a8e";
    }
  } else {
    if (isChecked) {
      opacity = 1;
      color   = trackerType === "workout" ? "#86efac" : "#c4b5fd";
      glow    = trackerType === "workout"
        ? "0 0 10px #86efac60"
        : "0 0 10px #c4b5fd60";
    } else if (isToday) {
      opacity = 0.85;
      color   = "#94a3b8";
      glow    = "0 0 8px #94a3b830";
    } else if (isPast && !isChecked) {
      opacity = 0.08;
      color   = "#334155";
    } else {
      // Future — muted green (workout) or muted purple (better)
      opacity = 0.22;
      color   = trackerType === "workout" ? "#2e6e4a" : "#5a3d7a";
    }
  }

  const handleMouseDown = () => {
    longPressRef.current = setTimeout(() => onLongPress(dayNumber), 500);
  };
  const handleMouseUp = () => clearTimeout(longPressRef.current);
  const handleClick   = () => {
    clearTimeout(longPressRef.current);
    onTap(dayNumber);
  };

  return (
    <div
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { handleMouseUp(); setHovered(false); }}
      className="dot-cell"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "scale(1)" : "scale(0.4)",
        transition: `opacity 0.5s ease ${animDelay}ms, transform 0.5s cubic-bezier(0.34,1.56,0.64,1) ${animDelay}ms`,
      }}
    >
      <div
        className="dot-inner"
        style={{
          backgroundColor: color,
          opacity,
          boxShadow: glow,
          transform: isToday ? "scale(1.15)" : "scale(1)",
        }}
      />
      {isToday && (
        <div className="today-ring" style={{ borderColor: color }} />
      )}
      <div
        className="dot-tooltip"
        style={{
          opacity: hovered ? 1 : 0,
          transform: hovered
            ? "translateX(-50%) translateY(0px)"
            : "translateX(-50%) translateY(5px)",
        }}
      >
        {getDayDate(dayNumber)}
      </div>
    </div>
  );
}

// ─── Color Picker Panel ───────────────────────────────────────────────────────
function ColorPicker({ visible, selectedColor, onSelect, onClose }) {
  return (
    <div
      className="color-picker-overlay"
      style={{
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "all" : "none",
        transform: visible ? "translateY(0)" : "translateY(12px)",
        transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <p className="color-picker-label">mark this day</p>
      <div className="color-grid">
        {THEME_COLORS.map((c) => (
          <button
            key={c.value}
            className="color-swatch"
            title={c.name}
            onClick={() => onSelect(c.value)}
            style={{
              backgroundColor: c.value,
              boxShadow: selectedColor === c.value ? `0 0 0 2px #0f172a, 0 0 0 4px ${c.value}` : "none",
              transform: selectedColor === c.value ? "scale(1.2)" : "scale(1)",
            }}
          />
        ))}
      </div>
      <button className="color-remove" onClick={() => onSelect(null)}>
        remove mark
      </button>
      <button className="color-close" onClick={onClose}>×</button>
    </div>
  );
}

// ─── Tracker Card (side panel) ────────────────────────────────────────────────
function TrackerCard({ tracker, active, index, onSelect, progress }) {
  return (
    <button
      className={`tracker-card ${active ? "tracker-card--active" : ""}`}
      onClick={() => onSelect(index)}
      style={{
        "--accent": tracker.accent,
        borderColor: active ? `${tracker.accent}50` : "transparent",
        background: active
          ? `linear-gradient(135deg, ${tracker.accent}12, ${tracker.accent}06)`
          : "rgba(15,23,42,0.5)",
      }}
    >
      <div className="tracker-card__top">
        <span className="tracker-card__label">{tracker.label}</span>
        {active && (
          <span className="tracker-card__dot" style={{ backgroundColor: tracker.accent }} />
        )}
      </div>
      <span className="tracker-card__sub">{tracker.sublabel}</span>
      <div className="tracker-card__bar">
        <div
          className="tracker-card__fill"
          style={{
            width: `${progress}%`,
            backgroundColor: tracker.accent,
            transition: "width 1s cubic-bezier(0.16,1,0.3,1)",
          }}
        />
      </div>
    </button>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const currentDay    = getCurrentDay();
  const [activeTracker, setActiveTracker] = useState(0);
  const [prevTracker,   setPrevTracker]   = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const [direction,     setDirection]     = useState(1);
  const [headerVis,     setHeaderVis]     = useState(true);

  // Per-tracker state
  const [specialDays,   setSpecialDays]   = useState({});   // { dayNum: color }
  const [checkedDays,   setCheckedDays]   = useState({});   // { trackerId: Set<dayNum> }
  const [colorPicker,   setColorPicker]   = useState(null); // dayNumber | null
  const [tooltip,       setTooltip]       = useState(null); // dayNumber | null

  const tracker = TRACKERS[activeTracker];

  const switchTracker = useCallback((idx) => {
    if (idx === activeTracker || transitioning) return;
    setDirection(idx > activeTracker ? 1 : -1);
    setPrevTracker(activeTracker);
    setTransitioning(true);
    setHeaderVis(false);
    setTimeout(() => {
      setActiveTracker(idx);
      setTransitioning(false);
      setHeaderVis(true);
    }, 380);
  }, [activeTracker, transitioning]);

  const handleTap = (dayNumber) => {
    if (activeTracker === 0) {
      setColorPicker(dayNumber);
    } else {
      const key = tracker.id;
      setCheckedDays((prev) => {
        const current = new Set(prev[key] || []);
        if (current.has(dayNumber)) {
          current.delete(dayNumber);
        } else {
          current.add(dayNumber);
        }
        return { ...prev, [key]: current };
      });
    }
  };

  const handleLongPress = (dayNumber) => {
    setTooltip(dayNumber);
    setTimeout(() => setTooltip(null), 1800);
  };

  const handleColorSelect = (color) => {
    if (!colorPicker) return;
    if (color === null) {
      setSpecialDays((prev) => {
        const next = { ...prev };
        delete next[colorPicker];
        return next;
      });
    } else {
      setSpecialDays((prev) => ({ ...prev, [colorPicker]: color }));
    }
    setColorPicker(null);
  };

  // Progress stats
  const checkedCount = checkedDays[tracker.id]?.size || 0;
  const progressPct  = activeTracker === 0
    ? Math.round((currentDay / 365) * 100)
    : Math.round((checkedCount / currentDay) * 100) || 0;

  const daysLeft = 365 - currentDay;

  // Slide animation
  const slideStyle = {
    transform: transitioning
      ? `translateX(${direction * -60}px)`
      : "translateX(0)",
    opacity: transitioning ? 0 : 1,
    transition: transitioning
      ? "transform 0.35s cubic-bezier(0.4,0,1,1), opacity 0.35s ease"
      : "transform 0.35s cubic-bezier(0,0,0.2,1), opacity 0.35s ease",
  };

  return (
    <div className="app">
      {/* Background grain */}
      <div className="grain" />

      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar__year">
          <span className="sidebar__year-num">{YEAR}</span>
          <span className="sidebar__year-sub">trackers</span>
        </div>

        <div className="sidebar__trackers">
          {TRACKERS.map((t, i) => (
            <TrackerCard
              key={t.id}
              tracker={t}
              active={i === activeTracker}
              index={i}
              onSelect={switchTracker}
              progress={i === 0
                ? Math.round((currentDay / 365) * 100)
                : Math.round(((checkedDays[t.id]?.size || 0) / currentDay) * 100) || 0
              }
            />
          ))}
        </div>

        <div className="sidebar__stats">
          <div className="stat">
            <span className="stat__val">{currentDay}</span>
            <span className="stat__lbl">days in</span>
          </div>
          <div className="stat">
            <span className="stat__val">{daysLeft}</span>
            <span className="stat__lbl">remaining</span>
          </div>
          {activeTracker > 0 && (
            <div className="stat">
              <span className="stat__val" style={{ color: tracker.accent }}>{checkedCount}</span>
              <span className="stat__lbl">completed</span>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="main">
        {/* Header */}
        <header className="header">
          <div className="header__title-group">
            <h1 className="header__title" style={{
              color: tracker.accent,
              opacity: headerVis ? 1 : 0,
              transform: headerVis ? "translateY(0)" : "translateY(7px)",
              transition: "opacity 0.3s ease, transform 0.3s cubic-bezier(0.16,1,0.3,1), color 0.4s ease",
            }}>
              {tracker.label}
            </h1>
            <p className="header__desc" style={{
              opacity: headerVis ? 1 : 0,
              transform: headerVis ? "translateY(0)" : "translateY(5px)",
              transition: "opacity 0.3s ease 0.05s, transform 0.3s cubic-bezier(0.16,1,0.3,1) 0.05s",
            }}>
              {tracker.description}
            </p>
          </div>
          <div className="header__progress">
            <svg viewBox="0 0 36 36" className="progress-ring">
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="#1e293b" strokeWidth="2"/>
              <circle
                cx="18" cy="18" r="15.5"
                fill="none"
                stroke={tracker.accent}
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray={`${progressPct * 0.974} 97.4`}
                strokeDashoffset="24.35"
                style={{ transition: "stroke-dasharray 1.2s cubic-bezier(0.16,1,0.3,1)" }}
              />
              <text x="18" y="21" textAnchor="middle" className="progress-ring__text">
                {progressPct}%
              </text>
            </svg>
          </div>
        </header>

        {/* Dots grid */}
        <div className="dots-wrapper" style={slideStyle}>
          <div className="dots-grid">
            {Array.from({ length: 365 }, (_, i) => {
              const day = i + 1;
              return (
                <Dot
                  key={`${tracker.id}-${day}`}
                  dayNumber={day}
                  currentDay={currentDay}
                  isSpecial={!!specialDays[day]}
                  specialColor={specialDays[day]}
                  isChecked={checkedDays[tracker.id]?.has(day)}
                  trackerType={tracker.id}
                  onTap={handleTap}
                  onLongPress={handleLongPress}
                  animDelay={Math.min(i * 2.5, 300)}
                />
              );
            })}
          </div>

          {/* Tooltip */}
          {tooltip && (
            <div className="floating-tooltip">
              {getDayDate(tooltip)}
            </div>
          )}
        </div>

        {/* Color picker */}
        <ColorPicker
          visible={!!colorPicker}
          selectedColor={colorPicker ? specialDays[colorPicker] : null}
          onSelect={handleColorSelect}
          onClose={() => setColorPicker(null)}
        />

        {/* Hint */}
        <p className="hint">
          {activeTracker === 0
            ? "tap a dot to mark a special day"
            : `tap a dot to mark a ${tracker.id === "workout" ? "session" : "win"}`}
        </p>
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@300;400&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .app {
          min-height: 100vh;
          background: #0b1120;
          display: flex;
          font-family: 'DM Mono', monospace;
          position: relative;
          overflow: hidden;
        }

        /* Grain texture */
        .grain {
          position: fixed; inset: 0; pointer-events: none; z-index: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
          opacity: 0.4;
        }

        /* ── Sidebar ── */
        .sidebar {
          width: 200px;
          min-width: 200px;
          background: rgba(10,17,35,0.9);
          border-right: 1px solid #1e293b;
          display: flex;
          flex-direction: column;
          padding: 32px 16px;
          gap: 28px;
          position: relative;
          z-index: 1;
        }

        .sidebar__year {
          display: flex;
          flex-direction: column;
          padding-bottom: 20px;
          border-bottom: 1px solid #1e293b;
        }
        .sidebar__year-num {
          font-family: 'DM Serif Display', serif;
          font-size: 2.2rem;
          color: #f1f5f9;
          letter-spacing: -1px;
          line-height: 1;
        }
        .sidebar__year-sub {
          font-size: 0.62rem;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 2px;
          margin-top: 4px;
        }

        .sidebar__trackers {
          display: flex;
          flex-direction: column;
          gap: 8px;
          flex: 1;
        }

        .tracker-card {
          width: 100%;
          border-radius: 10px;
          padding: 12px 12px 10px;
          border: 1px solid transparent;
          cursor: pointer;
          text-align: left;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
          overflow: hidden;
        }
        .tracker-card:hover {
          background: rgba(30,41,59,0.7) !important;
        }
        .tracker-card__top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 2px;
        }
        .tracker-card__label {
          font-size: 0.78rem;
          color: #cbd5e1;
          font-weight: 400;
          letter-spacing: 0.5px;
        }
        .tracker-card__dot {
          width: 6px; height: 6px;
          border-radius: 50%;
        }
        .tracker-card__sub {
          font-size: 0.6rem;
          color: #475569;
          display: block;
          margin-bottom: 10px;
        }
        .tracker-card__bar {
          height: 2px;
          background: #1e293b;
          border-radius: 1px;
          overflow: hidden;
        }
        .tracker-card__fill {
          height: 100%;
          border-radius: 1px;
          opacity: 0.8;
        }

        .sidebar__stats {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding-top: 16px;
          border-top: 1px solid #1e293b;
        }
        .stat { display: flex; flex-direction: column; gap: 1px; }
        .stat__val {
          font-family: 'DM Serif Display', serif;
          font-size: 1.4rem;
          color: #e2e8f0;
          line-height: 1;
        }
        .stat__lbl {
          font-size: 0.58rem;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 1.5px;
        }

        /* ── Main ── */
        .main {
          flex: 1;
          display: flex;
          flex-direction: column;
          padding: 32px 40px;
          overflow: hidden;
          position: relative;
          z-index: 1;
        }

        .header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 32px;
        }
        .header__title {
          font-family: 'DM Serif Display', serif;
          font-size: 2.8rem;
          letter-spacing: -1px;
          line-height: 0.9;
          transition: color 0.5s ease;
        }
        .header__desc {
          font-size: 0.65rem;
          color: #475569;
          margin-top: 8px;
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        .progress-ring {
          width: 56px; height: 56px;
        }
        .progress-ring__text {
          fill: #94a3b8;
          font-family: 'DM Mono', monospace;
          font-size: 7px;
        }

        /* ── Dots ── */
        .dots-wrapper {
          flex: 1;
          display: flex;
          flex-direction: column;
          position: relative;
        }
        .dots-grid {
          display: grid;
          grid-template-columns: repeat(25, 1fr);
          gap: 7px;
          max-width: 700px;
        }

        .dot-cell {
          aspect-ratio: 1;
          position: relative;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: visible;
        }
        .dot-cell:hover .dot-inner {
          transform: scale(1.4) !important;
          opacity: 1 !important;
        }
        .dot-inner {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          transition:
            opacity 0.6s ease,
            transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
            box-shadow 0.4s ease,
            background-color 0.4s ease;
        }
        .today-ring {
          position: absolute;
          inset: -3px;
          border-radius: 50%;
          border: 1.5px solid;
          opacity: 0.5;
          animation: pulse-ring 2.5s ease-in-out infinite;
        }
        @keyframes pulse-ring {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50%       { transform: scale(1.5); opacity: 0; }
        }

        /* ── Dot tooltip ── */
        .dot-tooltip {
          position: absolute;
          bottom: calc(100% + 8px);
          left: 50%;
          background: #1e293b;
          border: 1px solid #334155;
          color: #cbd5e1;
          font-family: 'DM Mono', monospace;
          font-size: 0.58rem;
          letter-spacing: 0.5px;
          padding: 5px 9px;
          border-radius: 6px;
          white-space: nowrap;
          pointer-events: none;
          z-index: 20;
          transition: opacity 0.18s ease, transform 0.18s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 4px 16px rgba(0,0,0,0.4);
        }
        .dot-tooltip::after {
          content: "";
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          border: 4px solid transparent;
          border-top-color: #334155;
        }

        /* ── Color Picker ── */
        .color-picker-overlay {
          position: fixed;
          bottom: 80px;
          left: 50%;
          transform: translateX(-50%);
          background: #0f172a;
          border: 1px solid #1e293b;
          border-radius: 16px;
          padding: 20px 24px;
          z-index: 100;
          backdrop-filter: blur(20px);
          box-shadow: 0 24px 60px rgba(0,0,0,0.6);
          min-width: 260px;
        }
        .color-picker-label {
          font-size: 0.62rem;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 2px;
          margin-bottom: 14px;
          text-align: center;
        }
        .color-grid {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: center;
          margin-bottom: 14px;
        }
        .color-swatch {
          width: 28px; height: 28px;
          border-radius: 50%;
          border: none;
          cursor: pointer;
          transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s ease;
        }
        .color-swatch:hover { transform: scale(1.3); }
        .color-remove {
          display: block;
          width: 100%;
          background: none;
          border: 1px solid #1e293b;
          border-radius: 8px;
          color: #475569;
          font-family: 'DM Mono', monospace;
          font-size: 0.62rem;
          letter-spacing: 1px;
          padding: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .color-remove:hover {
          border-color: #334155;
          color: #94a3b8;
          background: #1e293b;
        }
        .color-close {
          position: absolute;
          top: 12px; right: 14px;
          background: none; border: none;
          color: #475569; font-size: 1.1rem;
          cursor: pointer; line-height: 1;
          transition: color 0.2s;
        }
        .color-close:hover { color: #94a3b8; }

        /* ── Tooltip ── */
        .floating-tooltip {
          position: fixed;
          bottom: 80px;
          left: 50%;
          transform: translateX(-50%);
          background: #1e293b;
          color: #cbd5e1;
          font-size: 0.7rem;
          padding: 8px 16px;
          border-radius: 20px;
          letter-spacing: 1px;
          animation: fadeUp 0.2s ease, fadeOut 0.3s ease 1.5s forwards;
          pointer-events: none;
          z-index: 50;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateX(-50%) translateY(8px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes fadeOut {
          from { opacity: 1; }
          to   { opacity: 0; }
        }

        /* ── Hint ── */
        .hint {
          font-size: 0.58rem;
          color: #334155;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          margin-top: 20px;
          text-align: center;
          max-width: 700px;
        }

        /* ── Responsive ── */
        @media (max-width: 700px) {
          .sidebar { display: none; }
          .main { padding: 24px 16px; }
          .dots-grid {
            grid-template-columns: repeat(15, 1fr);
            gap: 5px;
          }
          .header__title { font-size: 2rem; }
        }
      `}</style>
    </div>
  );
}
