import Phaser from 'phaser';
import { ACTIONS, bindingsFor, GAMEPAD, type Action } from './actions';
import { bus } from '../events';

/* lo stato delle azioni per fotogramma: la scena lo aggiorna una volta
   prima del giocatore, poi tutti leggono down/pressed/released. gli stati
   si calcolano confrontando col fotogramma prima, così più lettori non
   si rubano mai l'evento. */

const STICK_DEAD = 0.35;

type Device = 'tastiera' | 'gamepad';

export class Input {
    private scene: Phaser.Scene;
    private keys = new Map<string, Phaser.Input.Keyboard.Key>();
    private prev = new Map<Action, boolean>();
    private curr = new Map<Action, boolean>();
    private currKb = new Map<Action, boolean>();
    private currPad = new Map<Action, boolean>();
    private prevPadButtons: boolean[] = [];
    private prevStickNeutral = true;
    private _device: Device = 'tastiera';

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.rebuild();
        this.reset();
        // il clic destro è lo scudo: niente menu contestuale sul canvas
        scene.input.mouse?.disableContextMenu();
    }

    /** ultimo dispositivo usato: decide le etichette nei testi */
    get device(): Device {
        return this._device;
    }

    /** da chiamare una volta per fotogramma, prima di Player.update */
    update(): void {
        // prima prev = fotogramma scorso, poi curr = adesso: gli spigoli
        // restano visibili a chi legge dopo update, fino al fotogramma dopo
        for (const a of ACTIONS) this.prev.set(a, this.curr.get(a) ?? false);
        for (const a of ACTIONS) {
            const kb = this.readKb(a);
            const pad = this.readPad(a);
            this.currKb.set(a, kb);
            this.currPad.set(a, pad);
            this.curr.set(a, kb || pad);
        }
        // il dispositivo segue l'ultimo usato davvero
        let padEdge = this.padPressedEdge();
        if (!padEdge && this.stickEdge()) padEdge = true;
        if (padEdge) {
            this.setDevice('gamepad');
        } else {
            for (const a of ACTIONS) {
                if (this.currKb.get(a) && !this.prev.get(a)) {
                    this.setDevice('tastiera');
                    break;
                }
            }
        }
    }

    down(a: Action): boolean {
        return this.curr.get(a) ?? false;
    }

    pressed(a: Action): boolean {
        return (this.curr.get(a) ?? false) && !(this.prev.get(a) ?? false);
    }

    released(a: Action): boolean {
        return !(this.curr.get(a) ?? false) && (this.prev.get(a) ?? false);
    }

    /** dopo una rimappatura: ricrea i tasti legati */
    rebuild(): void {
        const kb = this.scene.input.keyboard;
        if (!kb) return;
        for (const a of ACTIONS) {
            for (const key of bindingsFor(a)) {
                if (key.startsWith('MOUSE_')) continue;
                if (this.keys.has(key)) continue;
                // un nome ignoto a phaser darebbe un tasto senza codice: lo salta, la rimappatura resta
                if (!(key.toUpperCase() in Phaser.Input.Keyboard.KeyCodes)) continue;
                this.keys.set(key, kb.addKey(key, false));
            }
        }
    }

    /** riallinea col mondo: niente spigoli vecchi dopo una pausa */
    reset(): void {
        for (const a of ACTIONS) {
            const kb = this.readKb(a);
            const pad = this.readPad(a);
            this.currKb.set(a, kb);
            this.currPad.set(a, pad);
            const down = kb || pad;
            this.curr.set(a, down);
            this.prev.set(a, down);
        }
        this.prevPadButtons = this.padButtons();
        this.prevStickNeutral = this.stickNeutral();
    }

    destroy(): void {
        this.keys.clear();
    }

    private setDevice(d: Device): void {
        if (this._device === d) return;
        this._device = d;
        bus.emit('input-device', { device: d });
    }

    private readKb(a: Action): boolean {
        const pointer = this.scene.input.activePointer;
        for (const key of bindingsFor(a)) {
            if (key === 'MOUSE_LEFT' && pointer?.leftButtonDown()) return true;
            if (key === 'MOUSE_RIGHT' && pointer?.rightButtonDown()) return true;
            const k = this.keys.get(key);
            if (k?.isDown) return true;
        }
        return false;
    }

    private pad(): (Gamepad & { connected: boolean }) | null {
        const gp = this.scene.input.gamepad;
        if (!gp) return null;
        for (let i = 0; i < 4; i++) {
            const p = gp.getPad(i) as unknown as (Gamepad & { connected: boolean }) | null;
            if (p?.connected) return p;
        }
        return null;
    }

    private readPad(a: Action): boolean {
        const pad = this.pad();
        if (!pad) return false;
        const map = GAMEPAD[a];
        if (typeof map === 'string') {
            const ax = pad.axes[0] ?? 0;
            const ay = pad.axes[1] ?? 0;
            const btn = (i: number): boolean => !!pad.buttons[i]?.pressed;
            switch (map) {
                case 'stick-left': return ax < -STICK_DEAD || btn(14);
                case 'stick-right': return ax > STICK_DEAD || btn(15);
                case 'stick-up': return ay < -STICK_DEAD || btn(12);
                case 'stick-down': return ay > STICK_DEAD || btn(13);
            }
        }
        for (const i of map) {
            if (pad.buttons[i]?.pressed) return true;
        }
        return false;
    }

    private padButtons(): boolean[] {
        const pad = this.pad();
        if (!pad) return [];
        return pad.buttons.map((b) => b.pressed);
    }

    private padPressedEdge(): boolean {
        const now = this.padButtons();
        let edge = false;
        for (let i = 0; i < now.length; i++) {
            if (now[i] && !this.prevPadButtons[i]) {
                edge = true;
                break;
            }
        }
        this.prevPadButtons = now;
        return edge;
    }

    private stickNeutral(): boolean {
        const pad = this.pad();
        if (!pad) return true;
        const ax = Math.abs(pad.axes[0] ?? 0) < STICK_DEAD;
        const ay = Math.abs(pad.axes[1] ?? 0) < STICK_DEAD;
        const dpad = [12, 13, 14, 15].some((i) => pad.buttons[i]?.pressed);
        return ax && ay && !dpad;
    }

    private stickEdge(): boolean {
        const neutral = this.stickNeutral();
        const edge = this.prevStickNeutral && !neutral;
        this.prevStickNeutral = neutral;
        return edge;
    }
}
