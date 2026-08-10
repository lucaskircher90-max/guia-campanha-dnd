// Verso genérico das cartas de tarot — desenho próprio (SVG), usado para
// toda carta virada pra baixo. Inspirado nos motivos das artes originais do
// usuário (borda ornamentada, pentagramas, velas, janela em arco com reflexo
// em espelho), mas é um desenho novo, não uma cópia daquelas artes.

function polar(cx, cy, r, angleDeg) {
  const rad = (Math.PI / 180) * angleDeg;
  return { x: cx + r * Math.sin(rad), y: cy - r * Math.cos(rad) };
}

function starPoints(cx, cy, outerR, innerR, spikes = 5) {
  const step = 180 / spikes;
  const pts = [];
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const p = polar(cx, cy, r, i * step);
    pts.push(`${p.x.toFixed(1)},${p.y.toFixed(1)}`);
  }
  return pts.join(" ");
}

function ropeBeads(x, y, w, h, step = 11) {
  const pts = [];
  let i = 0;
  for (let px = x; px <= x + w; px += step, i++) pts.push({ x: px, y, big: i % 2 === 0 });
  for (let py = y; py <= y + h; py += step, i++) pts.push({ x: x + w, y: py, big: i % 2 === 0 });
  for (let px = x + w; px >= x; px -= step, i++) pts.push({ x: px, y: y + h, big: i % 2 === 0 });
  for (let py = y + h; py >= y; py -= step, i++) pts.push({ x, y: py, big: i % 2 === 0 });
  return pts;
}

function Pentagram({ cx, cy }) {
  return (
    <g stroke="var(--color-gold-400)" fill="none" strokeWidth="1">
      <circle cx={cx} cy={cy} r="12" />
      <polygon points={starPoints(cx, cy, 9.5, 3.6)} strokeWidth="0.9" />
    </g>
  );
}

function Candle({ cx, y }) {
  return (
    <g stroke="var(--color-gold-400)" fill="none" strokeWidth="1">
      <rect x={cx - 3} y={y - 14} width="6" height="16" rx="1" />
      <path d={`M ${cx - 3} ${y} L ${cx + 3} ${y}`} />
      <path d={`M ${cx} ${y - 17} q -2.5 -4 0 -7 q 2.5 3 0 7`} fill="var(--color-gold-400)" stroke="none" />
    </g>
  );
}

export default function TarotCardBack({ className = "" }) {
  const beads = ropeBeads(12, 12, 176, 296, 11);
  const archX = 34, archY = 46, archW = 132, archR = 66;
  const archBottom = 236;
  const midY = (archY + archR + archBottom) / 2;

  return (
    <svg viewBox="0 0 200 320" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="tcb-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-parchment-200)" />
          <stop offset="100%" stopColor="var(--color-parchment-300)" />
        </linearGradient>
        <linearGradient id="tcb-window" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#171022" />
          <stop offset="100%" stopColor="#05040a" />
        </linearGradient>
        <clipPath id="tcb-window-clip">
          <path
            d={`M ${archX} ${archBottom} L ${archX} ${archY + archR} A ${archR} ${archR} 0 0 1 ${archX + archW} ${archY + archR} L ${archX + archW} ${archBottom} Z`}
          />
        </clipPath>
      </defs>

      <rect x="3" y="3" width="194" height="314" rx="10" fill="url(#tcb-bg)" stroke="var(--color-gold-600)" strokeWidth="2" />

      {beads.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={p.big ? 2.1 : 1.2} fill="var(--color-gold-500)" opacity={p.big ? 0.9 : 0.55} />
      ))}

      <Pentagram cx={26} cy={26} />
      <Pentagram cx={174} cy={26} />
      <Candle cx={26} y={296} />
      <Candle cx={174} y={296} />

      <path
        d={`M ${archX} ${archBottom} L ${archX} ${archY + archR} A ${archR} ${archR} 0 0 1 ${archX + archW} ${archY + archR} L ${archX + archW} ${archBottom} Z`}
        fill="url(#tcb-window)"
        stroke="var(--color-gold-500)"
        strokeWidth="1.5"
      />

      <g clipPath="url(#tcb-window-clip)">
        {/* selo radiante central */}
        <g transform={`translate(100 ${midY - 34})`} stroke="var(--color-gold-400)" fill="none" strokeWidth="0.8" opacity="0.9">
          <circle r="17" />
          <circle r="10" />
          <polygon points={starPoints(0, 0, 17, 6.5)} strokeWidth="0.7" opacity="0.8" />
          {Array.from({ length: 12 }).map((_, i) => {
            const a = i * 30;
            const p1 = polar(0, 0, 19, a);
            const p2 = polar(0, 0, 23, a);
            return <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} />;
          })}
        </g>

        {/* linha d'água */}
        <line x1={archX} x2={archX + archW} y1={midY} y2={midY} stroke="var(--color-gold-500)" strokeWidth="0.6" opacity="0.5" />

        {/* reflexo espelhado, mais apagado */}
        <g
          transform={`translate(100 ${midY + 34}) scale(1 -1)`}
          stroke="var(--color-gold-400)"
          fill="none"
          strokeWidth="0.8"
          opacity="0.35"
        >
          <circle r="17" />
          <circle r="10" />
          <polygon points={starPoints(0, 0, 17, 6.5)} strokeWidth="0.7" />
          {Array.from({ length: 12 }).map((_, i) => {
            const a = i * 30;
            const p1 = polar(0, 0, 19, a);
            const p2 = polar(0, 0, 23, a);
            return <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} />;
          })}
        </g>
      </g>
    </svg>
  );
}
