import sharp from 'sharp';
import { copyFileSync } from 'node:fs';

// Toglie l'alone bianco dallo scontorno (matte su fondo chiaro) senza
// toccare il disegno: solo i pixel semi-trasparenti cambiano RGB, mai l'alpha.
// - alpha alta: unblend del matte, recupera il vero colore (stabile);
// - alpha bassa: copia dall'opaco piu' vicino (l'unblend amplificherebbe il rumore).
// Uso: node scripts/defringe-sprite.mjs <input> [output]
// senza output: backup in <input>.bak.png e sovrascrittura sul posto.

const R = 6;
const UNBLEND_MIN_A = 128;

const input = process.argv[2] ?? 'public/assets/sprites/player_sheet.png';
const output = process.argv[3] ?? null;

const { data, info } = await sharp(input).raw().toBuffer({ resolveWithObject: true });
const W = info.width, H = info.height;
const A = (x, y) => data[(y * W + x) * 4 + 3];
const out = Buffer.from(data);
let nUnblend = 0, nDonor = 0;
for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4, a = data[i + 3];
        if (a <= 0 || a >= 255) continue;
        if (a >= UNBLEND_MIN_A) {
            const inv = 255 * (1 - a / 255), al = a / 255;
            for (let c = 0; c < 3; c++) out[i + c] = Math.min(255, Math.max(0, Math.round((data[i + c] - inv) / al)));
            nUnblend++;
            continue;
        }
        let bx = -1, by = -1, bd = Infinity;
        for (let dy = -R; dy <= R; dy++) {
            for (let dx = -R; dx <= R; dx++) {
                if (!dx && !dy) continue;
                const nx = x + dx, ny = y + dy;
                if (nx < 0 || ny < 0 || nx >= W || ny >= H || A(nx, ny) !== 255) continue;
                const d = dx * dx + dy * dy;
                if (d < bd) { bd = d; bx = nx; by = ny; }
            }
        }
        if (bx < 0) continue;
        const j = (by * W + bx) * 4;
        out[i] = data[j]; out[i + 1] = data[j + 1]; out[i + 2] = data[j + 2];
        nDonor++;
    }
}
console.log(`unblend: ${nUnblend} | donor: ${nDonor}`);

if (output) {
    await sharp(out, { raw: { width: W, height: H, channels: 4 } }).png().toFile(output);
    console.log(`scritto ${output}`);
} else {
    copyFileSync(input, `${input}.bak.png`);
    await sharp(out, { raw: { width: W, height: H, channels: 4 } }).png().toFile(input);
    console.log(`sovrascritto ${input} (backup in ${input}.bak.png)`);
}
