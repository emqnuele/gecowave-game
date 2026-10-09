import type Phaser from 'phaser';
import { keyLabel } from '../input/keyText';
import type { GameContext, GameSystem } from './context';

/** qualcosa con cui si parla o si agisce premendo interagisci */
export interface Interactable {
    x: number;
    y: number;
    range: number;
    onInteract: () => void;
    /** in due: si fa sul proprio schermo senza chiedere all'host (passanti, nascondigli) */
    local?: boolean;
}

/** il registro di cosa si può toccare: npc, passanti, missioni, storia, meccaniche, sigilli, sfide, corse */
export class Interactions implements GameSystem {
    private readonly ctx: Pick<GameContext, 'scene' | 'player'>;
    // a parità di distanza vince chi è entrato prima: l'ordine d'inserimento è comportamento
    private list: Interactable[] = [];
    private prompt!: Phaser.GameObjects.Container;
    private promptTxt!: Phaser.GameObjects.Text;

    constructor(ctx: Pick<GameContext, 'scene' | 'player'>) {
        this.ctx = ctx;
    }

    /** gli oggetti restano quelli dei manager: i passanti si muovono e il registro li segue */
    add(...items: Interactable[]): void {
        this.list.push(...items);
    }

    remove(item: Interactable | null): void {
        this.list = this.list.filter((it) => it !== item);
    }

    /** via quello che sta qui intorno: porte cadute anche dall'altra parte */
    removeNear(x: number, y: number, r: number): void {
        this.list = this.list.filter((it) => Math.hypot(it.x - x, it.y - y) > r);
    }

    /** dove sta già qualcosa, per chi deve piazzare altro senza coprirlo */
    points(): { x: number; y: number }[] {
        return this.list.map((it) => ({ x: it.x, y: it.y }));
    }

    someNear(x: number, y: number, dx: number, dy: number): boolean {
        return this.list.some((it) => Math.abs(it.x - x) < dx && Math.abs(it.y - y) < dy);
    }

    nearest(): Interactable | null {
        return this.nearestTo(this.ctx.player.x, this.ctx.player.y);
    }

    /** il più vicino a un punto: in due l'host lo cerca dove sta l'ospite */
    nearestTo(x: number, y: number): Interactable | null {
        const p = { x, y };
        let best: Interactable | null = null;
        let bestDist = Infinity;
        for (const it of this.list) {
            const d = Math.hypot(p.x - it.x, p.y - it.y);
            if (d < it.range && d < bestDist) {
                best = it;
                bestDist = d;
            }
        }
        return best;
    }

    buildPrompt(): void {
        const add = this.ctx.scene.add;
        const circle = add.graphics();
        circle.fillStyle(0x000000, 0.6);
        circle.fillCircle(0, 0, 11);
        circle.lineStyle(1.5, 0x4ade80, 0.8);
        circle.strokeCircle(0, 0, 11);
        const txt = add.text(0, 0, 'E', {
            fontFamily: '"Martian Mono", monospace',
            fontSize: '11px',
            color: '#4ade80',
        }).setOrigin(0.5);
        this.promptTxt = txt;
        this.prompt = add.container(0, 0, [circle, txt]).setDepth(8).setVisible(false);
    }

    updatePrompt(): void {
        const near = this.nearest();
        if (near) {
            this.promptTxt.setText(keyLabel('interact'));
            this.prompt.setVisible(true);
            this.prompt.setPosition(near.x, near.y - 48 + Math.sin(this.ctx.scene.time.now / 300) * 3);
        } else {
            this.prompt.setVisible(false);
        }
    }

    destroy(): void {}
}
