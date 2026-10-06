// Draws the profile header: one grainy line that falls from a small dot and wanders across the page,
// the same hand as amberburch.com. Pencil for light GitHub, warm amber light for dark.
// Run: node header/draw.mjs   (writes header/light.svg and header/dark.svg)
import { writeFileSync } from 'node:fs'

const W = 960, H = 220
const SEED = 20261006

// A small, repeatable random source, so the drawing is the same every time it is generated.
let s = SEED
const rand = () => { s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
const phase = Array.from({ length: 6 }, () => rand() * 6.283)

// The pen: a heading that drifts like a hand, pulled loosely towards a moving point, kept inside the frame.
const pen = { x: 64, y: 70, a: Math.PI / 2 + 0.4 }
const pts = [[pen.x, pen.y]]
const dt = 1 / 120
for (let i = 0; i < 1700; i++) {
  const t = i * 8.3
  const turn = Math.sin(t * 0.0009 + phase[0]) * 1.9 + Math.sin(t * 0.0023 + phase[1]) * 1.1 + Math.sin(t * 0.0051) * 0.6
  pen.a += turn * dt
  const gx = W * 0.5 + Math.sin(t * 0.00031 + phase[2]) * W * 0.42
  const gy = H * 0.52 + Math.cos(t * 0.00043 + phase[3]) * H * 0.16
  let want = Math.atan2(gy - pen.y, gx - pen.x), pull = 0.9
  const m = 38
  if (pen.x < m || pen.x > W - m || pen.y < m || pen.y > H - m) { want = Math.atan2(H / 2 - pen.y, W / 2 - pen.x); pull = 7 }
  let d = want - pen.a; d = Math.atan2(Math.sin(d), Math.cos(d))
  pen.a += d * pull * dt
  pen.x += Math.cos(pen.a) * 210 * dt; pen.y += Math.sin(pen.a) * 210 * dt
  if (i % 5 === 4) pts.push([pen.x, pen.y])
}

// Smooth the points into one continuous curve (Catmull-Rom as cubic Béziers).
const f = n => n.toFixed(1)
let path = `M${f(pts[0][0])} ${f(pts[0][1])}`
for (let i = 0; i < pts.length - 1; i++) {
  const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2
  const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
  const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
  path += ` C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`
}

const svg = ({ ink, glow }) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="A single hand-drawn line falls from a small dot and draws itself across the page.">
<defs>
  <filter id="graphite" x="-2%" y="-12%" width="104%" height="124%">
    <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="rough"/>
    <feDisplacementMap in="SourceGraphic" in2="rough" scale="2.4" xChannelSelector="R" yChannelSelector="G" result="line"/>
    <feTurbulence type="fractalNoise" baseFrequency="1.7" numOctaves="1" seed="3" result="grain"/>
    <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  2.6 0 0 0 -0.75" result="speckle"/>
    <feComposite in="line" in2="speckle" operator="in" result="pencil"/>${glow ? `
    <feGaussianBlur in="pencil" stdDeviation="3.2" result="halo"/>
    <feMerge><feMergeNode in="halo"/><feMergeNode in="pencil"/><feMergeNode in="pencil"/></feMerge>` : ''}
  </filter>
</defs>
<style>
  .line { fill: none; stroke: ${ink}; stroke-width: 2.6; stroke-linecap: round; stroke-linejoin: round;
          stroke-dasharray: 1; stroke-dashoffset: 1; animation: draw 16s cubic-bezier(.45,.1,.35,1) infinite; }
  .echo { opacity: .22; stroke-width: 1.4; animation-delay: .5s; }
  .dot { fill: ${ink}; transform-origin: 64px 66px; animation: breathe 16s ease-in-out infinite; }
  @keyframes draw { 0% { stroke-dashoffset: 1; opacity: 1 } 62% { stroke-dashoffset: 0; opacity: 1 } 88% { stroke-dashoffset: 0; opacity: 1 } 97% { stroke-dashoffset: 0; opacity: 0 } 100% { stroke-dashoffset: 1; opacity: 0 } }
  @keyframes breathe { 0%, 100% { transform: scale(1); opacity: .9 } 4% { transform: scale(1.5); opacity: 1 } 10% { transform: scale(1); opacity: .9 } }
  @media (prefers-reduced-motion: reduce) { .line { animation: none; stroke-dashoffset: 0 } .dot { animation: none } }
</style>
<g filter="url(#graphite)">
  <path class="line echo" pathLength="1" d="${path}"/>
  <path class="line" pathLength="1" d="${path}"/>
</g>
<circle class="dot" cx="64" cy="66" r="3.4"/>
</svg>
`

writeFileSync(new URL('./light.svg', import.meta.url), svg({ ink: '#1d1c1a', glow: false }))
writeFileSync(new URL('./dark.svg', import.meta.url), svg({ ink: '#f0b45a', glow: true }))
console.log(`drew ${pts.length} points into header/light.svg and header/dark.svg`)
