import Phaser from 'phaser';
import { COMBAT, TILE, ZONE_HEX } from '../config';
import { DIALOGUES, NOTINO_FUGHE, TOASTS, TRABOCCHETTI, WAVESUNG } from '../content/story';
import { LEVELS, TOTAL_FRAGMENTS } from '../content/levels';
import { bus } from '../engine/events';
import { biomeFor, type BiomeDef } from '../content/biomes';
import { AmbienceManager } from '../engine/AmbienceManager';
import { DecorationManager } from '../engine/DecorationManager';
import { TerrainRenderer } from '../engine/TerrainRenderer';
import { WaterRenderer } from '../engine/WaterRenderer';
import { ensurePickupTextures } from '../engine/art/pickups';
import { BOSS_CHARMS, ITEMS } from '../content/items';
import { LightingManager } from '../engine/LightingManager';
import { loadLevel, type LoadedLevel } from '../engine/LevelLoader';
import { ParallaxManager } from '../engine/ParallaxManager';
import { RoomBackdrops } from '../engine/RoomBackdrops';
import { loadRegion } from '../world/registry';
import { oldXToProgress, type RegionLayout, type Room } from '../world/types';
import { npcTexture } from '../engine/npcTexture';
import { NavGraph } from '../engine/nav/NavGraph';
import { hashString } from '../engine/art/ink';
import { sfx } from '../engine/sfx';
import { state } from '../engine/state';
import { music } from '../engine/music';
import { generateFogTexture } from '../engine/textures';
import { Boss } from '../entities/Boss';
import { Companion } from '../entities/Companion';
import { Enemy } from '../entities/Enemy';
import { Player } from '../entities/Player';
import type { AbilityId, BossKind, EnemyKind, LevelDef } from '../types';

interface SceneData {
    levelId: string;
    checkpointId?: string | null;
    showCard?: boolean;
    /** override dello spawn: usato per rientrare accanto a un varco segreto */
    spawnAt?: { x: number; y: number };
}

interface Interactable {
    x: number;
    y: number;
    range: number;
    onInteract: () => void;
}

const BOSS_INTRO: Partial<Record<BossKind, string>> = {
    guggu: 'guggu-intro',
    breccio: 'breccio-intro',
    notino: 'notino-intro',
    riba: 'riba-intro',
    lochef: 'lochef-intro',
    ombra: 'ombra-intro',
    ticummi: 'ticummi-intro',
    formicona: 'formicona-intro',
    teorema: 'teorema-intro',
    furgone: 'furgone-intro',
    danjilo: 'danjilo-intro',
    smela: 'smela-boss',
    limite: 'limite-intro',
    pedrino: 'pedrino-intro',
    flauto: 'flauto-intro',
    settequaranta: 'settequaranta-intro',
    custode: 'custode-intro',
    delegato: 'delegato-intro',
    notturno: 'notturno-intro',
    modello: 'modello-intro',
    revisore: 'revisore-intro',
    garante: 'garante-intro',
    trentatre: 'trentatre-intro',
    maranza: 'maranza-intro',
    maranzone: 'maranzone-intro',
    istruttore: 'istruttore-intro',
    annascrivania: 'annascrivania-intro',
    walter: 'walter-boss-intro',
};

/* l'ordine dei rimpianti nel void: ad ognuno la sua verità */
const VOID_REGRETS: BossKind[] = ['delegato', 'notturno', 'modello', 'revisore', 'garante'];

/* la quest di walter baruffoni: sequenza di boss per capitolo.
   l'ultimo di marcetti è walter stesso, rivelato e ingrandito. */
const BARUFFONI_SEQ: Record<string, BossKind[]> = {
    galliate: ['maranza', 'maranzone'],
    marcetti: ['istruttore', 'annascrivania', 'walter'],
};

export const TOTAL_MASCHERE = 5;

const FALL_DEATH_MARGIN = 3000;

/* gli agguati di notino: senza tommasorveglianza spawna e combatte,
   con l'abbonamento viene respinto. le gag succedono comunque. */
interface AmbushDef {
    x: number;
    type: 'fight' | 'gag';
    intro: string;
    count?: number;
}

const AMBUSHES: Record<string, AmbushDef[]> = {
    rio: [
        { x: 95 * 32, type: 'fight', intro: 'notino-agguato-1' },
        { x: 520 * 32, type: 'fight', intro: 'notino-agguato-2' },
    ],
    stabilimento: [{ x: 220 * 32, type: 'fight', intro: 'notino-agguato-6' }],
    ruhra: [
        { x: 100 * 32, type: 'fight', intro: 'notino-agguato-3' },
        { x: 430 * 32, type: 'fight', intro: 'notino-agguato-4' },
    ],
    caso: [{ x: 250 * 32, type: 'gag', intro: 'notino-caso' }],
    tana: [{ x: 60 * 32, type: 'gag', intro: 'notino-tana' }],
    sorveglianza: [{ x: 100 * 32, type: 'gag', intro: 'notino-sorveglianza' }],
    cantina: [{ x: 120 * 32, type: 'fight', intro: 'notino-agguato-5', count: 2 }],
};

const TOMMASO_BLOCCA = ['tommaso-blocca', 'tommaso-blocca-2', 'tommaso-blocca-3'];

export class GameScene extends Phaser.Scene {
    private def!: LevelDef;
    /** la regione a stanze; null quando si gioca il capitolo vecchio */
    private layout: RegionLayout | null = null;
    /** stanza per slot della macro-griglia */
    private roomBySlot: Int16Array | null = null;
    private level!: LoadedLevel;
    /** pavimenti e salti per chi insegue o passeggia */
    private nav!: NavGraph;
    private player!: Player;
    private boss: Boss | null = null;
    private enemies!: Phaser.GameObjects.Group;
    private playerProjectiles!: Phaser.Physics.Arcade.Group;
    private enemyProjectiles!: Phaser.Physics.Arcade.Group;
    private lametteGroup!: Phaser.Physics.Arcade.Group;
    private barreGroup!: Phaser.Physics.Arcade.Group;
    private doorGroup!: Phaser.Physics.Arcade.StaticGroup;
    private interactables: Interactable[] = [];
    private prompt!: Phaser.GameObjects.Container;
    private lastSafe!: { x: number; y: number };
    private safeTimer = 0;
    private exiting = false;
    private checkpointSprites = new Map<string, Phaser.GameObjects.Sprite>();
    private lighting!: LightingManager;
    private parallax!: ParallaxManager;
    private biome!: BiomeDef;
    private terrain!: TerrainRenderer;
    private ambience!: AmbienceManager;
    private water!: WaterRenderer;
    private clone: Companion | null = null;
    private cloneUntil = 0;
    private cloneColliders: Phaser.Physics.Arcade.Collider[] = [];
    private analisiUntil = 0;
    private nextAnalisiTick = 0;
    private analisiGlyphs: Phaser.GameObjects.Image[] = [];
    private bossIntroShown = false;
    private exitLockToastAt = 0;
    // arena di lametta
    private lamettaCenter: { x: number; y: number } | null = null;
    private lamettaActive = false;
    private lamettaFloorY = 0;
    private smelaArena: { x: number; y: number } | null = null;
    private acquaPuddles: { gfx: Phaser.GameObjects.Graphics; x: number; y: number; until: number; nextTick: number }[] = [];
    private nextLametteAt = 0;
    private nextPitturaAt = 0;
    private colorDropsTaken = 0;
    private mirror: Phaser.GameObjects.Sprite | null = null;
    private pedroChoiceShown = false;
    // il patto con pedro: potere vero, poi arrivano gli dei
    private pattoActive = false;
    // scontro finale con gli dei dopo aver rifiutato di consegnare le wave:
    // qui la morte è definitiva (game over, niente respawn)
    private finalGodsFight = false;
    private pattoDeiAt = 0;
    private pattoNextSpawnAt = 0;
    private pattoWarned = 0;
    // tommasoscudo
    private scudoUntil = 0;
    private scudoGfx: Phaser.GameObjects.Graphics | null = null;
    // inseguimenti nella tana: lochef ci prova più di una volta
    private chaseSprite: Phaser.GameObjects.Sprite | null = null;
    private chaseStarts: number[] = [];
    private chaseEnds: number[] = [];
    private chaseZoneIdx = -1;
    private chaseDone: boolean[] = [];
    // ivan maggini nello scontro con guggu
    private ivanSprite: Phaser.GameObjects.Sprite | null = null;
    private ivanInArena = false;
    private ivanBusy = false;
    private nextIvanStrikeAt = 0;
    private ivanDead = false;
    // il void: romero ti guida tra i rimpianti, uno scontro per ogni verità
    private companion: Phaser.GameObjects.Sprite | null = null;
    private companionBaseY = 0;
    private companionInteract: Interactable | null = null;
    private voidArenas: { x: number; y: number }[] = [];
    private voidStep = 0;
    private voidBusy = false;
    // la quest di walter: arene sequenziali in galliate e marcetti
    private baruffoniArenas: { x: number; y: number }[] = [];
    private baruffoniStep = 0;
    private baruffoniBusy = false;
    // doomsday: pedro raggiunge il custode se perde troppo tempo
    private collapsePedro = false;
    private collapseTriggered = false;
    private doomsdayWarned = 0;
    private replacedBossKind: BossKind | null = null;
    private replacedBossX = 0;
    private replacedBossY = 0;
    private nextWildGlitchAt = 0;
    // il primo custode attacca sul beat: metronomo interno a 120 bpm
    private beatMs = 500;
    private nextBeatAt = 0;

    constructor() {
        super('GameScene');
    }

    init(data: SceneData): void {
        const region = loadRegion(this, data.levelId);
        this.def = region?.def ?? LEVELS[data.levelId];
        if (!this.def) throw new Error(`livello sconosciuto: ${data.levelId}`);
        this.layout = region?.layout ?? null;
        this.roomBySlot = null;
        if (this.layout) {
            const L = this.layout;
            this.roomBySlot = new Int16Array(L.macroW * L.macroH).fill(-1);
            for (const room of L.rooms) {
                for (let y = room.sy; y < room.sy + room.sh; y++) {
                    for (let x = room.sx; x < room.sx + room.sw; x++) this.roomBySlot[y * L.macroW + x] = room.id;
                }
            }
        }
        music.playLevel(data.levelId);
    }

    create(data: SceneData): void {
        this.exiting = false;
        this.boss = null;
        this.clone = null;
        this.cloneColliders = [];
        this.mirror = null;
        this.interactables = [];
        this.analisiGlyphs = [];
        this.checkpointSprites.clear();
        this.lamettaCenter = null;
        this.lamettaActive = false;
        this.smelaArena = null;
        this.acquaPuddles.forEach((p) => p.gfx.destroy());
        this.acquaPuddles = [];
        this.colorDropsTaken = 0;
        this.bossIntroShown = false;
        this.pedroChoiceShown = false;
        this.pattoActive = false;
        this.finalGodsFight = false;
        this.pattoWarned = 0;
        this.scudoUntil = 0;
        this.scudoGfx = null;
        this.chaseSprite = null;
        this.chaseStarts = [];
        this.chaseEnds = [];
        this.chaseZoneIdx = -1;
        this.chaseDone = [];
        this.ivanSprite = null;
        this.ivanInArena = false;
        this.ivanBusy = false;
        this.ivanDead = false;
        this.companion = null;
        this.companionBaseY = 0;
        this.companionInteract = null;
        this.voidArenas = [];
        this.voidStep = 0;
        this.voidBusy = false;
        this.baruffoniArenas = [];
        this.baruffoniStep = 0;
        this.baruffoniBusy = false;
        this.collapsePedro = false;
        this.collapseTriggered = false;
        this.doomsdayWarned = 0;
        this.replacedBossKind = null;
        this.replacedBossX = 0;
        this.replacedBossY = 0;
        this.nextWildGlitchAt = 0;
        this.nextBeatAt = 0;

        generateFogTexture(this);

        this.biome = biomeFor(this.def);
        this.lighting = new LightingManager(this);
        this.lighting.enable(this.biome);

        this.level = loadLevel(this, this.def, this.biome);
        this.level.layer.setDepth(2);
        this.level.spikes.setDepth(3, 0);
        this.nav = new NavGraph(this.def.grid);

        const t0 = performance.now();
        this.terrain = new TerrainRenderer(this, this.biome);
        this.terrain.build({ grid: this.def.grid, biome: this.biome, seedKey: this.def.id });
        if (import.meta.env.DEV) console.info(`[terrain] ${this.def.id}: ${Math.round(performance.now() - t0)}ms`);
        if (this.layout) new RoomBackdrops(this).build(this.layout, this.biome);

        this.parallax = new ParallaxManager(this);
        const reserved = [
            this.level.spawn,
            ...this.level.checkpoints,
            ...this.level.entities,
            ...this.level.exits.map((r) => ({ x: r.centerX, y: r.centerY })),
        ];
        new DecorationManager(this, this.lighting).decorate(this.def.grid, this.biome, this.def.id, reserved);
        this.water = new WaterRenderer(this);
        this.water.build(this.level.water, this.biome, this.lighting);
        this.ambience = new AmbienceManager(this);
        this.ambience.build(this.biome, this.def.grid, this.def.id);

        let sp = this.level.spawn;
        const cpId = data.checkpointId ?? null;
        if (cpId) {
            const cp = this.level.checkpoints.find((c) => c.id === cpId);
            if (cp) sp = { x: cp.x, y: cp.y - 8 };
        }
        // rientro da un capitolo segreto: spawn accanto al varco d'origine
        if (data.spawnAt) sp = { x: data.spawnAt.x, y: data.spawnAt.y };
        this.player = new Player(this, sp.x, sp.y);
        this.player.setDepth(4);
        this.lighting.playerLight(this.player);
        this.lastSafe = { ...sp };

        this.enemies = this.add.group({ runChildUpdate: false });
        this.playerProjectiles = this.physics.add.group({ allowGravity: false });
        this.enemyProjectiles = this.physics.add.group({ allowGravity: false });
        this.lametteGroup = this.physics.add.group({ allowGravity: false });
        this.barreGroup = this.physics.add.group();
        this.doorGroup = this.physics.add.staticGroup();

        this.spawnEntities();
        this.spawnCheckpoints();
        this.spawnDroppedBarre();
        this.setupColliders();
        this.setupEvents();
        this.setupCamera();
        this.parallax.build(this.def.color, this.def.id, this.biome, this.layout ? this.layout.horizonRow * TILE : this.level.heightPx);
        this.parallax.resize();
        this.buildPrompt();

        // i capitoli di walter riusano il fondale del trenbolone ma cupo e malato
        if (this.def.script === 'galliate' || this.def.script === 'marcetti') {
            const cam = this.cameras.main;
            const tint = this.def.script === 'galliate' ? 0x150406 : 0x1a1206;
            const veil = this.add.rectangle(0, 0, cam.width, cam.height, tint, 0.42)
                .setOrigin(0, 0).setScrollFactor(0).setDepth(3);
            this.scale.on('resize', () => veil.setSize(cam.width, cam.height));
        }

        state.setFlag(`visto-${this.def.id}`);

        bus.emit('zone-changed', {
            title: this.def.title,
            accentWord: this.def.accentWord,
            color: this.def.color,
            punchline: this.def.punchline,
            showCard: data.showCard !== false,
        });
        bus.emit('barre-changed', { barre: state.save.barre, gained: false });
        bus.emit('abilities-changed', { abilities: state.abilities });
        bus.emit('fragments-changed', { count: state.abilities.length, total: TOTAL_FRAGMENTS });

        // la tommasorveglianza ti accoglie diversamente se non sei cliente premium
        let introId = this.def.introDialogue;
        if (introId === 'tommaso-benvenuto' && !state.hasFlag('tommasorveglianza')) {
            introId = 'tommaso-benvenuto-estraneo';
        }
        // nella tana il risveglio gira sul nero, poi gli occhi si aprono
        const wakeUp = () => this.cameras.main.fadeIn(600, 0, 0, 0);
        const isTanaIntro = this.def.id === 'tana';
        if (introId && !state.save.seenDialogues.includes(introId)) {
            state.save.seenDialogues.push(introId);
            state.persist();
            if (isTanaIntro) {
                this.time.delayedCall(500, () => this.startDialogue(introId!, wakeUp));
            } else {
                this.time.delayedCall(700, () => this.startDialogue(introId!));
            }
        } else if (isTanaIntro) {
            // dialogo già visto in una run precedente: svegliati comunque
            wakeUp();
        }

        this.setupScript();
    }

    /* ---------- costruzione ---------- */

    private spawnEntities(): void {
        for (const { spec, x, y } of this.level.entities) {
            switch (spec.type) {
                case 'enemy':
                    // una parte dei nemici dorme: si passa piano, o si sveglia tutto
                    this.spawnEnemy(spec.kind, x, y, { sleeping: hashString(`${this.def.id}:${x}:${y}`) % 100 < 35 });
                    break;
                case 'npc':
                    this.spawnNpc(spec.id, x, y);
                    break;
                case 'ability':
                    if (!state.hasAbility(spec.ability)) this.spawnFragment(x, y, spec.ability);
                    break;
                case 'lore':
                    this.spawnLore(spec.id, x, y);
                    break;
                case 'barre':
                    this.spawnBarrePickup(x, y, spec.amount);
                    break;
                case 'cuore':
                    this.spawnCuore(x, y, `cuore-${this.def.id}-${Math.round(x)}-${Math.round(y)}`);
                    break;
                case 'maschera':
                    this.spawnMaschera(x, y, `maschera-${this.def.id}`);
                    break;
                case 'portal':
                    this.spawnPortal(x, y, spec.to, spec.needsFlag, spec.label);
                    break;
                case 'item':
                    this.spawnItemPickup(x, y, spec.item, spec.amount ?? 1, `item-${this.def.id}-${Math.round(x)}-${Math.round(y)}`);
                    break;
                case 'boss': {
                    // i boss sconfitti restano sconfitti, regola souls
                    if (state.hasFlag(`boss-down-${spec.kind}`)) {
                        this.recoverBossReward(spec.kind, x, y);
                        break;
                    }
                    // l'ombra senza abbonamento è addestrata su poco footage
                    const hpOverride = spec.kind === 'ombra' && !state.hasFlag('tommasorveglianza') ? 34 : undefined;
                    this.boss = new Boss(this, x, y, spec.kind, hpOverride);
                    // pedro finale forte come il pedro del doomsday: raffica e inseguimento
                    if (spec.kind === 'pedro') this.boss.frenzy = true;
                    // in ng+ ivan è già dei nostri: guggu si taglia subito
                    if (spec.kind === 'guggu' && state.hasFlag('ivan')) this.boss.invulnerable = false;
                    // il limite si arresta solo con tutti e tre gli indizi
                    if (spec.kind === 'limite' && this.indiziRaccolti() >= 3) this.boss.invulnerable = false;
                    // da cliente premium ticummi ha i tuoi dati: evoca echi di te
                    if (spec.kind === 'ticummi' && state.hasFlag('tommasorveglianza')) this.boss.summonOverride = 'eco';
                    this.lighting.follow(this.boss, this.boss.def.glowColor, 280, 1.0);
                    break;
                }
            }
        }
    }

    /** sacchetto o amuleto a terra: si raccoglie una volta sola per salvataggio */
    private spawnItemPickup(x: number, y: number, item: string, amount: number, persistKey: string): void {
        if (!ITEMS[item] || state.save.collectedLore.includes(persistKey)) return;
        const isCharm = ITEMS[item].kind === 'amuleto';
        if (isCharm && state.hasCharm(item)) return;
        ensurePickupTextures(this);
        const pickup = this.physics.add.sprite(x, y, isCharm ? 'pickup-charm' : 'pickup-item').setDepth(5);
        (pickup.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
        this.lighting.follow(pickup, isCharm ? 0xc084fc : 0xfacc15, 150, 0.8);
        this.tweens.add({ targets: pickup, y: y - 7, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        this.physics.add.overlap(this.player, pickup, () => {
            pickup.destroy();
            state.save.collectedLore.push(persistKey);
            state.addItem(item, amount);
            sfx.pickup();
            if (isCharm) {
                bus.emit('charm-found', { id: item });
            } else {
                bus.emit('toast', { text: `${ITEMS[item].icon} ${ITEMS[item].name}${amount > 1 ? ` ×${amount}` : ''} nello zaino` });
                bus.emit('inventory-changed', {});
            }
        });
    }

    /** ogni boss lascia il suo amuleto, una volta sola */
    private dropBossCharm(kind: BossKind, x: number, y: number): void {
        const id = BOSS_CHARMS[kind];
        if (!id || state.hasCharm(id)) return;
        this.spawnItemPickup(x + 40, y + 30, id, 1, `charm-${id}`);
    }

    /** se sei morto tra la vittoria e la ricompensa, la ricompensa ti aspetta */
    private recoverBossReward(kind: BossKind, x: number, y: number): void {
        const fragmentByBoss: Partial<Record<BossKind, AbilityId>> = {
            guggu: 'rimbalzo',
            breccio: 'riflesso',
            notino: 'risonante',
            ombra: 'scudo',
            teorema: 'analisi',
            smela: 'acquatossica',
        };
        const ability = fragmentByBoss[kind];
        if (ability && !state.hasAbility(ability)) this.spawnFragment(x, y + 50, ability);
        this.dropBossCharm(kind, x, y);
        if (kind === 'riba' && !state.hasFlag('dispositivo')) state.setFlag('dispositivo');
        if (kind === 'lochef') this.spawnCuore(x, y + 50, 'cuore-lochef');
        if (kind === 'formicona') this.spawnCuore(x, y + 50, 'cuore-formicona');
        if (kind === 'settequaranta') this.spawnCuore(x, y + 50, 'cuore-barrato');
        if (kind === 'custode') this.spawnCuore(x, y + 50, 'cuore-custode');
        if (kind === 'limite') {
            state.setFlag('caso-risolto');
            this.spawnCuore(x, y + 50, 'cuore-limite');
        }
        if (kind === 'furgone' || kind === 'smela') state.setFlag('stabilimento-chiuso');
        if (kind === 'pedrino') state.setFlag('ricordi-visti');
    }

    private spawnEnemy(kind: EnemyKind, x: number, y: number, opts: { sleeping?: boolean; hunting?: boolean } = {}): Enemy {
        const e = new Enemy(this, x, y, kind, this.nav, { sleeping: opts.sleeping });
        if (opts.hunting) e.hunt();
        e.setDepth(4);
        this.enemies.add(e);
        this.lighting.follow(e, e.arch.glowColor, 110, 0.55);
        return e;
    }


    private spawnNpc(id: string, x: number, y: number): void {
        // marker invisibili degli inseguimenti nella tana
        if (id === 'caccia-inizio') {
            this.chaseStarts.push(this.progressAt(x, y));
            this.chaseStarts.sort((a, b) => a - b);
            this.chaseDone = this.chaseStarts.map(() => false);
            return;
        }
        if (id === 'caccia-fine') {
            this.chaseEnds.push(this.progressAt(x, y));
            this.chaseEnds.sort((a, b) => a - b);
            return;
        }

        // marker invisibile: qui smela si rivela come boss finale
        if (id === 'smela-arena') {
            this.smelaArena = { x, y };
            return;
        }

        // marker invisibili delle arene del void: una per ogni rimpianto
        if (id.startsWith('arena-')) {
            this.voidArenas.push({ x, y });
            this.voidArenas.sort((a, b) => this.progressAt(a.x, a.y) - this.progressAt(b.x, b.y));
            return;
        }

        // marker invisibili delle arene della quest di walter
        if (id.startsWith('warena-')) {
            this.baruffoniArenas.push({ x, y });
            this.baruffoniArenas.sort((a, b) => this.progressAt(a.x, a.y) - this.progressAt(b.x, b.y));
            return;
        }

        // walter ti accompagna come faceva romero: cammina piano e si parla
        if (id === 'walter-guida') {
            const guide = this.add.sprite(x, y + 4, 'npc-walter').setDepth(4).setPipeline('Light2D');
            this.lighting.follow(guide, 0x86efac, 160, 0.8);
            this.companion = guide;
            this.companionBaseY = y + 4;
            this.companionInteract = { x, y, range: 80, onInteract: () => this.interactWalterGuida() };
            this.interactables.push(this.companionInteract);
            return;
        }

        // romero che ti fa da guida tra i rimpianti: cammina piano accanto a te e si parla
        if (id === 'romero-guida') {
            const guide = this.add.sprite(x, y + 4, 'npc-romero').setDepth(4).setPipeline('Light2D');
            this.lighting.follow(guide, 0x60a5fa, 170, 0.8);
            this.companion = guide;
            this.companionBaseY = y + 4;
            // interactable che segue romero: la sua posizione si aggiorna nel loop
            this.companionInteract = { x, y, range: 80, onInteract: () => this.interactGuida() };
            this.interactables.push(this.companionInteract);
            return;
        }

        // l'altare del 33: sfida opt-in al miniboss più potente del void
        if (id === 'sfida-33') {
            if (state.hasFlag('boss-down-trentatre')) return;
            const altar = this.add.sprite(x, y, 'lore-tablet').setDepth(4).setPipeline('Light2D');
            altar.setScale(1.3).setTint(0xfde047);
            this.lighting.follow(altar, 0xfacc15, 200, 0.95);
            this.tweens.add({ targets: altar, y: y - 5, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
            this.interactables.push({ x, y, range: 70, onInteract: () => this.interactSfida33(altar) });
            return;
        }

        // teorema mind doors
        if (id.startsWith('porta-teorema')) {
            if (state.hasFlag(`aperta-${id}`)) return;
            const door = this.doorGroup.create(x, y - 48, 'porta-teorema') as Phaser.Physics.Arcade.Sprite;
            door.setDepth(3).setPipeline('Light2D');
            (door.body as Phaser.Physics.Arcade.StaticBody).setSize(28, 128);
            this.lighting.follow(door, 0x60a5fa, 150, 0.7);
            const entry: Interactable = { x, y, range: 70, onInteract: () => this.interactPorta(id, door, entry) };
            this.interactables.push(entry);
            return;
        }

        const texture = npcTexture(id);
        const npc = this.add.sprite(x, y + 4, texture).setDepth(4).setPipeline('Light2D');
        this.lighting.follow(npc, ZONE_HEX[this.def.color], 160, 0.7);
        // vavleeh è steso a terra: niente fluttuazione, per rispetto
        if (!id.startsWith('vavleeh')) {
            this.tweens.add({ targets: npc, y: npc.y - 3, duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        }

        // lametta presiede l'arena: si vede ma non si parla
        if (id === 'lametta-arena') {
            this.lamettaCenter = { x, y };
            return;
        }
        if (id === 'ivan-incontro') this.ivanSprite = npc;
        this.interactables.push({ x, y, range: 70, onInteract: () => this.interactNpc(id) });
    }

    private interactNpc(id: string): void {
        switch (id) {
            case 'ivan-incontro':
                if (state.hasFlag('boss-down-guggu')) {
                    bus.emit('toast', { text: 'ivan non risponde più. il loop è finito davvero.' });
                    return;
                }
                this.startDialogue(id, () => {
                    if (!state.hasFlag('ivan')) {
                        state.setFlag('ivan');
                        if (this.boss?.def.kind === 'guggu') this.boss.invulnerable = false;
                        bus.emit('toast', { text: 'la furia di ivan ti accompagna. guggu ora si taglia.' });
                    }
                });
                break;
            case 'ticummi-offerta':
                this.startDialogue(id, () => {
                    if (state.hasFlag('tommasorveglianza')) return;
                    bus.emit('choice-show', {
                        title: 'tommasorveglianza: 133 barre. assolutamente sicura. 👍',
                        options: [{ label: 'compra (133 barre)' }, { label: 'rifiuta l\'affare' }],
                        onPick: (i) => {
                            if (i === 0 && state.save.barre >= 133) {
                                state.save.barre -= 133;
                                state.setFlag('tommasorveglianza');
                                bus.emit('barre-changed', { barre: state.save.barre, gained: false });
                                bus.emit('toast', { text: 'tommasorveglianza attiva. ti senti osservato, ma protetto.' });
                            } else if (i === 0) {
                                bus.emit('toast', { text: 'non hai 133 barre. ticummi ti guarda con pietà.' });
                            }
                        },
                    });
                });
                break;
            case 'spaccino':
                if (state.run.trenbolone) {
                    bus.emit('toast', { text: 'spaccino: "amico sei già a posto, inutile sprecare roba."' });
                    return;
                }
                this.startDialogue('spaccino-offerta', () => {
                    bus.emit('choice-show', {
                        title: 'comprare una dose di trenbolone? (costa 0 barre, è un omaggio)',
                        options: [{ label: 'accetta (fatti di trenbolone)' }, { label: 'no grazie' }],
                        onPick: (i) => {
                            if (i === 0) {
                                state.run.trenbolone = true;
                                state.setFlag('trenbolone-attivo');
                                bus.emit('toast', { text: 'ti sei fatto di trenbolone. ti senti una bestia ma lo schermo gira.' });
                                sfx.pickup();
                                bus.emit('hp-changed', { hp: state.run.hp, maxHp: state.maxHp, hurt: false });
                                
                                const boss = this.boss;
                                const bossIsAlive = boss && boss.active && boss.def.kind === 'flauto';
                                if (bossIsAlive) {
                                    // teleport the boss to the player for surprise attack
                                    boss.x = this.player.x + 220;
                                    boss.y = this.player.y - 100;
                                    (boss as any).anchorX = this.player.x + 220;
                                    (boss as any).anchorY = this.player.y - 100;
                                    
                                    this.bossIntroShown = true;
                                    this.startDialogue('flauto-fatto-rabbia', () => {
                                        boss.engage();
                                    });
                                } else {
                                    // fall asleep since boss is already defeated
                                    this.time.delayedCall(1000, () => {
                                        this.player.stun(999999);
                                        this.startDialogue('trenbo-addormentato', () => {
                                            this.gotoLevel('tana');
                                        });
                                    });
                                }
                            } else {
                                bus.emit('toast', { text: 'spaccino: "come vuoi, torna quando hai fegato."' });
                            }
                        }
                    });
                });
                break;
            case 'filippus-dodo':
                this.startDialogue('filippus-dodo', () => {
                    if (state.hasFlag('filippus-dono')) return;
                    state.setFlag('filippus-dono');
                    state.save.barre += 40;
                    bus.emit('barre-changed', { barre: state.save.barre, gained: true });
                    sfx.pickup();
                });
                break;
            case 'venditore-acqua':
                this.startDialogue(id, () => {
                    if (state.run.smela) {
                        bus.emit('toast', { text: 'ne hai già bevuta. l\'effetto smela III è già al lavoro.' });
                        return;
                    }
                    bus.emit('choice-show', {
                        title: 'acqua di smela, gratis. una sorsata?',
                        options: [{ label: 'bevi', danger: true }, { label: 'no, grazie' }],
                        onPick: (i) => {
                            if (i === 0) {
                                state.run.smela = true;
                                this.startDialogue('smela-truffa', () => this.playSmelaPoisonEffect());
                                bus.emit('toast', { text: TOASTS.smela });
                            }
                        },
                    });
                });
                break;
            case 'smela-offerta':
                this.startDialogue(id, () => {
                    bus.emit('choice-show', {
                        title: 'acqua premium della sorgente: 15 barre.',
                        options: [{ label: 'compra e bevi (15 barre)', danger: true }, { label: 'no grazie' }],
                        onPick: (i) => {
                            if (i === 0 && state.save.barre >= 15) {
                                state.save.barre -= 15;
                                bus.emit('barre-changed', { barre: state.save.barre, gained: false });
                                state.run.smela = true;
                                this.startDialogue('smela-truffa', () => {
                                    this.playSmelaPoisonEffect();
                                });
                                bus.emit('toast', { text: TOASTS.smela });
                            } else if (i === 0) {
                                bus.emit('toast', { text: 'non hai 15 barre. smela perde interesse immediatamente.' });
                            }
                        },
                    });
                });
                break;
            case 'piema-mente':
                this.interactPiema();
                break;
            case 'samatt-loop':
                this.startDialogue(state.hasFlag('boss-down-guggu') ? 'samatt-libero' : id);
                break;
            case 'walter-bus':
                // walter si sblocca solo dopo guggu: prima dorme della grossa
                if (!state.hasFlag('boss-down-guggu')) {
                    bus.emit('toast', { text: 'walter ronfa appoggiato a un palo. meglio non svegliarlo ora.' });
                    return;
                }
                if (state.hasFlag('boss-down-walter')) {
                    this.startDialogue('walter-bus-dopo');
                    return;
                }
                this.startDialogue('walter-bus-intro', () => {
                    bus.emit('choice-show', {
                        title: 'walter sbadiglia: "mi daresti una mano a galliate? è una cosa veloce, 3 annetti al massimo."',
                        options: [{ label: 'aiuta walter (vai a galliate)' }, { label: 'no, ho da fare' }],
                        onPick: (i) => {
                            if (i !== 0) {
                                bus.emit('toast', { text: 'walter: "...va beh. torna quando vuoi. io intanto schiaccio un pisolino."' });
                                return;
                            }
                            state.portalReturn = { levelId: 'bus', x: this.player.x, y: this.player.y };
                            bus.emit('toast', { text: 'sali sulla wolkswagen polo di walter. destinazione: galliate.' });
                            this.gotoLevel('galliate');
                        },
                    });
                });
                break;
            case 'indizio-1':
            case 'indizio-2':
            case 'indizio-3':
                this.interactIndizio(id);
                break;
            case 'lametta-cantina':
                if (state.hasFlag('boss-down-ticummi')) {
                    this.startDialogue('lametta-libero');
                } else {
                    this.startDialogue(id);
                }
                break;
            case 'lochef-cameo':
                music.playCustom("assets/music/lochef85's OST 1.mp3");
                this.startDialogue(id);
                break;
            default:
                this.startDialogue(id);
        }
    }

    private interactPiema(): void {
        if (state.hasAbility('analisi')) {
            bus.emit('toast', { text: 'piema sta facendo le valigie per andare da lametta.' });
            return;
        }
        if (!state.hasFlag('dispositivo')) {
            this.startDialogue('piema-senza-dispositivo');
            return;
        }
        this.startDialogue('piema-folle', () => {
            this.cameras.main.flash(500, 96, 165, 250);
            this.gotoLevel('mente');
        });
    }

    // mind door interactive
    private interactPorta(id: string, door: Phaser.Physics.Arcade.Sprite, entry: Interactable): void {
        const t = TRABOCCHETTI[id];
        if (!t) return;
        bus.emit('choice-show', {
            title: t.q,
            options: t.options.map((label) => ({ label })),
            onPick: (i) => {
                if (i !== t.correct) {
                    bus.emit('toast', { text: TOASTS.quizErrore });
                    this.cameras.main.flash(240, 248, 113, 113);
                    this.player.kill();
                    return;
                }
                state.setFlag(`aperta-${id}`);
                this.interactables = this.interactables.filter((it) => it !== entry);
                sfx.unlock();
                this.add.particles(door.x, door.y, 'p-spark', {
                    speed: { min: 40, max: 160 },
                    scale: { start: 0.7, end: 0 },
                    tint: 0x60a5fa,
                    lifespan: 500,
                    quantity: 20,
                    stopAfter: 20,
                });
                door.destroy();
                bus.emit('toast', { text: TOASTS.portaAperta });
            },
        });
    }

    private spawnFragment(x: number, y: number, ability: AbilityId): void {
        const shard = this.physics.add.sprite(x, y, 'fragment').setDepth(5);
        (shard.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
        this.lighting.follow(shard, 0x4ade80, 200, 1.0);
        this.tweens.add({ targets: shard, y: y - 10, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        this.tweens.add({ targets: shard, angle: { from: -8, to: 8 }, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        this.physics.add.overlap(this.player, shard, () => {
            shard.destroy();
            state.unlockAbility(ability);
            sfx.unlock();
            bus.emit('abilities-changed', { abilities: state.abilities });
            bus.emit('fragments-changed', { count: state.abilities.length, total: TOTAL_FRAGMENTS });
            bus.emit('ability-unlocked', { ability });
        });
    }

    private spawnLore(id: string, x: number, y: number): void {
        const collected = state.save.collectedLore.includes(id);
        const tablet = this.add.sprite(x, y + 1, 'lore-tablet').setDepth(4).setPipeline('Light2D').setAlpha(collected ? 0.5 : 1);
        this.interactables.push({
            x, y, range: 60,
            onInteract: () => {
                if (!state.save.collectedLore.includes(id)) {
                    state.save.collectedLore.push(id);
                    state.persist();
                    tablet.setAlpha(0.5);
                }
                this.startDialogue(id);
            },
        });
    }

    private micKey(cpId: string): string {
        return `mic-${this.def.id}-${cpId}`;
    }

    private spawnCheckpoints(): void {
        for (const cp of this.level.checkpoints) {
            const mic = this.add.sprite(cp.x, cp.y - 12, 'mic').setDepth(4).setPipeline('Light2D');
            this.checkpointSprites.set(cp.id, mic);
            const used = state.save.collectedLore.includes(this.micKey(cp.id));
            if (state.save.checkpointId === cp.id) {
                mic.setTint(0x4ade80);
                this.lighting.static(cp.x, cp.y - 20, 0x4ade80, 160, 0.8);
            } else if (used) {
                mic.setTint(0x64748b).setAlpha(0.55);
            }
            // checkpoints are one-time use
            if (used) continue;
            const entry: Interactable = {
                x: cp.x, y: cp.y, range: 60,
                onInteract: () => this.activateCheckpoint(cp.id, mic, entry),
            };
            this.interactables.push(entry);
        }
    }

    private spawnDroppedBarre(): void {
        const drop = state.dropped;
        if (!drop || drop.levelId !== this.def.id || drop.amount <= 0) return;
        const ghost = this.physics.add.sprite(drop.x, drop.y, 'drop-ghost').setDepth(4);
        (ghost.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
        this.lighting.follow(ghost, 0x4ade80, 130, 0.7);
        this.tweens.add({ targets: ghost, y: drop.y - 8, alpha: 0.6, duration: 900, yoyo: true, repeat: -1 });
        this.physics.add.overlap(this.player, ghost, () => {
            ghost.destroy();
            state.save.barre += drop.amount;
            state.dropped = null;
            state.persist();
            sfx.pickup();
            bus.emit('barre-changed', { barre: state.save.barre, gained: true });
            bus.emit('toast', { text: TOASTS.barreRecovered });
        });
    }

    private spawnBarrePickup(x: number, y: number, amount: number): void {
        // i pickup piazzati a mano non riappaiono una volta presi
        const key = `${this.def.id}-${Math.round(x)}-${Math.round(y)}`;
        if (state.save.collectedLore.includes(key)) return;
        const note = this.physics.add.sprite(x, y, 'barra').setDepth(4);
        (note.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
        this.tweens.add({ targets: note, y: y - 6, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        this.physics.add.overlap(this.player, note, () => {
            note.destroy();
            state.save.collectedLore.push(key);
            state.save.barre += amount;
            state.persist();
            sfx.pickup();
            bus.emit('barre-changed', { barre: state.save.barre, gained: true });
        });
    }

    /** cuore del realm: +1 vita massima, per sempre */
    private spawnCuore(x: number, y: number, persistKey: string): void {
        if (state.save.collectedLore.includes(persistKey)) return;
        const heart = this.physics.add.sprite(x, y, 'cuore').setDepth(5);
        (heart.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
        this.lighting.follow(heart, 0xf87171, 170, 0.9);
        this.tweens.add({ targets: heart, y: y - 8, duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        this.tweens.add({ targets: heart, scale: { from: 1, to: 1.15 }, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        this.physics.add.overlap(this.player, heart, () => {
            heart.destroy();
            state.save.collectedLore.push(persistKey);
            state.save.stats.costituzione += 1;
            state.run.hp = state.maxHp;
            state.persist();
            sfx.heal();
            this.cameras.main.flash(180, 248, 113, 113);
            bus.emit('hp-changed', { hp: state.run.hp, maxHp: state.maxHp, hurt: false });
            bus.emit('toast', { text: TOASTS.cuore });
        });
    }

    /* ---------- le maschere del realm ---------- */

    private maschereCount(): number {
        return state.save.collectedLore.filter((k) => k.startsWith('maschera-')).length;
    }

    private spawnMaschera(x: number, y: number, persistKey: string): void {
        if (state.save.collectedLore.includes(persistKey)) return;
        const mask = this.physics.add.sprite(x, y, 'maschera').setDepth(5);
        (mask.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
        this.lighting.follow(mask, 0x4ade80, 170, 0.9);
        this.tweens.add({ targets: mask, y: y - 8, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        this.tweens.add({ targets: mask, angle: { from: -6, to: 6 }, duration: 1700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        this.physics.add.overlap(this.player, mask, () => {
            mask.destroy();
            state.save.collectedLore.push(persistKey);
            state.save.barre += 25;
            state.persist();
            sfx.unlock();
            bus.emit('barre-changed', { barre: state.save.barre, gained: true });
            const n = this.maschereCount();
            bus.emit('toast', { text: `una maschera della tua stessa faccia (${n}/${TOTAL_MASCHERE}). +25 barre.` });
            if (n === 3 && !state.hasFlag('maschere-5')) {
                state.setFlag('maschere-5');
                state.save.stats.forza += 1;
                state.persist();
                bus.emit('wavesung', WAVESUNG.markolinoMaschere5);
            }
            if (n >= TOTAL_MASCHERE && !state.hasFlag('maschera-completa')) {
                state.setFlag('maschera-completa');
                bus.emit('wavesung', WAVESUNG.markolinoMaschere10);
                bus.emit('toast', { text: TOASTS.mascheraCompleta });
            }
        });
    }

    /* ---------- varchi verso i capitoli segreti ---------- */

    private spawnPortal(x: number, y: number, to: string, needsFlag?: string, label?: string): void {
        const unlocked = !needsFlag || state.hasFlag(needsFlag);
        const portal = this.add.sprite(x, y - 8, 'portal').setDepth(5);
        if (!unlocked) {
            // varco spento: si intravede appena finché non scatta la condizione
            portal.setAlpha(0.16).setTint(0x445544);
            this.interactables.push({
                x, y: y - 8, range: 60,
                onInteract: () => bus.emit('toast', { text: TOASTS.portalLocked }),
            });
            return;
        }
        this.lighting.follow(portal, to === 'barrato' ? 0xfacc15 : 0x4ade80, 220, 1.0);
        this.tweens.add({ targets: portal, scaleX: { from: 0.92, to: 1.08 }, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        this.tweens.add({ targets: portal, angle: { from: -3, to: 3 }, duration: 2200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        this.add.particles(x, y - 8, 'p-dot', {
            scale: { start: 0.4, end: 0 },
            alpha: { start: 0.6, end: 0 },
            tint: to === 'barrato' ? 0xfacc15 : 0x4ade80,
            speed: { min: 10, max: 40 },
            lifespan: 1000,
            frequency: 120,
        }).setDepth(4);
        const hintShown = `portal-hint-${to}`;
        if (!state.hasFlag(hintShown)) {
            state.setFlag(hintShown);
            this.time.delayedCall(900, () => bus.emit('toast', {
                text: to === 'barrato' ? TOASTS.portalBarrato : TOASTS.portalCustode,
            }));
        }
        this.interactables.push({
            x, y: y - 8, range: 58,
            onInteract: () => {
                if (this.exiting) return;
                bus.emit('choice-show', {
                    title: `un varco verso ${label ?? to}. ci entri?`,
                    options: [{ label: `entra: ${label ?? to}` }, { label: 'resta qui' }],
                    onPick: (i) => {
                        if (i !== 0 || this.exiting) return;
                        state.portalReturn = { levelId: this.def.id, x, y };
                        bus.emit('toast', { text: `entri nel varco: ${label ?? to}.` });
                        this.gotoLevel(to);
                    },
                });
            },
        });
    }

    /* ---------- il caso analisi 1 ---------- */

    private indiziRaccolti(): number {
        return ['indizio-1', 'indizio-2', 'indizio-3'].filter((f) => state.hasFlag(f)).length;
    }

    private interactIndizio(id: string): void {
        this.startDialogue(id, () => {
            if (!state.hasFlag(id)) {
                state.setFlag(id);
                const n = this.indiziRaccolti();
                bus.emit('toast', { text: `indizio acquisito al fascicolo (${n}/3).` });
                if (n >= 3) {
                    if (this.boss?.def.kind === 'limite') this.boss.invulnerable = false;
                    this.startDialogue('caso-completo');
                }
            }
        });
    }

    /* ---------- colliders ed eventi ---------- */

    private setupColliders(): void {
        const layer = this.level.layer;
        this.physics.add.collider(this.player, layer);
        this.physics.add.collider(this.enemies, layer);
        this.physics.add.collider(this.barreGroup, layer);
        this.physics.add.collider(this.playerProjectiles, layer, (proj) => this.popProjectile(proj as Phaser.Physics.Arcade.Sprite));
        this.physics.add.collider(this.enemyProjectiles, layer, (proj) => this.popProjectile(proj as Phaser.Physics.Arcade.Sprite));

        this.physics.add.collider(this.player, this.doorGroup);
        this.physics.add.collider(this.enemies, this.doorGroup);

        this.physics.add.collider(this.player, this.level.breakableWalls);
        this.physics.add.collider(this.enemies, this.level.breakableWalls);
        this.physics.add.collider(this.barreGroup, this.level.breakableWalls);
        this.physics.add.collider(this.playerProjectiles, this.level.breakableWalls, (proj) => {
            this.popProjectile(proj as Phaser.Physics.Arcade.Sprite);
            this.destroyBreakableWall(proj as Phaser.Physics.Arcade.Sprite);
        });
        this.physics.add.overlap(this.player.attackHitbox, this.level.breakableWalls, (_hb, obj) => {
            if (!this.player.attackActive) return;
            this.player.attackActive = false;
            this.player.onAttackHit();
            this.hitstop();
            this.destroyBreakableWall(obj as Phaser.Physics.Arcade.Sprite);
        });

        this.physics.add.overlap(this.player.attackHitbox, this.enemies, (_hb, obj) => {
            if (!this.player.attackActive) return;
            const enemy = obj as Enemy;
            this.player.attackActive = false;
            this.player.onAttackHit();
            this.hitstop();
            enemy.takeDamage(this.player.attackDamage, this.player.x);
        });

        this.physics.add.overlap(this.player, this.enemies, (_p, obj) => {
            const enemy = obj as Enemy;
            this.player.hurt(1, enemy.x);
        });

        this.physics.add.overlap(this.playerProjectiles, this.enemies, (a, b) => {
            const enemy = (a instanceof Enemy ? a : b) as Enemy;
            const bullet = (a instanceof Enemy ? b : a) as Phaser.Physics.Arcade.Sprite;
            if (!enemy.active || !bullet.active) return;
            // il colpo risonante perfora ma ogni bersaglio lo subisce una volta
            const hitSet = (bullet.getData('hit') ?? new Set()) as Set<Enemy>;
            if (hitSet.has(enemy)) return;
            hitSet.add(enemy);
            bullet.setData('hit', hitSet);
            const dmg = (bullet.getData('dmg') as number | undefined) ?? state.risonanteDamage * state.damageMult;
            enemy.takeDamage(dmg, bullet.x);
            this.player.onAttackHit();
        });

        this.physics.add.overlap(this.enemyProjectiles, this.player, (a, b) => {
            const proj = (a === this.player ? b : a) as Phaser.Physics.Arcade.Sprite;
            if (this.time.now < this.scudoUntil) {
                this.reflectProjectile(proj);
                return;
            }
            if (this.player.hurt(1, proj.x)) {
                this.popProjectile(proj);
            }
        });

        this.physics.add.overlap(this.lametteGroup, this.player, (a, b) => {
            const blade = (a === this.player ? b : a) as Phaser.Physics.Arcade.Sprite;
            this.player.hurt(1, blade.x);
        });

        this.physics.add.overlap(this.player, this.level.spikes, () => this.onSpikes());

        this.physics.add.overlap(this.player, this.barreGroup, (_p, obj) => {
            const note = obj as Phaser.Physics.Arcade.Sprite;
            const value = note.getData('value') as number;
            note.destroy();
            state.save.barre += value;
            state.persist();
            sfx.barra();
            bus.emit('barre-changed', { barre: state.save.barre, gained: true });
        });

        if (this.boss) {
            this.physics.add.collider(this.boss, layer);
            this.physics.add.overlap(this.player.attackHitbox, this.boss, () => {
                if (!this.player.attackActive || !this.boss) return;
                this.player.attackActive = false;
                if (this.boss.takeDamage(this.player.attackDamage, this.player.x)) {
                    this.player.onAttackHit();
                    this.hitstop();
                } else if (this.boss.def.kind === 'guggu') {
                    bus.emit('toast', { text: TOASTS.gugguDoor });
                } else if (this.boss.def.kind === 'limite') {
                    bus.emit('toast', { text: TOASTS.limiteScudo });
                }
            });
            this.physics.add.overlap(this.player, this.boss, () => {
                if (this.boss) this.player.hurt(this.boss.def.contactDamage, this.boss.x);
            });
            this.physics.add.overlap(this.playerProjectiles, this.boss, (obj, proj) => {
                const bullet = (obj === this.boss ? proj : obj) as Phaser.Physics.Arcade.Sprite;
                if (!this.boss || !bullet.active) return;
                const dmg = (bullet.getData('dmg') as number | undefined) ?? state.risonanteDamage * state.damageMult;
                if (this.boss.takeDamage(dmg, bullet.x)) {
                    this.player.onAttackHit();
                }
            });
        }
    }

    private setupEvents(): void {
        const on = (event: string, fn: (...args: never[]) => void) => {
            this.events.on(event, fn, this);
            this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.events.off(event, fn, this));
        };
        on('player-risonante', this.onRisonante as never);
        on('player-riflesso', this.onRiflesso as never);
        on('player-analisi', this.onAnalisi as never);
        on('player-scudo', this.onScudo as never);
        on('player-acqua', this.onAcquaTossica as never);
        on('enemy-shoot', this.onEnemyShoot as never);
        on('enemy-died', this.onEnemyDied as never);
        on('enemy-alert', this.onEnemyAlert as never);
        on('player-dead', this.onPlayerDead as never);
        on('boss-summon', this.onBossSummon as never);
        on('boss-lamette', this.onBossLamette as never);
        on('boss-defeated', this.onBossDefeated as never);

        this.input.keyboard!.on('keydown-ESC', () => bus.emit('request-pause', {}));
        this.input.keyboard!.on('keydown-E', () => this.tryInteract());
    }

    /* ---------- progresso: la x dei capitoli lineari, il percorso nelle regioni ---------- */

    private roomAt(x: number, y: number): Room | null {
        const L = this.layout;
        if (!L || !this.roomBySlot) return null;
        const sx = Math.floor(x / TILE / L.slotW);
        const sy = Math.floor(y / TILE / L.slotH);
        if (sx < 0 || sy < 0 || sx >= L.macroW || sy >= L.macroH) return null;
        const id = this.roomBySlot[sy * L.macroW + sx];
        return id >= 0 ? L.rooms[id] : null;
    }

    /** quanto si è avanti nel capitolo: celle nel capitolo vecchio, stanze del percorso nella regione */
    private progressAt(x: number, y: number): number {
        if (!this.layout) return x / TILE;
        const room = this.roomAt(x, y);
        if (!room) return 0;
        // le stanze laterali contano come l'inizio della stanza da cui partono
        if (room.pathIndex < 0) return this.layout.rooms[room.anchor].pathIndex;
        const f = (x / TILE - room.rect.x) / room.rect.w;
        return room.pathIndex + Phaser.Math.Clamp(f, 0, 0.999);
    }

    /** una x del capitolo vecchio, in pixel, tradotta in progresso */
    private progressOfOldX(oldXPx: number): number {
        return this.layout ? oldXToProgress(this.layout, oldXPx / TILE) : oldXPx / TILE;
    }

    /** il punto libero più vicino dove far comparire qualcuno alto due celle */
    private openSpotNear(x: number, y: number, radius = 12): { x: number; y: number } {
        const grid = this.def.grid;
        const open = (c: number, r: number) => {
            const ch = grid[r]?.[c];
            return ch !== undefined && ch !== '#' && ch !== '%' && ch !== '^' && ch !== 'F';
        };
        const c0 = Math.floor(x / TILE);
        const r0 = Math.floor(y / TILE);
        for (let d = 0; d <= radius; d++) {
            for (let dy = -d; dy <= d; dy++) {
                for (let dx = -d; dx <= d; dx++) {
                    if (Math.max(Math.abs(dx), Math.abs(dy)) !== d) continue;
                    const c = c0 + dx;
                    const r = r0 + dy;
                    if (open(c, r) && open(c, r - 1)) return { x: c * TILE + TILE / 2, y: r * TILE + TILE / 2 };
                }
            }
        }
        return { x: this.player.x, y: this.player.y - 40 };
    }

    private setupCamera(): void {
        const cam = this.cameras.main;
        cam.setBounds(0, 0, this.level.widthPx, this.level.heightPx);
        this.physics.world.setBounds(0, 0, this.level.widthPx, this.level.heightPx);
        cam.startFollow(this.player, true, 0.12, 0.12);
        cam.setDeadzone(50, 36);
        const applyZoom = () => {
            cam.setZoom(Math.max(1.05, this.scale.height / this.level.heightPx));
            this.parallax?.resize();
        };
        applyZoom();
        this.scale.on('resize', applyZoom);
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scale.off('resize', applyZoom));
        // nella tana resti al buio: i dialoghi del sonno girano sul nero,
        // poi apri gli occhi a fine dialogo (vedi intro in create)
        if (this.def.id === 'tana') cam.fadeOut(0, 0, 0, 0);
        else cam.fadeIn(500, 0, 0, 0);
        if (cam.postFX) cam.postFX.addVignette(0.5, 0.5, 0.86);
    }

    private buildPrompt(): void {
        const circle = this.add.graphics();
        circle.fillStyle(0x000000, 0.6);
        circle.fillCircle(0, 0, 11);
        circle.lineStyle(1.5, 0x4ade80, 0.8);
        circle.strokeCircle(0, 0, 11);
        const txt = this.add.text(0, 0, 'E', {
            fontFamily: '"Martian Mono", monospace',
            fontSize: '11px',
            color: '#4ade80',
        }).setOrigin(0.5);
        this.prompt = this.add.container(0, 0, [circle, txt]).setDepth(8).setVisible(false);
    }

    /* ---------- script per capitolo ---------- */

    private setupScript(): void {
        if (this.def.script === 'trenbolone') {
            if (!state.hasFlag('rio-curato') && !state.run.trenbolone) {
                this.time.delayedCall(900, () => {
                    bus.emit('wavesung', WAVESUNG.trenboloneAd);
                    state.run.trenbolone = true;
                    state.setFlag('trenbolone-attivo');
                    bus.emit('toast', { text: TOASTS.trenbolone });
                });
            }
        }
        // samatt ha un telefono e una gratitudine infinita
        if (this.def.id === 'santuario' && state.hasFlag('boss-down-guggu') && !state.hasFlag('wavesung-samatt')) {
            state.setFlag('wavesung-samatt');
            this.time.delayedCall(2000, () => bus.emit('wavesung', WAVESUNG.samattGrazie));
        }
        if (this.def.script === 'ruhra' && !state.hasFlag('wavesung-piema')) {
            state.setFlag('wavesung-piema');
            this.time.delayedCall(1200, () => bus.emit('wavesung', WAVESUNG.markolinoPiema));
        }
        if (this.def.script === 'tana' && !state.hasFlag('wavesung-tana')) {
            state.setFlag('wavesung-tana');
            this.time.delayedCall(2500, () => bus.emit('wavesung', WAVESUNG.markolinoTana));
        }
        if (this.def.script === 'sorveglianza' && !state.hasFlag('wavesung-sorveglianza')) {
            state.setFlag('wavesung-sorveglianza');
            this.time.delayedCall(1200, () => bus.emit('wavesung', WAVESUNG.piemaAiuto));
        }
        if (this.def.script === 'cantina' && !state.hasFlag('wavesung-cantina')) {
            state.setFlag('wavesung-cantina');
            const msg = state.hasFlag('tommasorveglianza') ? WAVESUNG.ticummiClausola : WAVESUNG.ticummiArrabbiato;
            this.time.delayedCall(1200, () => bus.emit('wavesung', msg));
        }
        if (this.def.script === 'pedro' && !state.hasFlag('wavesung-finale')) {
            state.setFlag('wavesung-finale');
            this.time.delayedCall(1200, () => bus.emit('wavesung', WAVESUNG.markolinoFinale));
        }
        if (this.def.script === 'indagine') this.setupVoid();
        if (this.def.script === 'galliate' || this.def.script === 'marcetti') this.setupBaruffoni();
    }

    /* ---------- la quest di walter baruffoni: galliate e marcetti ---------- */

    /** la sequenza di boss di questo capitolo (vuota fuori dalla quest) */
    private baruffoniSeq(): BossKind[] {
        return BARUFFONI_SEQ[this.def.id] ?? [];
    }

    private setupBaruffoni(): void {
        const seq = this.baruffoniSeq();
        if (seq.length === 0) return;
        this.baruffoniStep = seq.filter((k) => state.hasFlag(`boss-down-${k}`)).length;
        // riallineo walter all'arena di turno
        if (this.companion) {
            const here = this.baruffoniArenas[Math.min(this.baruffoniStep, this.baruffoniArenas.length - 1)];
            if (here) this.companion.setPosition(here.x - 90, this.companionBaseY);
        }
        if (this.baruffoniStep >= seq.length) {
            // capitolo già concluso: walter resta in fondo, l'uscita è libera
            if (this.companion && this.baruffoniArenas.length) {
                const last = this.baruffoniArenas[this.baruffoniArenas.length - 1];
                this.companion.setPosition(last.x + 60, this.companionBaseY);
            }
            return;
        }
        this.spawnBaruffoniBoss(this.baruffoniStep);
    }

    /** materializza il boss di turno nella sua arena (l'ultimo di marcetti è walter) */
    private spawnBaruffoniBoss(idx: number): void {
        const seq = this.baruffoniSeq();
        const kind = seq[idx];
        const arena = this.baruffoniArenas[idx];
        if (!kind || !arena) return;
        if (kind === 'walter') {
            this.walterReveal(arena);
            return;
        }
        this.boss = new Boss(this, arena.x, arena.y - 20, kind);
        this.bossIntroShown = false;
        this.lighting.follow(this.boss, this.boss.def.glowColor, 260, 1.0);
        this.setupBossColliders();
    }

    /** un boss della quest è caduto: walter commenta e fa avanzare la sequenza */
    private onBaruffoniDown(kind: BossKind): void {
        const seq = this.baruffoniSeq();
        const idx = seq.indexOf(kind);
        if (idx < 0) return;
        this.baruffoniStep = idx + 1;
        const last = idx >= seq.length - 1;
        this.startDialogue(`${this.def.id}-verita-${idx + 1}`, () => {
            if (last) {
                this.onBaruffoniComplete();
                return;
            }
            this.time.delayedCall(900, () => this.spawnBaruffoniBoss(idx + 1));
        });
    }

    /** galliate: ultimo maranza giù → strada libera verso le autoscuole */
    private onBaruffoniComplete(): void {
        if (this.def.id !== 'galliate') return;
        bus.emit('toast', { text: 'la strada per le autoscuole marcetti è libera. walter sorride.' });
    }

    /** walter smette di sonnacchiare: si rivela boss finale e si ingrandisce */
    private walterReveal(arena: { x: number; y: number }): void {
        if (this.baruffoniBusy) return;
        this.baruffoniBusy = true;
        this.startDialogue('walter-rivelazione', () => {
            // l'npc che ti seguiva sparisce: ora è il boss
            if (this.companionInteract) {
                this.interactables = this.interactables.filter((i) => i !== this.companionInteract);
                this.companionInteract = null;
            }
            const cx = this.companion?.x ?? arena.x;
            this.companion?.destroy();
            this.companion = null;
            const wy = arena.y - 30;
            const boss = new Boss(this, cx, wy, 'walter');
            boss.setScale(0.35);
            this.boss = boss;
            this.bossIntroShown = true; // l'ingaggio lo faccio io dopo la crescita
            this.lighting.follow(boss, boss.def.glowColor, 320, 1.1);
            this.setupBossColliders();
            this.cameras.main.shake(600, 0.01);
            this.cameras.main.flash(300, 22, 163, 74);
            this.tweens.add({
                targets: boss,
                scale: 1.15,
                duration: 1500,
                ease: 'Back.easeOut',
                onComplete: () => boss.active && boss.engage(),
            });
        });
    }

    /** walter cammina piano accanto al player, come faceva romero nel void */
    private updateBaruffoni(time: number, delta: number): void {
        const c = this.companion;
        if ((this.def.script !== 'galliate' && this.def.script !== 'marcetti') || !c) return;
        let objX: number;
        if (this.baruffoniStep < this.baruffoniArenas.length) {
            objX = this.baruffoniArenas[this.baruffoniStep].x - 70;
        } else {
            const lastArena = this.baruffoniArenas[this.baruffoniArenas.length - 1];
            objX = (lastArena?.x ?? this.player.x) + 80;
        }
        this.moveGuide(c, objX, time, delta);
    }

    /** parlare con walter lungo il cammino: commento contestuale e strano */
    private interactWalterGuida(): void {
        const seq = this.baruffoniSeq();
        const n = Math.min(this.baruffoniStep + 1, seq.length);
        this.startDialogue(`${this.def.id}-walter-${n}`);
    }

    /* ---------- il void: i rimpianti di piema e lametta ---------- */

    /** quante verità sono già state strappate ai rimpianti (0..5) */
    private veritaRivelate(): number {
        return VOID_REGRETS.filter((k) => state.hasFlag(`boss-down-${k}`)).length;
    }

    private setupVoid(): void {
        this.voidStep = this.veritaRivelate();
        // riallineo romero alla verità a cui siamo arrivati
        if (this.companion) {
            const here = this.voidArenas[Math.min(this.voidStep, this.voidArenas.length - 1)];
            if (here) this.companion.setPosition(here.x - 90, this.companionBaseY);
        }
        if (this.voidStep >= VOID_REGRETS.length) {
            // tutto già visto: il void è solo un corridoio verso il nucleo
            if (this.companion && this.voidArenas.length) {
                const last = this.voidArenas[this.voidArenas.length - 1];
                this.companion.setPosition(last.x + 60, this.companionBaseY);
            }
            // se sei uscito prima della chiusura, la riproponiamo così l'uscita si apre
            if (!state.hasFlag('void-concluso')) {
                this.time.delayedCall(1200, () => this.voidClimax());
            }
            return;
        }
        if (!state.hasFlag('wavesung-void')) {
            state.setFlag('wavesung-void');
            this.time.delayedCall(2200, () => bus.emit('wavesung', WAVESUNG.markolinoVoid));
        }
        this.spawnRegret(this.voidStep);
    }

    /** materializza il rimpianto di turno nella sua arena */
    private spawnRegret(idx: number): void {
        const arena = this.voidArenas[idx];
        if (!arena) return;
        const kind = VOID_REGRETS[idx];
        this.boss = new Boss(this, arena.x, arena.y - 20, kind);
        this.bossIntroShown = false;
        this.lighting.follow(this.boss, this.boss.def.glowColor, 260, 1.0);
        this.setupBossColliders();
    }

    /** un rimpianto è caduto: si rivela la verità e romero ti porta al prossimo */
    private onVeritaRivelata(idx: number): void {
        this.voidStep = idx + 1;
        const last = idx >= VOID_REGRETS.length - 1;
        this.startDialogue(`verita-${idx + 1}`, () => {
            if (last) {
                this.voidClimax();
                return;
            }
            // romero non teletrasporta: cammina col player verso la prossima arena (updateVoid)
            this.time.delayedCall(900, () => this.spawnRegret(idx + 1));
        });
    }

    /** romero cammina piano, resta accanto al player e si ferma se lo perde */
    private updateVoid(time: number, delta: number): void {
        const c = this.companion;
        if (this.def.script !== 'indagine' || !c) return;

        // obiettivo: il punto a sinistra dell'arena di turno (o oltre l'ultima, a fine void)
        let objX: number;
        if (this.voidStep < this.voidArenas.length) {
            objX = this.voidArenas[this.voidStep].x - 70;
        } else {
            const lastArena = this.voidArenas[this.voidArenas.length - 1];
            objX = (lastArena?.x ?? this.player.x) + 80;
        }

        this.moveGuide(c, objX, time, delta);
    }

    /** la guida accompagna il player: nei capitoli lineari cammina verso l'obiettivo
        senza mai staccarsi, nelle regioni fluttua al suo fianco dal lato dell'obiettivo */
    private moveGuide(c: Phaser.GameObjects.Sprite, objX: number, time: number, delta: number): void {
        if (this.layout) {
            const side = Math.sign(objX - this.player.x) || 1;
            const tx = this.player.x + side * 70;
            const ty = this.player.y - 26;
            // rimasta in un'altra stanza: ti raggiunge invece di attraversare mezza regione
            if (Math.hypot(tx - c.x, ty - c.y) > 900) c.setPosition(tx, ty);
            const k = 1 - Math.exp(-delta / 260);
            c.x += (tx - c.x) * k;
            c.y += (ty - c.y) * k + Math.sin(time / 320) * 0.4;
            c.setFlipX(side < 0);
        } else {
            // guida ma resta vicino: non si allontana mai più di `lead` dal player.
            // se il player resta indietro, la guida non supera player+lead → di fatto lo aspetta.
            const lead = 150;
            const targetX = Phaser.Math.Clamp(objX, this.player.x - lead, this.player.x + lead);
            const speed = 150; // px/s, più lento del geco: non vola mai avanti
            const step = (speed * delta) / 1000;
            const dx = targetX - c.x;
            if (Math.abs(dx) <= step + 1) {
                c.x = targetX;
            } else {
                c.x += Math.sign(dx) * step;
                c.setFlipX(dx < 0);
            }
            c.y = this.companionBaseY + Math.sin(time / 320) * 2;
        }
        if (this.companionInteract) {
            this.companionInteract.x = c.x;
            this.companionInteract.y = c.y;
        }
    }

    /** parlare con romero lungo il cammino: commento contestuale alla verità di turno */
    private interactGuida(): void {
        if (state.hasFlag('void-concluso')) {
            this.startDialogue('romero-guida-fine');
            return;
        }
        const n = Math.min(this.voidStep + 1, VOID_REGRETS.length);
        this.startDialogue(`romero-guida-${n}`);
    }

    /** l'altare del 33: evocabile in qualsiasi momento, anche coi rimpianti vivi.
        il rimpianto in corso viene accantonato e rievocato dopo la sfida. */
    private interactSfida33(altar: Phaser.GameObjects.Sprite): void {
        this.startDialogue('trentatre-altare', () => {
            bus.emit('choice-show', {
                title: 'il 33 pulsa nell\'altare. lo evochi? è molto più forte di te.',
                options: [{ label: 'evoca il 33', danger: true }, { label: 'non ancora' }],
                onPick: (i) => {
                    if (i !== 0) return;
                    // accantono il rimpianto in corso: tornerà fresco dopo il 33
                    if (this.boss?.active && VOID_REGRETS.includes(this.boss.def.kind)) {
                        this.boss.destroy();
                        bus.emit('boss-hp', null);
                    }
                    altar.destroy();
                    this.boss = new Boss(this, altar.x, altar.y - 30, 'trentatre');
                    this.boss.chase = true;
                    this.bossIntroShown = false;
                    this.lighting.follow(this.boss, this.boss.def.glowColor, 320, 1.1);
                    this.setupBossColliders();
                },
            });
        });
    }

    /** l'ultima verità: pedro sta eseguendo l'ordine ORA. arriva markolino. */
    private voidClimax(): void {
        if (this.voidBusy) return;
        this.voidBusy = true;
        this.startDialogue('void-svolta', () => {
            // markolino piomba di corsa da destra
            const mx = this.player.x + 520;
            const mk = this.add.sprite(mx, this.player.y, 'npc-markolino').setDepth(5).setPipeline('Light2D');
            this.lighting.follow(mk, 0x4ade80, 200, 0.9);
            mk.setFlipX(true);
            bus.emit('wavesung', WAVESUNG.markolinoPedroMuove);
            this.tweens.add({
                targets: mk,
                x: this.player.x + 90,
                duration: 1100,
                ease: 'Quad.easeOut',
                onComplete: () => {
                    this.startDialogue('markolino-avviso-pedro', () => {
                        this.startDialogue('void-addio-romero', () => {
                            state.setFlag('void-concluso');
                            bus.emit('toast', { text: 'pianti romero e corri verso il nucleo.' });
                        });
                    });
                },
            });
        });
    }

    /* ---------- loop ---------- */

    update(time: number, delta: number): void {
        if (!this.player) return;
        this.player.update(time, delta);

        if (!this.player.dead && this.player.y > this.level.heightPx + FALL_DEATH_MARGIN) {
            this.player.kill();
        }

        const target = this.clone && this.clone.active ? (this.clone as Phaser.GameObjects.Sprite) : this.player;
        this.updateEnemies(time, delta, target);
        this.boss?.update(time, delta, target);
        this.lighting.update();
        this.terrain.update(this.cameras.main.worldView);
        this.parallax.update(time);
        this.ambience.update();
        this.water.update(time);

        this.trackSafePosition(delta);
        state.save.record.playMs += delta;
        state.run.nearMic = this.level.checkpoints.some((cp) => Math.abs(cp.x - this.player.x) < 110 && Math.abs(cp.y - this.player.y) < 110);
        this.checkExits();
        this.updatePrompt();
        this.updateBossTrigger();
        this.magnetBarre();
        this.updateClone(time, delta);
        this.updateAnalisi(time);
        this.updateScudo(time);
        this.updateAcquaTossica(time);
        this.updateLamettaArena(time);
        this.updateSmelaArena();
        this.updateWaterCure();
        this.updateAmbush();
        this.updateChase(delta);
        this.updatePatto(time);
        this.updateIvan(time);
        this.updateVoid(time, delta);
        this.updateBaruffoni(time, delta);
        this.updateFakeWalls();
        this.updateDoomsday(time, delta);
        this.updateRhythm(time);

        if (state.run.trenbolone && Math.random() < 0.2) {
            this.shake(60, 0.0006);
        }
    }

    /** i tetti delle comparse contano solo chi è sveglio: la regione intera ne ha centinaia */
    private awakeEnemies(): number {
        let n = 0;
        for (const child of this.enemies.getChildren()) {
            const e = child as Enemy;
            if (e.active && !e.dormant) n++;
        }
        return n;
    }

    /** i nemici lontani dormono; si svegliano prima di entrare in vista, e il margine
        tra sveglia e sonno evita che chi sta sul confine si accenda e spenga di continuo */
    private updateEnemies(time: number, delta: number, target: Phaser.GameObjects.Sprite): void {
        const px = this.player.x;
        const py = this.player.y;
        for (const child of this.enemies.getChildren()) {
            const e = child as Enemy;
            if (!e.active) continue;
            const dx = Math.abs(e.x - px);
            const dy = Math.abs(e.y - py);
            if (e.dormant) {
                if (dx < 1500 && dy < 1000) e.setDormant(false);
            } else if (dx > 1800 || dy > 1250) {
                e.setDormant(true);
            }
            if (!e.dormant) e.update(time, delta, target);
        }
    }

    /* ---------- la modalità doomsday del realm ---------- */

    private updateDoomsday(time: number, delta: number): void {
        if (!state.save.doomsdayMode || this.player.dead || this.exiting) return;
        // niente doomsday durante gli scontri di trama già tesi
        if (this.pattoActive || this.finalGodsFight) return;
        const v = state.tickDoomsday(delta);
        bus.emit('doomsday-changed', { value: v, active: true });

        if (v >= 0.45 && this.doomsdayWarned < 1) {
            this.doomsdayWarned = 1;
            bus.emit('toast', { text: TOASTS.doomsdayWarn1 });
        }
        if (v >= 0.72 && this.doomsdayWarned < 2) {
            this.doomsdayWarned = 2;
            bus.emit('toast', { text: TOASTS.doomsdayWarn2 });
        }

        const activeBoss = this.boss && this.boss.engaged;

        // glitch selvaggi che infestano qualsiasi zona quando il doomsday avanza
        if (v >= 0.6 && !activeBoss && time >= this.nextWildGlitchAt) {
            this.nextWildGlitchAt = time + Phaser.Math.Between(3500, 6500);
            const side = Math.random() < 0.5 ? -1 : 1;
            const gx = Phaser.Math.Clamp(this.player.x + side * 420, 40, this.level.widthPx - 40);
            const at = this.openSpotNear(gx, this.player.y - 80);
            this.spawnEnemy('glitchetto', at.x, at.y, { hunting: true });
        }

        // doomsday pieno: pedro raggiunge il custode. boss anticipato, quasi impossibile.
        if (v >= 1 && !this.collapseTriggered && !activeBoss && this.def.script !== 'pedro') {
            this.collapseTriggered = true;
            this.collapsePedro = true;
            if (this.boss) {
                this.replacedBossKind = this.boss.def.kind;
                this.replacedBossX = this.boss.x;
                this.replacedBossY = this.boss.y;
                this.boss.destroy();
            } else {
                this.replacedBossKind = null;
            }
            bus.emit('toast', { text: TOASTS.doomsdayPedro });
            this.shake(400, 0.012);
            this.startDialogue('doomsday-pedro', () => {
                const px = Phaser.Math.Clamp(this.player.x + 220, 80, this.level.widthPx - 80);
                const at = this.openSpotNear(px, this.player.y - 120);
                this.boss = new Boss(this, at.x, at.y, 'pedro');
                this.boss.frenzy = true;
                this.lighting.follow(this.boss, this.boss.def.glowColor, 320, 1.1);
                this.setupBossColliders();
                this.boss.engage();
            });
        }
    }

    /* ---------- il primo custode: attacchi sul beat, pulse visivo ---------- */

    private updateRhythm(time: number): void {
        if (this.def.script !== 'custode' || !this.boss?.active || !this.boss.engaged) return;
        if (time < this.nextBeatAt) return;
        this.nextBeatAt = time + this.beatMs;
        // lampo sul beat: il boss imposta la scala ogni frame, quindi pulsiamo col tint
        const b = this.boss;
        b.setTintFill(0xfde047);
        this.time.delayedCall(90, () => b.active && b.clearTint());
        sfx.ui();
    }

    private updateFakeWalls(): void {
        this.terrain.updateReveal(this.player.x, this.player.y);
    }

    private destroyBreakableWall(wall: Phaser.Physics.Arcade.Sprite): void {
        sfx.hit();
        this.cameras.main.shake(80, 0.005);
        this.add.particles(wall.x, wall.y, 'p-spark', {
            speed: { min: 60, max: 200 },
            scale: { start: 0.8, end: 0 },
            tint: 0xcccccc,
            lifespan: 400,
            quantity: 12,
            stopAfter: 12,
        });
        this.nav.open(Math.floor(wall.x / TILE), Math.floor(wall.y / TILE));
        wall.destroy();
    }

    /* ---------- ivan maggini contro guggu ---------- */

    private updateIvan(time: number): void {
        if (this.def.script !== 'bus' || !this.ivanSprite?.active) return;
        const boss = this.boss;
        if (!boss?.active || !boss.engaged || !state.hasFlag('ivan')) return;

        if (boss.hp <= 15 && this.ivanInArena && !this.ivanDead) {
            this.ivanDead = true;
            this.killIvanCutscene();
            return;
        }

        if (!this.ivanInArena) {
            this.ivanInArena = true;
            this.ivanSprite.setPosition(boss.x - 600, boss.y + 30);
            this.ivanSprite.setFlipX(false);
            this.tweens.killTweensOf(this.ivanSprite);
            this.tweens.add({
                targets: this.ivanSprite,
                x: boss.x - 330,
                duration: 1000,
                ease: 'Quad.easeInOut',
            });
            this.nextIvanStrikeAt = time + 2600;
            bus.emit('toast', { text: 'ivan maggini entra nel caos. la furia è carica.' });
            return;
        }
        if (!this.ivanBusy && time >= this.nextIvanStrikeAt) {
            this.ivanStrike(boss);
        }
    }

    private killIvanCutscene(): void {
        const boss = this.boss;
        const ivan = this.ivanSprite;
        if (!boss || !ivan) return;

        this.tweens.killTweensOf(ivan);
        this.tweens.killTweensOf(boss);
        this.ivanBusy = true;
        boss.engaged = false;

        sfx.dash();
        this.tweens.add({
            targets: boss,
            x: ivan.x + Math.sign(boss.x - ivan.x) * 80,
            y: ivan.y - 20,
            duration: 350,
            ease: 'Quad.easeIn',
            onComplete: () => {
                sfx.hit();
                this.shake(200, 0.01);
                ivan.setTint(0xf87171);
                
                this.tweens.add({
                    targets: ivan,
                    x: ivan.x - 250,
                    y: ivan.y + 100,
                    angle: 85,
                    alpha: 0.4,
                    duration: 800,
                    ease: 'Quad.easeOut',
                    onComplete: () => {
                        this.startDialogue('ivan-sacrificio', () => {
                            ivan.destroy();
                            boss.engaged = true;
                        });
                    }
                });
            }
        });
    }

    private ivanStrike(boss: Boss): void {
        const ivan = this.ivanSprite!;
        this.ivanBusy = true;
        const homeX = ivan.x;
        const homeY = ivan.y;
        const dir = Math.sign(boss.x - ivan.x) || 1;
        ivan.setFlipX(dir < 0);
        ivan.setTintFill(0xfacc15);
        this.time.delayedCall(350, () => {
            if (!ivan.active) return;
            ivan.clearTint();
            sfx.dash();
            this.tweens.add({
                targets: ivan,
                x: boss.active ? boss.x + dir * 130 : homeX,
                y: boss.active ? boss.y + 30 : ivan.y,
                duration: 260,
                ease: 'Quad.easeIn',
                onComplete: () => {
                    if (boss.active) {
                        const g = this.add.graphics().setDepth(6);
                        g.lineStyle(5, 0xfacc15, 0.95);
                        g.beginPath();
                        g.moveTo(boss.x - 75, boss.y + 55);
                        g.lineTo(boss.x + 75, boss.y - 55);
                        g.strokePath();
                        this.tweens.add({ targets: g, alpha: 0, scaleX: 1.2, scaleY: 1.2, duration: 280, onComplete: () => g.destroy() });
                        sfx.hit();
                        this.shake(130, 0.006);
                        
                        const dmg = Math.min(4, boss.hp - 15);
                        if (dmg > 0) boss.takeDamage(dmg, ivan.x);
                    }
                    this.time.delayedCall(450, () => {
                        if (!ivan.active) return;
                        ivan.setFlipX(true);
                        this.tweens.add({
                            targets: ivan,
                            x: homeX,
                            y: homeY,
                            duration: 650,
                            ease: 'Quad.easeOut',
                            onComplete: () => {
                                ivan.setFlipX(false);
                                this.ivanBusy = false;
                                this.nextIvanStrikeAt = this.time.now + 4200;
                            },
                        });
                    });
                },
            });
        });
    }

    private trackSafePosition(delta: number): void {
        const body = this.player.body as Phaser.Physics.Arcade.Body;
        if (body.blocked.down && !this.player.dead) {
            this.safeTimer += delta;
            if (this.safeTimer > 250) {
                this.lastSafe = { x: this.player.x, y: this.player.y - 4 };
                this.safeTimer = 0;
            }
        } else {
            this.safeTimer = 0;
        }
    }

    private checkExits(): void {
        if (this.exiting || this.player.dead) return;
        // i capitoli segreti non hanno `next`: l'uscita riporta al varco d'origine
        if (!this.def.next) {
            if (!this.def.secret) return;
            const hit = this.level.exits.some((r) => r.contains(this.player.x, this.player.y));
            if (!hit) return;
            if (this.boss?.active && this.boss.def.guardsExit !== false) return;
            const ret = state.portalReturn;
            const target = ret?.levelId ?? this.def.returnTo;
            if (!target) return;
            const spawnAt = ret && ret.levelId === target ? { x: ret.x, y: ret.y } : undefined;
            state.portalReturn = null;
            this.gotoLevel(target, spawnAt);
            return;
        }
        const hit = this.level.exits.some((r) => r.contains(this.player.x, this.player.y));
        if (!hit) return;
        // i boss non si superano scappando (quelli opzionali sì)
        if (this.boss?.active && this.boss.def.guardsExit !== false) {
            if (this.time.now > this.exitLockToastAt) {
                this.exitLockToastAt = this.time.now + 3000;
                bus.emit('toast', { text: 'qualcosa di grosso blocca ancora la strada.' });
            }
            return;
        }
        if (this.def.script === 'ruhra' && !state.hasAbility('analisi')) {
            if (this.time.now > this.exitLockToastAt) {
                this.exitLockToastAt = this.time.now + 3000;
                bus.emit('toast', { text: 'piema ha ancora bisogno di te. la porta non si apre.' });
            }
            return;
        }
        if (this.def.script === 'indagine' && !state.hasFlag('void-concluso')) {
            if (this.time.now > this.exitLockToastAt) {
                this.exitLockToastAt = this.time.now + 3000;
                bus.emit('toast', { text: 'romero non ha finito. i rimpianti vanno guardati fino in fondo.' });
            }
            return;
        }
        if (this.def.script === 'galliate' && !state.hasFlag('boss-down-maranzone')) {
            if (this.time.now > this.exitLockToastAt) {
                this.exitLockToastAt = this.time.now + 3000;
                bus.emit('toast', { text: 'walter sbadiglia: "aspetta... prima questi maranza. galliate non si attraversa così."' });
            }
            return;
        }
        if (this.def.id === 'trenbolone' && !state.run.trenbolone) {
            if (this.time.now > this.exitLockToastAt) {
                this.exitLockToastAt = this.time.now + 3000;
                bus.emit('toast', { text: 'La via per il rio merdone è sbarrata. Ti serve il trenbolone.' });
            }
            return;
        }
        this.gotoLevel(this.def.next);
    }

    /** rientro da un capitolo segreto verso il varco d'origine (o il returnTo) */
    private returnFromSecret(delay: number): void {
        if (!this.def.secret) return;
        bus.emit('toast', { text: 'capitolo segreto completato. il varco ti riporta indietro...' });
        this.time.delayedCall(delay, () => {
            if (this.exiting || this.player.dead) return;
            const ret = state.portalReturn;
            const target = ret?.levelId ?? this.def.returnTo;
            if (!target) return;
            const spawnAt = ret && ret.levelId === target ? { x: ret.x, y: ret.y } : undefined;
            state.portalReturn = null;
            this.gotoLevel(target, spawnAt);
        });
    }

    private gotoLevel(next: string, spawnAt?: { x: number; y: number }): void {
        this.exiting = true;
        state.save.levelId = next;
        state.save.checkpointId = null;
        state.persist();
        sfx.stopPad();
        this.cameras.main.fadeOut(450, 0, 0, 0);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            this.scene.restart({ levelId: next, checkpointId: null, spawnAt } satisfies SceneData);
        });
    }

    private updatePrompt(): void {
        const near = this.findNearestInteractable();
        if (near) {
            this.prompt.setVisible(true);
            this.prompt.setPosition(near.x, near.y - 48 + Math.sin(this.time.now / 300) * 3);
        } else {
            this.prompt.setVisible(false);
        }
    }

    private updateBossTrigger(): void {
        if (!this.boss || this.boss.engaged || this.player.dead || this.exiting) return;
        const dist = Math.abs(this.player.x - this.boss.x);
        // nelle regioni il boss può stare sopra o sotto di te, dietro la roccia
        if (dist >= 440 || Math.abs(this.player.y - this.boss.y) >= 380) return;
        // la formicona sta nella tana: non si sveglia se cammini sul soffitto
        if (this.boss.def.kind === 'formicona' && this.player.y < this.boss.y - 60) return;

        if (this.def.script === 'pedro' && !this.pedroChoiceShown) {
            this.pedroChoiceShown = true;
            // se hai camminato nei suoi ricordi, pedro lo sa. e gli pesa.
            const incontro = state.hasFlag('ricordi-visti') ? 'pedro-incontro-ricordi' : 'pedro-incontro';
            this.startDialogue(incontro, () => {
                bus.emit('choice-show', {
                    title: 'pedro aspetta una risposta.',
                    options: [{ label: 'seguilo: stats raddoppiate', danger: true }, { label: 'contrastalo' }],
                    onPick: (i) => {
                        if (i === 0) {
                            this.startPatto();
                        } else {
                            this.boss?.engage();
                        }
                    },
                });
            });
            return;
        }

        let introId = BOSS_INTRO[this.boss.def.kind];
        // choose flauto dialogue depending on drug state
        if (this.boss.def.kind === 'flauto') {
            introId = state.run.trenbolone ? 'flauto-fatto-rabbia' : 'flauto-sveglio-rabbia';
        }
        if (this.boss.def.kind === 'ombra' && !state.hasFlag('tommasorveglianza')) introId = 'ombra-intro-scarsa';
        if (this.boss.def.kind === 'ticummi' && state.hasFlag('tommasorveglianza')) introId = 'ticummi-intro-cliente';
        if (introId && !this.bossIntroShown) {
            this.bossIntroShown = true;
            const boss = this.boss;
            if (!state.save.seenDialogues.includes(introId)) {
                state.save.seenDialogues.push(introId);
                state.persist();
                this.startDialogue(introId, () => boss?.engage());
            } else {
                boss.engage();
            }
            if (boss.def.kind === 'guggu' && boss.invulnerable) {
                this.time.delayedCall(600, () => {
                    if (boss.active && boss.invulnerable) bus.emit('toast', { text: TOASTS.gugguDoor });
                });
            }
        } else if (!introId) {
            this.boss.engage();
        }
    }

    /** le note volano verso il geco quando è vicino */
    private magnetBarre(): void {
        this.barreGroup.getChildren().forEach((obj) => {
            const note = obj as Phaser.Physics.Arcade.Sprite;
            const dx = this.player.x - note.x;
            const dy = this.player.y - note.y;
            if (Math.hypot(dx, dy) < 130 * state.mods.magnet) {
                const body = note.body as Phaser.Physics.Arcade.Body;
                body.setAllowGravity(false);
                body.setVelocity(dx * 6, dy * 6);
            }
        });
    }

    private findNearestInteractable(): Interactable | null {
        let best: Interactable | null = null;
        let bestDist = Infinity;
        for (const it of this.interactables) {
            const d = Math.hypot(this.player.x - it.x, this.player.y - it.y);
            if (d < it.range && d < bestDist) {
                best = it;
                bestDist = d;
            }
        }
        return best;
    }

    private tryInteract(): void {
        if (this.player.dead || this.exiting) return;
        this.findNearestInteractable()?.onInteract();
    }

    /* ---------- abilità attive ---------- */

    private onRisonante({ x, y, dir }: { x: number; y: number; dir: number }): void {
        const proj = this.playerProjectiles.create(x, y, 'proj-risonante') as Phaser.Physics.Arcade.Sprite;
        proj.setDepth(5);
        proj.setFlipX(dir < 0);
        proj.setVelocityX(dir * COMBAT.risonanteSpeed);
        this.lighting.follow(proj, 0x4ade80, 130, 0.8);
        this.add.particles(0, 0, 'p-spark', {
            follow: proj,
            speed: 30,
            scale: { start: 0.5, end: 0 },
            tint: 0x4ade80,
            lifespan: 200,
            frequency: 30,
        }).setDepth(4);
        this.time.delayedCall(1600, () => proj.active && this.popProjectile(proj));
    }

    private onRiflesso({ x, y, facing }: { x: number; y: number; facing: number }): void {
        this.killClone();
        const clone = new Companion(this, x, y, facing < 0 ? -1 : 1);
        this.clone = clone;
        this.cloneUntil = this.time.now + COMBAT.riflessoDurationMs;
        this.lighting.follow(clone, 0x22d3ee, 180, 0.9);

        // stessa fisica del player: terreno, muri, porte
        this.cloneColliders.push(
            this.physics.add.collider(clone, this.level.layer),
            this.physics.add.collider(clone, this.level.breakableWalls),
            this.physics.add.collider(clone, this.doorGroup),
            // il riflesso assorbe i colpi nemici (resta un'esca)
            this.physics.add.overlap(this.enemyProjectiles, clone, (a, b) => {
                this.popProjectile((a === clone ? b : a) as Phaser.Physics.Arcade.Sprite);
            }),
            // riusa il sistema d'attacco del player: la hitbox colpisce i nemici
            this.physics.add.overlap(clone.attackHitbox, this.enemies, (_hb, obj) => {
                if (!clone.attackActive) return;
                const enemy = obj as Enemy;
                clone.consumeSwing();
                this.cloneHitFx(enemy);
                enemy.takeDamage(clone.attackDamage, clone.x);
            }),
        );
        if (this.boss) {
            this.cloneColliders.push(
                this.physics.add.overlap(clone.attackHitbox, this.boss, (_hb, obj) => {
                    if (!clone.attackActive || !this.boss) return;
                    clone.consumeSwing();
                    this.cloneHitFx(obj as Phaser.GameObjects.Sprite);
                    this.boss.takeDamage(clone.attackDamage, clone.x);
                }),
            );
        }
    }

    private killClone(): void {
        this.cloneColliders.forEach((c) => c.destroy());
        this.cloneColliders = [];
        this.clone?.kill();
        this.clone = null;
    }

    private cloneHitFx(target: Phaser.GameObjects.Sprite): void {
        this.add.particles(target.x, target.y, 'p-spark', {
            speed: { min: 60, max: 140 },
            scale: { start: 0.5, end: 0 },
            tint: 0x22d3ee,
            lifespan: 200,
            quantity: 5,
            stopAfter: 5,
        }).setDepth(6);
    }

    private nearestHostile(x: number, y: number): (Phaser.GameObjects.Sprite & { active: boolean }) | null {
        let best: (Phaser.GameObjects.Sprite & { active: boolean }) | null = null;
        let bestDist = Infinity;
        const candidates = [...this.enemies.getChildren(), ...(this.boss ? [this.boss] : [])];
        for (const c of candidates) {
            const e = c as Phaser.GameObjects.Sprite & { active: boolean };
            if (!e.active) continue;
            const d = Math.hypot(x - e.x, y - e.y);
            if (d < bestDist) {
                best = e;
                bestDist = d;
            }
        }
        return best;
    }

    private updateClone(time: number, delta: number): void {
        const clone = this.clone;
        if (!clone || !clone.active) return;
        if (time >= this.cloneUntil) {
            this.killClone();
            return;
        }
        clone.update(time, delta, this.nearestHostile(clone.x, clone.y));
    }

    private onAnalisi(): void {
        this.analisiUntil = this.time.now + COMBAT.analisiDurationMs;
        this.nextAnalisiTick = 0;
        this.analisiGlyphs.forEach((g) => g.destroy());
        this.analisiGlyphs = [0, 1, 2].map((i) => this.add.image(this.player.x, this.player.y, `glyph-${i}`).setDepth(6));
        this.cameras.main.flash(90, 96, 165, 250);
    }

    private updateAnalisi(time: number): void {
        if (this.analisiGlyphs.length === 0) return;
        if (time >= this.analisiUntil) {
            this.analisiGlyphs.forEach((g) => g.destroy());
            this.analisiGlyphs = [];
            return;
        }
        this.analisiGlyphs.forEach((g, i) => {
            const angle = time / 250 + (i * Math.PI * 2) / 3;
            g.setPosition(
                this.player.x + Math.cos(angle) * COMBAT.analisiRadius * 0.7,
                this.player.y + Math.sin(angle) * COMBAT.analisiRadius * 0.7
            );
            g.setRotation(angle + Math.PI / 2);
        });
        if (time >= this.nextAnalisiTick) {
            this.nextAnalisiTick = time + COMBAT.analisiTickMs;
            const hits: (Enemy | Boss)[] = [];
            this.enemies.getChildren().forEach((obj) => {
                const e = obj as Enemy;
                if (e.active && Math.hypot(e.x - this.player.x, e.y - this.player.y) < COMBAT.analisiRadius) hits.push(e);
            });
            if (this.boss?.active && Math.hypot(this.boss.x - this.player.x, this.boss.y - this.player.y) < COMBAT.analisiRadius + 40) {
                hits.push(this.boss);
            }
            for (const h of hits) {
                h.takeDamage(1 * state.damageMult, this.player.x);
                this.player.onAttackHit();
            }
        }
    }

    /* ---------- tommasoscudo ---------- */

    private onScudo(): void {
        this.scudoUntil = this.time.now + COMBAT.scudoDurationMs;
        this.scudoGfx?.destroy();
        this.scudoGfx = this.add.graphics().setDepth(6);
        this.cameras.main.flash(70, 34, 211, 238);
        bus.emit('toast', { text: TOASTS.scudo });
    }

    private updateScudo(time: number): void {
        if (!this.scudoGfx) return;
        if (time >= this.scudoUntil) {
            this.scudoGfx.destroy();
            this.scudoGfx = null;
            return;
        }
        const left = (this.scudoUntil - time) / COMBAT.scudoDurationMs;
        const r = 52 + Math.sin(time / 90) * 4;
        this.scudoGfx.clear();
        this.scudoGfx.lineStyle(2, 0x22d3ee, 0.4 + left * 0.5);
        this.scudoGfx.strokeCircle(this.player.x, this.player.y, r);
        this.scudoGfx.fillStyle(0x22d3ee, 0.07);
        this.scudoGfx.fillCircle(this.player.x, this.player.y, r);
    }

    /** acqua tossica: versa una pozza che rallenta e avvelena chi ci passa */
    private onAcquaTossica({ x, y }: { x: number; y: number }): void {
        const gfx = this.add.graphics().setDepth(3);
        this.acquaPuddles.push({ gfx, x, y: y + 16, until: this.time.now + COMBAT.acquaDurationMs, nextTick: 0 });
        sfx.slash();
        this.cameras.main.flash(60, 34, 211, 238);
    }

    private updateAcquaTossica(time: number): void {
        const r = COMBAT.acquaRadius;
        for (let i = this.acquaPuddles.length - 1; i >= 0; i--) {
            const p = this.acquaPuddles[i];
            if (time >= p.until) {
                p.gfx.destroy();
                this.acquaPuddles.splice(i, 1);
                continue;
            }
            const left = (p.until - time) / COMBAT.acquaDurationMs;
            const rr = r + Math.sin(time / 140) * 4;
            p.gfx.clear();
            p.gfx.fillStyle(0x22d3ee, 0.10 + left * 0.10);
            p.gfx.fillEllipse(p.x, p.y, rr * 2, rr * 0.7);
            p.gfx.lineStyle(2, 0x22d3ee, 0.25 + left * 0.3);
            p.gfx.strokeEllipse(p.x, p.y, rr * 2, rr * 0.7);

            const tick = time >= p.nextTick;
            if (tick) p.nextTick = time + COMBAT.acquaTickMs;
            this.enemies.getChildren().forEach((obj) => {
                const e = obj as Enemy;
                if (!e.active) return;
                const dx = Math.abs(e.x - p.x);
                const dy = Math.abs(e.y - p.y);
                if (dx > r || dy > r * 0.7) return;
                // rallentamento: smorza la velocità orizzontale finché è nella pozza
                const body = e.body as Phaser.Physics.Arcade.Body;
                body.velocity.x *= 0.45;
                if (tick) {
                    e.takeDamage(COMBAT.acquaDamage, e.x);
                    this.add.particles(e.x, e.y, 'p-dot', {
                        speed: { min: 10, max: 30 }, angle: { min: 240, max: 300 },
                        scale: { start: 0.4, end: 0 }, tint: 0x22d3ee, lifespan: 400, quantity: 3, stopAfter: 3,
                    });
                }
            });
        }
    }

    /** il proiettile torna indietro, tinto di ciano e dei nostri */
    private reflectProjectile(proj: Phaser.Physics.Arcade.Sprite): void {
        if (!proj.active) return;
        const body = proj.body as Phaser.Physics.Arcade.Body;
        const vx = body.velocity.x;
        const vy = body.velocity.y;
        this.popProjectile(proj);
        sfx.slash();
        const back = this.playerProjectiles.create(this.player.x, this.player.y - 6, 'proj-ball') as Phaser.Physics.Arcade.Sprite;
        back.setDepth(5);
        back.setTint(0x22d3ee);
        // scudo nerfato: il rimando fa solo il 40% del danno nemico (1 -> 0.4)
        back.setData('dmg', 0.4);
        const speed = Math.max(360, Math.hypot(vx, vy));
        const angle = Math.atan2(-vy, -vx);
        back.setVelocity(Math.cos(angle) * speed * 1.15, Math.sin(angle) * speed * 1.15);
        this.time.delayedCall(2600, () => back.active && this.popProjectile(back));
    }

    /* ---------- inseguimenti nella tana ---------- */

    /** dialoghi per zona di caccia: la prima volta e la ricaduta */
    private static readonly CHASE_LINES = [
        { start: 'lochef-benvenuto', end: 'lochef-perso' },
        { start: 'lochef-ritorno', end: 'lochef-perso-2' },
    ];

    private updateChase(delta: number): void {
        if (this.def.script !== 'tana' || this.chaseStarts.length === 0 || this.player.dead || this.exiting) return;

        if (!this.chaseSprite) {
            // c'è una zona di caccia non ancora completata sotto i piedi?
            const here = this.progressAt(this.player.x, this.player.y);
            const idx = this.chaseStarts.findIndex((sx, i) => {
                const ex = this.chaseEnds[i] ?? Infinity;
                return !this.chaseDone[i] && here >= sx && here < ex;
            });
            if (idx < 0) return;
            this.chaseZoneIdx = idx;
            const lines = GameScene.CHASE_LINES[Math.min(idx, GameScene.CHASE_LINES.length - 1)];
            const spawn = () => {
                const chef = this.add.sprite(this.player.x - 420, this.player.y - 60, 'boss-lochef')
                    .setDepth(5)
                    .setPipeline('Light2D');
                this.chaseSprite = chef;
                this.lighting.follow(chef, 0xf87171, 260, 1.0);
                music.playCustom("assets/music/lochef85's OST 2.mp3");
                bus.emit('toast', { text: TOASTS.inseguimento });
            };
            if (!state.save.seenDialogues.includes(lines.start)) {
                state.save.seenDialogues.push(lines.start);
                state.persist();
                this.startDialogue(lines.start, spawn);
            } else {
                spawn();
            }
            return;
        }

        const chef = this.chaseSprite;
        if (!chef?.active) return;

        // fine corsa: lochef ti perde di vista. per ora.
        const endP = this.chaseEnds[this.chaseZoneIdx] ?? Infinity;
        if (this.progressAt(this.player.x, this.player.y) >= endP) {
            this.chaseDone[this.chaseZoneIdx] = true;
            this.chaseSprite = null;
            this.tweens.add({
                targets: chef,
                x: chef.x - 500,
                alpha: 0,
                duration: 900,
                ease: 'Quad.easeIn',
                onComplete: () => chef.destroy(),
            });
            music.playLevel(this.def.id);
            bus.emit('toast', { text: TOASTS.inseguimentoFine });
            const lines = GameScene.CHASE_LINES[Math.min(this.chaseZoneIdx, GameScene.CHASE_LINES.length - 1)];
            if (!state.save.seenDialogues.includes(lines.end)) {
                state.save.seenDialogues.push(lines.end);
                state.persist();
                this.startDialogue(lines.end);
            }
            return;
        }

        // fluttua verso di te, attraversa i muri: è casa sua
        const speed = 235;
        const dx = this.player.x - chef.x;
        const dy = this.player.y - 30 - chef.y;
        const dist = Math.hypot(dx, dy) || 1;
        chef.x += (dx / dist) * speed * (delta / 1000);
        chef.y += (dy / dist) * speed * (delta / 1000);
        chef.setFlipX(dx < 0);
        // ondeggia: inquietante ma con stile
        chef.y += Math.sin(this.time.now / 200) * 0.6;

        if (dist < 55) {
            if (this.player.hurt(1, chef.x)) {
                // il colpo lo rallenta: ti vuole vivo
                chef.x -= Math.sign(dx) * 160;
            }
        }
    }

    /* ---------- arena di lametta ---------- */

    private updateLamettaArena(time: number): void {
        if (!this.lamettaCenter || this.exiting) return;
        const c = this.lamettaCenter;

        if (!this.lamettaActive) {
            if (Math.abs(this.player.x - c.x) < 380 && Math.abs(this.player.y - c.y) < 380 && !this.player.dead) {
                this.lamettaActive = true;
                // pavimento catturato col player a terra: le gocce successive nascono in aria
                this.lamettaFloorY = this.player.y;
                music.playBoss('lametta-arena');
                this.startDialogue('lametta-incontro', () => {
                    this.nextLametteAt = this.time.now + 1500;
                    this.nextPitturaAt = this.time.now + 4000;
                    this.spawnColorDrop();
                });
            }
            return;
        }
        if (this.mirror) return;

        if (time >= this.nextLametteAt) {
            this.nextLametteAt = time + 2600;
            const xs = [this.player.x - 70 + Math.random() * 40, this.player.x + 40 + Math.random() * 40];
            this.onBossLamette({ xs, y: this.player.y });
        }
        if (time >= this.nextPitturaAt && this.awakeEnemies() < 5) {
            this.nextPitturaAt = time + 6500;
            const at = this.openSpotNear(c.x + (Math.random() - 0.5) * 400, c.y - 60, 8);
            this.spawnEnemy('pittura-mini', at.x, at.y, { hunting: true });
        }
    }

    /** smela si rivela boss finale quando arrivi in fondo (danjilo già fatto fuori) */
    private updateSmelaArena(): void {
        if (!this.smelaArena || this.boss || this.exiting || this.player.dead) return;
        if (state.hasFlag('boss-down-smela')) { this.smelaArena = null; return; }
        // smela si rivela solo dopo che hai sistemato danjilo a metà livello
        if (!state.hasFlag('boss-down-danjilo')) return;
        if (Math.abs(this.player.x - this.smelaArena.x) > 360 || Math.abs(this.player.y - this.smelaArena.y) > 380) return;
        const a = this.smelaArena;
        this.smelaArena = null;
        this.boss = new Boss(this, a.x, a.y, 'smela');
        this.bossIntroShown = false;
        this.lighting.follow(this.boss, this.boss.def.glowColor, 280, 1.0);
        this.setupBossColliders();
    }

    private spawnColorDrop(): void {
        if (!this.lamettaCenter) return;
        const c = this.lamettaCenter;
        const colors = [0xf87171, 0x4ade80, 0x60a5fa, 0xfacc15, 0xc084fc];
        const color = colors[this.colorDropsTaken % colors.length];
        const x = c.x + (Math.random() - 0.5) * 620;
        // tetto a ~90px (sotto la soglia col double jump), ma fascia ampia: da quasi-terra in su
        const y = this.lamettaFloorY - 8 - Math.random() * 82;
        const drop = this.physics.add.sprite(x, y, 'color-drop').setTint(color).setDepth(5);
        (drop.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
        this.lighting.follow(drop, color, 140, 0.9);
        this.tweens.add({ targets: drop, y: y - 10, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        this.physics.add.overlap(this.player, drop, () => {
            drop.destroy();
            this.colorDropsTaken++;
            sfx.pickup();
            if (this.colorDropsTaken >= 5) {
                bus.emit('toast', { text: TOASTS.mirrorOpen });
                this.spawnMirror();
            } else {
                bus.emit('toast', { text: `${TOASTS.colorDrop} (${this.colorDropsTaken}/5)` });
                this.spawnColorDrop();
            }
        });
    }

    private spawnMirror(): void {
        if (!this.lamettaCenter) return;
        const c = this.lamettaCenter;
        const mirror = this.add.sprite(c.x + 180, c.y + 12, 'black-mirror').setDepth(5).setAlpha(0);
        this.mirror = mirror;
        this.lighting.static(mirror.x, mirror.y, 0xc084fc, 220, 1.0);
        this.tweens.add({ targets: mirror, alpha: 1, duration: 800 });
        const zone = this.add.zone(mirror.x, mirror.y, 50, 80);
        this.physics.add.existing(zone);
        (zone.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
        this.physics.add.overlap(this.player, zone, () => {
            if (this.exiting || !this.def.next) return;
            this.exiting = true;
            this.startDialogue('lametta-uscita', () => {
                this.exiting = false;
                this.gotoLevel(this.def.next!);
            });
        });
    }

    /* ---------- rio merdone ---------- */

    private updateWaterCure(): void {
        if (this.def.script !== 'trenbolone' || this.level.water.length === 0) return;
        if (!state.run.trenbolone && !state.run.smela) return;
        const inWater = this.level.water.some((r) => r.contains(this.player.x, this.player.y + 20));
        if (!inWater) return;
        state.run.trenbolone = false;
        state.run.smela = false;
        state.removeFlag('trenbolone-attivo');
        sfx.heal();
        this.cameras.main.flash(200, 74, 222, 128);
        // refresh hud when player gets cured in the river
        bus.emit('hp-changed', { hp: state.run.hp, maxHp: state.maxHp, hurt: false });
        if (!state.hasFlag('rio-curato')) {
            state.setFlag('rio-curato');
            this.startDialogue('rio-cura', () => {
                this.spawnFragment(this.player.x, this.player.y - 50, 'rigenerazione');
            });
        } else {
            bus.emit('toast', { text: 'il fiume ti ripulisce. di nuovo. senza giudicare. quasi.' });
        }
    }

    private playSmelaPoisonEffect(): void {
        this.player.stun(999999);
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 1);
        overlay.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);
        overlay.setScrollFactor(0);
        overlay.setDepth(999);
        overlay.setAlpha(0);

        this.tweens.add({
            targets: overlay,
            alpha: { from: 0, to: 0.9 },
            duration: 5000,
            ease: 'Quad.easeIn',
        });

        const zoomTween = this.tweens.add({
            targets: this.cameras.main,
            zoom: 1.25,
            duration: 1200,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
        });

        const rotationTween = this.tweens.add({
            targets: this.cameras.main,
            rotation: 0.08,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
        });

        let shakeIntensity = 0.002;
        const shakeTimer = this.time.addEvent({
            delay: 150,
            callback: () => {
                shakeIntensity += 0.0012;
                this.shake(120, shakeIntensity);
            },
            repeat: 30,
        });

        this.time.delayedCall(5000, () => {
            zoomTween.remove();
            rotationTween.remove();
            shakeTimer.destroy();
            overlay.destroy();

            this.cameras.main.setZoom(1);
            this.cameras.main.setRotation(0);

            this.player.stun(0);
            this.onPlayerDead();
        });
    }

    private updateAmbush(): void {
        const list = AMBUSHES[this.def.id];
        if (!list || this.player.dead || this.exiting) return;
        for (let i = 0; i < list.length; i++) {
            const a = list[i];
            const flag = `agguato-${this.def.id}-${i}`;
            if (state.hasFlag(flag) || this.progressAt(this.player.x, this.player.y) < this.progressOfOldX(a.x)) continue;
            state.setFlag(flag);
            if (a.type === 'gag') {
                this.startDialogue(a.intro);
                return;
            }

            const count = a.count ?? 1;
            const spawned = this.spawnNotinoAmbush(count);

            this.player.stun(999999);
            spawned.forEach((e) => e.stun(999999));

            this.time.delayedCall(2000, () => {
                const dialogueId = state.hasFlag('tommasorveglianza')
                    ? TOMMASO_BLOCCA[i % TOMMASO_BLOCCA.length]
                    : a.intro;

                this.startDialogue(dialogueId, () => {
                    if (state.hasFlag('tommasorveglianza')) {
                        spawned.forEach((e, idx) => {
                            (e.body as Phaser.Physics.Arcade.Body).enable = false;
                            e.setFlipX(false);
                            this.tweens.add({
                                targets: e,
                                x: e.x - 800,
                                y: e.y - 40,
                                duration: 1500,
                                ease: 'Sine.easeInOut',
                                onComplete: () => {
                                    e.destroy();
                                    if (idx === spawned.length - 1) {
                                        this.player.stun(0);
                                    }
                                },
                            });
                        });
                    } else {
                        this.player.stun(0);
                        spawned.forEach((e) => e.stun(0));
                    }
                });
            });
            return;
        }
    }

    /** notino senza wave: piomba dall'alto, saltella, spara, e poi "non perde" */
    private spawnNotinoAmbush(count: number): Enemy[] {
        this.cameras.main.flash(120, 168, 85, 247);
        this.shake(180, 0.006);
        sfx.bossRoar();
        const spawned: Enemy[] = [];
        for (let i = 0; i < count; i++) {
            const dir = i % 2 === 0 ? 1 : -1;
            const at = this.openSpotNear(this.player.x + dir * (300 + i * 60), this.player.y - 140);
            const e = this.spawnEnemy('notino-mini', at.x, at.y, { hunting: true });
            this.physics.add.collider(e, this.level.layer);
            spawned.push(e);
        }
        return spawned;
    }

    /* ---------- il patto con pedro ---------- */

    private startPatto(): void {
        const pedro = this.boss;
        this.boss = null;
        state.run.patto = true;
        state.run.hp = state.maxHp;
        state.run.flow = state.maxFlow;
        bus.emit('hp-changed', { hp: state.run.hp, maxHp: state.maxHp, hurt: false });
        bus.emit('flow-changed', { flow: state.run.flow, maxFlow: state.maxFlow });
        if (pedro) {
            // pedro ha quello che voleva: si dissolve in glitch
            this.add.particles(pedro.x, pedro.y, 'p-spark', {
                speed: { min: 100, max: 300 },
                scale: { start: 1.2, end: 0 },
                tint: 0x22d3ee,
                lifespan: 500,
                quantity: 24,
                stopAfter: 24,
            });
            this.tweens.add({ targets: pedro, alpha: 0, duration: 600, onComplete: () => pedro.destroy() });
        }
        this.startDialogue('pedro-patto', () => {
            bus.emit('toast', { text: TOASTS.patto });
            this.pattoActive = true;
            this.pattoDeiAt = this.time.now + 20000;
            this.pattoNextSpawnAt = this.time.now + 2500;
            this.pattoWarned = 0;
        });
    }

    private updatePatto(time: number): void {
        if (!this.pattoActive || this.player.dead || this.boss) return;
        // ondate di glitch per assaporare il potere rubato
        if (time >= this.pattoNextSpawnAt && this.awakeEnemies() < 7) {
            this.pattoNextSpawnAt = time + 3500;
            const dir = Math.random() > 0.5 ? 1 : -1;
            const at = this.openSpotNear(this.player.x + dir * 420, this.player.y - 60, 10);
            const e = this.spawnEnemy('glitchetto', at.x, at.y, { hunting: true });
            this.physics.add.collider(e, this.level.layer);
        }
        const left = this.pattoDeiAt - time;
        if (left <= 12000 && this.pattoWarned < 1) {
            this.pattoWarned = 1;
            bus.emit('toast', { text: TOASTS.pattoAvviso1 });
        }
        if (left <= 6000 && this.pattoWarned < 2) {
            this.pattoWarned = 2;
            this.cameras.main.flash(150, 255, 255, 255);
            this.shake(400, 0.005);
            bus.emit('toast', { text: TOASTS.pattoAvviso2 });
        }
        if (left <= 0) this.arrivoDei();
    }

    /** piema e lametta, insieme, immortali, senza pause: non si vince */
    private arrivoDei(): void {
        this.startDialogue('dei-patto', () => {
            const x = this.player.x + 280;
            const y = Math.max(120, this.player.y - 160);
            this.boss = new Boss(this, x, y, 'dei');
            this.boss.invulnerable = true;
            this.boss.frenzy = true;
            this.lighting.follow(this.boss, 0xffffff, 340, 1.2);
            this.setupBossColliders();
            this.boss.engage();
            this.cameras.main.flash(220, 255, 255, 255);
            this.shake(700, 0.012);
        });
    }

    /* ---------- reazioni ---------- */

    private onSpikes(): void {
        if (!this.player.hurt(1, undefined)) return;
        // rientro morbido sull'ultima posizione sicura
        this.cameras.main.flash(150, 248, 113, 113);
        this.time.delayedCall(120, () => {
            if (this.player.dead) return;
            this.player.setPosition(this.lastSafe.x, this.lastSafe.y);
            (this.player.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
        });
    }

    private onEnemyShoot({ x, y, tx, ty, color }: { x: number; y: number; tx: number; ty: number; color?: number }): void {
        const proj = this.enemyProjectiles.create(x, y, 'proj-ball') as Phaser.Physics.Arcade.Sprite;
        proj.setDepth(5);
        proj.setTint(color ?? 0xf87171);
        const angle = Math.atan2(ty - y, tx - x);
        proj.setVelocity(Math.cos(angle) * 330, Math.sin(angle) * 330);
        this.time.delayedCall(3200, () => proj.active && this.popProjectile(proj));
    }

    private onBossLamette({ xs, y }: { xs: number[]; y: number }): void {
        for (const x of xs) {
            // telegrafo a terra prima della lama
            this.add.particles(x, y + 40, 'p-dot', {
                speed: { min: 10, max: 50 },
                angle: { min: 250, max: 290 },
                scale: { start: 0.5, end: 0 },
                tint: 0xc084fc,
                lifespan: 350,
                quantity: 8,
                stopAfter: 8,
            });
            this.time.delayedCall(480, () => {
                if (!this.scene.isActive()) return;
                const blade = this.lametteGroup.create(x, y + 90, 'proj-lametta') as Phaser.Physics.Arcade.Sprite;
                blade.setDepth(5);
                blade.setVelocityY(-430);
                sfx.slash();
                this.time.delayedCall(420, () => {
                    if (!blade.active) return;
                    this.tweens.add({ targets: blade, alpha: 0, duration: 200, onComplete: () => blade.destroy() });
                });
            });
        }
    }

    private popProjectile(proj: Phaser.Physics.Arcade.Sprite): void {
        if (!proj.active) return;
        this.add.particles(proj.x, proj.y, 'p-dot', {
            speed: { min: 30, max: 90 },
            scale: { start: 0.4, end: 0 },
            lifespan: 200,
            quantity: 4,
            stopAfter: 4,
        });
        proj.destroy();
    }

    private onEnemyDied({ x, y, kind, barre, splitsInto }: { x: number; y: number; kind: EnemyKind; barre: number; color: number; splitsInto: { kind: EnemyKind; count: number } | null }): void {
        this.shake(80, 0.004);
        // notino non muore: "si ritira strategicamente"
        if (kind === 'notino-mini') {
            const line = NOTINO_FUGHE[Math.floor(Math.random() * NOTINO_FUGHE.length)];
            bus.emit('toast', { text: line });
        }
        if (splitsInto) {
            for (let i = 0; i < splitsInto.count; i++) {
                const mini = this.spawnEnemy(splitsInto.kind, x + (i ? 20 : -20), y - 10, { hunting: true });
                this.physics.add.collider(mini, this.level.layer);
            }
        }
        state.save.record.kills++;
        const total = Math.round(barre * state.mods.barre);
        const pieces = Math.max(1, Math.round(total / 5));
        for (let i = 0; i < pieces; i++) {
            const note = this.barreGroup.create(x, y, 'barra') as Phaser.Physics.Arcade.Sprite;
            note.setData('value', Math.round(total / pieces));
            note.setDepth(4);
            note.setVelocity((Math.random() - 0.5) * 220, -150 - Math.random() * 130);
            note.setBounce(0.5);
        }
    }

    /** chi ti vede chiama i compagni vicini: si radunano */
    private onEnemyAlert({ x, y, from }: { x: number; y: number; from: Enemy }): void {
        for (const child of this.enemies.getChildren()) {
            const e = child as Enemy;
            if (e === from || !e.active || e.dormant) continue;
            if (Math.abs(e.x - x) < 340 && Math.abs(e.y - y) < 220) e.alertFrom(x, y);
        }
    }

    private onBossSummon({ x, y, kind }: { x: number; y: number; kind: EnemyKind }): void {
        const at = this.openSpotNear(x, y, 6);
        const e = this.spawnEnemy(kind, at.x, at.y, { hunting: true });
        this.physics.add.collider(e, this.level.layer);
    }

    private onBossDefeated({ kind, x, y }: { kind: BossKind; x: number; y: number }): void {
        this.boss = null;
        // pedro del doomsday: respinto, non è il pedro della trama. niente finale.
        if (kind === 'pedro' && this.collapsePedro) {
            this.collapsePedro = false;
            this.collapseTriggered = false;
            this.doomsdayWarned = 1;
            state.setDoomsday(0.55);
            const replaced = this.replacedBossKind;
            const rx = this.replacedBossX;
            const ry = this.replacedBossY;
            this.replacedBossKind = null;
            this.bossIntroShown = false;
            this.startDialogue('doomsday-respinto', () => {
                if (replaced) {
                    const hpOverride = replaced === 'ombra' && !state.hasFlag('tommasorveglianza') ? 34 : undefined;
                    this.boss = new Boss(this, rx, ry, replaced, hpOverride);
                    if (replaced === 'guggu' && state.hasFlag('ivan')) this.boss.invulnerable = false;
                    if (replaced === 'limite' && this.indiziRaccolti() >= 3) this.boss.invulnerable = false;
                    if (replaced === 'ticummi' && state.hasFlag('tommasorveglianza')) this.boss.summonOverride = 'eco';
                    this.lighting.follow(this.boss, this.boss.def.glowColor, 280, 1.0);
                    this.setupBossColliders();
                }
            });
            return;
        }
        if (kind !== 'pedro' && kind !== 'dei') {
            state.setFlag(`boss-down-${kind}`);
            state.save.record.bosses++;
            this.dropBossCharm(kind, x, y);
        }
        const waveBosses: BossKind[] = ['guggu', 'breccio', 'notino', 'smela', 'teorema', 'ombra'];
        if (waveBosses.includes(kind) && state.save.doomsdayMode) {
            state.relieveDoomsday();
            bus.emit('toast', { text: '✦ frammento di wave recuperato! doomsday allontanato ✦' });
        }
        switch (kind) {
            case 'guggu':
                this.spawnFragment(x, y + 60, 'rimbalzo');
                break;
            case 'breccio':
                this.startDialogue('breccio-morte', () => {
                    this.spawnFragment(x, y + 40, 'riflesso');
                });
                break;
            case 'notino':
                this.startDialogue('notino-sconfitto', () => {
                    this.spawnFragment(x, y + 40, 'risonante');
                });
                break;
            case 'riba':
                this.startDialogue('riba-sconfitta', () => {
                    state.setFlag('dispositivo');
                    bus.emit('toast', { text: TOASTS.dispositivo });
                });
                break;
            case 'lochef':
                this.startDialogue('lochef-sconfitto', () => {
                    this.spawnCuore(x, y + 40, 'cuore-lochef');
                });
                break;
            case 'formicona':
                this.startDialogue('formicona-sconfitta', () => {
                    this.spawnCuore(x, y + 40, 'cuore-formicona');
                });
                break;
            case 'furgone':
                this.startDialogue('furgone-sconfitto', () => {
                    state.setFlag('stabilimento-chiuso');
                    this.time.delayedCall(1500, () => bus.emit('wavesung', WAVESUNG.smelaRecensione));
                });
                break;
            case 'danjilo':
                this.startDialogue('danjilo-sconfitto');
                break;
            case 'smela':
                this.startDialogue('smela-sconfitta', () => {
                    state.setFlag('stabilimento-chiuso');
                    this.spawnFragment(x, y + 40, 'acquatossica');
                    this.time.delayedCall(1500, () => bus.emit('wavesung', WAVESUNG.smelaRecensione));
                });
                break;
            case 'limite':
                this.startDialogue('romero-verdetto', () => {
                    state.setFlag('caso-risolto');
                    this.spawnCuore(x, y + 40, 'cuore-limite');
                });
                break;
            case 'teorema':
                this.startDialogue('mente-ordine', () => {
                    this.spawnFragment(x, y + 40, 'analisi');
                });
                break;
            case 'pedrino':
                this.startDialogue('pedrino-fine', () => {
                    state.setFlag('ricordi-visti');
                });
                break;
            case 'ombra':
                this.startDialogue('ombra-sconfitta', () => {
                    this.spawnFragment(x, y + 40, 'scudo');
                });
                break;
            case 'ticummi':
                this.startDialogue('ticummi-caduto', () => {
                    bus.emit('choice-show', {
                        title: 'la boccetta di trenbolone è lì. ticummi pure.',
                        options: [{ label: 'ridagli la boccetta' }, { label: 'calpestala davanti a lui', danger: true }],
                        onPick: (i) => {
                            if (i === 0) {
                                state.setFlag('ticummi-graziato');
                                this.startDialogue('ticummi-pieta');
                            } else {
                                state.setFlag('trenbolone-distrutto');
                                this.startDialogue('ticummi-niente');
                            }
                        },
                    });
                });
                break;
            case 'settequaranta':
                this.startDialogue('settequaranta-morte', () => {
                    this.spawnCuore(x, y + 40, 'cuore-barrato');
                    this.returnFromSecret(4500);
                });
                break;
            case 'custode':
                this.startDialogue('custode-morte', () => {
                    this.spawnCuore(x, y + 40, 'cuore-custode');
                    this.returnFromSecret(4500);
                });
                break;
            case 'maranza':
            case 'maranzone':
            case 'istruttore':
            case 'annascrivania':
                this.onBaruffoniDown(kind);
                break;
            case 'walter':
                this.startDialogue('walter-morte', () => {
                    this.spawnCuore(x, y + 40, 'cuore-walter');
                    bus.emit('toast', { text: 'walter, spirando: "...comprate verisure. il primo mese è scontato."' });
                    this.returnFromSecret(5000);
                });
                break;
            case 'flauto':
                this.startDialogue('flauto-sconfitto', () => {
                    if (state.run.trenbolone) {
                        // fall asleep after battle if drug is active
                        this.time.delayedCall(1000, () => {
                            this.player.stun(999999);
                            this.startDialogue('trenbo-addormentato', () => {
                                this.gotoLevel('tana');
                            });
                        });
                    }
                });
                break;
            case 'trentatre':
                this.startDialogue('trentatre-sconfitto', () => {
                    state.save.barre += 333;
                    bus.emit('barre-changed', { barre: state.save.barre, gained: true });
                    bus.emit('toast', { text: '✦ hai battuto il 33. +333 barre. il numero ti rispetta, ora ✦' });
                    state.persist();
                    // rievoco il rimpianto accantonato, così la sequenza riprende
                    if (this.def.script === 'indagine' && !state.hasFlag('void-concluso') && this.voidStep < VOID_REGRETS.length) {
                        this.time.delayedCall(900, () => this.spawnRegret(this.voidStep));
                    }
                });
                break;
            case 'delegato':
            case 'notturno':
            case 'modello':
            case 'revisore':
            case 'garante':
                this.onVeritaRivelata(VOID_REGRETS.indexOf(kind));
                break;
            case 'pedro':
                this.startDialogue('pedro-sconfitto', () => {
                    this.startDialogue('dei-incontro', () => {
                        bus.emit('choice-show', {
                            title: 'le wave tornano a chi le ha create?',
                            options: [{ label: 'consegna le wave' }, { label: 'tienitele. sfida gli dei.', danger: true }],
                            onPick: (i) => {
                                if (i === 0) {
                                    this.scene.pause();
                                    bus.emit('ending', { id: 'consegna' });
                                } else {
                                    this.startDialogue('dei-rifiuto', () => {
                                        this.finalGodsFight = true;
                                        this.boss = new Boss(this, x, y - 40, 'dei');
                                        this.lighting.follow(this.boss, 0xffffff, 320, 1.1);
                                        this.setupBossColliders();
                                        this.boss.engage();
                                    });
                                }
                            },
                        });
                    });
                });
                break;
            case 'dei':
                this.time.delayedCall(800, () => {
                    this.scene.pause();
                    bus.emit('ending', { id: 'dei' });
                });
                break;
        }
    }

    /** colliders per un boss evocato dopo il create (gli dei) */
    private setupBossColliders(): void {
        if (!this.boss) return;
        this.physics.add.collider(this.boss, this.level.layer);
        this.physics.add.overlap(this.player.attackHitbox, this.boss, () => {
            if (!this.player.attackActive || !this.boss) return;
            this.player.attackActive = false;
            if (this.boss.takeDamage(this.player.attackDamage, this.player.x)) {
                this.player.onAttackHit();
                this.hitstop();
            }
        });
        this.physics.add.overlap(this.player, this.boss, () => {
            if (this.boss) this.player.hurt(this.boss.def.contactDamage, this.boss.x);
        });
        this.physics.add.overlap(this.playerProjectiles, this.boss, (obj, proj) => {
            const bullet = (obj === this.boss ? proj : obj) as Phaser.Physics.Arcade.Sprite;
            if (!this.boss || !bullet.active) return;
            const dmg = (bullet.getData('dmg') as number | undefined) ?? state.risonanteDamage * state.damageMult;
            if (this.boss.takeDamage(dmg, bullet.x)) {
                this.player.onAttackHit();
            }
        });
    }

    private onPlayerDead(): void {
        state.save.record.deaths++;
        const lost = state.save.barre;
        // le barre restano dove sei morto, stile souls
        state.dropped = lost > 0 ? { levelId: this.def.id, x: this.lastSafe.x, y: this.lastSafe.y, amount: lost } : null;
        state.save.barre = 0;
        state.persist();
        this.shake(300, 0.01);
        this.player.setTint(0xf87171);
        this.tweens.add({ targets: this.player, alpha: 0, angle: 180, duration: 600 });
        sfx.stopPad();
        this.time.delayedCall(900, () => {
            this.scene.pause();
            if (this.pattoActive) {
                // il patto finisce come doveva finire: morte definitiva
                bus.emit('ending', { id: 'pedro' });
            } else if (this.finalGodsFight || this.collapsePedro) {
                // hai sfidato gli dei (o il collasso ti ha raggiunto): game over
                bus.emit('ending', { id: 'sconfitta' });
            } else {
                bus.emit('player-died', { lost });
            }
        });
    }

    private activateCheckpoint(id: string, mic: Phaser.GameObjects.Sprite, entry: Interactable): void {
        state.save.collectedLore.push(this.micKey(id));
        state.save.levelId = this.def.id;
        state.save.checkpointId = id;
        state.persist();
        state.run.hp = state.maxHp;
        sfx.checkpoint();
        this.interactables = this.interactables.filter((it) => it !== entry);
        this.checkpointSprites.forEach((m, mid) => {
            if (mid === id) return;
            if (state.save.collectedLore.includes(this.micKey(mid))) {
                m.setTint(0x64748b).setAlpha(0.55);
            } else {
                m.clearTint();
            }
        });
        mic.setTint(0x4ade80);
        bus.emit('hp-changed', { hp: state.run.hp, maxHp: state.maxHp, hurt: false });
        bus.emit('toast', { text: TOASTS.checkpoint });
        this.add.particles(mic.x, mic.y - 10, 'p-spark', {
            speed: { min: 60, max: 180 },
            scale: { start: 0.8, end: 0 },
            tint: 0x4ade80,
            lifespan: 500,
            quantity: 16,
            stopAfter: 16,
        });
    }

    private startDialogue(id: string, onEnd?: () => void): void {
        const lines = DIALOGUES[id];
        if (!lines) {
            onEnd?.();
            return;
        }
        this.scene.pause();
        bus.emit('dialogue-start', {
            lines,
            onEnd: () => {
                this.scene.resume();
                onEnd?.();
            },
        });
    }

    /* ---------- feel ---------- */

    private hitstop(): void {
        this.physics.world.timeScale = 6;
        setTimeout(() => {
            if (this.scene.isActive()) this.physics.world.timeScale = 1;
        }, COMBAT.hitstopMs);
        this.shake(60, 0.003);
    }

    private shake(duration: number, intensity: number): void {
        if (state.settings.screenShake) this.cameras.main.shake(duration, intensity);
    }
}
