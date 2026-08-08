const sharp = require('sharp');
const path = require('path');

const REF = path.join(__dirname, '../../public/canon/heroic/musculos.png');

function hsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let h = 0;
  if (d) { if (mx === r) h = 60 * (((g - b) / d) % 6); else if (mx === g) h = 60 * ((b - r) / d + 2); else h = 60 * ((r - g) / d + 4) }
  if (h < 0) h += 360;
  return [h, d / mx || 0, mx];
}

const points = {
  head: { y: 0.05, x: 0.5 },
  neck: { y: 0.14, x: 0.5 },
  trapezius: { y: 0.14, x: 0.38 },
  shoulder: { y: 0.20, x: 0.15 },
  chest: { y: 0.22, x: 0.42 },
  bicep: { y: 0.30, x: 0.12 },
  forearm: { y: 0.40, x: 0.08 },
  hand: { y: 0.52, x: 0.08 },
  abdomen: { y: 0.32, x: 0.5 },
  flank: { y: 0.35, x: 0.32 },
  thigh: { y: 0.60, x: 0.35 },
  knee: { y: 0.72, x: 0.33 },
  leg: { y: 0.82, x: 0.33 },
  foot: { y: 0.95, x: 0.33 }
};

async function run() {
  const { data, info } = await sharp(REF).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width;
  const H = info.height;

  console.log("Sampling points from musculos.png:");
  for (const [name, pt] of Object.entries(points)) {
    const px = Math.round(pt.x * W);
    const py = Math.round(pt.y * H);
    const idx = (py * W + px) * 4;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    const a = data[idx + 3];
    const [h, s, v] = hsv(r, g, b);
    console.log(`${name.padEnd(12)}: x=${pt.x.toFixed(2)} (${px}), y=${pt.y.toFixed(2)} (${py}) -> RGB(${r},${g},${b}) -> HSV(H:${h.toFixed(1)}, S:${s.toFixed(2)}, V:${v.toFixed(2)}) a=${a}`);
  }
}

run().catch(console.error);
