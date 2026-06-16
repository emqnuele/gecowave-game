import { useEffect, useRef } from 'react';
import type { BakedTextures } from '@/lib/textureBaker';

/* disegna una texture bakata in un riquadro, contenuta e nitida. */
export function SpriteIcon({ baked, texture, size = 40 }: { baked: BakedTextures; texture: string | null; size?: number }) {
    const ref = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const cv = ref.current;
        if (!cv) return;
        const ctx = cv.getContext('2d')!;
        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, size, size);
        const img = texture?.startsWith('tile-')
            ? null
            : texture
              ? baked.sprites.get(texture)
              : null;
        const tileFrame = texture === 'tile-wall' ? baked.tiles[8] : texture === 'tile-fake' || texture === 'tile-break' ? baked.tiles[8] : null;
        const src = img ?? tileFrame;
        if (!src) return;
        const w = 'width' in src ? src.width : size;
        const h = 'height' in src ? src.height : size;
        const scale = Math.min(size / w, size / h);
        ctx.drawImage(src, (size - w * scale) / 2, (size - h * scale) / 2, w * scale, h * scale);
    }, [baked, texture, size]);

    return <canvas ref={ref} width={size} height={size} className="shrink-0" />;
}
