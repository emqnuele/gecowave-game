import Phaser from 'phaser';
import { CreatureGlow, creatureFrames, creatureRes } from '../engine/art/creatureKit';
import { CREATURE_KEYS, ensureCreature } from '../engine/art/creatures';
import { FLASHBACKS } from '../content/flashbacks';
import { flashback } from '../engine/FlashbackManager';
import { sfx } from '../engine/sfx';

/* solo sviluppo (?gallery): tutto il cast vivo in griglia sotto una luce
   che segue il mouse, per controllare disegni, normal map e fotogrammi.
   ?flashback=fb-ordine (uno solo) o ?flashback=all (tutti in sequenza):
   palco nero con gli 8 ricordi in loop, clic per saltare da uno all'altro. */
export class GalleryScene extends Phaser.Scene {
    private sprites: { s: Phaser.GameObjects.Sprite; g: CreatureGlow; n: number }[] = [];
    private t = 0;

    constructor() {
        super('GalleryScene');
    }

    create(): void {
        const params = new URLSearchParams(location.search);
        if (params.has('flashback')) {
            this.flashbackPreview(params.get('flashback') ?? 'all');
            return;
        }
        const filter = params.get('gallery') ?? '';
        const keys = CREATURE_KEYS.filter((k) => !filter || filter === '1' || k.includes(filter));
        this.cameras.main.setBackgroundColor(0x1a1c24);
        this.lights.enable().setAmbientColor(0x202430);
        const big = keys.some((k) => k.startsWith('boss-'));
        const cell = Number(new URLSearchParams(location.search).get('cell')) || (big ? 210 : 120);
        const cols = Math.max(1, Math.floor((this.scale.width - 20) / cell));
        keys.forEach((key, i) => {
            const x = 20 + cell / 2 + (i % cols) * cell;
            const y = 20 + cell / 2 + Math.floor(i / cols) * cell;
            ensureCreature(this, key);
            const res = creatureRes(this, key);
            const tex = this.textures.get(key).get(0);
            const logical = Math.max(tex.width, tex.height) / res;
            const scale = (key.startsWith('boss-') ? Math.min(2.1, (cell - 30) / logical) : Math.min(cell / 50, (cell - 30) / logical)) / res;
            const s = this.add.sprite(x, y, key, 0).setScale(scale).setPipeline('Light2D');
            const g = new CreatureGlow(s);
            this.sprites.push({ s, g, n: creatureFrames(this, key) });
            this.add.text(x, y + cell / 2 - 14, key.replace(/^(enemy|boss)-/, ''), { fontFamily: 'monospace', fontSize: '11px', color: '#94a3b8' }).setOrigin(0.5);
            this.lights.addLight(x - 30, y - 50, 150, 0xfff1d6, 1.2);
        });
        const mouse = this.lights.addLight(0, 0, 260, 0x9ff5d0, 1.4);
        this.input.on('pointermove', (p: Phaser.Input.Pointer) => mouse.setPosition(p.worldX, p.worldY));
    }

    update(_time: number, delta: number): void {
        this.t += delta;
        for (const { s, g, n } of this.sprites) {
            s.setFrame(Math.floor(this.t / 170) % n);
            g.sync();
        }
    }

    /** anteprima flashback: palco nero, finto player al centro, nav DOM per provarli tutti */
    private flashbackPreview(first: string): void {
        this.cameras.main.setBackgroundColor(0x050507);
        const W = this.scale.width;
        const H = this.scale.height;
        // finto player: al flashback servono solo x/y + body + stun opzionale
        const dummy = this.physics.add.sprite(W / 2, H / 2 + 40, 'p-dot').setScale(0.1).setAlpha(0.01);
        (dummy.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);

        const ids = Object.keys(FLASHBACKS);
        let idx = ids.includes(first) ? ids.indexOf(first) : 0;
        let sequence = first === 'all' || !ids.includes(first);

        // nav DOM: una riga di bottoni sopra il letterbox
        const nav = document.createElement('div');
        nav.id = 'flashback-preview-nav';
        const title = document.createElement('span');
        title.textContent = 'flashback — E salta · click un ricordo per provarlo';
        nav.append(title);
        const btns: HTMLButtonElement[] = [];
        ids.forEach((id, i) => {
            const b = document.createElement('button');
            b.textContent = `${i + 1} ${id.replace('fb-', '')}`;
            b.onclick = () => {
                if (flashback.isPlaying) return;
                sfx.init();
                idx = i;
                sequence = false;
                this.playOne(dummy, ids[idx]!, () => this.idleNext(dummy, ids, () => idx, (v) => { idx = v; }, sequence));
                this.markActive(btns, i);
            };
            btns.push(b);
            nav.append(b);
        });
        const all = document.createElement('button');
        all.textContent = '▶ tutti';
        all.onclick = () => {
            if (flashback.isPlaying) return;
            sfx.init();
            sequence = true;
            this.playOne(dummy, ids[idx]!, () => this.idleNext(dummy, ids, () => idx, (v) => { idx = v; }, sequence));
        };
        nav.append(all);
        document.body.append(nav);
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            nav.remove();
            gate.remove();
        });

        this.markActive(btns, idx);
        // l'audio parte solo dopo un gesto: il gate lo sblocca, poi via alla sequenza
        const gate = document.createElement('div');
        gate.id = 'flashback-preview-gate';
        const go = document.createElement('button');
        go.textContent = '▶ guarda i ricordi (attiva l\u2019audio)';
        go.onclick = () => {
            sfx.init();
            gate.remove();
            this.playOne(dummy, ids[idx]!, () => this.idleNext(dummy, ids, () => idx, (v) => { idx = v; }, sequence));
        };
        gate.append(go);
        document.body.append(gate);
        this.events.on(Phaser.Scenes.Events.UPDATE, () => this.markActive(btns, idx));
    }

    private playOne(dummy: Phaser.Physics.Arcade.Sprite, id: string, onEnd: () => void): void {
        // anteprima: non sporcare il save (niente fb-<id> nei seen, niente persist)
        flashback.play(this, dummy as unknown as Phaser.GameObjects.Sprite, id, onEnd, { markSeen: false });
    }

    private idleNext(
        dummy: Phaser.Physics.Arcade.Sprite,
        ids: string[],
        get: () => number,
        set: (v: number) => void,
        sequence: boolean,
    ): void {
        if (!sequence) return;
        // 600ms di nero tra un ricordo e l'altro
        this.time.delayedCall(600, () => {
            set((get() + 1) % ids.length);
            this.playOne(dummy, ids[get()]!, () => this.idleNext(dummy, ids, get, set, sequence));
        });
    }

    private markActive(btns: HTMLButtonElement[], idx: number): void {
        btns.forEach((b, i) => b.classList.toggle('on', i === idx));
    }
}
