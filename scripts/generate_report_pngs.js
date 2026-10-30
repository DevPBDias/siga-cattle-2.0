const fs = require('fs');
const path = require('path');
const { encode } = require('fast-png');

function createBadgePng({
  width = 300,
  height = 100,
  primaryColor = [30, 59, 43], // rgb
  secondaryColor = [255, 203, 4], // rgb
  text = 'AGRO 3MIL',
  subText = 'SIGA CATTLE'
}) {
  const data = new Uint8Array(width * height * 4);

  // Background is transparent (0, 0, 0, 0)
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 0;
    data[i + 1] = 0;
    data[i + 2] = 0;
    data[i + 3] = 0;
  }

  // Draw a rounded rectangular container
  const radius = 12;
  const padding = 4;
  for (let y = padding; y < height - padding; y++) {
    for (let x = padding; x < width - padding; x++) {
      // Check corner rounding
      const inTopLeft = x < padding + radius && y < padding + radius;
      const inTopRight = x >= width - padding - radius && y < padding + radius;
      const inBottomLeft = x < padding + radius && y >= height - padding - radius;
      const inBottomRight = x >= width - padding - radius && y >= height - padding - radius;

      let draw = true;
      if (inTopLeft) {
        const dx = x - (padding + radius);
        const dy = y - (padding + radius);
        if (dx * dx + dy * dy > radius * radius) draw = false;
      } else if (inTopRight) {
        const dx = x - (width - padding - radius - 1);
        const dy = y - (padding + radius);
        if (dx * dx + dy * dy > radius * radius) draw = false;
      } else if (inBottomLeft) {
        const dx = x - (padding + radius);
        const dy = y - (height - padding - radius - 1);
        if (dx * dx + dy * dy > radius * radius) draw = false;
      } else if (inBottomRight) {
        const dx = x - (width - padding - radius - 1);
        const dy = y - (height - padding - radius - 1);
        if (dx * dx + dy * dy > radius * radius) draw = false;
      }

      if (draw) {
        const idx = (y * width + x) * 4;
        const isBorder = (x <= padding + 2 || x >= width - padding - 3 || y <= padding + 2 || y >= height - padding - 3);
        if (isBorder) {
          data[idx] = secondaryColor[0];
          data[idx + 1] = secondaryColor[1];
          data[idx + 2] = secondaryColor[2];
          data[idx + 3] = 255;
        } else {
          data[idx] = primaryColor[0];
          data[idx + 1] = primaryColor[1];
          data[idx + 2] = primaryColor[2];
          data[idx + 3] = 240;
        }
      }
    }
  }

  // Draw circular emblem on the left
  const cx = 50;
  const cy = height / 2;
  const cr = 32;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const distSq = dx * dx + dy * dy;
      if (distSq <= cr * cr) {
        const idx = (y * width + x) * 4;
        if (distSq >= (cr - 3) * (cr - 3)) {
          // Gold border
          data[idx] = secondaryColor[0];
          data[idx + 1] = secondaryColor[1];
          data[idx + 2] = secondaryColor[2];
          data[idx + 3] = 255;
        } else {
          // Inner emblem
          data[idx] = primaryColor[0];
          data[idx + 1] = primaryColor[1];
          data[idx + 2] = primaryColor[2];
          data[idx + 3] = 255;
        }
      }
    }
  }

  return encode({ width, height, data });
}

const rootDir = 'c:/Users/User/Desktop/Projetos/INDI Ouro 2.0';

// 1. Agro 3mil
const agroPng = createBadgePng({
  width: 300,
  height: 90,
  primaryColor: [30, 59, 43], // #1E3B2B
  secondaryColor: [247, 233, 212], // #F7E9D4
  text: 'FAZENDA AGRO 3MIL',
  subText: 'SIGA CATTLE'
});
fs.writeFileSync(path.join(rootDir, 'public/branding/agro3mil/logo-report.png'), Buffer.from(agroPng));
console.log('Agro 3mil report logo written.');

// 2. Fazenda B
const fazendaBPng = createBadgePng({
  width: 300,
  height: 90,
  primaryColor: [17, 98, 174], // #1162AE
  secondaryColor: [255, 203, 4], // #FFCB04
  text: 'FAZENDA B',
  subText: 'SIGA CATTLE'
});
fs.writeFileSync(path.join(rootDir, 'public/branding/fazenda-b/logo-report.png'), Buffer.from(fazendaBPng));
fs.writeFileSync(path.join(rootDir, 'public/branding/fazendaB/logo-report.png'), Buffer.from(fazendaBPng));
console.log('Fazenda B report logo written.');
