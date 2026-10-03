import Phaser from 'phaser';
import { TILE } from '../config';
import { noteId, pageId, PAGE_REGIONS, REGION_NOTES, TOTAL_PAGES } from '../content/arcs';
import { hashString } from './art/ink';
import { bus } from './events';
import type { LightingManager } from './LightingManager';
import { sfx } from './sfx';
import { state } from './state';
import { checkAchievements } from './achievements';
import type { RegionLayout, Room } from '../world/types';

/* le storie sparse nelle stanze: le quattro note della regione, le pagine
   strappate di pedro, il pensiero sepolto di piema. tutto su posizioni che il
   geco simulato ha già verificato, mai sul percorso: chi esplora, legge */

export interface StoryTalkable {
    x: number;
    y: number;
    range: number;
    onInteract: () => void;
}

interface Hooks {
    dialogue: (id: string, onEnd?: () => void) => void;
    choice: (title: string, options: { label: string; danger?: boolean }[], onPick: (i: number) => void) => void;
    /** toglie un oggetto con cui parlare quando sparisce dal mondo */
    forget: (t: StoryTalkable) => void;
}

const SIDE_KINDS = new Set(['hall', 'cave', 'secret', 'shaft', 'pool', 'gauntlet']);

export class StoryManager {
    readonly talkables: StoryTalkable[] = [];
    private scene: Phaser.Scene;
    private lighting: LightingManager;
    private hooks: Hooks;

    constructor(scene: Phaser.Scene, lighting: LightingManager, hooks: Hooks) {
        this.scene = scene;
        this.lighting = lighting;
        this.hooks = hooks;
    }

    setup(regionId: string, layout: RegionLayout | null, avoid: { x: number; y: number }[]): void {
        if (!layout?.spots?.length) return;
        const used = [...avoid];
        const free = (x: number, y: number) => used.every((p) => Math.abs(p.x - x) > 170 || Math.abs(p.y - y) > 120);
        const spotIn = (room: Room): { x: number; y: number } | null => {
            const list = layout.spots!.filter((s) => s[2] === room.id);
            // dal centro della stanza verso i bordi: si legge dove c'è spazio
            const order = list.map((s, i) => ({ s, k: Math.abs(i - (list.length - 1) / 2) })).sort((a, b) => a.k - b.k);
            for (const { s } of order) {
                const x = s[0] * TILE + TILE / 2;
                const y = (s[1] + 1) * TILE - 18;
                if (free(x, y)) return { x, y };
            }
            return null;
        };
        const anchorOf = (room: Room) => (room.pathIndex >= 0 ? room.pathIndex : layout.rooms.find((o) => o.id === room.anchor)?.pathIndex ?? 0);
        // stanze laterali in ordine di avanzamento: le note si leggono nell'ordine giusto andando avanti
        const side = layout.rooms
            .filter((r) => r.pathIndex < 0 && SIDE_KINDS.has(r.kind))
            .sort((a, b) => anchorOf(a) - anchorOf(b) || hashString(`${regionId}:${a.id}`) - hashString(`${regionId}:${b.id}`));
        const pathRooms = layout.rooms.filter((r) => r.pathIndex >= 0 && (r.kind === 'hall' || r.kind === 'cave')).sort((a, b) => a.pathIndex - b.pathIndex);
        const taken = new Set<number>();
        const claim = (pool: Room[], at: number): { x: number; y: number; room: Room } | null => {
            if (!pool.length) return null;
            const start = Math.min(pool.length - 1, Math.floor(at * pool.length));
            for (let d = 0; d < pool.length; d++) {
                for (const i of [start + d, start - d]) {
                    const room = pool[i];
                    if (!room || taken.has(room.id)) continue;
                    const p = spotIn(room);
                    if (!p) continue;
                    taken.add(room.id);
                    used.push(p);
                    return { ...p, room };
                }
            }
            return null;
        };

        // le pagine di pedro stanno nelle stanze segrete, se ce ne sono: premiano chi cerca
        const pageIndex = (PAGE_REGIONS as readonly string[]).indexOf(regionId);
        if (pageIndex >= 0) {
            const secrets = side.filter((r) => r.kind === 'secret');
            const at = claim(secrets.length ? secrets : side, 0.6) ?? claim(pathRooms, 0.7);
            if (at) this.spawnPage(pageIndex, at.x, at.y);
        }

        // il pensiero sepolto: in fondo alla testa di piema, nella stanza laterale più lontana
        if (regionId === 'mente') {
            const at = claim(side, 0.95) ?? claim(pathRooms, 0.9);
            if (at) this.spawnThought(at.x, at.y);
        }

        const notes = REGION_NOTES[regionId] ?? [];
        notes.forEach((_, i) => {
            const at = claim(side, (i + 0.5) / notes.length) ?? claim(pathRooms, (i + 0.5) / notes.length);
            if (at) this.spawnNote(noteId(regionId, i), at.x, at.y);
        });
    }

    private forget(t: StoryTalkable): void {
        const i = this.talkables.indexOf(t);
        if (i >= 0) this.talkables.splice(i, 1);
        this.hooks.forget(t);
    }

    private read(id: string): boolean {
        if (state.save.collectedLore.includes(id)) return false;
        state.save.collectedLore.push(id);
        // una nota per regione ora: il trofeo scatta a 12, non a 40
        if (!state.hasFlag('storie-del-realm') && state.save.collectedLore.filter((k) => k.startsWith('nota-')).length >= 12) state.setFlag('storie-del-realm');
        state.persist();
        checkAchievements();
        return true;
    }

    private spawnNote(id: string, x: number, y: number): void {
        const tablet = this.scene.add.sprite(x, y + 1, 'lore-tablet').setDepth(4).setPipeline('Light2D')
            .setAlpha(state.save.collectedLore.includes(id) ? 0.5 : 1);
        this.talkables.push({
            x, y, range: 60,
            onInteract: () => {
                if (this.read(id)) tablet.setAlpha(0.5);
                this.hooks.dialogue(id);
            },
        });
    }

    private spawnPage(i: number, x: number, y: number): void {
        const id = pageId(i);
        if (state.save.collectedLore.includes(id)) return;
        this.ensurePageTexture();
        const page = this.scene.add.image(x, y - 6, 'pagina-pedro').setDepth(4).setPipeline('Light2D');
        const light = this.lighting.static(x, y - 10, 0x67e8f9, 120, 0.7);
        this.scene.tweens.add({ targets: page, y: y - 14, angle: { from: -6, to: 6 }, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        const t: StoryTalkable = {
            x, y, range: 60,
            onInteract: () => {
                if (!this.read(id)) return;
                sfx.pickup();
                page.destroy();
                this.lighting.remove(light);
                this.forget(t);
                const got = Array.from({ length: TOTAL_PAGES }, (_, k) => pageId(k)).filter((k) => state.save.collectedLore.includes(k)).length;
                this.hooks.dialogue(id, () => {
                    if (got < TOTAL_PAGES) {
                        bus.emit('toast', { text: `pagina del quaderno di pedro: ${got}/${TOTAL_PAGES}. le altre sono sparse nel realm.` });
                        if (got === 1) {
                            this.scene.time.delayedCall(2500, () => bus.emit('wavesung', { sender: 'markolino', text: 'hai trovato una pagina con la grafia di pedro? quella di PRIMA del glitch? cercale tutte. io le ho cercate per mesi e non ne ho mai trovata una. a te vengono incontro. chissà perché.' }));
                        }
                        return;
                    }
                    state.setFlag('quaderno-completo');
                    state.addItem('quaderno-pedro', 1);
                    this.hooks.dialogue('quaderno-completo', () => bus.emit('charm-found', { id: 'quaderno-pedro' }));
                });
            },
        };
        this.talkables.push(t);
    }

    private spawnThought(x: number, y: number): void {
        if (state.hasFlag('pensiero-cancellato') || state.hasFlag('pensiero-portato')) return;
        const orb = this.scene.add.sprite(x, y - 10, 'lore-tablet').setDepth(4).setPipeline('Light2D').setTint(0x93c5fd);
        const light = this.lighting.static(x, y - 16, 0x60a5fa, 160, 0.9);
        this.scene.tweens.add({ targets: orb, y: y - 20, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        const t: StoryTalkable = {
            x, y, range: 60,
            onInteract: () => {
                this.hooks.dialogue('pensiero-sepolto', () => {
                    this.hooks.choice('il pensiero sepolto di piema. cancellarlo ti fa come lui (nessuna prova, un dio libero). portarlo fuori lo incastra (prova per romero).', [
                        { label: 'cancellalo: come fece lui, nessun processo per piema' },
                        { label: 'portalo fuori: prova per arrestare anche piema', danger: true },
                    ], (i) => {
                        state.setFlag(i === 0 ? 'pensiero-cancellato' : 'pensiero-portato');
                        state.persist();
                        orb.destroy();
                        this.lighting.remove(light);
                        this.forget(t);
                        this.hooks.dialogue(i === 0 ? 'pensiero-cancellato' : 'pensiero-portato');
                    });
                });
            },
        };
        this.talkables.push(t);
    }

    private ensurePageTexture(): void {
        if (this.scene.textures.exists('pagina-pedro')) return;
        const g = this.scene.add.graphics();
        // foglio strappato a mano, righe azzurre e la grafia ordinata di prima del glitch
        const pts = [
            new Phaser.Math.Vector2(2, 1), new Phaser.Math.Vector2(20, 0), new Phaser.Math.Vector2(22, 4), new Phaser.Math.Vector2(20, 8),
            new Phaser.Math.Vector2(23, 13), new Phaser.Math.Vector2(21, 18), new Phaser.Math.Vector2(23, 25), new Phaser.Math.Vector2(1, 26),
        ];
        g.fillStyle(0xe7e5e4, 1);
        g.fillPoints(pts, true);
        g.lineStyle(1.5, 0x0b0c10, 1);
        g.strokePoints(pts, true);
        g.lineStyle(1, 0x67e8f9, 0.8);
        for (let y = 6; y < 24; y += 4) g.lineBetween(4, y, 17 + (y % 3), y);
        g.generateTexture('pagina-pedro', 24, 27);
        g.destroy();
    }

    destroy(): void {
        this.talkables.length = 0;
    }
}
