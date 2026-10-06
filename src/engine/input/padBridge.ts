/* il gamepad nei menu: i menu sono dom con tasti veri, il pad li imita.
   quando un'interfaccia dom ha il controllo i pulsanti diventano eventi
   tastiera sintetici su window; in gioco il ponte tace, il pad lo legge
   Input e gli eventi finti non arrivano mai a phaser durante l'azione. */

const DEAD = 0.35;
const REPEAT_MS = 180;

const BUTTON_KEY: Record<number, { code: string; key: string }> = {
    0: { code: 'Enter', key: 'Enter' },
    1: { code: 'Escape', key: 'Escape' },
    8: { code: 'Tab', key: 'Tab' },
    9: { code: 'Escape', key: 'Escape' },
};

/** avvia il ponte, ritorna lo stop */
export function startPadBridge(uiActive: () => boolean): () => void {
    let raf = 0;
    let alive = true;
    const prevButtons: boolean[] = [];
    let lastDir: string | null = null;
    let lastDirAt = 0;

    const press = (code: string, key: string): void => {
        window.dispatchEvent(new KeyboardEvent('keydown', { code, key, bubbles: true }));
    };

    const loop = (): void => {
        if (!alive) return;
        raf = requestAnimationFrame(loop);
        if (!uiActive()) {
            prevButtons.length = 0;
            lastDir = null;
            return;
        }
        let pad: Gamepad | null = null;
        try {
            const pads = navigator.getGamepads ? navigator.getGamepads() : [];
            for (const p of pads) {
                if (p?.connected) {
                    pad = p;
                    break;
                }
            }
        } catch { /* senza gamepad non si gioca col pad */ }
        if (!pad) {
            prevButtons.length = 0;
            lastDir = null;
            return;
        }
        for (const [index, mapped] of Object.entries(BUTTON_KEY)) {
            const i = Number(index);
            const down = !!pad.buttons[i]?.pressed;
            if (down && !prevButtons[i]) press(mapped.code, mapped.key);
            prevButtons[i] = down;
        }
        const ax = pad.axes[0] ?? 0;
        const ay = pad.axes[1] ?? 0;
        const btn = (i: number): boolean => !!pad!.buttons[i]?.pressed;
        let dir: string | null = null;
        if (btn(14) || ax < -DEAD) dir = 'ArrowLeft';
        else if (btn(15) || ax > DEAD) dir = 'ArrowRight';
        else if (btn(12) || ay < -DEAD) dir = 'ArrowUp';
        else if (btn(13) || ay > DEAD) dir = 'ArrowDown';
        const now = performance.now();
        if (dir) {
            if (dir !== lastDir || now - lastDirAt > REPEAT_MS) {
                press(dir, dir);
                lastDir = dir;
                lastDirAt = now;
            }
        } else {
            lastDir = null;
        }
    };
    raf = requestAnimationFrame(loop);
    return () => {
        alive = false;
        cancelAnimationFrame(raf);
    };
}
