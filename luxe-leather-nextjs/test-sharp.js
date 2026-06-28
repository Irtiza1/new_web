const fs = require('fs');
const sharp = require('sharp');
async function run() {
  try {
    const inputBuffer = fs.readFileSync('real_test.webp');
    const buffer = await sharp(inputBuffer, { animated: false })
        .rotate()
        .resize({ width: 2200, height: 2200, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 84, effort: 4 })
        .toBuffer();
    console.log("SUCCESS:", buffer.length);
  } catch (e) {
    console.error("ERROR:", e);
  }
}
run();
