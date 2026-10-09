// genera tutte le icone e le grafiche dell'installer da una singola public/icon.png (1024x1024+)
// output in build/: icon.png/.ico/.icns, installerHeader.bmp, installerSidebar.bmp, dmg-background.png
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';
import png2icons from 'png2icons';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SRC = join(root, 'public', 'icon.png');
const OUT = join(root, 'build');

// palette coerente col gioco (dark + acid gold)
const BG_DARK = '#0a0a0c';
const BG_DARK2 = '#16161a';
const GOLD = '#dfb15b';

if (!existsSync(SRC)) {
    console.warn('\n[gen-icons] public/icon.png non trovata: salto la generazione.');
    console.warn('[gen-icons] mettine una a 1024x1024 (o piu) e rilancia per icone e installer brandizzati.\n');
    process.exit(0);
}

mkdirSync(OUT, { recursive: true });

// converte un buffer immagine in BMP 24-bit (richiesto da NSIS per header/sidebar)
async function toBMP(pngBuffer, outPath) {
    const { data, info } = await sharp(pngBuffer)
        .flatten({ background: BG_DARK })
        .removeAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
    const { width, height } = info;
    const rowSize = Math.floor((24 * width + 31) / 32) * 4;
    const pixelArraySize = rowSize * height;
    const buf = Buffer.alloc(54 + pixelArraySize);
    buf.write('BM', 0);
    buf.writeUInt32LE(buf.length, 2);
    buf.writeUInt32LE(54, 10);
    buf.writeUInt32LE(40, 14);
    buf.writeInt32LE(width, 18);
    buf.writeInt32LE(height, 22);
    buf.writeUInt16LE(1, 26);
    buf.writeUInt16LE(24, 28);
    buf.writeUInt32LE(pixelArraySize, 34);
    buf.writeInt32LE(2835, 38);
    buf.writeInt32LE(2835, 42);
    for (let y = 0; y < height; y++) {
        const srcY = height - 1 - y; // bmp e' bottom-up
        let p = 54 + y * rowSize;
        for (let x = 0; x < width; x++) {
            const si = (srcY * width + x) * 3;
            buf[p++] = data[si + 2];
            buf[p++] = data[si + 1];
            buf[p++] = data[si];
        }
    }
    writeFileSync(outPath, buf);
}

const src = sharp(SRC);

// 1) png base ad alta risoluzione (linux + finestra app)
await src.clone().resize(1024, 1024, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png().toFile(join(OUT, 'icon.png'));

// 2) ico (windows) e icns (mac) dalla sorgente png
const pngBuf = await src.clone().resize(1024, 1024, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
writeFileSync(join(OUT, 'icon.ico'), png2icons.createICO(pngBuf, png2icons.BILINEAR, 0, true));
writeFileSync(join(OUT, 'icon.icns'), png2icons.createICNS(pngBuf, png2icons.BILINEAR, 0));

// logo ridimensionato riusabile nelle grafiche
const logo = (size) => src.clone().resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();

// 3) sidebar NSIS (164x314): pannello dark brandizzato con glow dorato + logo
{
    const W = 164, H = 314;
    const bg = Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${BG_DARK2}"/>
          <stop offset="1" stop-color="${BG_DARK}"/>
        </linearGradient>
        <radialGradient id="glow" cx="50%" cy="34%" r="55%">
          <stop offset="0" stop-color="${GOLD}" stop-opacity="0.28"/>
          <stop offset="1" stop-color="${GOLD}" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="${W}" height="${H}" fill="url(#g)"/>
      <rect width="${W}" height="${H}" fill="url(#glow)"/>
      <rect x="0" y="0" width="${W}" height="2" fill="${GOLD}" opacity="0.55"/>
    </svg>`);
    const composed = await sharp(bg)
        .composite([{ input: await logo(108), top: 52, left: Math.round((W - 108) / 2) }])
        .png().toBuffer();
    await toBMP(composed, join(OUT, 'installerSidebar.bmp'));
}

// 4) header NSIS (150x57): chiaro e leggibile, logo a destra + filo dorato
{
    const W = 150, H = 57;
    const bg = Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${W}" height="${H}" fill="#f4f3ec"/>
      <rect x="0" y="${H - 2}" width="${W}" height="2" fill="${GOLD}"/>
    </svg>`);
    const composed = await sharp(bg)
        .composite([{ input: await logo(42), top: Math.round((H - 42) / 2), left: W - 42 - 8 }])
        .flatten({ background: '#f4f3ec' })
        .png().toBuffer();
    await toBMP(composed, join(OUT, 'installerHeader.bmp'));
}

// 5) sfondo DMG (540x380): gradient dark, logo in alto, freccia verso Applicazioni
{
    const W = 540, H = 380;
    const bg = Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${BG_DARK2}"/>
          <stop offset="1" stop-color="${BG_DARK}"/>
        </linearGradient>
        <radialGradient id="glow" cx="50%" cy="62%" r="60%">
          <stop offset="0" stop-color="${GOLD}" stop-opacity="0.10"/>
          <stop offset="1" stop-color="${GOLD}" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="${W}" height="${H}" fill="url(#g)"/>
      <rect width="${W}" height="${H}" fill="url(#glow)"/>
      <g stroke="${GOLD}" stroke-width="3" fill="none" opacity="0.8" stroke-linecap="round" stroke-linejoin="round">
        <line x1="232" y1="215" x2="308" y2="215"/>
        <polyline points="296,203 310,215 296,227"/>
      </g>
    </svg>`);
    const composed = await sharp(bg)
        .composite([{ input: await logo(120), top: 36, left: Math.round((W - 120) / 2) }])
        .png().toBuffer();
    writeFileSync(join(OUT, 'dmg-background.png'), composed);
}

console.log('[gen-icons] generati: icon.png/.ico/.icns, installerSidebar.bmp, installerHeader.bmp, dmg-background.png in build/');
