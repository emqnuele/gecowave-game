import Phaser from 'phaser';
import { ENEMIES, type EnemyArchetype } from '../content/enemies';
import type { NavEdge, NavGraph } from '../engine/nav/NavGraph';
import type { EnemyKind } from '../types';

/* stati: chi dorme si sveglia se ti avvicini o lo colpisci, chi pattuglia gira
   sul suo pavimento senza cadere, chi ti vede dà l'allarme e ti insegue lungo
   il grafo di navigazione (salti compresi), chi ti perde torna a casa, i più
   deboli a vita bassa scappano */
export type EnemyMode = 'sleep' | 'patrol' | 'alert' | 'chase' | 'return' | 'flee';

/** quanto salta ogni comportamento, in px: decide quali archi del grafo può usare */
const JUMP: Record<EnemyArchetype['behavior'], number> = {
    walker: 80,
    hopper: 170,
    chaser: 150,
    charger: 60,
    flyer: 0,
    turret: 0,
};

/** chi insegue senza limiti: le comparse di trama non mollano */
const RELENTLESS = new Set<EnemyKind>(['notino-mini', 'eco', 'tossico-trenbo']);
/** chi scappa quando è quasi morto */
const SKITTISH = new Set<EnemyKind>(['glitchetto', 'pittura-mini', 'numero', 'bottiglia', 'formica']);

export class Enemy extends Phaser.Physics.Arcade.Sprite {
    readonly arch: EnemyArchetype;
    hp: number;
    mode: EnemyMode = 'patrol';
    /** lontano dal player: niente logica né fisica, le regioni ne contano centinaia */
    dormant = false;

    private nav: NavGraph | null;
    private homeX: number;
    private homeY: number;
    private t = Math.random() * 1000;
    private nextActionAt = 0;
    private nextShotAt = 0;
    private facingDir: 1 | -1 = Math.random() < 0.5 ? -1 : 1;
    private chargingUntil = 0;
    private stunnedUntil = 0;
    private modeUntil = 0;
    private lastSeenAt = -99999;
    private path: NavEdge[] | null = null;
    private pathAt = -99999;
    private flight: NavEdge | null = null;
    private flightAt = 0;
    /** l'arco in corso ha già lasciato terra: si chiude al primo appoggio dopo */
    private flightAir = false;
    private flyRoute: { x: number; y: number }[] = [];
    private flyRouteAt = -99999;
    private stuckX = 0;
    private stuckAt = 0;
    private mark: Phaser.GameObjects.Text | null = null;

    constructor(scene: Phaser.Scene, x: number, y: number, kind: EnemyKind, nav: NavGraph | null = null, opts: { sleeping?: boolean } = {}) {
        super(scene, x, y, ENEMIES[kind].texture);
        this.arch = ENEMIES[kind];
        this.hp = this.arch.hp;
        this.nav = nav;
        this.homeX = x;
        this.homeY = y;
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.setPipeline('Light2D');

        const body = this.body as Phaser.Physics.Arcade.Body;
        const airborne = this.arch.behavior === 'flyer' || this.arch.behavior === 'turret';
        body.setAllowGravity(!airborne);
        body.setSize(this.width * 0.8, this.height * 0.8);
        if (opts.sleeping && !airborne) this.setMode('sleep');
    }

    setDormant(dormant: boolean): void {
        if (dormant === this.dormant || !this.body) return;
        this.dormant = dormant;
        const body = this.body as Phaser.Physics.Arcade.Body;
        if (dormant) body.stop();
        body.enable = !dormant;
        this.mark?.setVisible(!dormant && this.mode === 'sleep');
    }

    private get ground(): boolean {
        return (this.body as Phaser.Physics.Arcade.Body).blocked.down;
    }

    private setMode(mode: EnemyMode, ms = 0): void {
        this.mode = mode;
        this.modeUntil = this.scene.time.now + ms;
        this.path = null;
        if (mode === 'sleep') this.showMark('z z', '#94a3b8');
        else if (mode === 'alert') this.showMark('!', '#facc15');
        else if (mode === 'flee') this.showMark('!!', '#f87171');
        else this.hideMark();
    }

    private showMark(text: string, color: string): void {
        if (!this.mark) {
            this.mark = this.scene.add.text(this.x, this.y, text, {
                fontFamily: '"Permanent Marker", cursive',
                fontSize: '15px',
                color,
                stroke: '#000',
                strokeThickness: 3,
            }).setOrigin(0.5).setDepth(7);
        }
        this.mark.setText(text).setColor(color).setVisible(true);
    }

    private hideMark(): void {
        this.mark?.setVisible(false);
    }

    /** un compagno ti ha visto: si sveglia e arriva */
    alertFrom(x: number, y: number): void {
        if (!this.active || this.dormant || this.mode === 'chase' || this.mode === 'alert' || this.mode === 'flee') return;
        if (this.nav && !this.nav.sight(this.x, this.y, x, y)) return;
        this.setMode('alert', 350);
    }

    /** target = giocatore, o il suo riflesso distorto se attivo */
    update(_time: number, delta: number, target: Phaser.GameObjects.Sprite): void {
        if (!this.active) return;
        this.t += delta;
        const body = this.body as Phaser.Physics.Arcade.Body;
        const now = this.scene.time.now;
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const dist = Math.hypot(dx, dy);
        this.mark?.setPosition(this.x, this.y - this.displayHeight / 2 - 12 + Math.sin(this.t / 300) * 2);

        if (now < this.stunnedUntil) {
            body.setVelocityX(body.velocity.x * 0.9);
            return;
        }

        const sees = dist < this.arch.aggroRange && (!this.nav || this.nav.sight(this.x, this.y - 6, target.x, target.y - 10));
        if (sees) this.lastSeenAt = now;

        switch (this.mode) {
            case 'sleep':
                body.setVelocityX(body.velocity.x * 0.8);
                // dorme sodo: ti sente solo da vicino
                if (dist < 150 || (sees && dist < this.arch.aggroRange * 0.45)) this.wake();
                return;
            case 'patrol':
                if (sees) {
                    this.setMode('alert', 380);
                    this.scene.events.emit('enemy-alert', { x: this.x, y: this.y, from: this });
                    break;
                }
                this.patrol(body, now);
                break;
            case 'alert':
                body.setVelocityX(body.velocity.x * 0.8);
                this.setFlipX(dx > 0);
                if (now >= this.modeUntil) this.setMode('chase');
                return;
            case 'chase': {
                const relentless = RELENTLESS.has(this.arch.kind);
                const lostFor = now - this.lastSeenAt;
                const leash = Math.hypot(this.x - this.homeX, this.y - this.homeY);
                if (!relentless && (lostFor > 4500 || leash > 1500)) {
                    this.setMode('return');
                    break;
                }
                if (SKITTISH.has(this.arch.kind) && this.hp <= Math.max(1, this.arch.hp * 0.34) && this.hp < this.arch.hp) {
                    this.setMode('flee', 2600);
                    break;
                }
                this.chase(body, target, dx, dy, now);
                break;
            }
            case 'return':
                if (sees) {
                    this.setMode('chase');
                    break;
                }
                if (this.goTo(body, this.homeX, this.homeY, now, this.arch.speed * 0.8)) this.setMode('patrol');
                break;
            case 'flee':
                this.flee(body, dx, now);
                if (now >= this.modeUntil) this.setMode(sees ? 'chase' : 'patrol');
                break;
        }

        // chi ha un'arma spara solo se ti vede: niente colpi attraverso la roccia
        if (this.arch.fireRateMs && sees && this.mode === 'chase' && now >= this.nextShotAt) {
            this.nextShotAt = now + this.arch.fireRateMs;
            this.scene.events.emit('enemy-shoot', { x: this.x, y: this.y, tx: target.x, ty: target.y, color: this.arch.glowColor });
        }
    }

    private wake(): void {
        this.setMode('alert', 500);
        this.scene.tweens.add({ targets: this, y: this.y - 6, duration: 120, yoyo: true });
        this.scene.events.emit('enemy-alert', { x: this.x, y: this.y, from: this });
    }

    /* ---------- pattuglia ---------- */

    private patrol(body: Phaser.Physics.Arcade.Body, now: number): void {
        const b = this.arch.behavior;
        if (b === 'turret') {
            this.y = this.homeY + Math.sin(this.t / 600) * 8;
            return;
        }
        if (b === 'flyer') {
            body.setVelocity(Math.sin(this.t / 900) * 40, Math.cos(this.t / 700) * 30 + (this.homeY - this.y) * 0.5);
            return;
        }
        const seg = this.nav ? this.nav.segments[this.nav.segmentBelow(this.x, body.bottom - 4)] : undefined;
        // non si cade dal proprio pavimento: si gira prima del bordo
        if (seg) {
            const left = seg.c0 * 32 + 14;
            const right = (seg.c1 + 1) * 32 - 14;
            if (this.x <= left) this.facingDir = 1;
            if (this.x >= right) this.facingDir = -1;
        }
        if (body.blocked.left) this.facingDir = 1;
        if (body.blocked.right) this.facingDir = -1;
        if (b === 'hopper') {
            if (this.ground && now >= this.nextActionAt) {
                body.setVelocity(this.facingDir * this.arch.speed * 0.5, -300);
                this.nextActionAt = now + 1100 + Math.random() * 900;
                this.setFlipX(this.facingDir > 0);
            }
            if (this.ground) body.setVelocityX(body.velocity.x * 0.85);
            return;
        }
        // ogni tanto si ferma a guardarsi intorno
        const pause = Math.sin(this.t / 2300) > 0.75;
        body.setVelocityX(pause ? 0 : this.facingDir * Math.min(this.arch.speed, 90) * 0.7);
        this.setFlipX(this.facingDir > 0);
    }

    /* ---------- inseguimento ---------- */

    private chase(body: Phaser.Physics.Arcade.Body, target: Phaser.GameObjects.Sprite, dx: number, dy: number, now: number): void {
        const b = this.arch.behavior;
        if (b === 'turret') {
            this.y = this.homeY + Math.sin(this.t / 600) * 8;
            this.setFlipX(dx > 0);
            return;
        }
        if (b === 'flyer') {
            this.flyTo(body, target.x, target.y - 20, this.arch.speed, now);
            this.setFlipX(dx > 0);
            return;
        }
        if (b === 'charger' && this.chargerAttack(body, dx, dy, now)) return;
        if (b === 'walker' && this.arch.lungeSpeed && Math.abs(dy) < 50 && Math.abs(dx) < 170 && now >= this.nextActionAt && this.ground) {
            body.setVelocityX(Math.sign(dx) * this.arch.lungeSpeed);
            this.nextActionAt = now + 1400;
            this.setFlipX(dx > 0);
            return;
        }
        const tb = target.body as Phaser.Physics.Arcade.Body | undefined;
        const ty = tb ? tb.bottom - 4 : target.y;
        const speed = b === 'walker' ? Math.max(this.arch.speed, 110) : this.arch.speed;
        this.goTo(body, target.x, ty, now, speed);
    }

    /** cammina e salta lungo il grafo verso un punto; true quando ci è arrivato */
    private goTo(body: Phaser.Physics.Arcade.Body, tx: number, ty: number, now: number, speed: number): boolean {
        const b = this.arch.behavior;
        if (b === 'flyer' || b === 'turret') {
            if (b === 'flyer') this.flyTo(body, tx, ty, speed * 0.7, now);
            return Math.hypot(tx - this.x, ty - this.y) < 24;
        }
        // in volo su un arco: si tiene la velocità finché non si tocca terra
        if (this.flight) {
            if (!this.ground) this.flightAir = true;
            if ((this.ground && this.flightAir) || now - this.flightAt > 1600) {
                this.flight = null;
                this.pathAt = -99999;
            } else {
                // in caduta dal bordo si spinge finché il pavimento non finisce
                const vx = this.flight.kind === 'drop' && !this.flightAir ? Math.sign(this.flight.vx) * Math.max(120, Math.abs(this.flight.vx)) : this.flight.vx;
                body.setVelocityX(vx);
                return false;
            }
        }
        if (!this.ground) return false;
        const nav = this.nav;
        if (!nav) {
            body.setVelocityX(Math.sign(tx - this.x) * speed);
            return Math.abs(tx - this.x) < 12;
        }
        const mine = nav.segmentBelow(this.x, body.bottom - 4, 2);
        const goal = nav.segmentBelow(tx, ty, 16);
        const seg = mine >= 0 ? nav.segments[mine] : null;
        const clampToSeg = (x: number) => (seg ? Phaser.Math.Clamp(x, seg.c0 * 32 + 12, (seg.c1 + 1) * 32 - 12) : x);
        if (mine < 0 || goal < 0 || mine === goal) {
            const x = clampToSeg(tx);
            this.stepToward(body, x, speed, now);
            return Math.abs(tx - this.x) < 20 && mine === goal;
        }
        if (!this.path || now - this.pathAt > 800 || (this.path[0] && nav.segmentAt(this.path[0].fromC, nav.segments[mine].r) !== mine)) {
            this.path = nav.path(mine, goal, JUMP[b]);
            this.pathAt = now;
        }
        const edge = this.path?.[0];
        if (!edge) {
            // niente strada: si avvicina quanto può restando sul suo pavimento
            this.stepToward(body, clampToSeg(tx), speed, now);
            return false;
        }
        const launchX = edge.fromC * 32 + 16;
        if (Math.abs(this.x - launchX) > 7) {
            this.stepToward(body, launchX, speed, now);
            return false;
        }
        this.path!.shift();
        this.flight = edge;
        this.flightAt = now;
        this.flightAir = false;
        this.x = launchX;
        if (edge.kind === 'jump') {
            body.setVelocity(edge.vx, -edge.vy);
        } else {
            body.setVelocity(edge.vx === 0 ? 0 : Math.sign(edge.vx) * Math.max(Math.abs(edge.vx), 90), body.velocity.y);
        }
        this.setFlipX(edge.vx > 0);
        return false;
    }

    private stepToward(body: Phaser.Physics.Arcade.Body, x: number, speed: number, now: number): void {
        const d = x - this.x;
        if (Math.abs(d) < 6) {
            body.setVelocityX(body.velocity.x * 0.7);
            return;
        }
        const dir = Math.sign(d);
        // vicino al punto di stacco anche chi saltella cammina: col saltello lo scavalcherebbe
        if (this.arch.behavior === 'hopper' && Math.abs(d) > 56) {
            if (now >= this.nextActionAt) {
                body.setVelocity(dir * Math.min(speed, Math.abs(d) * 3 + 60), -320);
                this.nextActionAt = now + 420 + Math.random() * 300;
            } else {
                body.setVelocityX(body.velocity.x * 0.9);
            }
        } else {
            body.setVelocityX(dir * Math.min(speed, Math.abs(d) * 6 + 30));
        }
        this.setFlipX(dir > 0);
        // incastrato contro qualcosa: si prova a saltarci sopra, poi si rinuncia al percorso
        if (Math.abs(this.x - this.stuckX) > 10) {
            this.stuckX = this.x;
            this.stuckAt = now;
        } else if (now - this.stuckAt > 1200) {
            this.stuckAt = now;
            if (this.ground) body.setVelocityY(-420);
            this.path = null;
        }
    }

    private flyTo(body: Phaser.Physics.Arcade.Body, tx: number, ty: number, speed: number, now: number): void {
        const nav = this.nav;
        let gx = tx;
        let gy = ty;
        if (nav && !nav.sight(this.x, this.y, tx, ty)) {
            if (now - this.flyRouteAt > 700 || this.flyRoute.length === 0) {
                this.flyRoute = nav.flyPath(this.x, this.y, tx, ty, 1, 1800) ?? [];
                this.flyRouteAt = now;
            }
            while (this.flyRoute.length && Math.hypot(this.flyRoute[0].x - this.x, this.flyRoute[0].y - this.y) < 20) this.flyRoute.shift();
            // il primo punto del percorso ancora in vista
            const next = this.flyRoute.find((p, i) => i > 3 ? false : nav.sight(this.x, this.y, p.x, p.y)) ?? this.flyRoute[0];
            if (next) {
                gx = next.x;
                gy = next.y;
            }
        } else {
            this.flyRoute = [];
        }
        const a = Math.atan2(gy - this.y, gx - this.x);
        body.setVelocity(Math.cos(a) * speed, Math.sin(a) * speed);
    }

    private chargerAttack(body: Phaser.Physics.Arcade.Body, dx: number, dy: number, now: number): boolean {
        if (now < this.chargingUntil) {
            // il muro ferma la corsa, e fa male solo a lui
            if (body.blocked.left || body.blocked.right) {
                this.chargingUntil = 0;
                this.stunnedUntil = now + 800;
                body.setVelocityX(0);
                this.scene.cameras.main.shake(120, 0.004);
            }
            return true;
        }
        if (Math.abs(dy) < 70 && Math.abs(dx) < this.arch.aggroRange && now >= this.nextActionAt && this.ground) {
            this.nextActionAt = now + 2600;
            this.setTintFill(0xfacc15);
            this.setFlipX(dx > 0);
            body.setVelocityX(0);
            this.scene.tweens.add({ targets: this, x: this.x + 3, duration: 50, yoyo: true, repeat: 5 });
            this.scene.time.delayedCall(380, () => {
                if (!this.active) return;
                this.clearTint();
                this.chargingUntil = this.scene.time.now + 1200;
                body.setVelocityX(Math.sign(dx) * this.arch.speed);
            });
            return true;
        }
        return false;
    }

    private flee(body: Phaser.Physics.Arcade.Body, dx: number, now: number): void {
        const dir = -Math.sign(dx) || 1;
        if (this.arch.behavior === 'flyer') {
            body.setVelocity(dir * this.arch.speed, -40);
            return;
        }
        const nav = this.nav;
        const seg = nav ? nav.segments[nav.segmentBelow(this.x, body.bottom - 4, 2)] : undefined;
        const edge = seg ? (dir < 0 ? seg.c0 * 32 + 14 : (seg.c1 + 1) * 32 - 14) : this.x + dir * 200;
        this.stepToward(body, edge, this.arch.speed * 1.1, now);
    }

    takeDamage(amount: number, fromX: number): void {
        if (!this.active) return;
        this.hp -= amount;
        const body = this.body as Phaser.Physics.Arcade.Body;
        if (this.arch.behavior !== 'charger') {
            body.velocity.x += Math.sign(this.x - fromX) * 240;
        }
        this.setTintFill(0xffffff);
        this.scene.time.delayedCall(70, () => this.active && this.clearTint());
        if (this.mode === 'sleep' || this.mode === 'patrol' || this.mode === 'return') {
            this.lastSeenAt = this.scene.time.now;
            this.setMode('chase');
            this.scene.events.emit('enemy-alert', { x: this.x, y: this.y, from: this });
        }
        if (this.hp <= 0) this.die();
    }

    private die(): void {
        const [min, max] = this.arch.barre;
        const amount = Phaser.Math.Between(min, max);
        this.scene.events.emit('enemy-died', {
            x: this.x,
            y: this.y,
            kind: this.arch.kind,
            barre: amount,
            color: this.arch.glowColor,
            splitsInto: this.arch.splitsInto ?? null,
        });
        this.scene.add.particles(this.x, this.y, 'p-spark', {
            speed: { min: 100, max: 280 },
            scale: { start: 1, end: 0 },
            tint: this.arch.glowColor,
            lifespan: 400,
            quantity: 14,
            stopAfter: 14,
        });
        this.destroy();
    }

    destroy(fromScene?: boolean): void {
        this.mark?.destroy();
        this.mark = null;
        super.destroy(fromScene);
    }

    /** chi viene evocato o piomba in un agguato parte già all'attacco */
    hunt(): void {
        this.lastSeenAt = this.scene.time.now;
        this.setMode('chase');
    }

    stun(duration: number): void {
        this.stunnedUntil = this.scene.time.now + duration;
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setVelocity(0, 0);
    }
}
