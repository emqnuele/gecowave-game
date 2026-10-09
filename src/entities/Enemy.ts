import Phaser from 'phaser';
import { ENEMIES, type EnemyArchetype } from '../content/enemies';
import type { NavEdge, NavGraph } from '../world/NavGraph';
import type { EnemyKind } from '../types';
import { mix } from '../art/ink';
import { ensureCreature } from '../art/creatures';
import { CreatureGlow, creatureBody, creatureFrames, creatureRes } from '../art/creatureKit';
import { emitWorld } from '../core/worldEvents';
import { rng } from '../core/rng';
import { state } from '../core/state';
import { SHIELD_TOMMASO, shieldBarksFor } from '../content/barks';

/* stati: chi dorme si sveglia se ti avvicini o lo colpisci, chi pattuglia gira
   sul suo pavimento senza cadere, chi ti vede dà l'allarme e ti insegue lungo
   il grafo di navigazione (salti compresi), chi ti perde torna a casa, i più
   deboli a vita bassa scappano */
export type EnemyMode = 'sleep' | 'patrol' | 'alert' | 'chase' | 'return' | 'flee';

/** varianti che si sommano al comportamento: scudo davanti, agguato dal soffitto, scoppio */
export type EnemyTrait = 'scudo' | 'soffitto' | 'kamikaze';

const FUSE_MS = 650;
/** parate di fila che fanno cadere lo scudo: di lato si passa, solo più piano del pogo */
const GUARD_HITS = 3;
const GUARD_WINDOW_MS = 2600;
const GUARD_BREAK_MS = 1300;
/** lo scudo è disegnato al doppio, come i fogli delle creature */
const SHIELD_RES = 2;
const BLAST_R = 96;

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
    /** élite: più grosso, più duro, più insistente, e paga meglio */
    readonly elite: boolean;
    private aura: Phaser.GameObjects.Image | null = null;
    private speedMult = 1;

    private nav: NavGraph | null;
    private homeX: number;
    private homeY: number;
    private t = rng.logic.next() * 1000;
    private nextActionAt = 0;
    private nextShotAt = 0;
    private facingDir: 1 | -1 = rng.logic.next() < 0.5 ? -1 : 1;
    private chargingUntil = 0;
    private stunnedUntil = 0;
    /** sbandato: gli hai insegnato qualcosa, ora prende il doppio */
    private staggeredUntil = 0;
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
    private flyStuckY = 0;
    private mark: Phaser.GameObjects.Text | null = null;
    readonly trait: EnemyTrait | null;
    private shield: Phaser.GameObjects.Image | null = null;
    private shieldKick = 0;
    private guardHits = 0;
    private guardAt = -99999;
    private speech: Phaser.GameObjects.Text | null = null;
    private speechUntil = 0;
    private nextBarkAt = 0;
    /** appeso al soffitto finché non passi sotto */
    private hanging = false;
    private fuseAt = 0;
    /** occhi e luci della creatura, fuori dalla pipeline delle luci */
    private look: CreatureGlow;
    private frames: number;
    private animT = rng.fx.next() * 1000;

    constructor(scene: Phaser.Scene, x: number, y: number, kind: EnemyKind, nav: NavGraph | null = null, opts: { sleeping?: boolean; elite?: boolean; trait?: EnemyTrait | null } = {}) {
        super(scene, x, y, ensureCreature(scene, ENEMIES[kind].texture));
        this.elite = !!opts.elite;
        const base = ENEMIES[kind];
        // l'élite è lo stesso nemico, solo peggio: tutto si legge dall'archetipo
        this.arch = this.elite
            ? { ...base, hp: Math.ceil(base.hp * 3.5), aggroRange: base.aggroRange * 1.4, barre: [base.barre[0] * 6, base.barre[1] * 6], fireRateMs: base.fireRateMs ? base.fireRateMs * 0.7 : undefined }
            : base;
        this.speedMult = this.elite ? 1.2 : 1;
        this.hp = this.arch.hp;
        this.nav = nav;
        this.homeX = x;
        this.homeY = y;
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.setPipeline('Light2D');
        // i fogli a inchiostro sono disegnati al doppio: la scala li riporta alla misura logica
        const res = creatureRes(scene, this.texture.key);
        this.setScale(1 / res);
        this.frames = creatureFrames(scene, this.texture.key);
        this.look = new CreatureGlow(this);
        scene.events.on(Phaser.Scenes.Events.POST_UPDATE, this.syncLook, this);

        const body = this.body as Phaser.Physics.Arcade.Body;
        const airborne = this.arch.behavior === 'flyer' || this.arch.behavior === 'turret';
        body.setAllowGravity(!airborne);
        const frame = creatureBody(this);
        body.setSize(frame.w * 0.8, frame.h * 0.8);
        if (this.elite) {
            this.setScale(1.5 / res);
            this.aura = scene.add.image(x, y, 'p-dot').setTint(this.arch.glowColor).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.55).setScale(5).setDepth(3.9);
            scene.tweens.add({ targets: this.aura, scale: 6.2, alpha: 0.3, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        }
        this.trait = opts.trait ?? null;
        if (this.trait === 'soffitto' && !this.hangFromCeiling()) this.trait = null;
        if (this.trait === 'scudo') {
            const key = Enemy.shieldTexture(scene, kind);
            // chiaro e appena tinto: quello scuro di prima nel buio non si leggeva come scudo
            this.shield = scene.add.image(x, y, key).setDepth(4.1).setScale(1 / SHIELD_RES).setPipeline('Light2D').setTint(mix(this.arch.glowColor, 0xe4e4e7, 0.6));
        }
        if (opts.sleeping && !airborne && !this.hanging) this.setMode('sleep');
    }

    /** ogni simbolo ha il suo scudo: la valigia del pendolare, l'antisommossa del tossico, il resto lo scudo d'inchiostro */
    private static shieldTexture(scene: Phaser.Scene, kind: EnemyKind): string {
        const key = kind === 'pendolare' ? 'trait-scudo-valigia' : kind === 'tossico-trenbo' ? 'trait-scudo-tossico' : 'trait-scudo';
        if (scene.textures.exists(key)) return key;
        const INK = 0x0b0c10;
        const g = scene.add.graphics();
        if (key === 'trait-scudo-valigia') {
            g.lineStyle(4, INK, 1);
            g.strokeRoundedRect(10, 2, 14, 10, 4);
            g.fillStyle(0xd6d3d1, 1);
            g.fillRoundedRect(2, 10, 30, 44, 6);
            g.fillStyle(0xa8a29e, 1);
            g.fillRect(8, 10, 5, 44);
            g.fillRect(21, 10, 5, 44);
            g.fillStyle(0xfafaf9, 1);
            g.fillRoundedRect(14, 30, 6, 10, 2);
            g.fillStyle(INK, 1);
            for (const [cx, cy] of [[5, 13], [29, 13], [5, 51], [29, 51]]) g.fillRect(cx - 3, cy - 3, 6, 6);
            g.lineStyle(4, INK, 1);
            g.strokeRoundedRect(2, 10, 30, 44, 6);
            g.generateTexture(key, 34, 56);
        } else if (key === 'trait-scudo-tossico') {
            g.fillStyle(0xe7e5e4, 1);
            g.fillRoundedRect(2, 2, 28, 58, 8);
            g.fillStyle(INK, 1);
            g.fillRoundedRect(7, 8, 18, 9, 3);
            g.lineStyle(2, 0xfafaf9, 0.9);
            g.lineBetween(10, 11, 16, 11);
            // l'adesivo dell'occhio, storto come lo attacca un tossico
            g.fillStyle(0xfafaf9, 1);
            g.fillEllipse(16, 36, 18, 11);
            g.fillStyle(INK, 1);
            g.fillCircle(16, 36, 4);
            g.lineStyle(2, INK, 1);
            g.strokeEllipse(16, 36, 18, 11);
            g.lineStyle(3, 0xa8a29e, 1);
            g.lineBetween(5, 50, 27, 44);
            g.lineStyle(2, INK, 0.7);
            g.lineBetween(22, 22, 26, 27);
            g.lineBetween(8, 52, 11, 56);
            g.lineStyle(4, INK, 1);
            g.strokeRoundedRect(2, 2, 28, 58, 8);
            g.generateTexture(key, 32, 62);
        } else {
            g.fillStyle(0xd4d4d8, 1);
            g.fillRoundedRect(2, 2, 24, 52, 9);
            g.fillStyle(0xfafafa, 1);
            g.fillRoundedRect(6, 6, 5, 44, 2);
            g.lineStyle(2, INK, 0.35);
            for (let y = 12; y <= 44; y += 6) g.lineBetween(13, y, 22, y);
            g.fillStyle(INK, 1);
            g.fillCircle(15, 28, 6);
            g.fillStyle(0xe4e4e7, 1);
            g.fillCircle(15, 28, 2.5);
            g.fillStyle(INK, 1);
            for (const [cx, cy] of [[9, 9], [20, 9], [9, 47], [20, 47]]) g.fillCircle(cx, cy, 1.8);
            g.lineStyle(4, INK, 1);
            g.strokeRoundedRect(2, 2, 24, 52, 9);
            g.generateTexture(key, 28, 56);
        }
        g.destroy();
        return key;
    }

    /** si attacca al soffitto sopra la sua casa; false se lì sopra non c'è roccia */
    private hangFromCeiling(): boolean {
        const b = this.arch.behavior;
        if (!this.nav || b === 'flyer' || b === 'turret') return false;
        const c = Math.floor(this.x / 32);
        let r = Math.floor(this.y / 32);
        for (let k = 0; k < 12; k++, r--) {
            if (this.nav.solid(c, r - 1)) {
                // tra soffitto e pavimento serve spazio per cadere davvero
                if (k < 5) return false;
                this.hanging = true;
                this.y = r * 32 + (creatureBody(this).h * this.scaleY) / 2 + 1;
                const body = this.body as Phaser.Physics.Arcade.Body;
                body.setAllowGravity(false);
                body.setVelocity(0, 0);
                this.setFlipY(true);
                this.setTint(0x6b7280);
                return true;
            }
        }
        return false;
    }

    /** colpo parato: lo scudo guarda dove guarda lui, il pogo e i colpi alle spalle passano */
    blocks(fromX: number, dir: 'side' | 'up' | 'down' | 'shot'): boolean {
        if (this.trait !== 'scudo' || !this.active || dir === 'down' || dir === 'up') return false;
        if (this.scene.time.now < this.stunnedUntil) return false;
        const facing = this.flipX ? 1 : -1;
        return Math.sign(fromX - this.x) === facing;
    }

    /** una parata: lo scudo trema, lui si vanta, e alla terza di fila gli cade */
    parried(): void {
        if (!this.shield) return;
        const now = this.scene.time.now;
        this.guardHits = now - this.guardAt < GUARD_WINDOW_MS ? this.guardHits + 1 : 1;
        this.guardAt = now;
        this.shieldKick = 1;
        this.shield.setTintFill(0xffffff);
        this.scene.time.delayedCall(70, () => this.shield?.setTint(mix(this.arch.glowColor, 0xe4e4e7, 0.6)));
        const lines = shieldBarksFor(this.arch.kind);
        if (this.guardHits >= GUARD_HITS) {
            this.guardHits = 0;
            this.stun(GUARD_BREAK_MS);
            this.say(this.pickLine(lines.broken), 1600);
            return;
        }
        if (now < this.nextBarkAt) return;
        // la prima parata parla sempre, poi ogni tanto: un nemico che commenta ogni colpo stanca
        if (this.speech && rng.fx.next() < 0.45) return;
        const tommaso = state.save.seenDialogues.includes('ticummi-offerta') && rng.fx.next() < 0.35;
        this.say(this.pickLine(tommaso ? SHIELD_TOMMASO : lines.parry));
    }

    private pickLine(lines: string[]): string {
        return lines[Math.floor(rng.fx.next() * lines.length)];
    }

    /** la battuta sopra la testa, come quelle dei passanti */
    private say(text: string, ms = 2200): void {
        const now = this.scene.time.now;
        if (!this.speech) {
            this.speech = this.scene.add.text(this.x, this.y, '', {
                fontFamily: '"Permanent Marker", cursive',
                fontSize: '13px',
                color: '#f1f5f9',
                stroke: '#000000',
                strokeThickness: 4,
                padding: { x: 4, y: 2 },
                wordWrap: { width: 190 },
                align: 'center',
            }).setOrigin(0.5, 1).setDepth(8);
        }
        this.speech.setText(text).setVisible(!this.dormant).setAlpha(1).setRotation((rng.fx.next() - 0.5) * 0.06);
        this.speechUntil = now + ms;
        this.nextBarkAt = now + ms + 600;
    }

    setDormant(dormant: boolean): void {
        if (dormant === this.dormant || !this.body) return;
        this.dormant = dormant;
        const body = this.body as Phaser.Physics.Arcade.Body;
        if (dormant) body.stop();
        body.enable = !dormant;
        this.mark?.setVisible(!dormant && this.mode === 'sleep');
        this.aura?.setVisible(!dormant);
        this.look.setVisible(!dormant);
        this.shield?.setVisible(!dormant);
        if (dormant) this.speech?.setVisible(false);
        // chi dorme appeso resta appeso: senza gravità anche quando si risveglia il corpo
        if (!dormant && this.hanging) body.setAllowGravity(false);
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
        this.mark?.setPosition(this.x, this.y - body.height / 2 - 16 + Math.sin(this.t / 300) * 2);
        this.aura?.setPosition(this.x, this.y);
        if (this.shield) {
            const side = this.flipX ? 1 : -1;
            // stordito non para: lo scudo cade storto, così si vede che ora passa tutto
            const down = now < this.stunnedUntil;
            this.shieldKick = Math.max(0, this.shieldKick - delta / 120);
            this.shield
                .setPosition(this.x + side * (body.width / 2 + 6 - this.shieldKick * 5 + (down ? 4 : 0)), this.y + 2 + (down ? body.height * 0.3 : 0))
                .setFlipX(this.flipX)
                .setRotation(down ? side * 1.2 : 0)
                .setAlpha(down ? 0.7 : 1);
        }
        if (this.speech?.visible) {
            const left = this.speechUntil - now;
            this.speech.setPosition(this.x, this.y - body.height / 2 - 30);
            if (left <= 0) this.speech.setVisible(false);
            else if (left < 400) this.speech.setAlpha(left / 400);
        }

        if (this.hanging) {
            // passa sotto e ti cade addosso: lo si vede solo se lo si cerca
            if (Math.abs(dx) < 70 && dy > 0 && dy < 420 && (!this.nav || this.nav.sight(this.x, this.y + 10, target.x, target.y - 10))) this.drop();
            return;
        }
        if (this.fuseAt) {
            body.setVelocityX(body.velocity.x * 0.85);
            this.setTintFill(Math.floor(now / 90) % 2 ? 0xffffff : 0xef4444);
            if (now >= this.fuseAt) this.explode();
            return;
        }
        if (this.trait === 'kamikaze' && this.mode === 'chase' && dist < 80) {
            this.fuseAt = now + FUSE_MS;
            emitWorld(this.scene, 'enemy-fuse', { x: this.x, y: this.y });
            return;
        }

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
                    emitWorld(this.scene, 'enemy-alert', { x: this.x, y: this.y, from: this });
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
                if (!relentless && (lostFor > (this.elite ? 9000 : 4500) || leash > (this.elite ? 2600 : 1500))) {
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
            emitWorld(this.scene, 'enemy-shoot', { x: this.x, y: this.y, tx: target.x, ty: target.y, color: this.arch.glowColor });
            // la torretta che ha appena sparato resta scoperta: si vede dal colore caldo
            if (this.arch.behavior === 'turret') {
                this.setTint(0xfde68a);
                this.scene.time.delayedCall(900, () => this.active && this.clearTint());
            }
        }
    }

    private drop(): void {
        this.hanging = false;
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setAllowGravity(true);
        body.setVelocityY(260);
        this.setFlipY(false);
        this.clearTint();
        emitWorld(this.scene, 'enemy-drop', { x: this.x, y: this.y });
        this.hunt();
    }

    /** il kamikaze: un lampo, un raggio, e paga lo stesso le sue barre */
    private explode(): void {
        if (!this.active) return;
        emitWorld(this.scene, 'enemy-explode', { x: this.x, y: this.y, r: BLAST_R, from: this });
        this.hp = 0;
        this.die();
    }

    private wake(): void {
        this.setMode('alert', 500);
        this.scene.tweens.add({ targets: this, y: this.y - 6, duration: 120, yoyo: true });
        emitWorld(this.scene, 'enemy-alert', { x: this.x, y: this.y, from: this });
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
                this.nextActionAt = now + 1100 + rng.logic.next() * 900;
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
        const speed = (b === 'walker' ? Math.max(this.arch.speed, 110) : this.arch.speed) * this.speedMult;
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
                this.nextActionAt = now + 420 + rng.logic.next() * 300;
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
        const r = Math.max(8, Math.min(16, body.width / 2));
        if (nav && !nav.sightWide(this.x, this.y, tx, ty, r)) {
            if (now - this.flyRouteAt > 900 || this.flyRoute.length === 0) {
                this.flyRoute = nav.flyPath(this.x, this.y, tx, ty) ?? [];
                this.flyRouteAt = now;
            }
            while (this.flyRoute.length && Math.hypot(this.flyRoute[0].x - this.x, this.flyRoute[0].y - this.y) < 24) this.flyRoute.shift();
            // il punto più avanti del percorso che si vede col corpo intero: si tagliano le curve, non gli spigoli
            let pick = -1;
            for (let i = Math.min(6, this.flyRoute.length - 1); i >= 0; i--) {
                const p = this.flyRoute[i];
                if (nav.sightWide(this.x, this.y, p.x, p.y, r)) {
                    pick = i;
                    break;
                }
            }
            const next = this.flyRoute[Math.max(0, pick)];
            if (next) {
                gx = next.x;
                gy = next.y;
            }
            // incastrato su uno spigolo: si salta al punto dopo e ci si stacca dal muro
            if (Math.hypot(this.x - this.stuckX, this.y - this.flyStuckY) > 6) {
                this.stuckX = this.x;
                this.flyStuckY = this.y;
                this.stuckAt = now;
            } else if (now - this.stuckAt > 500) {
                this.stuckAt = now;
                this.flyRoute.shift();
                body.setVelocity(-body.velocity.y || 60, body.velocity.x || -60);
                return;
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
        // chi è appeso e viene colpito molla la presa
        if (this.hanging) this.drop();
        this.hp -= this.staggered ? amount * 2 : amount;
        const body = this.body as Phaser.Physics.Arcade.Body;
        if (this.arch.behavior !== 'charger') {
            body.velocity.x += Math.sign(this.x - fromX) * 240;
        }
        this.setTintFill(0xffffff);
        this.scene.time.delayedCall(70, () => this.active && this.clearTint());
        if (this.mode === 'sleep' || this.mode === 'patrol' || this.mode === 'return') {
            this.lastSeenAt = this.scene.time.now;
            this.setMode('chase');
            emitWorld(this.scene, 'enemy-alert', { x: this.x, y: this.y, from: this });
        }
        if (this.hp <= 0) this.die();
    }

    private die(): void {
        const [min, max] = this.arch.barre;
        const amount = rng.logic.between(min, max);
        emitWorld(this.scene, 'enemy-died', {
            x: this.x,
            y: this.y,
            kind: this.arch.kind,
            barre: amount,
            color: this.arch.glowColor,
            splitsInto: this.arch.splitsInto ?? null,
        });
        const burst = this.scene.add.particles(this.x, this.y, 'p-spark', {
            speed: { min: 100, max: 280 },
            scale: { start: 1, end: 0 },
            tint: this.arch.glowColor,
            lifespan: 400,
            quantity: 14,
            stopAfter: 14,
        });
        this.scene.time.delayedCall(800, () => burst.destroy());
        this.destroy();
    }

    /** fotogramma del ciclo e strato emissivo: dopo la fisica, così non resta indietro */
    private syncLook(_time: number, delta: number): void {
        if (!this.active || this.dormant) return;
        if (this.frames > 1) {
            const body = this.body as Phaser.Physics.Arcade.Body;
            const v = Math.hypot(body.velocity.x, body.velocity.y);
            const asleep = this.mode === 'sleep' || this.hanging;
            // chi corre muove le zampe più in fretta, chi dorme respira appena
            this.animT += delta * (asleep ? 0.35 : 0.8 + Math.min(1.6, v / 160));
            const f = Math.floor(this.animT / 150) % this.frames;
            if (String(this.frame.name) !== String(f)) this.setFrame(f);
        }
        this.look.sync(this.mode === 'sleep' || this.hanging ? 0.25 : 1);
    }

    destroy(fromScene?: boolean): void {
        this.scene?.events.off(Phaser.Scenes.Events.POST_UPDATE, this.syncLook, this);
        this.look.destroy();
        this.mark?.destroy();
        this.mark = null;
        this.aura?.destroy();
        this.aura = null;
        this.shield?.destroy();
        this.shield = null;
        this.speech?.destroy();
        this.speech = null;
        super.destroy(fromScene);
    }

    /** ha appena sparato: per un attimo è scoperto */
    get justFired(): boolean {
        const rate = this.arch.fireRateMs;
        return !!rate && this.nextShotAt > 0 && this.scene.time.now - (this.nextShotAt - rate) < 900;
    }

    /** in piena carica: chi ci scivola attraverso lo fa sbandare */
    get isCharging(): boolean {
        return this.scene.time.now < this.chargingUntil;
    }

    get staggered(): boolean {
        return this.scene.time.now < this.staggeredUntil;
    }

    /** la lezione riuscita: fermo, storditi i sensi, il doppio dei danni */
    stagger(ms: number): void {
        this.chargingUntil = 0;
        this.staggeredUntil = this.scene.time.now + ms;
        this.stun(ms);
        this.showMark('✶ ✶', '#facc15');
        this.scene.tweens.add({ targets: this, angle: { from: -12, to: 12 }, duration: 140, yoyo: true, repeat: Math.floor(ms / 280), onComplete: () => this.active && this.setAngle(0) });
        this.scene.time.delayedCall(ms, () => this.active && this.mode !== 'sleep' && this.mode !== 'alert' && this.mode !== 'flee' && this.hideMark());
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
