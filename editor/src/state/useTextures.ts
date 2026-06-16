import { useEffect, useState } from 'react';
import { bakeTextures, type BakedTextures } from '@/lib/textureBaker';

/* cuoce le texture una sola volta e le condivide. */
export function useTextures(): { baked: BakedTextures | null; error: string | null } {
    const [baked, setBaked] = useState<BakedTextures | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let alive = true;
        bakeTextures()
            .then((b) => alive && setBaked(b))
            .catch((e) => alive && setError(String(e)));
        return () => {
            alive = false;
        };
    }, []);

    return { baked, error };
}
