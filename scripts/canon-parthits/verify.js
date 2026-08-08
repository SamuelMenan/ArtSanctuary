// verify.js — Superpone heroic-<view>-final.json sobre la lámina limpia
// <view>.png con los colores de muscleColors. Uso: node verify.js <view>
const path = require('path'), sharp = require('sharp')
const VIEW = process.argv[2]
if (!VIEW) { console.error('uso: node verify.js <view>'); process.exit(1) }
const R = require(path.join(__dirname, `configs/heroic-${VIEW}-final.json`))
const plate = path.join(__dirname, `../../public/canon/heroic/${VIEW}.png`)
const C = {
  trapezius:'#9f7bc4', shoulder:'#f0a850', lats:'#d76b6b', infraspinatus:'#7fb0e6',
  lumbar:'#8fc98f', gluteus:'#e07b7b', arm:'#6f9fd8', forearm:'#d39a6a',
  hamstring:'#f4c07a', popliteal:'#8fc0e6', calf:'#8fc98f', foot:'#7fb0e6', neck:'#9cc080',
  head:'#cfc0a8', chest:'#e08585', abdomen:'#f0b870', pelvis:'#c98fb8', flank:'#d39a6a',
  hip:'#c98fb8', thigh:'#c98fb8', leg:'#8fc98f', knee:'#cbb06a', ankle:'#cbb06a',
}
sharp(plate).metadata().then((m) => {
  const W = m.width, H = m.height
  let p = ''
  for (const [k, v] of Object.entries(R)) {
    const d = v.path.replace(/([\d.]+) ([\d.]+)/g, (_, x, y) => `${(x * W).toFixed(1)} ${(y * H).toFixed(1)}`)
    p += `<path d="${d}" fill="${C[k] || '#b0a8a0'}" fill-opacity="0.55" stroke="${C[k] || '#b0a8a0'}" stroke-opacity="0.85" stroke-width="0.6"/>`
  }
  return sharp(plate).composite([{ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${p}</svg>`), top: 0, left: 0 }]).png().toFile(`C:/tmp/${VIEW}-muscle-verify.png`)
}).then(() => console.log('ok'))
