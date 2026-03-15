import React, { useState, useEffect } from "react";

interface Mood { label: string; count: number; angleDeg: number; }
interface Song  { title: string; artist: string; albumColor: string; }

const MOODS: Mood[] = [
  { label: "Love",     count: 17, angleDeg: 315 },
  { label: "Upbeat",   count: 13, angleDeg:   0 },
  { label: "Grief",    count:  3, angleDeg:  45 },
  { label: "Calm",     count: 15, angleDeg:  90 },
  { label: "Anxious",  count: 16, angleDeg: 135 },
  { label: "Anger",    count:  3, angleDeg: 180 },
  { label: "Euphoric", count: 13, angleDeg: 225 },
  { label: "Sad",      count: 15, angleDeg: 270 },
];

const TOP_SONGS: Song[] = [
  { title: "Saath Nibhana Saathiya", artist: "Falguni Pathak",        albumColor: "#5b3a7e" },
  { title: "Tere Bin Nahi Lagda",    artist: "Nusrat Fateh Ali Khan", albumColor: "#3a4a7e" },
  { title: "Kun Faya Kun",           artist: "A.R. Rahman",           albumColor: "#7e3a5b" },
  { title: "Channa Mereya",          artist: "Arijit Singh",          albumColor: "#3a7e6a" },
];

// ─── helpers ──────────────────────────────────────────────────────────────────
const rad = (d: number) => (d * Math.PI) / 180;
const pt  = (cx: number, cy: number, r: number, a: number) => ({
  x: cx + Math.cos(a) * r,
  y: cy + Math.sin(a) * r,
});

// ─── MoodWheel ────────────────────────────────────────────────────────────────
function MoodWheel() {
  const [ready, setReady] = useState(false);
  useEffect(() => { const id = setTimeout(() => setReady(true), 120); return () => clearTimeout(id); }, []);

  const S  = 300;
  const CX = S / 2;
  const CY = S / 2;

  // ── outer grey ring ──
  const RO = 148;   // ring outer radius
  const RI = 84;    // ring inner radius  (= petal area outer boundary)

  // ── petals ──
  // Each petal is a pure arc-slice (donut segment).
  // Angular span is FIXED = 37° (45° − 4° gap each side). NEVER changes → no overlap.
  // Only the OUTER RADIUS of the petal scales with count.
  const HALF    = 21.5;
  const P_MIN   = 48;        // outer radius for count=3  (small petal)
  const P_MAX   = RI;        // outer radius for count=17 (large petal, touches ring)
  const CR      = 7;
  const P_INNER = 14;

  function petalPath(angleDeg: number, pOuter: number): string {
    const aL = rad(angleDeg - HALF);
    const aR = rad(angleDeg + HALF);

    const OL = pt(CX, CY, pOuter, aL);
    const OR = pt(CX, CY, pOuter, aR);
    const dOuter = CR / pOuter;
    const OL_arc = pt(CX, CY, pOuter, aL + dOuter);
    const OR_arc = pt(CX, CY, pOuter, aR - dOuter);

    const IL = pt(CX, CY, P_INNER, aL);
    const IR = pt(CX, CY, P_INNER, aR);
    const dInner = CR / P_INNER;
    const IL_arc = pt(CX, CY, P_INNER, aL + dInner);
    const IR_arc = pt(CX, CY, P_INNER, aR - dInner);

    const lLen = Math.hypot(IL.x - OL.x, IL.y - OL.y);
    const rLen = Math.hypot(IR.x - OR.x, IR.y - OR.y);
    const OL_s = { x: OL.x + (IL.x - OL.x) / lLen * CR, y: OL.y + (IL.y - OL.y) / lLen * CR };
    const OR_s = { x: OR.x + (IR.x - OR.x) / rLen * CR, y: OR.y + (IR.y - OR.y) / rLen * CR };
    const IL_s = { x: IL.x + (OL.x - IL.x) / lLen * CR, y: IL.y + (OL.y - IL.y) / lLen * CR };
    const IR_s = { x: IR.x + (OR.x - IR.x) / rLen * CR, y: IR.y + (OR.y - IR.y) / rLen * CR };

    return [
      `M ${OL_arc.x} ${OL_arc.y}`,
      `A ${pOuter} ${pOuter} 0 0 1 ${OR_arc.x} ${OR_arc.y}`,
      `Q ${OR.x} ${OR.y} ${OR_s.x} ${OR_s.y}`,
      `L ${IR_s.x} ${IR_s.y}`,
      `Q ${IR.x} ${IR.y} ${IR_arc.x} ${IR_arc.y}`,
      `A ${P_INNER} ${P_INNER} 0 0 0 ${IL_arc.x} ${IL_arc.y}`,
      `Q ${IL.x} ${IL.y} ${IL_s.x} ${IL_s.y}`,
      `L ${OL_s.x} ${OL_s.y}`,
      `Q ${OL.x} ${OL.y} ${OL_arc.x} ${OL_arc.y}`,
      "Z",
    ].join(" ");
  }

  // Grey ring arc — inner radius matches petal outer radius so they attach flush
  function ringPath(angleDeg: number, rInner: number): string {
    const gap = 1.5;
    const a1  = rad(angleDeg - 22.5 + gap);
    const a2  = rad(angleDeg + 22.5 - gap);
    const RCR = 8;
    const dRO = RCR / RO;
    const dRI = Math.min(RCR / rInner, rad(19 - gap) * 0.4);
    const o1  = pt(CX, CY, RO,     a1), o2 = pt(CX, CY, RO,     a2);
    const i1  = pt(CX, CY, rInner, a1), i2 = pt(CX, CY, rInner, a2);
    const o1a = pt(CX, CY, RO,     a1 + dRO), o2a = pt(CX, CY, RO,     a2 - dRO);
    const i1a = pt(CX, CY, rInner, a1 + dRI), i2a = pt(CX, CY, rInner, a2 - dRI);
    const lLen = Math.hypot(i1.x-o1.x, i1.y-o1.y), rLen = Math.hypot(i2.x-o2.x, i2.y-o2.y);
    const o1s = { x: o1.x+(i1.x-o1.x)/lLen*RCR, y: o1.y+(i1.y-o1.y)/lLen*RCR };
    const o2s = { x: o2.x+(i2.x-o2.x)/rLen*RCR, y: o2.y+(i2.y-o2.y)/rLen*RCR };
    const i1s = { x: i1.x-(i1.x-o1.x)/lLen*RCR, y: i1.y-(i1.y-o1.y)/lLen*RCR };
    const i2s = { x: i2.x-(i2.x-o2.x)/rLen*RCR, y: i2.y-(i2.y-o2.y)/rLen*RCR };
    return [
      `M ${o1a.x} ${o1a.y}`,
      `A ${RO} ${RO} 0 0 1 ${o2a.x} ${o2a.y}`,
      `Q ${o2.x} ${o2.y} ${o2s.x} ${o2s.y}`,
      `L ${i2s.x} ${i2s.y}`,
      `Q ${i2.x} ${i2.y} ${i2a.x} ${i2a.y}`,
      `A ${rInner} ${rInner} 0 0 0 ${i1a.x} ${i1a.y}`,
      `Q ${i1.x} ${i1.y} ${i1s.x} ${i1s.y}`,
      `L ${o1s.x} ${o1s.y}`,
      `Q ${o1.x} ${o1.y} ${o1a.x} ${o1a.y}`,
      "Z",
    ].join(" ");
  }

  function labelXY(angleDeg: number) {
    const r = (RI + RO) / 2 + 1;
    return pt(CX, CY, r, rad(angleDeg));
  }

  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "0 16px" }}>
      <svg width="100%" height="auto" viewBox={`0 0 ${S} ${S}`} style={{ maxWidth: S }}>

        {/* ring base */}
        <circle cx={CX} cy={CY} r={RO} fill="#282828" />

        {/* grey segments — inner radius matches each petal's outer radius */}
        {MOODS.map(m => {
          const t      = m.count / 17;
          const pOuter = P_MIN + t * (P_MAX - P_MIN);
          return (
            <path key={`rs-${m.label}`} d={ringPath(m.angleDeg, pOuter)} fill="#353535" stroke="#181818" strokeWidth="2" />
          );
        })}

        {/* labels — positioned in middle of each ring segment */}
        {MOODS.map(m => {
          const t      = m.count / 17;
          const pOuter = P_MIN + t * (P_MAX - P_MIN);
          const r      = (pOuter + RO) / 2;
          const p      = pt(CX, CY, r, rad(m.angleDeg));
          return (
            <g key={`lb-${m.label}`}>
              <text x={p.x} y={p.y - 7} textAnchor="middle" dominantBaseline="middle"
                fill="#ffffff" fontSize="13" fontWeight="700"
                fontFamily="-apple-system,'Helvetica Neue',sans-serif">{m.count}</text>
              <text x={p.x} y={p.y + 8} textAnchor="middle" dominantBaseline="middle"
                fill="#ffffff" fontSize="9"
                fontFamily="-apple-system,'Helvetica Neue',sans-serif">{m.label}</text>
            </g>
          );
        })}

        {/* dark inner disc */}
        <circle cx={CX} cy={CY} r={P_MIN} fill="#1d1d1d" />

        {/* petals */}
        {MOODS.map((m, i) => {
          const t      = m.count / 17;
          const pOuter = P_MIN + t * (P_MAX - P_MIN);
          const gid    = `g${i}`;
          const angleR = rad(m.angleDeg);

          const g1 = pt(CX, CY, pOuter,  angleR);
          const g2 = pt(CX, CY, P_INNER, angleR);

          return (
            <g key={`pe-${m.label}`}
              style={{
                opacity:         ready ? 1 : 0,
                transform:       ready ? "scale(1)" : "scale(0.2)",
                transformOrigin: `${CX}px ${CY}px`,
                transition:      `opacity .35s ease ${i * .06}s, transform .5s cubic-bezier(.34,1.4,.64,1) ${i * .06}s`,
              }}
            >
              <defs>
                <linearGradient id={gid}
                  x1={g1.x} y1={g1.y} x2={g2.x} y2={g2.y}
                  gradientUnits="userSpaceOnUse">
                  <stop offset="0%"   stopColor="#FFFFFF" />
                  <stop offset="35%"  stopColor="#EDD9FF" />
                  <stop offset="72%"  stopColor="#C084FC" />
                  <stop offset="100%" stopColor="#9333EA" />
                </linearGradient>
              </defs>
              <path
                d={petalPath(m.angleDeg, pOuter)}
                fill={`url(#${gid})`}
                style={{
                  filter: t > 0.75
                    ? "drop-shadow(0 0 9px rgba(192,132,252,.8))"
                    : "drop-shadow(0 0 5px rgba(192,132,252,.4))",
                }}
              />
            </g>
          );
        })}



      </svg>
    </div>
  );
}

// ─── AlbumCircle ──────────────────────────────────────────────────────────────
function AlbumCircle({ color }: { color: string }) {
  return (
    <div style={{
      width: 52, height: 52, borderRadius: "50%", flexShrink: 0,
      background: `radial-gradient(circle at 35% 35%, ${color}dd, ${color}55)`,
      border: "1px solid rgba(255,255,255,.08)",
      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
    }}>🎵</div>
  );
}

// ─── Nav icons ────────────────────────────────────────────────────────────────
const IC = "#888", LW = "1.8";
const NavGrid   = () => <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="1.5" y="1.5" width="7" height="7" rx="1.5" stroke={IC} strokeWidth={LW}/><rect x="11.5" y="1.5" width="7" height="7" rx="1.5" stroke={IC} strokeWidth={LW}/><rect x="1.5" y="11.5" width="7" height="7" rx="1.5" stroke={IC} strokeWidth={LW}/><rect x="11.5" y="11.5" width="7" height="7" rx="1.5" stroke={IC} strokeWidth={LW}/></svg>;
const NavLines  = () => <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><line x1="2" y1="5" x2="18" y2="5" stroke={IC} strokeWidth={LW} strokeLinecap="round"/><line x1="2" y1="10" x2="18" y2="10" stroke={IC} strokeWidth={LW} strokeLinecap="round"/><line x1="2" y1="15" x2="12" y2="15" stroke={IC} strokeWidth={LW} strokeLinecap="round"/></svg>;
const NavHeart  = () => <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 17S2 11 2 6a4 4 0 0 1 8 0 4 4 0 0 1 8 0c0 5-8 11-8 11Z" stroke={IC} strokeWidth={LW} strokeLinecap="round" strokeLinejoin="round"/></svg>;
const NavChat   = () => <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M17 3H3a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h3l4 3.5L14 14h3a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1Z" stroke={IC} strokeWidth={LW} strokeLinecap="round" strokeLinejoin="round"/></svg>;
const NavPerson = () => <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="7.5" r="3.5" stroke="#fff" strokeWidth="1.8"/><path d="M3.5 19c0-4.142 3.358-7.5 7.5-7.5s7.5 3.358 7.5 7.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"/></svg>;

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function MusicProfile() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html,body{height:100%;margin:0;padding:0;}
        .mp{background:#1c1c1c;min-height:100vh;font-family:'Inter',-apple-system,sans-serif;color:#f0f0f0;width:100%;max-width:390px;margin:0 auto;position:relative;overflow-y:auto;scrollbar-width:none;-ms-overflow-style:none;}
        .mp::-webkit-scrollbar{display:none;}
        .mp-body{padding-bottom:40px;}
        .mp-header{padding:48px 22px 0;display:flex;justify-content:space-between;align-items:flex-start;}
        .mp-avatar{width:90px;height:90px;border-radius:50%;border:2.5px solid #fff;overflow:hidden;background:#333;display:flex;align-items:center;justify-content:center;font-size:40px;}
        .mp-actions{display:flex;gap:16px;padding-top:4px;}
        .mp-ibtn{background:none;border:none;cursor:pointer;opacity:.75;display:flex;}
        .mp-ibtn:hover{opacity:1;}
        .mp-info{padding:14px 22px 0;}
        .mp-name-row{display:flex;align-items:baseline;gap:9px;}
        .mp-name{font-size:30px;font-weight:800;color:#fff;letter-spacing:-.5px;}
        .mp-handle{font-size:15px;color:#aaa;}
        .mp-bio-row{display:flex;align-items:flex-start;justify-content:space-between;margin-top:7px;gap:12px;}
        .mp-bio{font-size:14px;color:#ccc;line-height:1.5;}
        .mp-fbtn{background:#fff;color:#111;border:none;border-radius:24px;padding:8px 22px;font-size:13px;font-weight:600;cursor:pointer;white-space:nowrap;}
        .mp-div{height:1px;background:rgba(255,255,255,.12);margin:20px 22px 0;}
        .mp-wheel{display:flex;justify-content:center;padding:6px 0 0;}
        .mp-cnt{text-align:center;margin-top:10px;}
        .mp-cnt-n{font-size:36px;font-weight:700;color:#fff;letter-spacing:-1px;}
        .mp-cnt-l{font-size:13px;color:#777;margin-top:2px;}
        .mp-songs{padding:22px 22px 0;}
        .mp-songs-h{font-size:20px;font-weight:800;color:#fff;margin-bottom:14px;}
        .mp-srow{display:flex;align-items:center;gap:14px;padding:9px 0;border-bottom:1px solid rgba(255,255,255,.06);}
        .mp-srow:last-child{border-bottom:none;}
        .mp-stitle{font-size:14px;font-weight:500;color:#bbb;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .mp-sartist{font-size:12px;color:#555;margin-top:2px;}
        .mp-nav{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:390px;padding:8px 18px 28px;background:linear-gradient(to top,#1c1c1c 55%,transparent);pointer-events:none;}
        .mp-nav-bar{background:rgba(40,40,40,.97);border-radius:40px;border:1px solid rgba(255,255,255,.07);display:flex;align-items:center;justify-content:space-between;padding:10px 22px;pointer-events:all;backdrop-filter:blur(20px);}
        .mp-nbtn{background:none;border:none;cursor:pointer;opacity:.7;display:flex;padding:2px;}
        .mp-nbtn:hover{opacity:1;}
        .mp-nactive{background:#9333ea;border:none;border-radius:50%;width:52px;height:52px;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 0 22px rgba(147,51,234,.6);}
      `}</style>

      <div className="mp">
        <div className="mp-body">
          <div className="mp-header">
            <div className="mp-avatar">🎩</div>
            <div className="mp-actions">
              <button className="mp-ibtn" aria-label="Edit">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button className="mp-ibtn" aria-label="Settings">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
              </button>
            </div>
          </div>

          <div className="mp-info">
            <div className="mp-name-row">
              <span className="mp-name">Sravan</span>
              <span className="mp-handle">(~savvu)</span>
            </div>
            <div className="mp-bio-row">
              <p className="mp-bio">Playing with my piano<br />since 3AM</p>
              <button className="mp-fbtn">0 Friends</button>
            </div>
          </div>
          <div className="mp-div" />

          <div className="mp-wheel"><MoodWheel /></div>

          <div className="mp-cnt">
            <div className="mp-cnt-n">67</div>
            <div className="mp-cnt-l">Songs this week</div>
          </div>

          <div className="mp-songs">
            <div className="mp-songs-h">Your Top Songs</div>
            {TOP_SONGS.map(s => (
              <div className="mp-srow" key={s.title}>
                <AlbumCircle color={s.albumColor} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="mp-stitle">{s.title}</div>
                  <div className="mp-sartist">{s.artist}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ padding: "16px 22px 40px" }}>
            <button style={{
              width: "100%",
              padding: "14px",
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 14,
              color: "#ff4d4d",
              fontSize: 15,
              fontWeight: 600,
              fontFamily: "'Inter', -apple-system, sans-serif",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              transition: "background 0.2s",
            }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,77,77,0.08)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ff4d4d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Log Out
            </button>
          </div>
        </div>

      </div>
    </>
  );
}