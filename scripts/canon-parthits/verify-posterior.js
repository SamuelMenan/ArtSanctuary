// verify-posterior.js — Superpone las regiones finales sobre posterior.png.
const path = require('path'), sharp = require('sharp')
const R = require(path.join(__dirname, 'configs/heroic-posterior-final.json'))
const plate = path.join(__dirname, '../../public/canon/heroic/posterior.png')
const cols = { trapezius:'#9650c8', shoulder:'#f5aa46', lats:'#d22828', infraspinatus:'#3c78e6', lumbar:'#50b45a', gluteus:'#e64646', arm:'#2850c8', forearm:'#b43c3c', hamstring:'#f5aa46', popliteal:'#46b4f5', calf:'#50b45a', foot:'#3c78e6', neck:'#78a050' }
sharp(plate).metadata().then((m) => {
  const W = m.width, H = m.height
  let paths = ''
  for (const [k, v] of Object.entries(R)) {
    const d = v.path.replace(/([\d.]+) ([\d.]+)/g, (_, x, y) => `${(x * W).toFixed(1)} ${(y * H).toFixed(1)}`)
    paths += `<path d="${d}" fill="${cols[k] || '#888'}" fill-opacity="0.5" stroke="${cols[k] || '#888'}" stroke-width="1.5"/>`
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${paths}</svg>`
  return sharp(plate).composite([{ input: Buffer.from(svg), top: 0, left: 0 }]).png().toFile('C:/tmp/post-verify.png')
}).then(() => console.log('ok'))
