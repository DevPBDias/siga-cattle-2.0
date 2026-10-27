const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generate() {
  const width = 1170;
  const height = 2532;

  const cowPath = path.join(__dirname, '../src/assets/icons/SIGA CATTLE ICON.png');
  const logoPath = path.join(__dirname, '../src/assets/icons/logo_siga_cattle.png');

  // Read and resize the cow icon
  const cowIconBuf = await sharp(cowPath)
    .resize(320, 320, { fit: 'contain' })
    .toBuffer();

  // Read and resize the typography logo
  const logoBuf = await sharp(logoPath)
    .resize(620, null, { fit: 'contain' })
    .toBuffer();

  const logoMeta = await sharp(logoBuf).metadata();

  const svgBg = Buffer.from(`
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#0f2217" />
          <stop offset="35%" stop-color="#1e3b2b" />
          <stop offset="65%" stop-color="#162e21" />
          <stop offset="100%" stop-color="#0b1710" />
        </linearGradient>
        <radialGradient id="centerGlow" cx="50%" cy="45%" r="35%">
          <stop offset="0%" stop-color="#2d7d46" stop-opacity="0.40" />
          <stop offset="60%" stop-color="#ffcb04" stop-opacity="0.08" />
          <stop offset="100%" stop-color="#1e3b2b" stop-opacity="0" />
        </radialGradient>
      </defs>

      <rect width="${width}" height="${height}" fill="url(#bgGradient)" />
      <rect width="${width}" height="${height}" fill="url(#centerGlow)" />

      <!-- Circular Badge Border for Cow Icon -->
      <circle cx="${width / 2}" cy="1000" r="190" fill="#14281e" fill-opacity="0.75" stroke="#ffcb04" stroke-width="3" stroke-opacity="0.5" />
      <circle cx="${width / 2}" cy="1000" r="202" fill="none" stroke="#2d7d46" stroke-width="2" stroke-opacity="0.4" stroke-dasharray="8 8" />

      <!-- Subtitle tag -->
      <text x="${width / 2}" y="1460" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="28" font-weight="700" fill="#ffcb04" letter-spacing="9">GESTÃO PECUÁRIA</text>

      <!-- Bottom loading indicator text -->
      <text x="${width / 2}" y="2360" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="24" font-weight="500" fill="#ffffff" fill-opacity="0.6" letter-spacing="3">Carregando...</text>
    </svg>
  `);

  const cowTop = 1000 - 160;
  const cowLeft = Math.round((width - 320) / 2);
  const logoTop = 1260;
  const logoLeft = Math.round((width - logoMeta.width) / 2);

  const finalImg = await sharp(svgBg)
    .composite([
      { input: cowIconBuf, top: cowTop, left: cowLeft },
      { input: logoBuf, top: logoTop, left: logoLeft }
    ])
    .png()
    .toBuffer();

  const publicSplash = path.join(__dirname, '../public/splash.png');
  const assetOpening = path.join(__dirname, '../src/assets/images/opening-page.png');

  fs.writeFileSync(publicSplash, finalImg);
  fs.writeFileSync(assetOpening, finalImg);

  console.log('Successfully written new splash to:', publicSplash, 'and', assetOpening);
}

generate().catch((err) => {
  console.error('Error in splash generator:', err);
  process.exit(1);
});
