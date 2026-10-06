/* la camera oscura: sviluppo cinematografico degli scatti e rullino.
   gli scatti vivono in localStorage come jpeg, una ventina al massimo */

export type PhotoFilter = 'naturale' | 'inchiostro' | 'brace' | 'sangue';

export interface Photo {
    id: string;
    at: number;
    levelId: string;
    filter: PhotoFilter;
    caption: string;
    dataUrl: string;
}

export const PHOTO_FILTERS: { id: PhotoFilter; name: string }[] = [
    { id: 'naturale', name: 'naturale' },
    { id: 'inchiostro', name: 'inchiostro' },
    { id: 'brace', name: 'brace' },
    { id: 'sangue', name: 'sangue' },
];

const KEY = 'gecowave-photos-v1';
const MAX = 24;

const FILTER_CSS: Record<PhotoFilter, string> = {
    naturale: 'none',
    inchiostro: 'grayscale(1) contrast(1.15) brightness(0.92)',
    brace: 'sepia(0.45) saturate(1.5) contrast(1.05)',
    sangue: 'grayscale(0.35) contrast(1.12) sepia(0.55) hue-rotate(-50deg) saturate(2.4)',
};

/** sviluppo: filtro, vignetta, grana, mascherino e didascalia incisa */
export function processPhoto(img: HTMLImageElement, o: { filter: PhotoFilter; letterbox: boolean; caption: string }): string {
    const W = Math.min(1600, img.naturalWidth || 1280);
    const scale = W / (img.naturalWidth || 1280);
    const H = Math.round((img.naturalHeight || 720) * scale);
    const cv = document.createElement('canvas');
    cv.width = W;
    cv.height = H;
    const ctx = cv.getContext('2d')!;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    ctx.filter = FILTER_CSS[o.filter];
    ctx.drawImage(img, 0, 0, W, H);
    ctx.filter = 'none';
    // vignetta: gli angoli cadono nel buio
    const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.45)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
    // grana della pellicola
    for (let i = 0; i < 1200; i++) {
        ctx.fillStyle = `rgba(255,255,255,${(Math.random() * 0.05).toFixed(3)})`;
        ctx.fillRect(Math.random() * W, Math.random() * H, 1, 1);
    }
    const bar = Math.round(H * 0.11);
    if (o.letterbox) {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, W, bar);
        ctx.fillRect(0, H - bar, W, bar);
    }
    const caption = o.caption.trim().slice(0, 60);
    if (caption) {
        ctx.fillStyle = '#e8dfc8';
        ctx.font = `italic ${Math.round(H * 0.042)}px "IM Fell English", Georgia, serif`;
        ctx.textBaseline = 'middle';
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 8;
        ctx.fillText(caption.toLowerCase(), Math.round(W * 0.04), o.letterbox ? H - bar / 2 : H - bar / 2);
        ctx.shadowBlur = 0;
    }
    return cv.toDataURL('image/jpeg', 0.85);
}

export function listPhotos(): Photo[] {
    try {
        const raw = localStorage.getItem(KEY);
        if (!raw) return [];
        const arr = JSON.parse(raw) as Photo[];
        return Array.isArray(arr) ? arr : [];
    } catch {
        return [];
    }
}

export function savePhoto(p: Omit<Photo, 'id' | 'at'>): Photo | null {
    const photo: Photo = { ...p, id: `${Date.now().toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`, at: Date.now() };
    let arr = [photo, ...listPhotos()].slice(0, MAX);
    try {
        localStorage.setItem(KEY, JSON.stringify(arr));
        return photo;
    } catch {
        // rullino pieno o quota finita: si dimezza e si riprova una volta
        arr = [photo, ...arr.slice(0, Math.floor(MAX / 2))];
        try {
            localStorage.setItem(KEY, JSON.stringify(arr));
            return photo;
        } catch {
            return null;
        }
    }
}

export function deletePhoto(id: string): void {
    try {
        localStorage.setItem(KEY, JSON.stringify(listPhotos().filter((p) => p.id !== id)));
    } catch {
        // rullino bloccato: si esce senza rompere niente
    }
}
