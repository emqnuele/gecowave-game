import Phaser from 'phaser';
import { COMBAT, TILE, ZONE_HEX } from '../config';
import { DIALOGUES, MECHANIC_HINTS, NOTINO_FUGHE, riddleFor, TOASTS, WAVESUNG } from '../content/story';
import { HUB_STOP, LEVEL_ORDER, LEVELS, TOTAL_FRAGMENTS } from '../content/levels';
import { QUESTS } from '../content/quests';
import { propArt } from '../engine/art/props';
import { bus } from '../engine/events';
import { biomeFor, type BiomeDef } from '../content/biomes';
import { AmbienceManager } from '../engine/AmbienceManager';
import { DecorationManager } from '../engine/DecorationManager';
import { TerrainRenderer } from '../engine/TerrainRenderer';
import { WaterRenderer } from '../engine/WaterRenderer';
import { ensurePickupTextures } from '../engine/art/pickups';
import { BASE_NOTCHES, BOSS_CHARMS, ITEMS, LEGACY_ITEMS, NOTCH_PRICES } from '../content/items';
import { LightingManager } from '../engine/LightingManager';
import { loadLevel, type LoadedLevel } from '../engine/LevelLoader';
import { ParallaxManager } from '../engine/ParallaxManager';
import { RoomBackdrops } from '../engine/RoomBackdrops';
import { loadRegion } from '../world/registry';
import { oldXToProgress, type RegionLayout, type Room } from '../world/types';
import { npcTexture } from '../engine/npcTexture';
import { NavGraph } from '../engine/nav/NavGraph';
import { RegionGuide } from '../engine/RegionGuide';
import { FolkManager } from '../engine/FolkManager';
import { TrapManager } from '../engine/TrapManager';
import { HazardManager } from '../engine/HazardManager';
import { TimeTrial } from '../engine/TimeTrial';
import { StoryManager } from '../engine/StoryManager';
import { StagingManager } from '../engine/StagingManager';
import { flashback } from '../engine/FlashbackManager';
import { FLASHBACK_BEFORE, FLASHBACK_ONCE } from '../content/flashbacks';
import { QuestManager } from '../engine/QuestManager';
import { Atmosphere } from '../engine/Atmosphere';
import { Soundscape } from '../engine/audio/Soundscape';
import { acoustics } from '../engine/audio/acoustics';
import { achievementsBlocked, checkAchievements, unlockAchievement } from '../engine/achievements';
import { REGION_COUNT } from '../content/achievements';
import { chapterParts, ENDING_BONUS, pushBoard, runScore, sumParts } from '../engine/score';
import { buildChapterSummary, buildFinalSummary, countsFor, expectBossRewards, expectCollectible, expectLoreKey, sealLevel } from '../engine/ChapterCompletion';
import { regionView } from '../engine/regionView';
import { hashString } from '../engine/art/ink';
import { sfx } from '../engine/sfx';
import { state } from '../engine/state';
import { music } from '../engine/music';
import { generateFogTexture } from '../engine/textures';
import { ensurePlayerSkin } from '../engine/playerSkin';
import { Boss } from '../entities/Boss';
import { animateCreature, creatureFrames, creatureRes } from '../engine/art/creatureKit';
import { ensureAbilityFx, FX } from '../engine/art/abilityFx';
import { ensureCreature, prewarmCreatures } from '../engine/art/creatures';
import { Companion } from '../entities/Companion';
import { Enemy, type EnemyTrait } from '../entities/Enemy';
import { Spawner } from '../entities/Spawner';
import { ENEMIES } from '../content/enemies';
import { Player } from '../entities/Player';
import { BossVoice } from '../engine/BossVoice';
import { OmbraBrain } from '../engine/OmbraBrain';
import type { OmbraInsight, PlayerAct } from '../engine/OmbraProfile';
import { PedroApparition } from '../engine/PedroApparition';
import { TrentatreMarks } from '../engine/TrentatreMarks';
import { NucleusStraightening } from '../engine/NucleusStraightening';
import { AbilitySeals } from '../engine/AbilitySeals';
import { createMechanic, type Mechanic } from '../engine/mechanics';
import { Input } from '../engine/input/Input';
import { keyLabel } from '../engine/input/keyText';
import { hitMult, LESSONS } from '../content/lessons';
import { BOSS_BARKS, barksFor, LAMETTA_BARKS } from '../content/barks';
import type { AbilityId, BossKind, DialogueLine, EnemyKind, LevelDef } from '../types';

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
    glitchpedro: 'glitchpedro-intro',
};

/* l'ordine dei rimpianti nel void: due di lametta, poi tre di piema */
const VOID_REGRETS: BossKind[] = ['notturno', 'modello', 'revisore', 'delegato', 'garante'];

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
    /** il livello input: nessuno legge più tasti fisici */
    private controls!: Input;
    private boss: Boss | null = null;
    private enemies!: Phaser.GameObjects.Group;
    /** nidi nelle grotte chiuse: spenti da lontano, armati da vicino */
    private spawners!: Phaser.GameObjects.Group;
    private spawnerToastShown = false;
    /** riusato ogni frame per le minacce: niente array nuovi per il GC */
    private threatCache: { x: number; y: number }[] = [];
    private playerProjectiles!: Phaser.Physics.Arcade.Group;
    private enemyProjectiles!: Phaser.Physics.Arcade.Group;
    private lametteGroup!: Phaser.Physics.Arcade.Group;
    private barreGroup!: Phaser.Physics.Arcade.Group;
    private doorGroup!: Phaser.Physics.Arcade.StaticGroup;
    private interactables: Interactable[] = [];
    private prompt!: Phaser.GameObjects.Container;
    private promptTxt!: Phaser.GameObjects.Text;
    private lastSafe!: { x: number; y: number };
    private safeTimer = 0;
    private exiting = false;
    private checkpointSprites = new Map<string, Phaser.GameObjects.Sprite>();
    /** microfoni e pali che spariscono durante i film */
    private propDressing: { img: Phaser.GameObjects.Sprite | Phaser.GameObjects.Image; light: Phaser.GameObjects.Light | null; glow: number }[] = [];
    private lighting!: LightingManager;
    private parallax!: ParallaxManager;
    private biome!: BiomeDef;
    private terrain!: TerrainRenderer;
    private ambience!: AmbienceManager;
    private water!: WaterRenderer;
    private clone: Companion | null = null;
    private cloneUntil = 0;
    private cloneColliders: Phaser.Physics.Arcade.Collider[] = [];
    private cloneTwin: Phaser.GameObjects.Image | null = null;
    private cloneJitterAt = 0;
    private cloneWaveAt = 0;
    private cloneSwapUsed = false;
    /** il player lo legge per sapere se la seconda pressione è uno scambio */
    get cloneAlive(): boolean {
        return !!this.clone?.active;
    }
    private analisiUntil = 0;
    private nextAnalisiTick = 0;
    private analisiGlyphs: Phaser.GameObjects.Image[] = [];
    private analisiPhase: 0 | 1 | 2 | 3 = 0;
    private analisiStart = 0;
    private analisiQedDone = false;
    private analisiMarked = new Set<Enemy>();
    private analisiMarks = new Map<Enemy, Phaser.GameObjects.Image>();
    private analisiBossMarked = false;
    private analisiCircle: Phaser.GameObjects.Graphics | null = null;
    private analisiQed: Phaser.GameObjects.Image | null = null;
    private lastCooldownEmit = 0;
    private lastDashWaveAt = 0;
    private guide: RegionGuide | null = null;
    /** percorso della freccia: ricalcolato solo cambiando stanza */
    private guideCacheKey = '';
    private guideCache: { x: number; y: number; rooms: number } | null = null;
    /** frammenti della wave vivi nel mondo: la freccia ci punta finché non li prendi */
    private liveFragments: { x: number; y: number; ability: AbilityId; obj: Phaser.Physics.Arcade.Sprite }[] = [];
    private folk!: FolkManager;
    private traps!: TrapManager;
    private hazards!: HazardManager;
    private trial: TimeTrial | null = null;
    private story: StoryManager | null = null;
    private pedroGhost: PedroApparition | null = null;
    private marks33: TrentatreMarks | null = null;
    /** un frammento apre il mondo: sigilli sulle porte laterali, mai sul percorso */
    private seals: AbilitySeals | null = null;
    private staging: StagingManager | null = null;
    private quests!: QuestManager;
    private atmosphere!: Atmosphere;
    private soundscape!: Soundscape;
    private nextTrophyCheckAt = 0;
    /** lo scontro col boss in corso: se ti colpisce niente "intoccabile" */
    private bossFight: { hit: boolean; hp: number } | null = null;
    private guideGfx!: Phaser.GameObjects.Graphics;
    private lastRoom = -1;
    /** dove stanno gli npc di trama, per indicarli */
    private npcAt = new Map<string, { x: number; y: number }>();
    /** sbarre che chiudono l'arena finché il boss è vivo */
    private arenaBars!: Phaser.Physics.Arcade.StaticGroup;
    private arenaGfx: Phaser.GameObjects.Graphics | null = null;
    private arenaRoom: Room | null = null;
    /** sfida a ondate in una stanza laterale: il microfono rosso */
    private challenge: { room: Room; wave: number; enemies: Enemy[]; nextAt: number; x: number; y: number } | null = null;
    private challengeSpot: { room: Room; x: number; y: number; mic: Phaser.GameObjects.Sprite } | null = null;
    private busStops: { key: string; x: number; y: number }[] = [];
    private homing: { obj: Phaser.Physics.Arcade.Sprite; at: number; moving: boolean }[] = [];
    private bossIntroShown = false;
    private exitLockToastAt = 0;
    // arena di lametta
    private lamettaCenter: { x: number; y: number } | null = null;
    private lamettaActive = false;
    private lamettaFloorY = 0;
    private smelaArena: { x: number; y: number } | null = null;
    private acquaPuddles: { img: Phaser.GameObjects.Image; glow: Phaser.GameObjects.Image; x: number; y: number; until: number; nextTick: number; waveAt: number }[] = [];
    private nextLametteAt = 0;
    private nextPitturaAt = 0;
    private colorDropsTaken = 0;
    private mirror: Phaser.GameObjects.Sprite | null = null;
    private pedroChoiceShown = false;
    /** pedro spento mentre combatti il suo glitch */
    private pedroShell: Boss | null = null;
    /** l'ordine raddrizza il nucleo solo contro il glitch, mai per patto o dei */
    private nucleusStraightening: NucleusStraightening | null = null;
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
    private scudoStart = 0;
    private scudoBubble: Phaser.GameObjects.Image | null = null;
    private scudoBubbleGlow: Phaser.GameObjects.Image | null = null;
    private scudoRec: Phaser.GameObjects.Image | null = null;
    // bottiglie di smela in volo e avvelenamento
    private acquaBottles: Phaser.Physics.Arcade.Sprite[] = [];
    private poisoned = new Map<Enemy | Boss, number>();
    // inseguimenti nella tana: lochef ci prova più di una volta
    private chaseSprite: Phaser.GameObjects.Sprite | null = null;
    private chaseLastSeen = { x: 0, y: 0 };
    private chaseWhisperAt = 0;
    private chaseWhisperIdx = 0;
    private chaseTrail: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
    private chaseStarts: number[] = [];
    private chaseEnds: number[] = [];
    private chaseZoneIdx = -1;
    private chaseStartedAt = 0;
    private chaseDone: boolean[] = [];
    /** fatica di lochef: dopo 8s a contatto rallenta del 30% per 3s */
    private chaseNearSince = 0;
    private chaseTiredUntil = 0;
    /** l'ospite n.12 dopo l'arresto: si parla e poi torna a casa */
    private ospite12Sprite: Phaser.GameObjects.Sprite | null = null;
    private ospite12Interact: Interactable | null = null;
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
    /** anti-spam del parry quando la hitbox resta sopra un nemico schermato */
    private parryUntil = 0;
    /** la meccanica del bioma (porte a orario, correnti, telecamere...) */
    private mechanic: Mechanic | null = null;
    private playerLightRef: Phaser.GameObjects.Light | null = null;
    /** quante volte hai sbagliato ogni porta della mente: la domanda cambia */
    private quizAttempts = new Map<string, number>();
    private nextLessonCheck = 0;
    /** chi parla durante lo scontro, e l'ombra che ti studia */
    private voice: BossVoice | null = null;
    private ombraBrain: OmbraBrain | null = null;
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
        this.silenceBoss();
        this.quizAttempts.clear();
        this.clone = null;
        this.cloneColliders = [];
        this.cloneTwin = null;
        this.cloneJitterAt = 0;
        this.cloneWaveAt = 0;
        this.cloneSwapUsed = false;
        this.mirror = null;
        this.interactables = [];
        this.analisiGlyphs = [];
        this.analisiUntil = 0;
        this.nextAnalisiTick = 0;
        this.analisiPhase = 0;
        this.analisiStart = 0;
        this.analisiQedDone = false;
        this.analisiMarked.clear();
        this.analisiMarks.clear();
        this.analisiBossMarked = false;
        this.analisiCircle = null;
        this.analisiQed = null;
        this.lastCooldownEmit = 0;
        this.lastDashWaveAt = 0;
        this.homing = [];
        this.busStops = [];
        this.propDressing = [];
        this.npcAt.clear();
        this.lastRoom = -1;
        this.guide = this.layout ? new RegionGuide(this.layout) : null;
        this.guideCacheKey = '';
        this.guideCache = null;
        this.liveFragments = [];
        this.checkpointSprites.clear();
        this.lamettaCenter = null;
        this.lamettaActive = false;
        this.smelaArena = null;
        this.acquaPuddles.forEach((p) => { p.img.destroy(); p.glow.destroy(); });
        this.acquaPuddles = [];
        this.acquaBottles = [];
        this.poisoned.clear();
        this.colorDropsTaken = 0;
        this.bossIntroShown = false;
        this.pedroChoiceShown = false;
        this.pedroShell = null;
        this.nucleusStraightening = null;
        this.pattoActive = false;
        this.finalGodsFight = false;
        this.pattoWarned = 0;
        this.scudoUntil = 0;
        this.scudoGfx = null;
        this.scudoStart = 0;
        this.scudoBubble = null;
        this.scudoBubbleGlow = null;
        this.scudoRec = null;
        this.chaseSprite = null;
        this.chaseTrail = null;
        this.chaseStarts = [];
        this.chaseEnds = [];
        this.chaseZoneIdx = -1;
        this.chaseWhisperAt = 0;
        this.chaseWhisperIdx = 0;
        this.chaseDone = [];
        this.chaseNearSince = 0;
        this.chaseTiredUntil = 0;
        this.ospite12Sprite = null;
        this.ospite12Interact = null;
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
        this.nextTrophyCheckAt = 0;
        this.bossFight = null;
        this.seals = null;
        // il capitolo comincia quando ci entri da fuori: morire e riprovare non azzera il cronometro
        if (state.save.chapterRun?.id !== data.levelId) {
            state.save.chapterRun = { id: data.levelId, startMs: state.save.record.playMs, deaths0: state.save.record.deaths, kills0: state.save.record.kills, noHitBosses: 0 };
        }

        generateFogTexture(this);
        // la pelle scelta alla forgia va in texture prima del player (costo una tantum)
        ensurePlayerSkin(this, state.save.skin);

        this.biome = biomeFor(this.def);
        this.lighting = new LightingManager(this);
        this.lighting.enable(this.biome);

        this.level = loadLevel(this, this.def, this.biome);
        ensureAbilityFx(this);
        prewarmCreatures(this, this.level.entities.map((e) => e.spec));
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
        this.controls = new Input(this);
        // la rimappatura ricostruisce i tasti vivi, la ripresa pulisce gli spigoli
        const offControls = bus.on('controls-changed', () => this.controls.rebuild());
        const onResume = (): void => {
            this.controls.reset();
            this.player.cancelCharge();
        };
        this.events.on(Phaser.Scenes.Events.RESUME, onResume);
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            offControls();
            this.events.off(Phaser.Scenes.Events.RESUME, onResume);
            this.controls.destroy();
        });
        this.player = new Player(this, sp.x, sp.y, this.controls);
        this.player.setDepth(4);
        this.playerLightRef = this.lighting.playerLight(this.player);
        this.lastSafe = { ...sp };

        this.enemies = this.add.group({ runChildUpdate: false });
        this.spawners = this.add.group({ runChildUpdate: false });
        this.playerProjectiles = this.physics.add.group({ allowGravity: false });
        this.enemyProjectiles = this.physics.add.group({ allowGravity: false });
        this.lametteGroup = this.physics.add.group({ allowGravity: false });
        this.barreGroup = this.physics.add.group();
        this.doorGroup = this.physics.add.staticGroup();
        this.arenaBars = this.physics.add.staticGroup();
        this.arenaGfx = null;
        this.arenaRoom = null;
        this.challenge = null;
        this.challengeSpot = null;

        this.spawnEntities();
        this.spawnCaveSpawners();
        if (this.def.hub) this.spawnPiazzaGuests();
        this.spawnCheckpoints();
        this.spawnBusStops();
        this.folk = new FolkManager(this, this.nav, (lines) => this.startLines(lines));
        this.folk.populate({
            seed: this.def.id,
            biomeId: this.biome.id,
            eye: this.biome.accent,
            layout: this.layout,
            avoid: this.level.entities.filter((e) => e.spec.type === 'enemy' || e.spec.type === 'spawner' || e.spec.type === 'boss').map((e) => ({ x: e.x, y: e.y })),
            widthPx: this.level.widthPx,
            crowd: this.def.hub ? 18 : undefined,
        });
        this.interactables.push(...this.folk.talkables);
        this.quests = new QuestManager(this, this.lighting, (lines, onEnd) => this.startLines(lines, onEnd));
        this.quests.setup(this.def.id, this.layout, this.biome.accent, this.player, [
            ...this.level.entities.filter((e) => e.spec.type !== 'enemy').map((e) => ({ x: e.x, y: e.y })),
            ...this.level.checkpoints.map((c) => ({ x: c.x, y: c.y })),
        ]);
        this.interactables.push(...this.quests.talkables);
        this.spawnChallenge();
        this.spawnTrial();
        this.story = new StoryManager(this, this.lighting, {
            dialogue: (id, onEnd) => this.startDialogue(id, onEnd),
            choice: (title, options, onPick) => bus.emit('choice-show', { title, options, onPick }),
            forget: (t) => {
                this.interactables = this.interactables.filter((it) => it !== t);
            },
        });
        this.story.setup(this.def.id, this.layout, [
            sp,
            ...this.interactables.map((it) => ({ x: it.x, y: it.y })),
            ...this.level.entities.filter((e) => e.spec.type !== 'enemy').map((e) => ({ x: e.x, y: e.y })),
        ]);
        this.interactables.push(...this.story.talkables);
        // catalogo completo: da qui i denominatori del riepilogo sono stabili
        sealLevel(this.def.id, this.layout?.rooms.length ?? 0);
        // pedro in scena una volta per regione: due righe, poi si sfalda
        this.pedroGhost = new PedroApparition(this, this.lighting);
        this.pedroGhost.setup(this.def.id, this.layout);
        this.marks33 = new TrentatreMarks(this);
        // il 33 affonda nel muro: roccia del bioma verso il fondo
        const rock = Phaser.Display.Color.IntegerToColor(this.biome.rock);
        const deep = Phaser.Display.Color.IntegerToColor(this.biome.deep);
        const tint = Phaser.Display.Color.GetColor(
            Math.round(rock.red * 0.35 + deep.red * 0.65),
            Math.round(rock.green * 0.35 + deep.green * 0.65),
            Math.round(rock.blue * 0.35 + deep.blue * 0.65),
        );
        this.marks33.build(this.def.id, [this.level.fakeWalls, this.level.breakableWalls], tint);
        // staging muto: una scena ambientale per regione, zero dialoghi
        this.staging = new StagingManager(this, this.lighting);
        this.staging.setup(this.def.id, this.layout, this.player);
        this.traps = new TrapManager(this, this.nav);
        this.traps.populate({
            seed: this.def.id,
            biomeId: this.biome.id,
            layout: this.layout,
            rim: this.biome.rim,
            avoid: [
                sp,
                ...this.level.entities.filter((e) => e.spec.type !== 'enemy').map((e) => ({ x: e.x, y: e.y })),
                ...this.level.checkpoints.map((c) => ({ x: c.x, y: c.y })),
                ...this.busStops,
                ...this.quests.talkables.map((t) => ({ x: t.x, y: t.y })),
                ...this.challengePoints(),
            ],
        });
        this.hazards = new HazardManager(this, this.nav, () => this.atmosphere?.weather === 'temporale' || this.atmosphere?.weather === 'pioggia');
        this.hazards.populate({
            seed: this.def.id,
            biomeId: this.biome.id,
            layout: this.layout,
            rim: this.biome.rim,
            deep: this.biome.rock,
            avoid: [sp, ...this.level.checkpoints.map((c) => ({ x: c.x, y: c.y })), ...this.busStops],
        });
        this.physics.add.collider(this.player, this.hazards.group,
            (_p, slab) => this.hazards.landOn(slab as Phaser.GameObjects.GameObject),
            (_p, slab) => this.hazards.canLand(this.player, slab as Phaser.GameObjects.GameObject));
        if (this.layout && this.playerLightRef) {
            const enemyKinds = [...new Set(Object.values(this.def.entities).flatMap((e) => (e.type === 'enemy' ? [e.kind] : [])))]
                .filter((k) => k !== 'notino-mini' && k !== 'pittura-mini');
            this.mechanic = createMechanic({
                scene: this, regionId: this.def.id, nav: this.nav, layout: this.layout, water: this.level.water,
                lighting: this.lighting, playerLight: this.playerLightRef, player: this.player,
                avoid: [sp, ...this.level.checkpoints.map((c) => ({ x: c.x, y: c.y })), ...this.busStops, ...this.interactables.map((it) => ({ x: it.x, y: it.y })),
                    ...this.level.entities.filter((e) => e.spec.type !== 'enemy').map((e) => ({ x: e.x, y: e.y }))],
                enemyKinds,
                spawnHunter: (kind, x, y) => {
                    const at = this.openSpotNear(x, y, 8);
                    this.spawnEnemy(kind, at.x, at.y, { hunting: true });
                },
                awakeEnemies: () => this.awakeEnemies(),
                quizDoor: (id, x, y) => this.spawnQuizDoor(id, x, y),
                trialRunning: () => !!this.trial?.active,
                chaseRunning: () => !!this.chaseSprite?.active,
                chaseRanges: () => this.chaseStarts.map((start, i) => ({ start, end: this.chaseEnds[i] ?? Infinity })),
                addInteractable: (x, y, range, onInteract) => {
                    const entry: Interactable = { x, y, range, onInteract };
                    this.interactables.push(entry);
                    return () => {
                        this.interactables = this.interactables.filter((it) => it !== entry);
                    };
                },
            });
        }
        // la casa ti sente: lochef torna in caccia da vicino
        const sniffedOff = bus.on('tana-sniffed', () => this.onTanaSniffed());
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            this.mechanic?.destroy();
            this.mechanic = null;
            this.silenceBoss();
            sniffedOff();
            this.pedroGhost?.destroy();
            this.pedroGhost = null;
            this.seals?.destroy();
            this.seals = null;
            this.nucleusStraightening?.destroy();
            this.nucleusStraightening = null;
            this.marks33?.destroy();
            this.marks33 = null;
            this.folk.destroy();
            this.traps.destroy();
            this.hazards.destroy();
            this.trial?.stop();
        });
        this.spawnDroppedBarre();
        this.setupColliders();
        this.setupEvents();
        this.setupCamera();
        this.parallax.build(this.def.color, this.def.id, this.biome, this.layout ? this.layout.horizonRow * TILE : this.level.heightPx);
        this.parallax.resize();
        this.atmosphere = new Atmosphere(this);
        this.atmosphere.build(this.biome, this.def.id);
        this.soundscape = new Soundscape(this, this.biome, this.nav, this.layout ? this.layout.horizonRow : null);
        this.buildPrompt();
        // i sigilli vivono nelle porte laterali: barriere, 33 e premi col save
        this.seals = new AbilitySeals({
            scene: this,
            regionId: this.def.id,
            layout: this.layout,
            player: this.player,
            nav: this.nav,
            lighting: this.lighting,
            fakeWalls: this.level.fakeWalls,
            breakableWalls: this.level.breakableWalls,
            getClone: () => {
                const c = this.clone;
                if (!c?.active) return null;
                const body = c.body as Phaser.Physics.Arcade.Body | null;
                return { x: c.x, y: c.y, w: body?.width ?? 36, h: body?.height ?? 55 };
            },
            giveHeart: (x, y, key) => this.spawnCuore(x, y, key, true),
            giveItem: (x, y, item, key) => this.spawnItemPickup(x, y, item, 1, key, true),
            giveBarre: (x, y, amount, key) => this.spawnBarrePickup(x, y, amount, key),
            giveNotch: (x, y, key) => this.spawnItemPickup(x, y, 'tacca', 1, key, true),
        });
        this.buildGuide();

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
                case 'enemy': {
                    // una parte dei nemici dorme: si passa piano, o si sveglia tutto
                    const h = hashString(`${this.def.id}:${x}:${y}`);
                    const elite = this.isEliteSpot(x, y, h);
                    this.spawnEnemy(spec.kind, x, y, { sleeping: h % 100 < 35, elite, trait: elite ? null : this.traitFor(spec.kind, x, y, h) });
                    break;
                }
                case 'spawner': {
                    this.spawnSpawner(spec.kind, x, y, {
                        maxAlive: spec.maxAlive ?? 3,
                        intervalMs: spec.intervalMs ?? 3500,
                        radius: spec.radius ?? 600,
                    });
                    break;
                }
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
                    // i premi attesi si registrano al caricamento, anche a boss già caduto
                    expectBossRewards(this.def.id, spec.kind);
                    // i boss sconfitti restano sconfitti, regola souls
                    if (state.hasFlag(`boss-down-${spec.kind}`)) {
                        this.recoverBossReward(spec.kind, x, y);
                        break;
                    }
                    // l'ombra senza abbonamento è addestrata su poco footage
                    const hpOverride = spec.kind === 'ombra' && !state.hasFlag('tommasorveglianza') ? 34 : undefined;
                    this.boss = this.makeBoss(x, y, spec.kind, hpOverride);
                    // pedro finale forte come il pedro del doomsday: raffica e inseguimento
                    if (spec.kind === 'pedro') this.boss.frenzy = true;
                    // in ng+ ivan è già dei nostri: guggu si taglia subito
                    if (spec.kind === 'guggu' && state.hasFlag('ivan')) this.boss.invulnerable = false;
                    // il limite si arresta solo con tutti e tre gli indizi
                    if (spec.kind === 'limite' && this.indiziRaccolti() >= 3) this.boss.invulnerable = false;
                    // da cliente premium ticummi ha i tuoi dati: evoca echi di te
                    if (spec.kind === 'ticummi' && state.hasFlag('tommasorveglianza')) this.boss.summonOverride = 'eco';
                    this.lightBoss(this.boss, this.boss.def.glowColor, 280, 1.0);
                    break;
                }
            }
        }
    }

    /** sacchetto o amuleto a terra: si raccoglie una volta sola per salvataggio */
    private spawnItemPickup(x: number, y: number, item: string, amount: number, persistKey: string, loose = false): void {
        // il denominatore si registra prima del controllo: vale anche a oggetto già preso
        const kind = ITEMS[item]?.kind;
        if (!LEGACY_ITEMS[item] && (kind === 'amuleto' || kind === 'potenziamento')) {
            const id = item;
            const key = persistKey;
            const charm = kind === 'amuleto';
            expectCollectible(this.def.id, key, 'thing', () => state.save.collectedLore.includes(key) || (charm && state.hasCharm(id)));
        }
        // le regioni già generate nascondono ancora i vecchi consumabili: diventano barre
        if (LEGACY_ITEMS[item] && !state.save.collectedLore.includes(persistKey)) {
            state.save.collectedLore.push(persistKey);
            this.spawnBarrePickup(x, y, LEGACY_ITEMS[item]! * amount);
            return;
        }
        if (!ITEMS[item] || state.save.collectedLore.includes(persistKey)) return;
        const isCharm = ITEMS[item].kind === 'amuleto';
        if (isCharm && state.hasCharm(item)) return;
        ensurePickupTextures(this);
        if (loose) ({ x, y } = this.rewardSpot(x, y));
        const pickup = this.physics.add.sprite(x, y, isCharm ? 'pickup-charm' : 'pickup-item').setDepth(5);
        if (loose) this.homeIn(pickup);
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
        this.spawnItemPickup(x + 40, y + 30, id, 1, `charm-${id}`, true);
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
            formicona: 'aggrappo',
        };
        const ability = fragmentByBoss[kind];
        if (ability && !state.hasAbility(ability)) this.spawnFragment(x, y + 50, ability, true);
        this.dropBossCharm(kind, x, y);
        if (kind === 'riba' && !state.hasFlag('dispositivo')) state.setFlag('dispositivo');
        if (kind === 'lochef') this.spawnCuore(x, y + 50, 'cuore-lochef', true);
        if (kind === 'formicona') this.spawnCuore(x, y + 50, 'cuore-formicona', true);
        if (kind === 'settequaranta') this.spawnCuore(x, y + 50, 'cuore-barrato', true);
        if (kind === 'custode') this.spawnCuore(x, y + 50, 'cuore-custode', true);
        if (kind === 'limite') {
            state.setFlag('caso-risolto');
            this.spawnCuore(x, y + 50, 'cuore-limite', true);
        }
        if (kind === 'furgone' || kind === 'smela') state.setFlag('stabilimento-chiuso');
        if (kind === 'pedrino') state.setFlag('ricordi-visti');
    }

    /** personaggio di scena: foglio a inchiostro animato se esiste, texture semplice altrimenti */
    private castSprite(x: number, y: number, key: string): Phaser.GameObjects.Sprite {
        const sprite = this.add.sprite(x, y, ensureCreature(this, key), 0).setPipeline('Light2D');
        sprite.setScale(1 / creatureRes(this, sprite.texture.key));
        animateCreature(sprite);
        return sprite;
    }

    /** la luce del boss sta un po' sopra la testa: le normal map lo modellano dall'alto */
    private lightBoss(boss: Boss, color: number, radius: number, intensity: number): Phaser.GameObjects.Light {
        const h = (boss.body as Phaser.Physics.Arcade.Body).height;
        return this.lighting.follow(boss, color, radius + h * 0.5, intensity, -h * 0.75, -h * 0.25);
    }

    /** un boss nasce sospeso sopra il pavimento più vicino, con la testa sotto il soffitto */
    private makeBoss(x: number, y: number, kind: BossKind, hpOverride?: number): Boss {
        const boss = new Boss(this, x, y, kind, hpOverride);
        const c = Math.floor(x / TILE);
        let r = Math.floor(y / TILE);
        while (r < this.level.heightPx / TILE - 1 && !this.nav.solid(c, r + 1)) r++;
        const floor = (r + 1) * TILE;
        let top = r;
        while (top > 0 && !this.nav.solid(c, top - 1) && floor - top * TILE < 600) top--;
        const ceil = top * TILE;
        const half = (boss.body as Phaser.Physics.Arcade.Body).height / 2 / (boss.def.bodyScale ?? 0.75);
        let by = floor - half - 70;
        if (by - half < ceil + 16) by = (floor + ceil) / 2;
        boss.relocate(x, by);
        return boss;
    }

    /** poche élite per regione: avanti nel percorso, nelle stanze grandi, mai vicino all'inizio */
    private isEliteSpot(x: number, y: number, h: number): boolean {
        if (!this.layout) return false;
        const room = this.roomAt(x, y);
        if (!room || !['hall', 'cave', 'gauntlet', 'shaft'].includes(room.kind)) return false;
        const p = room.pathIndex >= 0 ? room.pathIndex : this.layout.rooms[room.anchor].pathIndex;
        if (p < this.layout.pathLength * 0.3) return false;
        return h % 1000 < 22;
    }

    /** varianti dei nemici delle regioni: deterministiche, per bioma e comportamento */
    private traitFor(kind: EnemyKind, x: number, y: number, h: number): EnemyTrait | null {
        if (!this.layout) return null;
        const room = this.roomAt(x, y);
        if (!room || room.kind === 'start' || room.kind === 'rest') return null;
        const b = ENEMIES[kind].behavior;
        const biome = this.biome.id;
        const roll = (h >>> 10) % 1000;
        // il nemico simbolo della regione porta il suo tratto quasi sempre: è lui che insegna il pogo
        const lesson = LESSONS[kind];
        if (lesson?.trait && lesson.regions?.includes(this.def.id) && roll < 650) return lesson.trait;
        const hard = (list: string[], hi: number, lo: number) => (list.includes(biome) ? hi : lo);
        if ((b === 'walker' || b === 'charger') && roll < hard(['sanctum', 'factory', 'servers', 'core', 'noir', 'library', 'province', 'depot'], 200, 100)) return 'scudo';
        if ((b === 'walker' || b === 'hopper' || b === 'chaser') && !room.surface && roll >= 300 && roll < 300 + hard(['burrow', 'cellar', 'memory', 'mind', 'lab', 'void', 'swamp'], 170, 80)) return 'soffitto';
        if ((b === 'hopper' || b === 'flyer') && roll >= 600 && roll < 600 + hard(['wasteland', 'factory', 'core', 'void', 'servers', 'lab'], 140, 50)) return 'kamikaze';
        return null;
    }

    private spawnEnemy(kind: EnemyKind, x: number, y: number, opts: { sleeping?: boolean; hunting?: boolean; elite?: boolean; trait?: EnemyTrait | null } = {}): Enemy {
        const e = new Enemy(this, x, y, kind, this.nav, { sleeping: opts.sleeping && !opts.elite, elite: opts.elite, trait: opts.trait });
        if (opts.hunting) e.hunt();
        e.setDepth(4);
        this.enemies.add(e);
        // il kamikaze si annuncia con una luce rossa, chi sta appeso al buio no
        if (e.trait !== 'soffitto') {
            const h = (e.body as Phaser.Physics.Arcade.Body).height;
            this.lighting.follow(e, e.trait === 'kamikaze' ? 0xef4444 : e.arch.glowColor, 120 + h, 0.6, -h * 0.9 - 8, -h * 0.35);
        }
        return e;
    }

    /* ---------- nidi di mostri nelle grotte ---------- */

    private spawnSpawner(kind: EnemyKind, x: number, y: number, opts: { maxAlive?: number; intervalMs?: number; radius?: number } = {}): Spawner {
        const s = new Spawner(this, x, y, { kind, ...opts });
        this.spawners.add(s);
        this.physics.add.collider(this.player, s);
        this.lighting.follow(s, s.glowColor, 190, 0.85, 0, -20);
        return s;
    }

    /** nidi ovunque ci stia una tana: cave, secret e anse piccole con tetto,
        al massimo tre porte, mai nelle stanze sicure (start/rest/exit/arena)
        né a inizio gioco né dove c'è trama. deterministico per regione. */
    private spawnCaveSpawners(): void {
        if (!this.layout) return;
        const rooms = this.layout.rooms;
        const doorCount = new Map<number, number>();
        for (const d of this.layout.doors) {
            doorCount.set(d.a, (doorCount.get(d.a) ?? 0) + 1);
            doorCount.set(d.b, (doorCount.get(d.b) ?? 0) + 1);
        }
        const poolKinds = [...new Set(
            this.level.entities.filter((e) => e.spec.type === 'enemy' || e.spec.type === 'spawner')
                .map((e) => (e.spec as { kind: EnemyKind }).kind),
        )].filter((k) => {
            const b = ENEMIES[k]?.behavior;
            return b === 'walker' || b === 'hopper' || b === 'chaser' || b === 'charger';
        });
        const fallback: EnemyKind[] = ['tossico', 'formica', 'glitchetto', 'pendolare'];
        const kinds = poolKinds.length ? poolKinds : fallback.filter((k) => k in ENEMIES);
        for (const room of rooms) {
            if (room.kind === 'start' || room.kind === 'exit' || room.kind === 'rest' || room.kind === 'arena') continue;
            if (room.kind !== 'cave' && room.kind !== 'secret' && room.kind !== 'hall' && room.kind !== 'gauntlet' && room.kind !== 'pool') continue;
            if (room.surface) continue;
            if (room.rect.w > 80 || room.rect.h > 44 || room.rect.w * room.rect.h > 2400) continue;
            if ((doorCount.get(room.id) ?? 0) > 3) continue;
            // niente nidi a inizio gioco: sono tane opzionali, non il tutorial
            const anchorPath = room.pathIndex >= 0 ? room.pathIndex : rooms[room.anchor]?.pathIndex ?? 0;
            if (anchorPath < this.layout.pathLength * 0.1) continue;
            // niente nidi dove c'è trama (boss, npc, frammenti, lore, portali)
            const hasStory = this.level.entities.some((e) =>
                (e.spec.type === 'boss' || e.spec.type === 'npc' || e.spec.type === 'ability' || e.spec.type === 'lore' || e.spec.type === 'portal')
                && e.x >= room.rect.x * TILE && e.x < (room.rect.x + room.rect.w) * TILE
                && e.y >= room.rect.y * TILE && e.y < (room.rect.y + room.rect.h) * TILE,
            );
            if (hasStory) continue;
            const h = hashString(`${this.def.id}:spawner:${room.id}`);
            const chance = room.kind === 'secret' ? 80 : room.kind === 'cave' ? 70 : 60;
            if (h % 100 >= chance) continue;
            // la stanza ha già un nido piazzato a mano: niente doppioni
            const hasManual = this.level.entities.some((e) =>
                e.spec.type === 'spawner'
                && e.x >= room.rect.x * TILE && e.x < (room.rect.x + room.rect.w) * TILE
                && e.y >= room.rect.y * TILE && e.y < (room.rect.y + room.rect.h) * TILE,
            );
            if (hasManual) continue;
            const kind = kinds[h % kinds.length];
            const spot = this.caveSpawnerSpot(room);
            if (!spot) continue;
            this.spawnSpawner(kind, spot.x, spot.y, {
                maxAlive: 3,
                intervalMs: 3000 + (h % 2000),
                radius: 600,
            });
        }
    }

    /** il punto a terra più vicino al centro della grotta, lontano dai bordi */
    private caveSpawnerSpot(room: { rect: { x: number; y: number; w: number; h: number } }): { x: number; y: number } | null {
        const cx = room.rect.x + room.rect.w / 2;
        const cy = room.rect.y + room.rect.h - 2;
        let best: { c: number; r: number } | null = null;
        let bd = Infinity;
        for (let r = room.rect.y + 2; r < room.rect.y + room.rect.h - 1; r++) {
            for (let c = room.rect.x + 3; c < room.rect.x + room.rect.w - 3; c++) {
                if (!this.nav.standable(c, r)) continue;
                if (this.nav.solid(c, r - 1) && this.nav.solid(c, r - 2)) continue;
                const d = Math.abs(c - cx) + Math.abs(r - cy) * 2;
                if (d < bd) {
                    bd = d;
                    best = { c, r };
                }
            }
        }
        if (!best) return null;
        return { x: best.c * TILE + TILE / 2, y: best.r * TILE + TILE / 2 };
    }

    /** stile minecraft: spento da lontano, da vicino (600px) spawna
        finché attorno al nido ci sono meno di maxAlive vivi */
    private updateSpawners(time: number): void {
        if (this.spawners.getChildren().length === 0) return;
        if (this.awakeEnemies() >= 40) return;
        const px = this.player.x;
        const py = this.player.y;
        for (const child of this.spawners.getChildren()) {
            const s = child as Spawner;
            if (!s.active || s.broken) continue;
            const dx = Math.abs(s.x - px);
            const dy = Math.abs(s.y - py);
            if (s.dormant) {
                if (dx < 1500 && dy < 1000) s.setDormant(false);
                else continue;
            } else if (dx > 1800 || dy > 1250) {
                s.setDormant(true);
                continue;
            }
            s.syncAura();
            const dist = Math.hypot(s.x - px, s.y - py);
            const armed = dist < s.radius && !this.player.dead;
            s.setArmed(armed);
            if (!armed || time < s.nextAt) continue;
            let alive = 0;
            for (const obj of this.enemies.getChildren()) {
                const e = obj as Enemy;
                if (!e.active || e.dormant) continue;
                if (Math.hypot(e.x - s.x, e.y - s.y) < 760) {
                    alive++;
                    if (alive >= s.maxAlive) break;
                }
            }
            if (alive >= s.maxAlive) {
                s.nextAt = time + 600;
                continue;
            }
            const at = this.openSpotNear(s.x, s.y - 30, 6);
            this.spawnEnemy(s.kind, at.x, at.y, { hunting: true });
            s.nextAt = time + s.intervalMs * (0.85 + Math.random() * 0.3);
            sfx.crack();
            const puff = this.add.particles(s.x, s.y - 14, 'p-spark', {
                speed: { min: 40, max: 160 },
                scale: { start: 0.8, end: 0 },
                tint: s.glowColor,
                lifespan: 380,
                quantity: 8,
                stopAfter: 8,
            }).setDepth(6);
            this.time.delayedCall(600, () => puff.destroy());
        }
    }

    private damageSpawner(s: Spawner, amount: number): void {
        if (!s.active || s.broken) return;
        if (s.takeDamage(amount)) this.breakSpawner(s);
        else {
            sfx.hit();
            this.player.onAttackHit();
            this.hitstop();
        }
    }

    private breakSpawner(s: Spawner): void {
        const { x, y, glowColor, kind } = s;
        sfx.crumble();
        this.shake(200, 0.008);
        const burst = this.add.particles(x, y - 10, 'p-spark', {
            speed: { min: 80, max: 280 },
            scale: { start: 1, end: 0 },
            tint: [glowColor, 0xf5f5f4],
            lifespan: 500,
            quantity: 18,
            stopAfter: 18,
        }).setDepth(6);
        this.time.delayedCall(800, () => burst.destroy());
        this.spawnBarrePickup(x, y - 20, 12);
        s.destroy();
        if (!this.spawnerToastShown) {
            this.spawnerToastShown = true;
            bus.emit('toast', { text: `nido di ${kind} distrutto. niente più spawn da qui.` });
        }
    }

    /** lo scudo para: clang, rinculo, nessun flow */
    private parry(enemy: Enemy): void {
        const now = this.time.now;
        if (now < this.parryUntil) return;
        this.parryUntil = now + 350;
        sfx.clang();
        const dir = Math.sign(this.player.x - enemy.x) || 1;
        (this.player.body as Phaser.Physics.Arcade.Body).setVelocityX(dir * 260);
        const sparks = this.add.particles(enemy.x - dir * 18, enemy.y, 'p-spark', {
            speed: { min: 80, max: 220 }, angle: dir > 0 ? { min: -60, max: 60 } : { min: 120, max: 240 },
            scale: { start: 0.7, end: 0 }, tint: 0xe5e7eb, lifespan: 260, quantity: 8, stopAfter: 8,
        }).setDepth(6);
        this.time.delayedCall(400, () => sparks.destroy());
    }

    private onEnemyExplode({ x, y, r, from }: { x: number; y: number; r: number; from: Enemy }): void {
        sfx.crumble();
        sfx.hit();
        this.shake(220, 0.01);
        const boom = this.add.particles(x, y, 'p-spark', {
            speed: { min: 120, max: 340 }, scale: { start: 1.3, end: 0 }, tint: [0xef4444, 0xf97316, 0xfacc15],
            lifespan: 420, quantity: 26, stopAfter: 26,
        }).setDepth(6);
        this.time.delayedCall(600, () => boom.destroy());
        const flash = this.lighting.static(x, y, 0xf97316, 200, 1.4);
        this.time.delayedCall(260, () => this.lighting.remove(flash));
        if (Math.hypot(this.player.x - x, this.player.y - y) < r) this.player.hurt(1, x);
        // lo scoppio non guarda in faccia nessuno: anche i compagni si fanno male
        for (const obj of this.enemies.getChildren()) {
            const e = obj as Enemy;
            if (e !== from && e.active && Math.hypot(e.x - x, e.y - y) < r) e.takeDamage(2, x);
        }
    }


    private spawnNpc(id: string, x: number, y: number): void {
        // marker invisibili degli inseguimenti nella tana (solo finché il boss è vivo)
        if (id === 'caccia-inizio') {
            if (state.hasFlag('boss-down-lochef')) return;
            this.chaseStarts.push(this.progressAt(x, y));
            this.chaseStarts.sort((a, b) => a - b);
            this.chaseDone = this.chaseStarts.map(() => false);
            return;
        }
        if (id === 'caccia-fine') {
            if (state.hasFlag('boss-down-lochef')) return;
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
            const guide = this.castSprite(x, y + 4, 'npc-walter').setDepth(4);
            this.lighting.follow(guide, 0x86efac, 160, 0.8);
            this.companion = guide;
            this.companionBaseY = y + 4;
            this.companionInteract = { x, y, range: 48, onInteract: () => this.interactWalterGuida() };
            this.interactables.push(this.companionInteract);
            return;
        }

        // romero che ti fa da guida tra i rimpianti: cammina piano accanto a te e si parla
        if (id === 'romero-guida') {
            const guide = this.castSprite(x, y + 4, 'npc-romero').setDepth(4);
            this.lighting.follow(guide, 0x60a5fa, 170, 0.8);
            this.companion = guide;
            this.companionBaseY = y + 4;
            // interactable che segue romero: la sua posizione si aggiorna nel loop
            this.companionInteract = { x, y, range: 48, onInteract: () => this.interactGuida() };
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
            this.spawnQuizDoor(id, x, y);
            return;
        }

        this.npcAt.set(id, { x, y });
        const texture = npcTexture(id);
        const npc = this.castSprite(x, y + 4, texture).setDepth(4);
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
        const entry: Interactable = { x, y, range: 70, onInteract: () => this.interactNpc(id) };
        this.interactables.push(entry);
        if (id === 'ospite-12') {
            this.ospite12Sprite = npc;
            this.ospite12Interact = entry;
        }
    }

    /** l'ospite n.12 accanto alle statue del giardino, dopo l'arresto */
    private spawnOspite12(): void {
        let x = this.player.x + 80;
        let y = this.player.y;
        const statue = this.level.entities.find((e) => e.spec.type === 'lore' && e.spec.id === 'lore-statue');
        const room = statue ? this.roomAt(statue.x, statue.y) : this.roomAt(x, y);
        const layout = this.layout;
        const spots = room && layout ? (layout.spots ?? []).filter((s) => (s[2] ?? -1) === room.id) : [];
        if (spots.length) {
            const s = spots[Math.floor(spots.length / 2)]!;
            x = s[0] * TILE + TILE / 2;
            y = (s[1] + 1) * TILE - 18;
        } else if (statue) {
            x = statue.x + 60;
            y = statue.y;
        }
        this.spawnNpc('ospite-12', x, y);
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
                        title: 'tommasorveglianza 133 barre: notino respinto gratis, ma l\'ombra si allena su di te (forte). senza: affronti notino tu, ombra beta.',
                        options: [{ label: 'compra (133 barre): protetto, ma spiato' }, { label: 'rifiuta: libero, ma agguati veri' }],
                        onPick: (i) => {
                            if (i === 0 && state.save.barre >= 133) {
                                state.save.barre -= 133;
                                state.setFlag('tommasorveglianza');
                                state.save.ombra.premium = true;
                                state.persist();
                                bus.emit('barre-changed', { barre: state.save.barre, gained: false });
                                this.startDialogue('tommaso-avviso-clausola');
                            } else if (i === 0) {
                                bus.emit('toast', { text: 'non hai 133 barre. ticummi ti guarda con pietà.' });
                            } else {
                                this.startDialogue('tommaso-rifiuto');
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
            case 'romero-piazza':
                this.interactRomeroPiazza();
                break;
            case 'romero-caso': {
                const pre = state.hasFlag('lochef-arrestato') ? 'romero-lochef' : null;
                if (pre && !state.hasFlag('romero-lochef-detto')) {
                    state.setFlag('romero-lochef-detto');
                    this.startDialogue(pre, () => this.startDialogue(id));
                } else {
                    this.startDialogue(id);
                }
                break;
            }
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
            case 'ospite-12':
                this.startDialogue(id, () => {
                    state.setFlag('ospite-12-libero');
                    state.persist();
                    const npc = this.ospite12Sprite;
                    const entry = this.ospite12Interact;
                    if (entry) this.interactables = this.interactables.filter((it) => it !== entry);
                    this.ospite12Sprite = null;
                    this.ospite12Interact = null;
                    if (npc?.active) {
                        this.tweens.add({ targets: npc, alpha: 0, y: npc.y - 20, duration: 1200, onComplete: () => npc.destroy() });
                    }
                });
                break;
            case 'oracolo-mappa':
                this.startDialogue(id, () => this.startLines(this.oracleLines()));
                break;
            case 'bottega-wavezon':
                this.startDialogue(id, () => this.openPiazzaShop());
                break;
            case 'bacheca-missioni':
                this.startDialogue(id, () => this.startLines(this.boardLines()));
                break;
            case 'samatt-bar':
                this.startDialogue(id, () => this.startLines(this.barRumors()));
                break;
            case 'markolino-piazza': {
                const n = state.abilities.length;
                // l'acqua tossica è opzionale: sette frammenti bastano per il finale
                this.startDialogue(n >= 7 ? 'markolino-piazza-fine' : n >= 4 ? 'markolino-piazza-dopo' : id);
                break;
            }
            case 'markolino-dono':
                this.startDialogue(id, () => {
                    state.setFlag('markolino-dono-visto');
                    // il frammento promesso ("prendilo") cade accanto a lui: senza questo
                    // il dialogo lasciava il player a mani vuote e l'unica scivolata
                    // restava il pickup libero a ~30 tile di distanza
                    if (!state.hasAbility('scivolata') && !this.liveFragments.some((f) => f.ability === 'scivolata')) {
                        const dono = this.npcAt.get('markolino-dono');
                        if (dono) this.spawnFragment(dono.x, dono.y - 50, 'scivolata');
                    }
                });
                break;
            default:
                this.startDialogue(id);
        }
    }

    /* ---------- la piazza ---------- */

    /** chi torna in piazza dipende da cosa hai scelto per strada */
    private spawnPiazzaGuests(): void {
        const feet = 26 * TILE + TILE / 2;
        if (state.hasFlag('notino-a-casa')) {
            this.spawnNpc('mamma-notino-piazza', 116 * TILE, feet);
            this.spawnNpc('notino-piazza', 119 * TILE + 8, feet);
        }
        if (state.hasFlag('ospite-12-libero')) this.spawnNpc('ospite-12-piazza', 58 * TILE, feet);
        if (state.hasFlag('caso-risolto')) this.spawnNpc('romero-piazza', 18 * TILE, feet);
    }

    private interactRomeroPiazza(): void {
        if (state.hasFlag('caffe-romero')) {
            this.startDialogue('romero-caffe-dopo');
            return;
        }
        this.startDialogue('romero-piazza', () => {
            if (!state.save.collectedLore.includes('nota-caso-1')) return;
            bus.emit('choice-show', {
                title: 'ti ricordi un biglietto sulla sua scrivania. il bar è a due passi.',
                options: [{ label: 'offrigli un caffè, con lo zucchero' }, { label: 'lascialo stare' }],
                onPick: (i) => {
                    if (i !== 0) return;
                    state.setFlag('caffe-romero');
                    this.startDialogue('romero-caffe');
                },
            });
        });
    }

    /** l'oracolo legge quanto hai esplorato di ogni regione vista */
    private oracleLines(): DialogueLine[] {
        const say = (text: string): DialogueLine => ({ speaker: 'l\'oracolo delle mappe', color: 'cyan', text });
        const rows: string[] = [];
        let worst: { name: string; pct: number } | null = null;
        for (const id of [...LEVEL_ORDER, ...Object.keys(LEVELS).filter((k) => !LEVEL_ORDER.includes(k) && !LEVELS[k].hub)]) {
            if (!state.hasFlag(`visto-${id}`)) continue;
            const rooms = loadRegion(this, id)?.layout.rooms.length;
            if (!rooms) continue;
            const pct = Math.min(100, Math.round(((state.save.explored[id]?.length ?? 0) / rooms) * 100));
            rows.push(`${LEVELS[id].accentWord} ${pct}%`);
            if (pct < 100 && (!worst || pct < worst.pct)) worst = { name: LEVELS[id].accentWord, pct };
        }
        if (!rows.length) return [say('non hai visto niente. torna quando avrai almeno sbagliato strada una volta.')];
        const out = [say(`le tue mappe: ${rows.join(' · ')}.`)];
        out.push(worst
            ? say(`${worst.name} ti nasconde ancora parecchio. le stanze che non vedi sono quelle che ti guardano.`)
            : say('hai visto tutto quello che c\'era da vedere. adesso sei tu la mappa. inquietante, eh?'));
        return out;
    }

    /** la bacheca: le commissioni prese e quelle da riscuotere */
    private boardLines(): DialogueLine[] {
        const say = (text: string): DialogueLine => ({ speaker: 'bacheca delle commissioni', color: 'yellow', text });
        const open = QUESTS.filter((q) => state.save.quests[q.id] && state.save.quests[q.id].s !== 'fatta');
        const done = QUESTS.filter((q) => state.save.quests[q.id]?.s === 'fatta').length;
        const lines = [say(`commissioni chiuse: ${done} su ${QUESTS.length}.`)];
        for (const q of open.slice(0, 4)) {
            const st = state.save.quests[q.id];
            lines.push(say(`${st.s === 'pronta' ? '✓ da riscuotere' : '· in corso'}: "${q.title}" (${LEVELS[q.region]?.accentWord ?? q.region}).`));
        }
        const fresh = QUESTS.filter((q) => !state.save.quests[q.id] && state.hasFlag(`visto-${q.region}`));
        if (fresh.length) lines.push(say(`qualcuno chiede aiuto anche a ${[...new Set(fresh.map((q) => LEVELS[q.region]?.accentWord ?? q.region))].slice(0, 3).join(', ')}. cerca chi ha il punto esclamativo in testa.`));
        else if (!open.length) lines.push(say('nessuna richiesta aperta. il realm per una volta non ha bisogno di te. godetela.'));
        return lines;
    }

    /** il bar: voci vere, calcolate su quello che ti manca */
    private barRumors(): DialogueLine[] {
        const say = (text: string): DialogueLine => ({ speaker: 'samatt', color: 'yellow', text });
        const pool: string[] = [];
        const missing = TOTAL_FRAGMENTS - state.abilities.length;
        if (missing > 0) pool.push(`dicono che in giro ci siano ancora ${missing} frammenti della wave. uno lo tiene sempre il più grosso della zona, ovvio.`);
        if (!state.hasAbility('aggrappo')) pool.push('al rio c\'è una formica enorme che si arrampica sui muri. se la batti, magari ti insegna. o ti mangia.');
        if (!state.hasFlag('tommasorveglianza')) pool.push('ticummi vende una cosa chiamata tommasorveglianza. io non la comprerei. tu sì, scommetto.');
        if (state.save.notches < 6) pool.push('la bottega qui accanto vende tacche per gli amuleti. care, ma le tacche non si mangiano, durano.');
        const lore = state.save.collectedLore.filter((k) => k.startsWith('lore-')).length;
        if (lore < 30) pool.push('sui tetti della piazza ci sono scritte vecchie. nessuno sale a leggerle. tu hai le gambe da geco, no?');
        pool.push('il microfono della fontana salva come gli altri. ma qui almeno muori in compagnia.');
        const arene = state.save.flags.filter((f) => f.startsWith('arena-vinta-')).length;
        if (arene < 5) pool.push(`in ogni regione c'è un microfono rosso in una stanza fuori strada. ci sali e ti chiudono dentro con le bestie. paga bene. ne hai vinti ${arene}.`);
        pool.push('di notte nelle regioni girano bestie più grosse, con l\'aura. lasciano un sacco di barre. e un sacco di vedove.');
        pool.push('guastalla adesso sta seduto lì a guardare il citelis. da fuori. dice che è bellissimo. io ci credo poco.');
        const pick = Phaser.Utils.Array.Shuffle([...pool]).slice(0, 2);
        return pick.map(say);
    }

    /** la bottega della piazza: la cura completa e la tacca dopo, le due cose per cui servono le barre */
    private openPiazzaShop(): void {
        const ricarica = 25;
        const bought = state.save.notches - BASE_NOTCHES;
        const tacca = bought < NOTCH_PRICES.length ? NOTCH_PRICES[bought]! : 0;
        bus.emit('choice-show', {
            title: `bottega wavezon · hai ${state.save.barre} barre`,
            options: [{ label: `ricarica completa (${ricarica} barre)` }, { label: tacca ? `una tacca per amuleti (${tacca} barre)` : 'tacche finite: le hai tutte' }, { label: 'solo guardare' }],
            onPick: (i) => {
                const pay = (n: number): boolean => {
                    if (state.save.barre < n) {
                        bus.emit('toast', { text: 'commesso: "senza barre si guarda e basta, campione."' });
                        return false;
                    }
                    state.save.barre -= n;
                    bus.emit('barre-changed', { barre: state.save.barre, gained: false });
                    return true;
                };
                if (i === 0 && pay(ricarica)) {
                    state.run.hp = state.maxHp;
                    state.run.flow = state.maxFlow;
                    bus.emit('hp-changed', { hp: state.run.hp, maxHp: state.maxHp, hurt: false });
                    bus.emit('flow-changed', { flow: state.run.flow, maxFlow: state.maxFlow });
                    sfx.pickup();
                    bus.emit('toast', { text: 'ricaricato. vita e flow al massimo.' });
                } else if (i === 1 && tacca && pay(tacca)) {
                    state.addItem('tacca');
                    sfx.pickup();
                    bus.emit('toast', { text: 'una tacca in più. gli amuleti si cambiano ai microfoni.' });
                }
                state.persist();
            },
        });
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
    /** una porta della mente: chiude il varco finché non rispondi giusto */
    private spawnQuizDoor(id: string, x: number, y: number): void {
        if (state.hasFlag(`aperta-${id}`)) return;
        const door = this.doorGroup.create(x, y - 48, 'porta-teorema') as Phaser.Physics.Arcade.Sprite;
        door.setDepth(3).setPipeline('Light2D');
        (door.body as Phaser.Physics.Arcade.StaticBody).setSize(28, 128);
        this.lighting.follow(door, 0x60a5fa, 150, 0.7);
        const entry: Interactable = { x, y, range: 70, onInteract: () => this.interactPorta(id, door, entry) };
        this.interactables.push(entry);
    }

    private interactPorta(id: string, door: Phaser.Physics.Arcade.Sprite, entry: Interactable): void {
        const attempt = this.quizAttempts.get(id) ?? 0;
        const t = riddleFor(id, attempt);
        bus.emit('choice-show', {
            title: t.q,
            options: t.options.map((label) => ({ label })),
            onPick: (i) => {
                if (i !== t.correct) {
                    // sbagliare costa, ma la testa di piema non ti cancella più: ti morde e cambia domanda
                    this.quizAttempts.set(id, attempt + 1);
                    bus.emit('toast', { text: TOASTS.quizErrore });
                    this.cameras.main.flash(240, 248, 113, 113);
                    this.player.hurt(2, door.x);
                    for (const side of [-1, 1]) {
                        const at = this.openSpotNear(door.x + side * 180, door.y - 40, 8);
                        this.spawnEnemy('numero', at.x, at.y, { hunting: true });
                    }
                    return;
                }
                state.setFlag(`aperta-${id}`);
                this.interactables = this.interactables.filter((it) => it !== entry);
                sfx.unlock();
                const burst = this.add.particles(door.x, door.y, 'p-spark', {
                    speed: { min: 40, max: 160 },
                    scale: { start: 0.7, end: 0 },
                    tint: 0x60a5fa,
                    lifespan: 500,
                    quantity: 20,
                    stopAfter: 20,
                });
                this.time.delayedCall(900, () => burst.destroy());
                door.destroy();
                bus.emit('toast', { text: TOASTS.portaAperta });
            },
        });
    }

    /** un posto calpestabile vicino a dove è morto il boss: mai in aria o nella roccia */
    private rewardSpot(x: number, y: number): { x: number; y: number } {
        const c0 = Math.floor(x / TILE);
        const r0 = Math.floor(y / TILE);
        const room = this.roomAt(x, y);
        for (let d = 0; d <= 16; d++) {
            for (let dy = -d; dy <= d; dy++) {
                for (let dx = -d; dx <= d; dx++) {
                    if (Math.max(Math.abs(dx), Math.abs(dy)) !== d) continue;
                    const c = c0 + dx;
                    const r = r0 + dy;
                    if (this.nav.segmentAt(c, r) < 0) continue;
                    if (room && this.roomAt(c * TILE, r * TILE) !== room) continue;
                    return { x: c * TILE + TILE / 2, y: r * TILE + 6 };
                }
            }
        }
        return { x: this.player.x, y: this.player.y - 30 };
    }

    /** le ricompense dei boss, dopo un attimo, vengono a cercarti: non si perdono */
    private homeIn(obj: Phaser.Physics.Arcade.Sprite): void {
        this.homing.push({ obj, at: this.time.now + 1200, moving: false });
    }

    private updateHoming(delta: number): void {
        const now = this.time.now;
        this.homing = this.homing.filter((h) => h.obj.active);
        for (const h of this.homing) {
            if (now < h.at || this.player.dead) continue;
            const dx = this.player.x - h.obj.x;
            const dy = this.player.y - h.obj.y;
            const d = Math.hypot(dx, dy);
            if (d < 30) continue;
            if (!h.moving) {
                h.moving = true;
                this.tweens.killTweensOf(h.obj);
            }
            const v = Math.min(d, (420 + d * 0.9) * (delta / 1000));
            h.obj.x += (dx / d) * v;
            h.obj.y += (dy / d) * v;
        }
    }

    private spawnFragment(x: number, y: number, ability: AbilityId, loose = false): void {
        if (loose) ({ x, y } = this.rewardSpot(x, y));
        const shard = this.physics.add.sprite(x, y, 'fragment').setDepth(5);
        (shard.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
        this.lighting.follow(shard, 0x4ade80, 200, 1.0);
        this.tweens.add({ targets: shard, y: y - 10, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        this.tweens.add({ targets: shard, angle: { from: -8, to: 8 }, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        if (loose) this.homeIn(shard);
        this.liveFragments.push({ x, y, ability, obj: shard });
        this.physics.add.overlap(this.player, shard, () => {
            if (!shard.active) return;
            this.liveFragments = this.liveFragments.filter((f) => f.obj !== shard);
            shard.destroy();
            // doppione (es. dono di markolino + pickup libero): sparisce in silenzio
            if (state.hasAbility(ability)) return;
            state.unlockAbility(ability);
            sfx.unlock();
            bus.emit('abilities-changed', { abilities: state.abilities });
            bus.emit('fragments-changed', { count: state.abilities.length, total: TOTAL_FRAGMENTS });
            bus.emit('ability-unlocked', { ability });
            // la prima wave insegna i 33: una nota sola, poi parlano i muri
            if (!state.hasFlag('sigilli-spiegati')) {
                state.setFlag('sigilli-spiegati');
                this.time.delayedCall(1500, () => bus.emit('wavesung', WAVESUNG.markolinoSigilli));
            }
        });
    }

    private spawnLore(id: string, x: number, y: number): void {
        expectLoreKey(this.def.id, id, 'thing');
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

    /** accanto a ogni microfono una fermata del citelis: si scopre passando, da lì si viaggia */
    private spawnBusStops(): void {
        for (const cp of this.level.checkpoints) {
            const art = propArt(this.biome, 'busstop', 0);
            if (!this.textures.exists(art.id)) this.textures.addCanvas(art.id, art.canvas);
            const sx = cp.x + 58;
            const sy = cp.y + TILE / 2;
            const pole = this.add.image(sx, sy + 1, art.id).setOrigin(0.5, 1).setDepth(3).setPipeline('Light2D');
            const glow = this.lighting.static(sx, sy - 70, 0xfacc15, 150, 0.7);
            this.propDressing.push({ img: pole, light: glow, glow: 0.7 });
            const key = `${this.def.id}:${cp.id}`;
            this.busStops.push({ key, x: sx, y: sy - 30 });
            this.interactables.push({ x: sx, y: sy - 30, range: 56, onInteract: () => this.openTravel(key) });
        }
    }

    /** durante i film restano solo roccia e attori: si spengono i servizi */
    setPropsVisible(v: boolean): void {
        for (const p of this.propDressing) {
            if (p.img.active) p.img.setVisible(v);
            if (p.light) p.light.intensity = v ? p.glow : 0;
        }
    }

    private updateBusStops(): void {
        for (const s of this.busStops) {
            if (state.save.stops.includes(s.key)) continue;
            if (Math.abs(this.player.x - s.x) < 140 && Math.abs(this.player.y - s.y) < 110) {
                state.save.stops.push(s.key);
                state.persist();
                bus.emit('toast', { text: 'fermata del citelis scoperta. da qui si viaggia ({k:interact} sul palo).' });
            }
        }
    }

    private openTravel(current: string): void {
        if (this.exiting || this.boss?.engaged || this.chaseSprite) {
            bus.emit('toast', { text: 'il citelis non si ferma con qualcuno che ti insegue.' });
            return;
        }
        if (!state.save.stops.includes(current)) state.save.stops.push(current);
        // dopo guggu il citelis porta anche in piazza, da qualsiasi fermata
        if (state.hasFlag('boss-down-guggu') && !state.save.stops.includes(HUB_STOP)) state.save.stops.push(HUB_STOP);
        const order = [...Object.keys(LEVELS).filter((k) => LEVELS[k].hub), ...LEVEL_ORDER, ...Object.keys(LEVELS).filter((k) => !LEVEL_ORDER.includes(k) && !LEVELS[k].hub)];
        const stops = state.save.stops
            .map((key) => {
                const [levelId, cpId] = key.split(':');
                return { key, levelId, cpId };
            })
            .filter((s) => LEVELS[s.levelId])
            .sort((a, b) => order.indexOf(a.levelId) - order.indexOf(b.levelId) || Number(a.cpId.split('-')[1]) - Number(b.cpId.split('-')[1]))
            .map((s, i, all) => {
                const n = all.filter((o, j) => o.levelId === s.levelId && j <= i).length;
                const label = LEVELS[s.levelId].hub ? `capolinea ${LEVELS[s.levelId].accentWord}` : `${LEVELS[s.levelId].accentWord} · fermata ${n}`;
                return { key: s.key, levelId: s.levelId, label };
            });
        bus.emit('travel-show', { stops, current, onPick: (key) => this.travelTo(key) });
    }

    /** viaggio col citelis: si scende alla fermata scelta, accanto al suo microfono */
    private travelTo(key: string): void {
        const [levelId, cpId] = key.split(':');
        if (!LEVELS[levelId]) return;
        sfx.dash();
        bus.emit('toast', { text: 'sali sul citelis. convalidare, prego.' });
        this.exiting = true;
        state.portalReturn = null;
        state.save.levelId = levelId;
        state.save.checkpointId = cpId;
        state.persist();
        sfx.stopPad();
        this.cameras.main.fadeOut(450, 0, 0, 0);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            this.scene.restart({ levelId, checkpointId: cpId, showCard: levelId !== this.def.id } satisfies SceneData);
        });
    }

    private spawnCheckpoints(): void {
        for (const cp of this.level.checkpoints) {
            const mic = this.castSprite(cp.x, cp.y - 12, 'mic').setDepth(4);
            this.checkpointSprites.set(cp.id, mic);
            let glow: Phaser.GameObjects.Light | null = null;
            let level = 0;
            const used = state.save.collectedLore.includes(this.micKey(cp.id));
            if (state.save.checkpointId === cp.id) {
                mic.setTint(0x4ade80);
                glow = this.lighting.static(cp.x, cp.y - 20, 0x4ade80, 160, 0.8);
                level = 0.8;
            } else if (used) {
                mic.setTint(0x64748b).setAlpha(0.55);
            }
            this.propDressing.push({ img: mic, light: glow, glow: level });
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

    private spawnBarrePickup(x: number, y: number, amount: number, persistKey?: string): void {
        // i pickup piazzati a mano non riappaiono una volta presi
        const key = persistKey ?? `${this.def.id}-${Math.round(x)}-${Math.round(y)}`;
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
    private spawnCuore(x: number, y: number, persistKey: string, loose = false): void {
        expectLoreKey(this.def.id, persistKey, 'heart');
        if (state.save.collectedLore.includes(persistKey)) return;
        if (loose) ({ x, y } = this.rewardSpot(x, y));
        const heart = this.physics.add.sprite(x, y, 'cuore').setDepth(5);
        if (loose) this.homeIn(heart);
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
        expectLoreKey(this.def.id, persistKey, 'thing');
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
        this.physics.add.collider(this.player, this.arenaBars);
        this.physics.add.collider(this.enemies, this.arenaBars);
        this.physics.add.collider(this.enemies, this.doorGroup);

        this.physics.add.collider(this.player, this.level.breakableWalls);
        this.physics.add.collider(this.enemies, this.level.breakableWalls);
        this.physics.add.collider(this.barreGroup, this.level.breakableWalls);
        this.physics.add.collider(this.playerProjectiles, this.level.breakableWalls, (proj) => {
            this.popProjectile(proj as Phaser.Physics.Arcade.Sprite);
            this.destroyBreakableWall(proj as Phaser.Physics.Arcade.Sprite);
        });
        this.physics.add.overlap(this.player.attackHitbox, this.level.breakableWalls, (_hb, obj) => {
            if (!this.player.attackActive && !this.player.slamming) return;
            if (this.player.slamming) {
                // schianto: sfonda e continua a scendere, senza pogo
                this.destroyBreakableWall(obj as Phaser.Physics.Arcade.Sprite);
                return;
            }
            this.player.attackActive = false;
            this.player.onAttackHit();
            this.hitstop();
            this.destroyBreakableWall(obj as Phaser.Physics.Arcade.Sprite);
        });

        this.physics.add.overlap(this.player.attackHitbox, this.enemies, (_hb, obj) => {
            if (!this.player.attackActive && !this.player.slamming) return;
            const enemy = obj as Enemy;
            if (enemy.blocks(this.player.x, this.player.attackDir)) {
                this.player.attackActive = false;
                this.parry(enemy);
                return;
            }
            this.player.attackActive = false;
            this.player.onAttackHit();
            this.hitstop();
            const open = LESSONS[enemy.arch.kind]?.openAfterShot;
            const mult = open && enemy.justFired ? open : hitMult(enemy.arch.kind, this.player.attackDir);
            this.dmgTo(enemy, this.player.attackDamage * mult, this.player.x);
            this.weakFeedback(enemy, mult);
            // lo specchietto colpito dal basso perde quota e resta lì un attimo
            if (enemy.active && enemy.arch.kind === 'specchietto' && this.player.attackDir === 'up') {
                enemy.stun(650);
                (enemy.body as Phaser.Physics.Arcade.Body).setVelocityY(240);
            }
        });

        // i nidi si rompono a colpi: mezza dozzina di sciabolate, o un paio di onde
        this.physics.add.overlap(this.player.attackHitbox, this.spawners, (_hb, obj) => {
            if (!this.player.attackActive && !this.player.slamming) return;
            const s = obj as Spawner;
            if (this.player.slamming) {
                this.damageSpawner(s, 2);
                return;
            }
            this.player.attackActive = false;
            this.damageSpawner(s, this.player.attackDamage);
        });

        this.physics.add.overlap(this.playerProjectiles, this.spawners, (a, b) => {
            const s = (a instanceof Spawner ? a : b) as Spawner;
            const bullet = (a instanceof Spawner ? b : a) as Phaser.Physics.Arcade.Sprite;
            if (!s.active || s.broken || !bullet.active) return;
            const level = (bullet.getData('level') as number | undefined) ?? -1;
            const reflected = !!bullet.getData('reflected');
            if (reflected) {
                const dmg = (bullet.getData('dmg') as number | undefined) ?? COMBAT.scudoReflectNormal;
                this.damageSpawner(s, dmg);
            } else {
                const step = level === 2 ? 2 : level === 1 ? 1 : 0.5;
                this.damageSpawner(s, state.risonanteDamage * state.damageMult * step);
                if (level === 0) this.popProjectile(bullet);
            }
            this.player.onAttackHit();
        });

        this.physics.add.overlap(this.player, this.enemies, (_p, obj) => {
            const enemy = obj as Enemy;
            // la lezione del citelis: attraverso la carica in scivolata, e lui sbanda
            if (this.player.isDashing && enemy.isCharging && LESSONS[enemy.arch.kind]?.staggerOnDash) {
                enemy.stagger(1700);
                sfx.clang();
                this.weakFeedback(enemy, 2);
                return;
            }
            // rimando perfetto: chi ti tocca in quella finestra viene respinto senza farti danno
            if (this.time.now < this.scudoUntil && this.time.now - this.scudoStart < COMBAT.scudoPerfectMs) {
                const dir = Math.sign(enemy.x - this.player.x) || 1;
                (enemy.body as Phaser.Physics.Arcade.Body)?.setVelocity(dir * 420, -260);
                enemy.stun(COMBAT.scudoStunMs);
                sfx.perfectDing();
                this.refundNote();
                return;
            }
            this.player.hurt(1, enemy.x);
        });

        this.physics.add.overlap(this.playerProjectiles, this.enemies, (a, b) => {
            const enemy = (a instanceof Enemy ? a : b) as Enemy;
            const bullet = (a instanceof Enemy ? b : a) as Phaser.Physics.Arcade.Sprite;
            if (!enemy.active || !bullet.active) return;
            // il colpo risonante perfora ma ogni bersaglio lo subisce una volta
            const hitSet = (bullet.getData('hit') ?? new Set()) as Set<Enemy>;
            if (hitSet.has(enemy)) return;
            const level = (bullet.getData('level') as number | undefined) ?? -1;
            const reflected = !!bullet.getData('reflected');
            // l'onda piena spacca anche gli scudi, eco e onda no
            if (enemy.blocks(bullet.x, 'shot') && level !== 2) {
                this.parry(enemy);
                this.popProjectile(bullet);
                return;
            }
            hitSet.add(enemy);
            bullet.setData('hit', hitSet);
            const mult = hitMult(enemy.arch.kind, reflected ? 'reflect' : 'shot');
            if (reflected) {
                const dmg = (bullet.getData('dmg') as number | undefined) ?? COMBAT.scudoReflectNormal;
                this.dmgTo(enemy, dmg * mult, bullet.x);
                if (bullet.getData('perfect') && enemy.active) enemy.stun(COMBAT.scudoStunMs);
            } else {
                const step = level === 2 ? 2 : level === 1 ? 1 : 0.5;
                this.dmgTo(enemy, state.risonanteDamage * state.damageMult * step * mult, bullet.x);
                // il colpo può uccidere: lo stordimento solo se è ancora in piedi
                if (level === 2 && enemy.active) enemy.stun(COMBAT.risonanteFullStunMs);
                // l'eco corta non perfora: si ferma al primo
                if (level === 0) this.popProjectile(bullet);
            }
            this.weakFeedback(enemy, mult);
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
                if (this.dmgTo(this.boss, this.player.attackDamage, this.player.x, this.player.attackDir)) {
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
                const level = (bullet.getData('level') as number | undefined) ?? -1;
                if (bullet.getData('reflected')) {
                    // il rimando tocca il boss una volta sola: l'homing restava
                    // addosso e mitragliava a ogni frame
                    if (bullet.getData('bossHit')) return;
                    bullet.setData('bossHit', true);
                    const dmg = (bullet.getData('dmg') as number | undefined) ?? COMBAT.scudoReflectNormal;
                    if (this.dmgTo(this.boss, dmg, bullet.x, 'shot')) this.player.onAttackHit();
                } else {
                    const step = level === 2 ? 2 : level === 1 ? 1 : 0.5;
                    if (this.dmgTo(this.boss, state.risonanteDamage * state.damageMult * step, bullet.x, 'shot')) {
                        this.player.onAttackHit();
                    }
                    if (level === 0) this.popProjectile(bullet);
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
        on('player-riflesso-swap', this.onRiflessoSwap as never);
        on('player-analisi', this.onAnalisi as never);
        on('player-scudo', this.onScudo as never);
        on('player-acqua', this.onAcquaTossica as never);
        on('enemy-shoot', this.onEnemyShoot as never);
        on('enemy-died', this.onEnemyDied as never);
        on('enemy-explode', this.onEnemyExplode as never);
        on('enemy-fuse', (() => sfx.fuse()) as never);
        on('enemy-drop', (() => sfx.shriek()) as never);
        on('enemy-alert', this.onEnemyAlert as never);
        on('player-dead', this.onPlayerDead as never);
        on('boss-summon', this.onBossSummon as never);
        on('boss-lamette', this.onBossLamette as never);
        on('boss-defeated', this.onBossDefeated as never);
        on('boss-engaged', this.onBossEngaged as never);
        on('boss-dying', (() => this.silenceBoss()) as never);
        // ogni mossa del geco nutre il profilo: l'ombra lo leggerà alla fine
        on('player-act', ((act: PlayerAct) => {
            state.observeOmbra(act);
            this.ombraBrain?.observeLive(act);
        }) as never);
        // mangiare è un canale da interrompere: l'ombra legge inizio e fine
        const offHealed = bus.on('player-healed', () => {
            this.events.emit('player-act', { act: 'heal' });
        });
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => offHealed());
        // dal telefono si ordina, nel mondo si mangia: il boccone parte qui
        const offEat = bus.on('eat-requested', ({ id }) => {
            const msg = this.player.startEat(id);
            if (msg) bus.emit('toast', { text: msg });
        });
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => offEat());
        on('boss-phase', (({ phase }: { phase: number }) => this.voice?.say(phase === 2 ? 'phase2' : 'phase3', true)) as never);
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

    /** palco dei flashback: il tratto piano più largo vicino al geco, mai nell'arena del boss.
        pubblica perché la chiama il FlashbackManager via host. */
    findFlatStage(x: number, y: number): { x: number; y: number } | null {
        const bossRoom = this.boss?.active ? this.roomAt(this.boss.x, this.boss.y) : null;
        let best: { x: number; y: number; score: number } | null = null;
        for (const seg of this.nav.segments) {
            const w = seg.c1 - seg.c0 + 1;
            if (w < 14) continue;
            const cx = Math.round((seg.c0 + seg.c1) / 2);
            // aria sopra la testa per tre celle: gli attori alti ci stanno
            if (!this.nav.free(cx, seg.r - 1) || !this.nav.free(cx, seg.r - 2)) continue;
            const px = cx * TILE + TILE / 2;
            const py = (seg.r + 1) * TILE;
            if (bossRoom) {
                const room = this.roomAt(px, py);
                if (room && room === bossRoom) continue;
            }
            const d = Math.hypot(px - x, py - y);
            if (d > 2400) continue;
            const score = w * 40 - d;
            if (!best || score > best.score) best = { x: px, y: py, score };
        }
        return best;
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
        const pad = this.layout ? 220 : 0;
        cam.setBounds(0, -pad, this.level.widthPx, this.level.heightPx + pad * 2);
        // sotto la mappa c'è solo roccia: il margine della camera non deve mostrare il parallasse
        if (pad) this.add.rectangle(0, this.level.heightPx, this.level.widthPx, pad + 40, this.biome.deep).setOrigin(0, 0).setDepth(2);
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
        this.promptTxt = txt;
        this.prompt = this.add.container(0, 0, [circle, txt]).setDepth(8).setVisible(false);
    }

    /* ---------- script per capitolo ---------- */

    private setupScript(): void {
        // trama per messaggi: niente dialoghi bloccanti senza npc.
        // solo wavesung, max 2 per capitolo, distanziati. chi vuole legge, chi no gioca.
        const waveOnce = (flag: string, wave: { sender: string; text: string }, delay: number) => {
            if (state.hasFlag(flag)) return;
            state.setFlag(flag);
            this.time.delayedCall(delay, () => bus.emit('wavesung', wave));
        };
        if (this.def.id === 'perduta') {
            waveOnce('pedro-eco-perduta', WAVESUNG.pedroEcoPerduta, 6000);
            waveOnce('tease-maschere-perduta', WAVESUNG.markolinoMaschereTease, 45000);
            // chi ha già sentito il dono (anche prima di questa fix) ma non ha la wave:
            // il frammento lo aspetta da markolino, non va perso per strada
            if (state.hasFlag('markolino-dono-visto') && !state.hasAbility('scivolata')
                && !this.liveFragments.some((f) => f.ability === 'scivolata')) {
                const dono = this.npcAt.get('markolino-dono');
                if (dono) this.spawnFragment(dono.x, dono.y - 50, 'scivolata');
            }
        }
        const hint = MECHANIC_HINTS[this.def.id];
        if (hint && this.mechanic) waveOnce(`meccanica-${this.def.id}`, hint, 12000);
        if (this.def.id === 'bus') waveOnce('romero-prima-bus', WAVESUNG.romeroBus, 25000);
        if (this.def.id === 'santuario') waveOnce('romero-prima-santuario', WAVESUNG.romeroSantuario, 30000);
        if (this.def.id === 'rio') waveOnce('smela-opzionale-detta', WAVESUNG.markolinoSmelaSkip, 40000);
        if (this.def.id === 'ruhra') {
            waveOnce('tease-corse-ruhra', WAVESUNG.markolinoCorseTease, 30000);
        }
        if (this.def.id === 'sorveglianza') {
            waveOnce('pedro-footage-visto', WAVESUNG.pedroFootage, 12000);
            waveOnce('tutorial-ombra-visto', WAVESUNG.markolinoOmbra, 45000);
        }
        if (this.def.id === 'cantina') {
            waveOnce('tease-arena-cantina', WAVESUNG.markolinoArenaTease, 30000);
        }
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
        this.boss = this.makeBoss(arena.x, arena.y - 20, kind);
        this.bossIntroShown = false;
        this.lightBoss(this.boss, this.boss.def.glowColor, 260, 1.0);
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
            const boss = this.makeBoss(cx, wy, 'walter');
            const full = boss.baseScale * 1.1;
            boss.baseScale = full * 0.3;
            this.boss = boss;
            this.bossIntroShown = true; // l'ingaggio lo faccio io dopo la crescita
            this.lightBoss(boss, boss.def.glowColor, 320, 1.1);
            this.setupBossColliders();
            this.cameras.main.shake(600, 0.01);
            this.cameras.main.flash(300, 22, 163, 74);
            this.tweens.add({
                targets: boss,
                baseScale: full,
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

    /* ---------- il void: due rimpianti di lametta, tre di piema ---------- */

    /** il primo rimpianto ancora in piedi: con l'ordine cambiato, contare non basta */
    private nextRegret(): number {
        const i = VOID_REGRETS.findIndex((k) => !state.hasFlag(`boss-down-${k}`));
        return i < 0 ? VOID_REGRETS.length : i;
    }

    private setupVoid(): void {
        this.voidStep = this.nextRegret();
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
        this.boss = this.makeBoss(arena.x, arena.y - 20, kind);
        this.bossIntroShown = false;
        this.lightBoss(this.boss, this.boss.def.glowColor, 260, 1.0);
        this.setupBossColliders();
    }

    /** un rimpianto è caduto: si rivela la verità e romero ti porta al prossimo */
    private onVeritaRivelata(idx: number): void {
        this.startDialogue(`verita-${idx + 1}`, () => {
            const next = this.nextRegret();
            this.voidStep = next;
            if (next >= VOID_REGRETS.length) {
                this.voidClimax();
                return;
            }
            // romero non teletrasporta: cammina col player verso la prossima arena (updateVoid)
            this.time.delayedCall(900, () => this.spawnRegret(next));
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
            // da fermo la guida si avvicina: così ci si parla senza rincorrerla
            const body = this.player.body as Phaser.Physics.Arcade.Body;
            const still = Math.abs(body.velocity.x) < 20 && body.blocked.down;
            const tx = this.player.x + side * (still ? 34 : 70);
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
                    this.boss = this.makeBoss(altar.x, altar.y - 30, 'trentatre');
                    this.boss.chase = true;
                    this.bossIntroShown = false;
                    this.lightBoss(this.boss, this.boss.def.glowColor, 320, 1.1);
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
            const mk = this.castSprite(mx, this.player.y, 'npc-markolino').setDepth(5);
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
        this.controls.update();
        if (this.controls.pressed('interact')) this.tryInteract();
        else if (this.controls.device === 'gamepad' && this.controls.pressed('up')
            && !this.controls.down('wave') && this.player.still && this.findNearestInteractable()) {
            // col pad interagisci premendo su da fermo, come a hallownest
            this.tryInteract();
        }
        if (this.controls.pressed('pause')) bus.emit('request-pause', {});
        this.player.update(time, delta);
        this.mechanic?.update(time, delta);

        if (!this.player.dead && this.player.y > this.level.heightPx + FALL_DEATH_MARGIN) {
            this.player.kill();
        }

        const target = this.clone && this.clone.active ? (this.clone as Phaser.GameObjects.Sprite) : this.player;
        // durante un flashback il ricordo è solo suo: il combattimento si congela
        const film = flashback.isPlaying;
        if (!film) {
            this.updateEnemies(time, delta, target);
            this.updateSpawners(time);
            this.boss?.update(time, delta, target);
            this.nucleusStraightening?.update(time, this.boss);
            this.voice?.update();
            this.ombraBrain?.update(time);
        }
        this.pedroGhost?.update(this.player);
        this.marks33?.update(this.player);
        this.seals?.update(time);
        this.updateLessons(time);
        this.lighting.update();
        this.terrain.update(this.cameras.main.worldView);
        this.parallax.update(time);
        this.ambience.update(this.layout ? !!this.roomAt(this.player.x, this.player.y)?.surface : !this.biome.indoor);
        this.water.update(time);

        this.trackSafePosition(delta);
        state.save.record.playMs += delta;
        state.flushPersist();
        state.run.nearMic = this.level.checkpoints.some((cp) => Math.abs(cp.x - this.player.x) < 110 && Math.abs(cp.y - this.player.y) < 110);
        this.checkExits();
        this.updatePrompt();
        // l'ingaggio aspetta la fine del film: niente dialoghi sopra il ricordo
        if (!flashback.isPlaying) this.updateBossTrigger();
        this.magnetBarre();
        this.updateClone(time, delta);
        this.updateHoming(delta);
        this.folk.update(time, delta, this.player, this.threats(), !!this.boss?.engaged);
        this.traps.update(time, delta, this.player);
        this.hazards.update(time, delta, this.player);
        this.trial?.update(this.player);
        this.updateArenaLock(time);
        this.updateExplore();
        this.updateBusStops();
        this.updateTrophies(time);
        const here = this.layout ? this.roomAt(this.player.x, this.player.y) : null;
        this.atmosphere.update(time, delta, this.layout ? !!here?.surface : !this.biome.indoor);
        // la notte ovatta la musica, ma i boss si sentono sempre a pieno
        music.setNight(this.boss?.engaged ? 0 : this.atmosphere.night * 0.85);
        // le vasche fisse del livello contano come le piene: testa sotto, mondo ovattato
        if (!this.player.headUnder && this.level.water.some((r) => r.contains(this.player.x, this.player.y - 16))) this.player.headUnder = true;
        this.soundscape.update(time, delta, { player: this.player, room: here, night: this.atmosphere.night, boss: !!this.boss?.engaged, rain: this.atmosphere.rainLevel });
        this.updateGuide(time);
        this.updateAnalisi(time);
        this.updateScudo(time);
        this.updateAcquaTossica(time, delta);
        this.updateAbilityFx(time);
        this.updatePoison(time);
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
        if (this.player.consumeSlamLanding()) this.slamLand(this.player.x, this.player.y);
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
                this.boss = this.makeBoss(at.x, at.y, 'pedro');
                this.boss.frenzy = true;
                this.lightBoss(this.boss, this.boss.def.glowColor, 320, 1.1);
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
        sfx.crumble();
        this.cameras.main.shake(80, 0.005);
        const burst = this.add.particles(wall.x, wall.y, 'p-spark', {
            speed: { min: 60, max: 200 },
            scale: { start: 0.8, end: 0 },
            tint: 0xcccccc,
            lifespan: 400,
            quantity: 12,
            stopAfter: 12,
        });
        this.time.delayedCall(800, () => burst.destroy());
        this.nav.open(Math.floor(wall.x / TILE), Math.floor(wall.y / TILE));
        wall.destroy();
    }

    /** l'impatto dello schianto: sfonda sotto i piedi e investe i nemici */
    private slamLand(x: number, y: number): void {
        const r = COMBAT.slamRadius;
        sfx.crumble();
        this.cameras.main.shake(180, 0.008);
        const dust = this.add.particles(x, y + 10, 'p-dot', {
            speed: { min: 60, max: 220 }, angle: { min: 200, max: 340 },
            scale: { start: 0.6, end: 0 }, alpha: { start: 0.6, end: 0 },
            tint: 0xa8a29e, lifespan: 450, quantity: 12, stopAfter: 12,
        }).setDepth(6);
        this.time.delayedCall(850, () => dust.destroy());
        const walls = this.level.breakableWalls.getChildren().filter((c) => {
            const w = c as Phaser.Physics.Arcade.Sprite;
            return Math.abs(w.x - x) < r && w.y > y - 20 && w.y < y + TILE * 1.5;
        });
        for (const w of walls) this.destroyBreakableWall(w as Phaser.Physics.Arcade.Sprite);
        for (const child of this.enemies.getChildren()) {
            const e = child as Enemy;
            if (e.active && Math.hypot(e.x - x, e.y - y) < r + 40) this.dmgTo(e, COMBAT.slamDamage, x);
        }
        for (const child of this.spawners.getChildren()) {
            const s = child as Spawner;
            if (s.active && !s.broken && Math.hypot(s.x - x, s.y - y) < r + 40) this.damageSpawner(s, COMBAT.slamDamage);
        }
        if (!state.hasFlag('spiegato-schianto')) {
            state.setFlag('spiegato-schianto');
            bus.emit('toast', { text: 'schianto! attacca ({k:attack}) mentre cadi per sfondare dall\u2019alto.' });
        }
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
        // se lo becca a metà carica, il busy resterebbe incastrato per sempre
        boss.release();
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
            this.completeChapterAndGo(target, spawnAt);
            return;
        }
        const hit = this.level.exits.some((r) => r.contains(this.player.x, this.player.y));
        if (!hit) return;
        // i boss non si superano scappando (quelli opzionali sì)
        if (this.boss?.active && this.boss.def.guardsExit !== false) {
            if (this.time.now > this.exitLockToastAt) {
                this.exitLockToastAt = this.time.now + 3000;
                bus.emit('toast', { text: `${this.boss.def.name.split(',')[0]} ti sbarra ancora la strada. segui la freccia.` });
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
                bus.emit('toast', { text: 'la via per il rio merdone è sbarrata. ti serve il trenbolone.' });
            }
            return;
        }
        this.completeChapterAndGo(this.def.next);
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
            this.completeChapterAndGo(target, spawnAt);
        });
    }

    /** uscita del capitolo con riepilogo animato: score una volta sola, poi la ui decide quando partire */
    private completeChapterAndGo(next: string, spawnAt?: { x: number; y: number }): void {
        if (this.exiting || this.player.dead || this.def.hub) {
            if (!this.exiting && !this.player.dead && this.def.hub) this.gotoLevel(next, spawnAt);
            return;
        }
        this.exiting = true;
        let summary = null;
        try {
            // finishChapter calcola, persiste ed emette chapter-score: da qui è idempotente
            const result = this.finishChapter();
            if (result) {
                const seen = new Set(state.save.explored[this.def.id] ?? []);
                summary = buildChapterSummary({
                    levelId: this.def.id,
                    title: this.def.title,
                    accentWord: this.def.accentWord,
                    color: this.def.color,
                    punchline: this.def.punchline,
                    visited: seen.size,
                    rooms: this.layout?.rooms.length ?? 0,
                    hearts: countsFor(this.def.id, 'heart'),
                    things: countsFor(this.def.id, 'thing'),
                    chapter: result.score,
                    lines: result.lines,
                    best: result.best,
                    assisted: result.assisted,
                    runTotal: runScore(0),
                });
            }
        } catch (e) {
            if (import.meta.env.DEV) console.warn('riepilogo capitolo saltato:', e);
        }
        if (!summary) {
            this.gotoLevel(next, spawnAt);
            return;
        }
        // il mondo aspetta dietro la carta: musica bassa, scena ferma
        music.setGraveDuck(true);
        this.scene.pause();
        let continued = false;
        const onContinue = (): void => {
            if (continued) return;
            continued = true;
            music.setGraveDuck(false);
            if (this.scene.isPaused()) this.scene.resume();
            this.gotoLevel(next, spawnAt);
        };
        try {
            bus.emit('chapter-summary-show', { summary, onContinue });
        } catch (e) {
            if (import.meta.env.DEV) console.warn('riepilogo capitolo saltato:', e);
            onContinue();
            return;
        }
        // senza ui pronta non si resta bloccati: transizione normale
        if (!document.querySelector('.chsum-overlay')) onContinue();
    }

    private gotoLevel(next: string, spawnAt?: { x: number; y: number }): void {
        if (next !== this.def.id) this.finishChapter();
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
            this.promptTxt.setText(keyLabel('interact'));
            this.prompt.setVisible(true);
            this.prompt.setPosition(near.x, near.y - 48 + Math.sin(this.time.now / 300) * 3);
        } else {
            this.prompt.setVisible(false);
        }
    }

    /* ---------- orientamento: stanze esplorate, obiettivo, freccia ---------- */

    private updateExplore(): void {
        if (!this.layout) return;
        const room = this.roomAt(this.player.x, this.player.y);
        if (!room || room.id === this.lastRoom) return;
        this.lastRoom = room.id;
        if (state.explore(this.def.id, room.id)) {
            if (state.save.explored[this.def.id].length >= this.layout.rooms.length && !state.hasFlag(`esplorata-${this.def.id}`)) {
                state.setFlag(`esplorata-${this.def.id}`);
                bus.emit('toast', { text: 'regione esplorata al 100%. la mappa è completa.' });
                unlockAchievement('cartografo');
                if (state.save.flags.filter((f) => f.startsWith('esplorata-')).length >= REGION_COUNT) unlockAchievement('gecografo');
            }
            state.persist();
        }
        regionView.room = room.id;
    }

    /** trofei e boss senza danni */
    private updateTrophies(time: number): void {
        const boss = this.boss;
        if (boss?.active && boss.engaged && boss.def.guardsExit !== false && !this.collapsePedro && !this.bossFight) {
            this.bossFight = { hit: false, hp: state.run.hp };
        }
        if (this.bossFight) {
            if (state.run.hp < this.bossFight.hp) this.bossFight.hit = true;
            this.bossFight.hp = state.run.hp;
        }
        if (time >= this.nextTrophyCheckAt) {
            this.nextTrophyCheckAt = time + 1000;
            checkAchievements();
        }
    }

    /** punteggio del capitolo quando lo lasci per andare avanti */
    private finishChapter(): { id: string; score: number; best: boolean; assisted: boolean; timeMs: number; lines: [string, string][] } | null {
        const run = state.save.chapterRun;
        if (!run || run.id !== this.def.id) return null;
        const timeMs = state.save.record.playMs - run.startMs;
        const deaths = state.save.record.deaths - run.deaths0;
        const kills = state.save.record.kills - run.kills0;
        const explored = this.layout ? (state.save.explored[this.def.id]?.length ?? 0) / this.layout.rooms.length : 1;
        const id = this.def.id;
        const secrets = countsFor(id, 'thing').found;
        const minutes = timeMs / 60000;
        const parts = chapterParts({ explored, secrets, kills, noHitBosses: run.noHitBosses, deaths, minutes });
        const score = sumParts(parts);
        // la partita assistita non fa punteggio: né record né somma della partita
        const assisted = achievementsBlocked();
        const prev = state.save.scores[id];
        const best = !assisted && (!prev || score > prev.score);
        if (best) state.save.scores[id] = { score, timeMs, deaths, kills, explored, secrets, assisted, rooms: this.layout?.rooms.length ?? 0, hearts: countsFor(id, 'heart'), things: countsFor(id, 'thing') };
        if (!assisted) state.save.runScores[id] = Math.max(state.save.runScores[id] ?? 0, score);
        if (id === 'perduta' && minutes < 6) unlockAchievement('speedrun');
        const lines = parts.filter(([, v]) => v !== 0).map(([k, v]) => [k, (v > 0 ? '+' : '') + v] as [string, string]);
        // il conto voce per voce resta nella bacheca: a schermo solo una notifica
        state.save.chapterLog = { ...state.save.chapterLog, [id]: { score, best, assisted, timeMs, lines, at: Date.now() } };
        state.save.chapterRun = null;
        state.persist();
        bus.emit('chapter-score', { id, score, best, assisted, timeMs });
        return { id, score, best, assisted, timeMs, lines };
    }

    /** il capitolo in corso, stimato come se finisse adesso (senza il bonus del tempo) */
    private liveChapterScore(): number {
        const run = state.save.chapterRun;
        if (!run || run.id !== this.def.id) return 0;
        const id = this.def.id;
        const explored = this.layout ? (state.save.explored[id]?.length ?? 0) / this.layout.rooms.length : 0;
        const secrets = countsFor(id, 'thing').found;
        return sumParts(chapterParts({
            explored, secrets, kills: state.save.record.kills - run.kills0, noHitBosses: run.noHitBosses, deaths: state.save.record.deaths - run.deaths0,
        }));
    }

    /** la partita finisce: prima il riepilogo cinematico, poi i titoli di coda */
    private endGame(id: 'consegna' | 'dei' | 'pedro' | 'sconfitta' | 'riscatto'): void {
        this.scene.pause();
        // a partita finita nessuno scontro resta aperto: barra, voce e battute si chiudono qui
        bus.emit('boss-hp', null);
        this.silenceBoss();
        bus.emit('bark-clear', {});
        const base = runScore(this.liveChapterScore());
        const bonus = ENDING_BONUS[id] ?? 0;
        const score = base === null ? null : base + bonus;
        const rank = score === null ? 0 : pushBoard({ name: state.save.playerName, score, ending: id, at: Date.now() });
        const assisted = base === null;
        // aggregati dai record dei capitoli: già salvati, niente da ricalcolare
        let visited = 0;
        let rooms = 0;
        let heartsFound = 0;
        let heartsTotal = 0;
        let thingsFound = 0;
        let thingsTotal = 0;
        for (const sc of Object.values(state.save.scores)) {
            if (!sc.rooms) continue;
            rooms += sc.rooms;
            visited += Math.round(sc.explored * sc.rooms);
            heartsFound += sc.hearts?.found ?? 0;
            heartsTotal += sc.hearts?.total ?? 0;
            thingsFound += sc.things?.found ?? 0;
            thingsTotal += sc.things?.total ?? 0;
        }
        const runSum = Object.values(state.save.runScores).reduce((s, v) => s + v, 0);
        const trophyPts = state.save.achievements.length * 10;
        const lines: [string, string][] = [];
        if (runSum > 0) lines.push(['capitoli', `+${runSum.toLocaleString('it-IT')}`]);
        if (trophyPts > 0) lines.push(['trofei', `+${trophyPts.toLocaleString('it-IT')}`]);
        if (bonus > 0) lines.push(['bonus finale', `+${bonus.toLocaleString('it-IT')}`]);
        const titles: Record<string, { title: string; win: boolean; color: 'green' | 'yellow' | 'cyan' | 'red' }> = {
            riscatto: { title: 'storto non vuol dire rotto', win: true, color: 'green' },
            consegna: { title: 'hai salvato il gecorealm', win: true, color: 'yellow' },
            dei: { title: 'ora il gecorealm è tuo', win: true, color: 'cyan' },
            pedro: { title: 'gli dei ti hanno raggiunto', win: false, color: 'red' },
            sconfitta: { title: 'il realm continua. tu no.', win: false, color: 'red' },
        };
        const end = titles[id] ?? titles.sconfitta;
        let summary = null;
        try {
            summary = buildFinalSummary({
                title: end.title,
                subtitle: end.win ? 'il realm tiene. questa volta davvero.' : 'ogni caduta insegna la strada.',
                color: end.color,
                visited,
                rooms,
                hearts: { found: heartsFound, total: heartsTotal },
                things: { found: thingsFound, total: thingsTotal },
                total: score,
                lines,
                best: rank === 1 && score !== null,
                rank,
                assisted,
            });
        } catch (e) {
            if (import.meta.env.DEV) console.warn('riepilogo finale saltato:', e);
        }
        if (!summary) {
            bus.emit('ending', { id, score, rank });
            return;
        }
        music.setGraveDuck(true);
        let continued = false;
        const onContinue = (): void => {
            if (continued) return;
            continued = true;
            music.setGraveDuck(false);
            bus.emit('ending', { id, score, rank });
        };
        try {
            bus.emit('final-summary-show', { summary, onContinue });
        } catch (e) {
            if (import.meta.env.DEV) console.warn('riepilogo finale saltato:', e);
            onContinue();
            return;
        }
        // senza ui pronta i titoli partono lo stesso
        if (!document.querySelector('.chsum-overlay')) onContinue();
    }

    /** cosa serve adesso per andare avanti, in ordine di urgenza */
    private currentObjective(): { x: number; y: number; label: string } | null {
        // la wave libera prima dell'uscita: se il capitolo nasconde un frammento
        // non ancora preso (es. la scivolata in perduta), la freccia ci porta lì.
        // in perduta markolino la annuncia: prima lui, poi il frammento, poi l'uscita.
        if (this.def.id === 'perduta' && !state.hasAbility('scivolata')) {
            const dono = this.npcAt.get('markolino-dono');
            if (dono && !state.hasFlag('markolino-dono-visto')) return { ...dono, label: 'markolino' };
        }
        const free = this.freeFragment();
        if (free) return free;
        const boss = this.boss;
        if (boss?.active && !boss.engaged && boss.def.guardsExit !== false) return { x: boss.x, y: boss.y, label: boss.def.name.split(',')[0] };
        const npc = (id: string, label: string) => {
            const at = this.npcAt.get(id);
            return at ? { ...at, label } : null;
        };
        if (this.def.script === 'ruhra' && !state.hasAbility('analisi')) return npc('piema-mente', 'piema');
        if (this.def.id === 'trenbolone' && !state.run.trenbolone && !state.hasFlag('boss-down-flauto')) return npc('spaccino', 'lo spaccino');
        if (this.def.script === 'indagine' && !state.hasFlag('void-concluso')) {
            const a = this.voidArenas[Math.min(this.voidStep, this.voidArenas.length - 1)];
            if (a) return { ...a, label: 'il prossimo rimpianto' };
        }
        if ((this.def.script === 'galliate' || this.def.script === 'marcetti') && this.baruffoniStep < this.baruffoniSeq().length) {
            const a = this.baruffoniArenas[this.baruffoniStep];
            if (a) return { ...a, label: 'la prossima arena' };
        }
        if (this.smelaArena && state.hasFlag('boss-down-danjilo')) return { ...this.smelaArena, label: 'la sorgente' };
        const exit = this.level.exits[0];
        if (exit) return { x: exit.centerX, y: exit.centerY, label: this.def.next ? 'uscita' : 'ritorno' };
        return null;
    }

    /** frammento della wave ancora a terra in questo capitolo, il più vicino: la freccia ci porta prima qui */
    private freeFragment(): { x: number; y: number; label: string } | null {
        if (!this.player) return null;
        let bx = 0;
        let by = 0;
        let bd = Infinity;
        let found = false;
        // prima quelli vivi nel mondo (es. il dono appena caduto ai piedi di markolino)
        for (const f of this.liveFragments) {
            if (state.hasAbility(f.ability)) continue;
            const d = Math.hypot(f.x - this.player.x, f.y - this.player.y);
            if (d < bd) { bd = d; bx = f.x; by = f.y; found = true; }
        }
        // fallback: piazzamenti statici del capitolo non ancora presi
        if (!found) {
            for (const e of this.level.entities) {
                if (e.spec.type !== 'ability' || state.hasAbility(e.spec.ability)) continue;
                const d = Math.hypot(e.x - this.player.x, e.y - this.player.y);
                if (d < bd) { bd = d; bx = e.x; by = e.y; found = true; }
            }
        }
        return found ? { x: bx, y: by, label: 'frammento della wave' } : null;
    }

    private buildGuide(): void {
        this.guideGfx = this.add.graphics().setDepth(9);
        regionView.id = this.def.id;
        regionView.layout = this.layout;
        regionView.markers = [
            ...this.level.checkpoints.map((c) => ({ x: c.x, y: c.y, kind: 'mic' as const })),
            ...this.level.exits.slice(0, 1).map((e) => ({ x: e.centerX, y: e.centerY, kind: 'exit' as const })),
            ...this.busStops.map((s) => ({ x: s.x, y: s.y, kind: 'stop' as const })),
            ...(this.seals ? this.seals.markers() : []),
        ];
    }

    /** freccia attorno al geco verso il prossimo varco giusto; sparisce in combattimento e quando sei arrivato */
    private updateGuide(time: number): void {
        const g = this.guideGfx;
        g.clear();
        const goal = this.currentObjective();
        regionView.player = { x: this.player.x, y: this.player.y };
        regionView.goal = goal;
        if (!goal || !state.settings.guide || this.player.dead || this.boss?.engaged || this.chaseSprite) return;
        // la BFS costa: vale finché player e bersaglio restano nelle stesse stanze;
        // l'obiettivo cambia (wave presa → uscita), quindi la chiave include anche il bersaglio
        const key = this.guide ? `${this.guide.roomAt(this.player.x, this.player.y)?.id ?? -1}:${this.guide.roomAt(goal.x, goal.y)?.id ?? -1}:${Math.round(goal.x)}:${Math.round(goal.y)}` : `direct:${Math.round(goal.x)}:${Math.round(goal.y)}`;
        let next = key === this.guideCacheKey ? this.guideCache : null;
        if (!next) {
            next = this.guide ? this.guide.nextPoint(this.player.x, this.player.y, goal.x, goal.y) : { x: goal.x, y: goal.y, rooms: 0 };
            this.guideCacheKey = key;
            this.guideCache = next;
        }
        if (!next) return;
        const dx = next.x - this.player.x;
        const dy = next.y - this.player.y;
        const d = Math.hypot(dx, dy);
        if (next.rooms === 0 && d < 140) return;
        const a = Math.atan2(dy, dx);
        const R = 64;
        const cx = this.player.x + Math.cos(a) * R;
        const cy = this.player.y - 6 + Math.sin(a) * R;
        const pulse = 0.55 + Math.sin(time / 260) * 0.2;
        const tip = { x: cx + Math.cos(a) * 11, y: cy + Math.sin(a) * 11 };
        const l = { x: cx + Math.cos(a + 2.5) * 10, y: cy + Math.sin(a + 2.5) * 10 };
        const r = { x: cx + Math.cos(a - 2.5) * 10, y: cy + Math.sin(a - 2.5) * 10 };
        g.fillStyle(0x000000, 0.6 * pulse);
        g.fillTriangle(tip.x + 2, tip.y + 2, l.x + 2, l.y + 2, r.x + 2, r.y + 2);
        g.fillStyle(ZONE_HEX[this.def.color], pulse);
        g.fillTriangle(tip.x, tip.y, l.x, l.y, r.x, r.y);
        g.lineStyle(2, 0x000000, 0.8 * pulse);
        g.strokeTriangle(tip.x, tip.y, l.x, l.y, r.x, r.y);
    }

    /** l'arena si chiude a scontro iniziato col player dentro, si riapre a boss caduto */
    private updateArenaLock(time: number): void {
        if (this.challenge) {
            this.updateChallenge(time);
            return;
        }
        const boss = this.boss;
        const fighting = !!boss?.active && boss.engaged && !boss.frenzy && !this.player.dead;
        if (this.arenaRoom) {
            // le scenette a metà scontro (ivan) fermano il boss ma non riaprono l'arena
            if (!boss?.active || this.player.dead) this.unlockArena();
            else this.drawArenaBars(time);
            return;
        }
        if (!fighting || !this.layout) return;
        const room = this.roomAt(boss!.x, boss!.y);
        if (!room || room.kind !== 'arena' || this.roomAt(this.player.x, this.player.y) !== room) return;
        // si chiude solo con il player ben dentro: mai sbarre addosso a chi sta sulla soglia
        const R = room.rect;
        const c = this.player.x / TILE;
        const r = this.player.y / TILE;
        if (c < R.x + 4 || c > R.x + R.w - 4 || r < R.y + 2 || r > R.y + R.h - 2) return;
        this.lockArena(room);
    }

    /** i rettangoli dei varchi della stanza, in pixel */
    private doorRects(room: Room): Phaser.Geom.Rectangle[] {
        const L = this.layout!;
        const out: Phaser.Geom.Rectangle[] = [];
        for (const d of L.doors) {
            if (d.a !== room.id && d.b !== room.id) continue;
            const A = L.rooms[d.a];
            const B = L.rooms[d.b];
            if (d.axis === 'h') {
                const right = A.rect.x < B.rect.x ? B : A;
                const left = right === A ? B : A;
                const bx = right.rect.x;
                const top = left.surface && right.surface ? 0 : d.y - 4;
                out.push(new Phaser.Geom.Rectangle((bx - 1) * TILE, top * TILE, TILE * 2, (d.y - top) * TILE));
            } else {
                const bottom = A.rect.y < B.rect.y ? B : A;
                out.push(new Phaser.Geom.Rectangle(d.x * TILE, (bottom.rect.y - 1) * TILE, d.len * TILE, TILE * 2));
            }
        }
        return out;
    }

    private lockArena(room: Room): void {
        this.arenaRoom = room;
        for (const r of this.doorRects(room)) {
            const bar = this.add.zone(r.centerX, r.centerY, r.width, r.height);
            this.physics.add.existing(bar, true);
            this.arenaBars.add(bar);
        }
        this.arenaGfx = this.add.graphics().setDepth(6);
        this.shake(220, 0.006);
        sfx.gate();
        sfx.bossRoar();
        bus.emit('toast', { text: 'le uscite si chiudono. o lui o te.' });
    }

    private unlockArena(): void {
        this.arenaBars.clear(true, true);
        this.arenaGfx?.destroy();
        this.arenaGfx = null;
        if (this.arenaRoom && !this.player.dead) {
            sfx.unlock();
            bus.emit('toast', { text: 'l\'arena si riapre.' });
        }
        this.arenaRoom = null;
    }

    /* ---------- sfide a ondate ---------- */

    /** una per regione, in una stanza laterale larga: sempre la stessa, scelta dall'id */
    private spawnChallenge(): void {
        const L = this.layout;
        if (!L?.spots?.length || this.def.hub) return;
        const rooms = L.rooms.filter((o) => o.pathIndex < 0 && (o.kind === 'hall' || o.kind === 'cave') && o.rect.w >= 18);
        const cands = rooms
            .map((room) => ({ room, spots: L.spots!.filter((sp) => sp[2] === room.id) }))
            .filter((o) => o.spots.length >= 3)
            // il microfono rosso resta fuori dai sigilli: due extra non si sovrappongono
            .filter((o) => !L.seals?.some((s) => s.room === o.room.id));
        if (!cands.length) return;
        const pickFrom = cands.slice().sort((a, b) => hashString(`${this.def.id}-${a.room.id}`) - hashString(`${this.def.id}-${b.room.id}`));
        for (const cand of pickFrom) {
            const sp = cand.spots[Math.floor(cand.spots.length / 2)];
            const x = sp[0] * TILE + TILE / 2;
            const y = (sp[1] + 1) * TILE - 18;
            if (this.interactables.some((it) => Math.abs(it.x - x) < 200 && Math.abs(it.y - y) < 140)) continue;
            const won = state.hasFlag(`arena-vinta-${this.def.id}`);
            const mic = this.castSprite(x, y - 12, 'mic').setDepth(4).setTint(won ? 0x64748b : 0xef4444);
            if (!won) this.lighting.static(x, y - 30, 0xef4444, 170, 0.9);
            const arenaKey = `arena-vinta-${this.def.id}`;
            const arenaLevel = this.def.id;
            expectCollectible(arenaLevel, arenaKey, 'thing', () => state.hasFlag(arenaKey));
            this.challengeSpot = { room: cand.room, x, y, mic };
            this.interactables.push({ x, y, range: 60, onInteract: () => this.offerChallenge() });
            return;
        }
    }

    private challengePoints(): { x: number; y: number }[] {
        const pts = this.challengeSpot ? [{ x: this.challengeSpot.x, y: this.challengeSpot.y }] : [];
        if (this.trial?.post) pts.push(this.trial.post);
        return pts;
    }

    /** la corsa contro il citelis: il palo con l'orario accanto a una fermata */
    private spawnTrial(): void {
        this.trial = null;
        if (!this.layout?.trials?.length || this.def.hub) return;
        const trial = new TimeTrial(this, this.lighting, this.def.id);
        const it = trial.setup(this.busStops, this.layout.trials);
        if (!it) return;
        this.trial = trial;
        this.interactables.push(it);
    }

    private offerChallenge(): void {
        const spot = this.challengeSpot;
        if (!spot || this.challenge || this.boss?.engaged) return;
        if (state.hasFlag(`arena-vinta-${this.def.id}`)) {
            bus.emit('toast', { text: 'il microfono rosso tace. questa arena l\'hai già vinta.' });
            return;
        }
        bus.emit('choice-show', {
            title: 'microfono rosso: tre ondate, porte chiuse, niente fuga. il pubblico vuole sangue.',
            options: [{ label: 'sali sul palco', danger: true }, { label: 'non ora' }],
            onPick: (i) => {
                if (i !== 0) return;
                this.challenge = { room: spot.room, wave: 0, enemies: [], nextAt: this.time.now + 900, x: spot.x, y: spot.y };
                this.lockArena(spot.room);
                bus.emit('toast', { text: 'sfida accettata. prima ondata.' });
            },
        });
    }

    private updateChallenge(time: number): void {
        const ch = this.challenge!;
        if (this.player.dead) {
            // chi muore sul palco perde la sfida: il pubblico se ne va, i mostri pure
            for (const e of ch.enemies) if (e.active) e.destroy();
            this.challenge = null;
            this.unlockArena();
            return;
        }
        this.drawArenaBars(time);
        ch.enemies = ch.enemies.filter((e) => e.active);
        if (ch.enemies.length || time < ch.nextAt) return;
        if (ch.wave === 3) {
            this.winChallenge();
            return;
        }
        ch.wave++;
        const kinds = [...new Set(this.level.entities.filter((e) => e.spec.type === 'enemy').map((e) => (e.spec as { kind: EnemyKind }).kind))];
        const pool: EnemyKind[] = kinds.length ? kinds : ['glitchetto'];
        const spots = (this.layout?.spots ?? []).filter((sp) => sp[2] === ch.room.id);
        const n = 2 + ch.wave;
        for (let k = 0; k < n; k++) {
            const sp = spots[(k * 7 + ch.wave * 3) % spots.length];
            const x = sp ? sp[0] * TILE + TILE / 2 : ch.x + (k - n / 2) * 60;
            const y = sp ? (sp[1] + 1) * TILE - 20 : ch.y;
            // mai addosso al geco: chi nasce troppo vicino si sposta dall'altra parte del palco
            const fx = Math.abs(x - this.player.x) < 160 ? ch.x * 2 - x : x;
            const elite = ch.wave === 3 && k === 0;
            this.spawnEnemy(pool[(k + ch.wave) % pool.length], fx, y, { hunting: true, elite });
            ch.enemies.push(this.enemies.getLast(true) as Enemy);
        }
        this.shake(160, 0.004);
        bus.emit('toast', { text: ch.wave === 3 ? 'ultima ondata. c\'è anche uno grosso.' : `ondata ${ch.wave} di 3.` });
        ch.nextAt = time + 1400;
    }

    private winChallenge(): void {
        this.challenge = null;
        this.unlockArena();
        state.setFlag(`arena-vinta-${this.def.id}`);
        state.save.barre += 180;
        state.addItem('panino-nonna', 2);
        state.persist();
        sfx.unlock();
        bus.emit('barre-changed', { barre: state.save.barre, gained: true });
        bus.emit('toast', { text: 'il pubblico impazzisce. +180 barre e due panini della nonna.' });
        this.challengeSpot?.mic.setTint(0x64748b);
        checkAchievements();
    }

    /** sbarre d'inchiostro che vibrano col colore del boss */
    private drawArenaBars(time: number): void {
        const g = this.arenaGfx;
        if (!g || !this.arenaRoom) return;
        g.clear();
        const color = this.boss?.def.glowColor ?? 0xffffff;
        for (const child of this.arenaBars.getChildren()) {
            const z = child as Phaser.GameObjects.Zone;
            const x0 = z.x - z.width / 2;
            const y0 = z.y - z.height / 2;
            const vertical = z.height >= z.width;
            const n = Math.max(2, Math.round((vertical ? z.width : z.width) / 14));
            g.fillStyle(0x05050a, 0.82);
            g.fillRect(x0, y0, z.width, z.height);
            g.lineStyle(3, color, 0.55 + Math.sin(time / 120) * 0.2);
            if (vertical) {
                for (let i = 0; i < n; i++) {
                    const x = x0 + ((i + 0.5) * z.width) / n + Math.sin(time / 90 + i) * 1.5;
                    g.lineBetween(x, y0, x, y0 + z.height);
                }
            } else {
                for (let i = 0; i < n; i++) {
                    const x = x0 + ((i + 0.5) * z.width) / n;
                    g.lineBetween(x, y0, x + Math.sin(time / 90 + i) * 2, y0 + z.height);
                }
            }
            g.lineStyle(2, 0x000000, 0.9);
            g.strokeRect(x0, y0, z.width, z.height);
        }
    }

    private updateBossTrigger(): void {
        if (!this.boss || this.boss.engaged || this.player.dead || this.exiting) return;
        const dist = Math.abs(this.player.x - this.boss.x);
        const near = dist < 440 && Math.abs(this.player.y - this.boss.y) < 380;
        // nelle regioni il boss si sveglia quando entri nella sua stanza, non attraverso la roccia
        const bossRoom = this.roomAt(this.boss.x, this.boss.y);
        if (bossRoom) {
            const inside = this.roomAt(this.player.x, this.player.y) === bossRoom;
            if (!inside && !(near && this.nav.sight(this.player.x, this.player.y - 10, this.boss.x, this.boss.y))) return;
        } else if (!near) {
            return;
        }
        // la formicona sta nella tana: non si sveglia se cammini sul soffitto
        if (this.boss.def.kind === 'formicona' && this.player.y < this.boss.y - 60) return;

        if (this.def.script === 'pedro' && !this.pedroChoiceShown) {
            this.pedroChoiceShown = true;
            // se hai camminato nei suoi ricordi, pedro lo sa. e gli pesa.
            const incontro = state.hasFlag('ricordi-visti') ? 'pedro-incontro-ricordi' : 'pedro-incontro';
            // chi ha ricomposto il quaderno gli mostra le pagine prima di rispondere
            const prima = (next: () => void) => (state.hasFlag('quaderno-completo') ? this.startDialogue(incontro, () => this.startDialogue('pedro-quaderno', next)) : this.startDialogue(incontro, next));
            prima(() => {
                // chi ha camminato nei ricordi ha una terza strada: la cartella del giorno 30
                const options = [{ label: 'seguilo: stats raddoppiate', danger: true }, { label: 'contrastalo' }];
                if (state.hasFlag('ricordi-visti')) options.push({ label: 'ricordagli il giorno 30' });
                bus.emit('choice-show', {
                    title: 'pedro aspetta una risposta.',
                    options,
                    onPick: (i) => {
                        if (i === 0) this.startPatto();
                        else if (i === 2) this.giorno30();
                        else this.boss?.engage();
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
        // il pensiero sepolto: il garante sa cosa ne hai fatto
        if (this.boss.def.kind === 'garante' && state.hasFlag('pensiero-cancellato')) introId = 'garante-cancellato';
        if (this.boss.def.kind === 'garante' && state.hasFlag('pensiero-portato')) introId = 'garante-prova';
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

    private onRisonante({ x, y, dir, level }: { x: number; y: number; dir: number; level?: number }): void {
        const lv = (level === 2 ? 2 : level === 1 ? 1 : 0) as 0 | 1 | 2;
        const key = lv === 2 ? FX.wave2 : lv === 1 ? FX.wave1 : FX.waveTap;
        const proj = this.playerProjectiles.create(x, y, key) as Phaser.Physics.Arcade.Sprite;
        proj.setDepth(5);
        proj.setFlipX(dir < 0);
        const speed = lv === 2 ? COMBAT.risonanteFullSpeed : lv === 1 ? COMBAT.risonanteSpeed : COMBAT.risonanteEcoSpeed;
        const life = lv === 2 ? COMBAT.risonanteFullLifeMs : lv === 1 ? COMBAT.risonanteLifeMs : COMBAT.risonanteEcoLifeMs;
        proj.setVelocityX(dir * speed);
        if (lv === 2) {
            const body = proj.body as Phaser.Physics.Arcade.Body;
            body.setSize(64, 64);
        }
        proj.setData('level', lv);
        proj.setData('trailAt', 0);
        proj.setData('waveAt', 0);
        this.lighting.follow(proj, 0x4ade80, 130, 0.8);
        const glow = this.add.image(x, y, `${key}~glow`).setDepth(4).setBlendMode(Phaser.BlendModes.ADD);
        proj.setData('trail', glow);
        this.time.delayedCall(life, () => proj.active && this.popProjectile(proj));
    }

    private onRiflesso({ x, y, facing }: { x: number; y: number; facing: number }): void {
        this.killClone();
        const clone = new Companion(this, x, y, facing < 0 ? -1 : 1);
        this.clone = clone;
        this.cloneUntil = this.time.now + COMBAT.riflessoDurationMs;
        this.cloneSwapUsed = false;
        this.player.riflessoSwapAvailable = true;
        this.lighting.follow(clone, 0x22d3ee, 180, 0.9);
        // gemello luminoso sopra: vetro rotto che slitta a scatti
        this.cloneTwin = this.add.image(x, y, clone.texture.key, clone.frame.name)
            .setScale(clone.scaleX).setAlpha(0.35).setTint(0xa5f3fc)
            .setBlendMode(Phaser.BlendModes.ADD).setDepth(5);
        this.cloneJitterAt = 0;
        this.cloneWaveAt = 0;
        // la nascita apre una stella di crepe
        const crack = this.add.image(x, y, FX.mirrorCrack).setDepth(6).setScale(0.4).setAlpha(0.9);
        const crackGlow = this.add.image(x, y, `${FX.mirrorCrack}~glow`).setDepth(5)
            .setBlendMode(Phaser.BlendModes.ADD).setScale(0.4).setAlpha(0.7);
        this.tweens.add({
            targets: [crack, crackGlow], scaleX: 1.4, scaleY: 1.4, alpha: 0, duration: 300,
            onComplete: () => { crack.destroy(); crackGlow.destroy(); },
        });
        sfx.mirrorBirth();
        // la nascita è la stessa decisione del lancio: il profilo l'ha già vista

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
                this.dmgTo(enemy, clone.attackDamage, clone.x);
            }),
            this.physics.add.overlap(clone.attackHitbox, this.spawners, (_hb, obj) => {
                if (!clone.attackActive) return;
                const s = obj as Spawner;
                clone.consumeSwing();
                this.cloneHitFx(s);
                this.damageSpawner(s, clone.attackDamage);
            }),
        );
        if (this.boss) {
            this.cloneColliders.push(
                this.physics.add.overlap(clone.attackHitbox, this.boss, (_hb, obj) => {
                    if (!clone.attackActive || !this.boss) return;
                    clone.consumeSwing();
                    this.cloneHitFx(obj as Phaser.GameObjects.Sprite);
                    this.dmgTo(this.boss, clone.attackDamage, clone.x);
                }),
            );
        }
    }

    /** seconda pressione: geco e clone si scambiano di posto */
    private onRiflessoSwap(): void {
        const clone = this.clone;
        if (!clone?.active || this.cloneSwapUsed) return;
        if (state.run.flow < COMBAT.riflessoSwapCost * state.mods.abilityCost) {
            bus.emit('toast', { text: TOASTS.noFlow });
            return;
        }
        state.run.flow -= COMBAT.riflessoSwapCost * state.mods.abilityCost;
        bus.emit('flow-changed', { flow: state.run.flow, maxFlow: state.maxFlow });
        this.cloneSwapUsed = true;
        this.player.riflessoSwapAvailable = false;
        const px = this.player.x;
        const py = this.player.y;
        this.player.setPosition(clone.x, clone.y);
        clone.setPosition(px, py);
        const body = this.player.body as Phaser.Physics.Arcade.Body;
        body.setVelocity(0, 0);
        this.player.grantInvuln(300);
        sfx.mirrorSwap();
        this.events.emit('player-act', { act: 'wave', wave: 'riflesso' });
        for (const [sx, sy] of [[this.player.x, this.player.y], [px, py]] as const) {
            for (let i = 0; i < 4; i++) {
                const s = this.add.image(sx, sy, FX.mirrorShard).setDepth(6);
                const a = Math.random() * Math.PI * 2;
                this.tweens.add({
                    targets: s,
                    x: sx + Math.cos(a) * 60,
                    y: sy + Math.sin(a) * 60,
                    angle: 200,
                    alpha: 0,
                    duration: 400,
                    ease: 'Quad.easeOut',
                    onComplete: () => s.destroy(),
                });
            }
        }
    }

    private killClone(): void {
        this.cloneColliders.forEach((c) => c.destroy());
        this.cloneColliders = [];
        this.cloneTwin?.destroy();
        this.cloneTwin = null;
        this.player.riflessoSwapAvailable = false;
        this.clone?.kill();
        this.clone = null;
    }

    private cloneHitFx(target: Phaser.GameObjects.Sprite): void {
        const fx = this.add.particles(target.x, target.y, 'p-spark', {
            speed: { min: 60, max: 140 },
            scale: { start: 0.5, end: 0 },
            tint: 0x22d3ee,
            lifespan: 200,
            quantity: 5,
            stopAfter: 5,
        }).setDepth(6);
        this.time.delayedCall(600, () => fx.destroy());
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

    /** il bersaglio vicino per il riflesso: senza nemici attorno resta fermo dov'è */
    private nearHostile(x: number, y: number): (Phaser.GameObjects.Sprite & { active: boolean }) | null {
        const h = this.nearestHostile(x, y);
        if (!h || Math.hypot(h.x - x, h.y - y) > 700) return null;
        return h;
    }

    private updateClone(time: number, delta: number): void {
        const clone = this.clone;
        if (!clone || !clone.active) return;
        if (time >= this.cloneUntil) {
            this.killClone();
            return;
        }
        clone.update(time, delta, this.nearHostile(clone.x, clone.y));
        // il gemello luminoso slitta a scatti come un vetro rotto
        if (this.cloneTwin) {
            this.cloneTwin.setPosition(clone.x, clone.y).setFrame(clone.frame.name).setFlipX(clone.flipX);
            if (time >= this.cloneJitterAt) {
                this.cloneJitterAt = time + 80 + Math.random() * 60;
                this.cloneTwin.x += Math.random() < 0.5 ? -2 : 2;
            }
        }
        // gancio per il piano 7: il clone tocca il mondo ogni 200 ms
        if (time - this.cloneWaveAt >= 200) {
            this.cloneWaveAt = time;
            const body = clone.body as Phaser.Physics.Arcade.Body | null;
            const w = body?.width ?? 36;
            const h = body?.height ?? 55;
            this.waveWorld('riflesso', clone.x, clone.y, new Phaser.Geom.Rectangle(clone.x - w / 2, clone.y - h / 2, w, h));
        }
    }

    private onAnalisi(): void {
        this.clearAnalisiFx();
        this.analisiStart = this.time.now;
        this.analisiUntil = this.analisiStart + COMBAT.analisiDurationMs;
        this.analisiPhase = 1;
        this.analisiQedDone = false;
        this.nextAnalisiTick = 0;
        this.analisiCircle = this.add.graphics().setDepth(5);
        sfx.chalk();
        this.cameras.main.flash(90, 96, 165, 250);
    }

    /** dimostrazione in tre tempi: ipotesi, passaggi, q.e.d. il cerchio segue il geco */
    private updateAnalisi(time: number): void {
        if (this.analisiPhase === 0) return;
        const elapsed = time - this.analisiStart;
        if (time >= this.analisiUntil) {
            this.clearAnalisiFx();
            return;
        }
        const px = this.player.x;
        const py = this.player.y;
        const r = COMBAT.analisiRadius;
        if (elapsed < 600) {
            // ipotesi: il cerchio si disegna e chi è dentro viene segnato
            const t = elapsed / 600;
            this.analisiCircle?.clear();
            this.analisiCircle?.lineStyle(4, 0xdbeafe, 0.85);
            this.analisiCircle?.beginPath();
            this.analisiCircle?.arc(px, py, r, -Math.PI / 2, -Math.PI / 2 + t * Math.PI * 2);
            this.analisiCircle?.strokePath();
            this.markAnalisiTargets(px, py, r);
        } else {
            if (this.analisiPhase === 1) {
                this.analisiPhase = 2;
                // passaggi: i sei teoremi cominciano a girare
                this.analisiGlyphs = FX.glyphs.map((k) => this.add.image(px, py, k).setDepth(6));
            }
            this.analisiCircle?.clear();
            this.analisiCircle?.lineStyle(2.5, 0xdbeafe, 0.5);
            this.analisiCircle?.strokeCircle(px, py, r);
            this.analisiGlyphs.forEach((g, i) => {
                const angle = time / 280 + (i * Math.PI * 2) / 6;
                g.setPosition(px + Math.cos(angle) * r * 0.7, py + Math.sin(angle) * r * 0.7);
                g.setRotation(angle + Math.PI / 2);
            });
            this.markAnalisiTargets(px, py, r);
            if (time >= this.nextAnalisiTick) {
                this.nextAnalisiTick = time + COMBAT.analisiTickMs;
                sfx.analisiTick();
                for (const obj of this.enemies.getChildren()) {
                    const e = obj as Enemy;
                    if (!e.active || Math.hypot(e.x - px, e.y - py) >= r) continue;
                    const mult = hitMult(e.arch.kind, 'analisi');
                    this.dmgTo(e, 1 * state.damageMult * mult, px);
                    this.weakFeedback(e, mult);
                    this.player.onAttackHit();
                }
                if (this.boss?.active && Math.hypot(this.boss.x - px, this.boss.y - py) < r + 40) {
                    this.dmgTo(this.boss, 1 * state.damageMult, px);
                    this.player.onAttackHit();
                }
            }
            if (elapsed >= 1800 && !this.analisiQedDone) {
                this.analisiQedDone = true;
                this.analisiPhase = 3;
                this.qedAnalisi(px, py, r);
            }
        }
        // le x restano sopra la testa di chi è segnato
        for (const [e, mark] of this.analisiMarks) {
            if (!e.active) {
                mark.destroy();
                this.analisiMarks.delete(e);
                this.analisiMarked.delete(e);
                continue;
            }
            mark.setPosition(e.x, e.y - 52);
        }
    }

    /** chi è nel cerchio viene segnato con una x di gesso */
    private markAnalisiTargets(px: number, py: number, r: number): void {
        for (const obj of this.enemies.getChildren()) {
            const e = obj as Enemy;
            if (!e.active || this.analisiMarked.has(e)) continue;
            if (Math.hypot(e.x - px, e.y - py) >= r) continue;
            this.analisiMarked.add(e);
            const mark = this.add.image(e.x, e.y - 52, FX.chalkX).setDepth(7);
            this.analisiMarks.set(e, mark);
        }
        if (this.boss?.active && !this.analisiBossMarked && Math.hypot(this.boss.x - px, this.boss.y - py) < r + 40) {
            this.analisiBossMarked = true;
        }
    }

    /** q.e.d.: chi è ancora segnato paga */
    private qedAnalisi(px: number, py: number, r: number): void {
        for (const e of [...this.analisiMarked]) {
            if (!e.active || Math.hypot(e.x - px, e.y - py) >= r) continue;
            const mult = hitMult(e.arch.kind, 'analisi');
            this.dmgTo(e, COMBAT.analisiQedDamage * state.damageMult * mult, px);
            const body = e.body as Phaser.Physics.Arcade.Body | null;
            body?.setVelocity(Math.sign(e.x - px) * 320, -200);
            this.weakFeedback(e, mult);
            this.player.onAttackHit();
        }
        if (this.analisiBossMarked && this.boss?.active && Math.hypot(this.boss.x - px, this.boss.y - py) < r + 40) {
            this.dmgTo(this.boss, COMBAT.analisiQedBossDamage * state.damageMult, px);
            this.player.onAttackHit();
        }
        this.analisiQed?.destroy();
        this.analisiQed = this.add.image(px, py - 70, FX.qed).setDepth(7).setScale(0.6).setAlpha(0);
        this.tweens.add({ targets: this.analisiQed, alpha: 1, scaleX: 1, scaleY: 1, duration: 220 });
        sfx.qed();
        this.cameras.main.flash(120, 219, 234, 254);
        this.waveWorld('analisi', px, py, new Phaser.Geom.Circle(px, py, r));
    }

    private clearAnalisiFx(): void {
        this.analisiPhase = 0;
        this.analisiQedDone = false;
        this.analisiMarked.clear();
        for (const m of this.analisiMarks.values()) m.destroy();
        this.analisiMarks.clear();
        this.analisiBossMarked = false;
        this.analisiGlyphs.forEach((g) => g.destroy());
        this.analisiGlyphs = [];
        this.analisiCircle?.destroy();
        this.analisiCircle = null;
        if (this.analisiQed) {
            const q = this.analisiQed;
            this.analisiQed = null;
            this.tweens.add({ targets: q, alpha: 0, duration: 300, onComplete: () => q.destroy() });
        }
    }

    /* ---------- tommasoscudo ---------- */

    private onScudo(): void {
        this.scudoUntil = this.time.now + COMBAT.scudoDurationMs;
        this.scudoStart = this.time.now;
        this.clearScudoFx();
        this.scudoBubble = this.add.image(this.player.x, this.player.y, FX.shieldPerfect).setDepth(6);
        this.scudoBubbleGlow = this.add.image(this.player.x, this.player.y, `${FX.shield}~glow`).setDepth(5)
            .setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.8);
        this.scudoRec = this.add.image(this.player.x + 44, this.player.y - 52, FX.rec).setDepth(7);
        sfx.crt();
        this.cameras.main.flash(70, 34, 211, 238);
        bus.emit('toast', { text: TOASTS.scudo });
    }

    private updateScudo(time: number): void {
        if (!this.scudoBubble) return;
        if (time >= this.scudoUntil) {
            this.clearScudoFx();
            return;
        }
        // i primi 220 ms il bordo è bianco e spesso: il rimando è perfetto
        const perfect = time - this.scudoStart < COMBAT.scudoPerfectMs;
        this.scudoBubble.setTexture(perfect ? FX.shieldPerfect : FX.shield);
        this.scudoBubble.setPosition(this.player.x, this.player.y);
        this.scudoBubble.setScale(1 + Math.sin(time / 90) * 0.03);
        this.scudoBubbleGlow?.setPosition(this.player.x, this.player.y);
        this.scudoRec?.setPosition(this.player.x + 44, this.player.y - 52);
    }

    private clearScudoFx(): void {
        this.scudoBubble?.destroy();
        this.scudoBubble = null;
        this.scudoBubbleGlow?.destroy();
        this.scudoBubbleGlow = null;
        this.scudoRec?.destroy();
        this.scudoRec = null;
        this.scudoGfx?.destroy();
        this.scudoGfx = null;
    }

    /** scritta a pennarello del rimando perfetto */
    private refundNote(): void {
        const note = this.add.image(this.player.x, this.player.y - 64, FX.refund).setDepth(7).setScale(0.7);
        this.tweens.add({ targets: note, y: note.y - 18, alpha: 0, duration: 600, onComplete: () => note.destroy() });
    }

    /** la bottiglia di smela: a terra la lanci ad arco, in aria la lasci cadere */
    private onAcquaTossica({ x, y, facing, aim }: { x: number; y: number; facing: number; aim: 'lob' | 'drop' }): void {
        const bottle = this.physics.add.sprite(x, y - 10, FX.bottle).setDepth(5);
        const body = bottle.body as Phaser.Physics.Arcade.Body;
        if (aim === 'lob') {
            const v = COMBAT.acquaBottleSpeed;
            body.setVelocity(facing * v * 0.82, -v * 0.57);
        } else {
            body.setVelocity(facing * 50, COMBAT.acquaBottleDropSpeed);
        }
        body.setAngularVelocity(facing * 540);
        body.setSize(20, 36);
        this.lighting.follow(bottle, 0x22d3ee, 120, 0.7);
        this.acquaBottles.push(bottle);
        sfx.bottleThrow();
        this.physics.add.collider(bottle, this.level.layer, () => this.burstBottle(bottle, null));
        this.physics.add.collider(bottle, this.level.breakableWalls, () => this.burstBottle(bottle, null));
        this.physics.add.overlap(bottle, this.enemies, (_b, obj) => this.burstBottle(bottle, obj as Enemy));
        if (this.boss) {
            this.physics.add.overlap(bottle, this.boss, (_b, obj) => this.burstBottle(bottle, obj as Boss));
        }
        this.time.delayedCall(3000, () => bottle.active && this.burstBottle(bottle, null));
    }

    /** la bottiglia scoppia: colpo diretto più pozza */
    private burstBottle(bottle: Phaser.Physics.Arcade.Sprite, hit: Enemy | Boss | null): void {
        if (!bottle.active) return;
        const x = bottle.x;
        const y = bottle.y;
        bottle.destroy();
        this.acquaBottles = this.acquaBottles.filter((b) => b !== bottle && b.active);
        sfx.bottleCrack();
        // schegge di plastica
        for (let i = 0; i < 7; i++) {
            const s = this.add.image(x, y, FX.shard).setDepth(6);
            const a = Math.random() * Math.PI * 2;
            this.tweens.add({
                targets: s,
                x: x + Math.cos(a) * (30 + Math.random() * 50),
                y: y + Math.sin(a) * (20 + Math.random() * 30),
                angle: 260,
                alpha: 0,
                duration: 420,
                ease: 'Quad.easeOut',
                onComplete: () => s.destroy(),
            });
        }
        // colpo diretto: effetto smela III, stordito e avvelenato (il boss non si stordisce)
        if (hit?.active) {
            this.applyPoison(hit);
            if (hit instanceof Enemy) {
                hit.stun(COMBAT.acquaDirectStunMs);
                this.dmgTo(hit, 1 * hitMult(hit.arch.kind, 'acqua'), x);
                this.player.onAttackHit();
            } else {
                this.dmgTo(hit, 1, x);
                this.player.onAttackHit();
            }
        }
        this.spawnPuddle(x, y);
        this.waveWorld('acquatossica', x, y, new Phaser.Geom.Circle(x, y, COMBAT.acquaRadius));
    }

    private spawnPuddle(x: number, y: number): void {
        while (this.acquaPuddles.length >= COMBAT.acquaMaxPuddles) {
            const old = this.acquaPuddles.shift();
            old?.img.destroy();
            old?.glow.destroy();
        }
        // la pozza sta sul pavimento sotto il punto di scoppio, mai a mezz'aria
        const c = Math.floor(x / TILE);
        let r = Math.floor(y / TILE);
        for (let k = 0; k < 10 && !this.nav.solid(c, r + 1); k++) r++;
        y = (r + 1) * TILE - 6;
        const img = this.add.image(x, y, FX.puddle).setDepth(3);
        const glow = this.add.image(x, y, `${FX.puddle}~glow`).setDepth(2)
            .setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.7);
        this.acquaPuddles.push({ img, glow, x, y, until: this.time.now + COMBAT.acquaDurationMs, nextTick: 0, waveAt: 0 });
        // una pozza sopra un getto di vapore lo spegne per un po'
        this.traps?.suppress(x, y, COMBAT.acquaRadius, 6000);
    }

    private updateAcquaTossica(time: number, _delta: number): void {
        const r = COMBAT.acquaRadius;
        for (let i = this.acquaPuddles.length - 1; i >= 0; i--) {
            const p = this.acquaPuddles[i]!;
            if (time >= p.until) {
                p.img.destroy();
                p.glow.destroy();
                this.acquaPuddles.splice(i, 1);
                continue;
            }
            const tick = time >= p.nextTick;
            if (tick) p.nextTick = time + COMBAT.acquaTickMs;
            // bolle che salgono e scoppiano
            if (tick && Math.random() < 0.6) sfx.bubble();
            if (tick) {
                const bubble = this.add.particles(p.x + (Math.random() - 0.5) * 120, p.y, 'p-dot', {
                    speed: { min: 20, max: 60 }, angle: { min: 250, max: 290 },
                    scale: { start: 0.4, end: 0 }, tint: 0x99f6e4, lifespan: 500, quantity: 2, stopAfter: 2,
                });
                this.time.delayedCall(800, () => bubble.destroy());
            }
            // gancio per il piano 7: la pozza tocca il mondo ogni 300 ms
            if (time - p.waveAt >= 300) {
                p.waveAt = time;
                this.waveWorld('acquatossica', p.x, p.y, new Phaser.Geom.Circle(p.x, p.y, r));
            }
            for (const obj of this.enemies.getChildren()) {
                const e = obj as Enemy;
                if (!e.active) continue;
                if (Math.abs(e.x - p.x) > r || Math.abs(e.y - p.y) > r * 0.7) continue;
                // rallentamento: smorza la velocità orizzontale finché è nella pozza
                const body = e.body as Phaser.Physics.Arcade.Body;
                body.velocity.x *= 0.45;
                this.applyPoison(e);
                if (tick) {
                    this.dmgTo(e, COMBAT.acquaDamage * hitMult(e.arch.kind, 'acqua'), e.x);
                    this.player.onAttackHit();
                }
            }
            if (this.boss?.active && Math.abs(this.boss.x - p.x) < r && Math.abs(this.boss.y - p.y) < r) {
                this.applyPoison(this.boss);
            }
        }
    }

    /** avvelenato: per 4 s prende più danni da tutto, tinto di verde-ciano */
    private applyPoison(target: Enemy | Boss): void {
        const until = this.time.now + COMBAT.poisonMs;
        if (!this.poisoned.has(target)) target.setTint(0x67e8a0);
        this.poisoned.set(target, until);
    }

    private updatePoison(time: number): void {
        for (const [target, until] of this.poisoned) {
            if (!target.active || time >= until) {
                if (target.active) target.clearTint();
                this.poisoned.delete(target);
            }
        }
    }

    /** danno del geco con l'avvelenamento: +30%, +15% sui boss */
    private dmgTo(target: Enemy | Boss, amount: number, fromX: number, dir?: 'side' | 'up' | 'down' | 'shot'): boolean {
        const poisoned = (this.poisoned.get(target) ?? 0) > this.time.now;
        const mult = poisoned ? (target instanceof Boss ? COMBAT.poisonBossMult : COMBAT.poisonMult) : 1;
        if (target instanceof Boss) return target.takeDamage(amount * mult, fromX, dir);
        target.takeDamage(amount * mult, fromX);
        return true;
    }

    /** il gancio per il piano 7: un'abilità tocca il mondo, i sigilli ascolteranno */
    private waveWorld(
        wave: 'risonante' | 'analisi' | 'scudo' | 'acquatossica' | 'riflesso' | 'scivolata',
        x: number,
        y: number,
        area: Phaser.Geom.Circle | Phaser.Geom.Rectangle,
        level?: number,
    ): void {
        this.events.emit('wave-world', { wave, x, y, area, level });
    }

    /** ricariche all'hud, scie dei proiettili, scivolata che tocca il mondo */
    private updateAbilityFx(time: number): void {
        if (time - this.lastCooldownEmit >= 100) {
            this.lastCooldownEmit = time;
            bus.emit('wave-cooldowns', { cds: this.player.cooldowns(), flow: state.run.flow });
        }
        if (this.player.isDashing && time - this.lastDashWaveAt >= 60) {
            this.lastDashWaveAt = time;
            const body = this.player.body as Phaser.Physics.Arcade.Body | null;
            const w = body?.width ?? 36;
            const h = body?.height ?? 55;
            this.waveWorld('scivolata', this.player.x, this.player.y,
                new Phaser.Geom.Rectangle(this.player.x - w / 2, this.player.y - h / 2, w, h));
        }
        for (const obj of this.playerProjectiles.getChildren()) {
            const proj = obj as Phaser.Physics.Arcade.Sprite;
            if (!proj.active) continue;
            const glow = proj.getData('trail') as Phaser.GameObjects.Image | undefined;
            if (glow) glow.setPosition(proj.x, proj.y);
            // scia di archi: una copia che svanisce, ogni 40 ms
            const level = (proj.getData('level') as number | undefined) ?? -1;
            if (level >= 0 && time - (proj.getData('trailAt') as number ?? 0) >= 40) {
                proj.setData('trailAt', time);
                const ghost = this.add.image(proj.x, proj.y, proj.texture.key, proj.frame.name)
                    .setFlipX(proj.flipX).setAlpha(0.5).setDepth(4);
                const pbody = proj.body as Phaser.Physics.Arcade.Body | null;
                if (pbody) ghost.setDisplaySize(pbody.width, pbody.height);
                this.tweens.add({ targets: ghost, alpha: 0, duration: 200, onComplete: () => ghost.destroy() });
            }
            // il colpo tocca il mondo mentre vola, ogni 60 ms
            const wave = level >= 0 ? 'risonante' as const : (proj.getData('reflected') ? 'scudo' as const : null);
            if (wave && time - (proj.getData('waveAt') as number ?? 0) >= 60) {
                proj.setData('waveAt', time);
                const pbody = proj.body as Phaser.Physics.Arcade.Body | null;
                const w = pbody?.width ?? 26;
                const h = pbody?.height ?? 18;
                this.waveWorld(wave, proj.x, proj.y,
                    new Phaser.Geom.Rectangle(proj.x - w / 2, proj.y - h / 2, w, h),
                    level >= 0 ? level : (proj.getData('perfect') ? 2 : 1));
            }
            // rimando perfetto: insegue chi l'ha sparato finché è vivo
            const homing = proj.getData('homing') as (Phaser.GameObjects.Sprite & { active: boolean }) | undefined;
            if (homing?.active) {
                const pbody = proj.body as Phaser.Physics.Arcade.Body | null;
                if (pbody) {
                    const dx = homing.x - proj.x;
                    const dy = homing.y - proj.y;
                    const speed = Math.hypot(pbody.velocity.x, pbody.velocity.y) || 400;
                    const cur = Math.atan2(pbody.velocity.y, pbody.velocity.x);
                    const want = Math.atan2(dy, dx);
                    let diff = want - cur;
                    while (diff > Math.PI) diff -= Math.PI * 2;
                    while (diff < -Math.PI) diff += Math.PI * 2;
                    const turn = Phaser.Math.Clamp(diff, -0.09, 0.09);
                    const next = cur + turn;
                    pbody.setVelocity(Math.cos(next) * speed, Math.sin(next) * speed);
                }
            } else if (homing && !homing.active) {
                proj.setData('homing', null);
            }
        }
    }
    private reflectProjectile(proj: Phaser.Physics.Arcade.Sprite): void {
        if (!proj.active) return;
        const body = proj.body as Phaser.Physics.Arcade.Body;
        const vx = body.velocity.x;
        const vy = body.velocity.y;
        const perfect = this.time.now - this.scudoStart < COMBAT.scudoPerfectMs;
        const shooter = proj.getData('shooter') as (Phaser.GameObjects.Sprite & { active: boolean }) | undefined;
        this.popProjectile(proj);
        const back = this.playerProjectiles.create(this.player.x, this.player.y - 6, 'proj-ball') as Phaser.Physics.Arcade.Sprite;
        back.setDepth(5);
        back.setTint(0x22d3ee);
        back.setData('dmg', perfect ? COMBAT.scudoReflectPerfect : COMBAT.scudoReflectNormal);
        back.setData('reflected', true);
        back.setData('perfect', perfect);
        back.setData('waveAt', 0);
        if (perfect && shooter?.active) back.setData('homing', shooter);
        const speed = Math.max(360, Math.hypot(vx, vy));
        const angle = Math.atan2(-vy, -vx);
        back.setVelocity(Math.cos(angle) * speed * 1.15, Math.sin(angle) * speed * 1.15);
        if (perfect) {
            sfx.perfectDing();
            this.refundNote();
            const target = shooter?.active ? shooter : null;
            if (target) {
                const dx = target.x - back.x;
                const dy = target.y - back.y;
                const d = Math.hypot(dx, dy) || 1;
                back.setVelocity((dx / d) * speed * 1.15, (dy / d) * speed * 1.15);
            }
        } else {
            sfx.slash();
        }
        this.time.delayedCall(2600, () => back.active && this.popProjectile(back));
    }

    /* ---------- inseguimenti nella tana ---------- */

    /** dialoghi per zona di caccia: la prima volta e la ricaduta */
    private static readonly CHASE_LINES = [
        { start: 'lochef-benvenuto', end: 'lochef-perso' },
        { start: 'lochef-ritorno', end: 'lochef-perso-2' },
    ];

    private updateChase(delta: number): void {
        // a boss sconfitto la tana è murata: niente più cacce al ritorno
        if (state.hasFlag('boss-down-lochef')) return;
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
                // arriva da dietro: dal lato opposto a dove ti porta la strada
                const goal = this.currentObjective();
                const next = goal && this.guide ? this.guide.nextPoint(this.player.x, this.player.y, goal.x, goal.y) : null;
                const ahead = next ? Math.sign(next.x - this.player.x) || 1 : 1;
                const cam = this.cameras.main.worldView;
                const sx = ahead > 0 ? cam.x - 60 : cam.right + 60;
                // fuori dalle luci: lochef si vede sempre, è lui la luce cattiva
                const chef = this.add.sprite(sx, this.player.y - 70, ensureCreature(this, 'boss-lochef'), 0).setDepth(7).setScale(1.25 / creatureRes(this, 'boss-lochef'));
                this.chaseSprite = chef;
                this.chaseStartedAt = this.time.now;
                this.chaseNearSince = 0;
                this.chaseTiredUntil = 0;
                this.lighting.follow(chef, 0xf87171, 300, 1.2);
                this.chaseTrail?.destroy();
                this.chaseTrail = this.add.particles(0, 0, 'p-dot', {
                    follow: chef,
                    speed: { min: 10, max: 40 },
                    scale: { start: 0.6, end: 0 },
                    alpha: { start: 0.5, end: 0 },
                    tint: 0xf87171,
                    lifespan: 600,
                    frequency: 60,
                }).setDepth(6);
                this.cameras.main.flash(160, 120, 10, 10);
                this.shake(260, 0.006);
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

        // fine corsa: lochef ti perde di vista. per ora. (o si stufa: nemmeno lui corre per sempre)
        const endP = this.chaseEnds[this.chaseZoneIdx] ?? Infinity;
        if (this.progressAt(this.player.x, this.player.y) >= endP || this.time.now - this.chaseStartedAt > 50000) {
            this.chaseDone[this.chaseZoneIdx] = true;
            this.chaseSprite = null;
            this.chaseTrail?.destroy();
            this.chaseTrail = null;
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

        // da nascosto lochef perde la traccia: punta l'ultimo punto visto, poi si allontana
        if (this.player.hidden) {
            const ls = this.chaseLastSeen;
            const hx = ls.x - chef.x;
            const hy = ls.y - 30 - chef.y;
            const hdist = Math.hypot(hx, hy) || 1;
            if (hdist > 70) {
                chef.x += (hx / hdist) * 235 * (delta / 1000);
                chef.y += (hy / hdist) * 235 * 0.75 * (delta / 1000);
            } else {
                const ax = chef.x - this.player.x;
                const ay = chef.y - this.player.y;
                const adist = Math.hypot(ax, ay) || 1;
                chef.x += (ax / adist) * 60 * (delta / 1000);
                chef.y += (ay / adist) * 60 * (delta / 1000);
                if (this.time.now >= this.chaseWhisperAt) {
                    this.chaseWhisperAt = this.time.now + 5000;
                    const lines = BOSS_BARKS.lochef?.extra?.whisper ?? [];
                    const raw = lines.length ? lines[this.chaseWhisperIdx++ % lines.length] : 'dove sei, piccolo?';
                    bus.emit('bark', { speaker: 'lochef85', color: 'red', text: typeof raw === 'string' ? raw : raw.text, urgent: true });
                }
            }
            chef.setFlipX(hx > 0);
            chef.setFrame(Math.floor(this.time.now / 110) % creatureFrames(this, 'boss-lochef'));
            return;
        }
        this.chaseLastSeen = { x: this.player.x, y: this.player.y };

        // fluttua verso di te, ma fa i gradini: in verticale è lento,
        // sui dislivelli si pianta in orizzontale. a elastico: lontano corre,
        // vicino ti lascia un respiro. vola, ma con la fatica di chi cucina.
        const dx = this.player.x - chef.x;
        const dy = this.player.y - 30 - chef.y;
        const dist = Math.hypot(dx, dy) || 1;
        let speed = dist > 620 ? 380 : dist > 320 ? 250 : 200;
        // partenza morbida: 1.5s per entrare in caccia, il salto iniziale non uccide
        const ramp = Math.min(1, (this.time.now - this.chaseStartedAt) / 1500);
        speed *= 0.4 + 0.6 * ramp;
        // fatica: dopo 8s a contatto (dist < 200) rallenta del 30% per 3s
        if (dist < 200) {
            if (!this.chaseNearSince) this.chaseNearSince = this.time.now;
            else if (this.time.now - this.chaseNearSince > 8000 && this.time.now >= this.chaseTiredUntil) {
                this.chaseTiredUntil = this.time.now + 3000;
                this.chaseNearSince = 0;
            }
        } else {
            this.chaseNearSince = 0;
        }
        if (this.time.now < this.chaseTiredUntil) speed *= 0.7;
        // gradini: in verticale scende a metà, in salita ancora più piano;
        // sul dislivello grosso (>120px) dimezza anche l'avanzata orizzontale
        let yFactor = 0.55;
        if (dy < 0) yFactor *= 0.65;
        const xFactor = Math.abs(dy) > 120 ? 0.5 : 1;
        chef.x += (dx / dist) * speed * xFactor * (delta / 1000);
        chef.y += (dy / dist) * speed * yFactor * (delta / 1000);
        chef.setFlipX(dx > 0);
        chef.setFrame(Math.floor(this.time.now / 110) % creatureFrames(this, 'boss-lochef'));
        // ondeggia: inquietante ma con stile
        chef.y += Math.sin(this.time.now / 200) * 0.6;

        if (dist < 45) {
            if (this.player.hurt(1, chef.x)) {
                // il colpo lo rallenta: ti vuole vivo
                chef.x -= Math.sign(dx) * 260;
            }
        }
    }

    /** la casa ti ha sentito nell'armadio: lochef torna in caccia da vicino */
    private onTanaSniffed(): void {
        const chef = this.chaseSprite;
        if (!chef?.active || this.player.dead || this.exiting) return;
        const side = chef.x < this.player.x ? -1 : 1;
        chef.x = this.player.x + side * 200;
        chef.y = this.player.y - 30;
        bus.emit('bark', { speaker: 'lochef85', color: 'red', text: 'la casa ti sente.', urgent: true });
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
                    this.silenceBoss();
                    this.voice = new BossVoice(this, LAMETTA_BARKS);
                    this.voice.say('engage', true);
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
        this.boss = this.makeBoss(a.x, a.y, 'smela');
        this.bossIntroShown = false;
        this.lightBoss(this.boss, this.boss.def.glowColor, 280, 1.0);
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
            this.voice?.event(`goccia-${this.colorDropsTaken}`);
            if (this.colorDropsTaken >= 5) {
                this.silenceBoss();
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
        const mirror = this.add.sprite(c.x + 180, c.y + 12, 'black-mirror').setDepth(5).setAlpha(0).setPipeline('Light2D');
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
            this.startDialogue('rio-cura');
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
                // la scelta della tecnokill si sente al primo agguato dopo
                const variant = state.hasFlag('tommasorveglianza') || state.hasFlag('notino-variante-detta') ? null
                    : state.hasFlag('notino-a-casa') ? 'notino-agguato-casa' : state.hasFlag('notino-disarmato') ? 'notino-agguato-vendetta' : null;
                if (variant) state.setFlag('notino-variante-detta');

                this.startDialogue(variant ?? dialogueId, () => {
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
            // con lo sparacchino di papà il primo notino è un osso duro
            const e = this.spawnEnemy('notino-mini', at.x, at.y, { hunting: true, elite: i === 0 && state.hasFlag('notino-disarmato') });
            this.physics.add.collider(e, this.level.layer);
            spawned.push(e);
        }
        return spawned;
    }

    /* ---------- il patto con pedro ---------- */

    private startPatto(): void {
        const pedro = this.boss;
        this.boss = null;
        // il patto chiude lo scontro: barra via, voce zitta, niente code
        bus.emit('boss-hp', null);
        this.silenceBoss();
        bus.emit('bark-clear', {});
        state.run.patto = true;
        state.run.hp = state.maxHp;
        state.run.flow = state.maxFlow;
        bus.emit('hp-changed', { hp: state.run.hp, maxHp: state.maxHp, hurt: false });
        bus.emit('flow-changed', { flow: state.run.flow, maxFlow: state.maxFlow });
        if (pedro) {
            // pedro ha quello che voleva: si dissolve in glitch
            const glitch = this.add.particles(pedro.x, pedro.y, 'p-spark', {
                speed: { min: 100, max: 300 },
                scale: { start: 1.2, end: 0 },
                tint: 0x22d3ee,
                lifespan: 500,
                quantity: 24,
                stopAfter: 24,
            });
            this.time.delayedCall(900, () => glitch.destroy());
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
            this.boss = this.makeBoss(x, y, 'dei');
            this.boss.invulnerable = true;
            this.boss.frenzy = true;
            this.lightBoss(this.boss, 0xffffff, 340, 1.2);
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

    private onEnemyShoot({ x, y, tx, ty, color, speed, size }: { x: number; y: number; tx: number; ty: number; color?: number; speed?: number; size?: number }): void {
        const proj = this.enemyProjectiles.create(x, y, 'proj-ball') as Phaser.Physics.Arcade.Sprite;
        proj.setDepth(5);
        proj.setTint(color ?? 0xf87171);
        // chi ha sparato: il rimando perfetto deve sapere a chi tornare
        const shooter = this.nearestHostile(x, y);
        if (shooter && Math.hypot(shooter.x - x, shooter.y - y) < 80) proj.setData('shooter', shooter);
        // ogni attacco ha la sua voce: il cecchino è un ago, la croce un mattone, la spirale ronza
        const v = speed ?? 330;
        const s = size ?? 1;
        proj.setScale(s);
        const angle = Math.atan2(ty - y, tx - x);
        proj.setVelocity(Math.cos(angle) * v, Math.sin(angle) * v);
        if (v >= 550) {
            // ago caldo: allungato nella direzione di volo + scia
            proj.setRotation(angle);
            proj.setScale(s * 1.6, s * 0.7);
            const trail = this.add.particles(0, 0, 'p-dot', {
                follow: proj, speed: 10, scale: { start: 0.45, end: 0 },
                tint: color ?? 0xffffff, lifespan: 220, frequency: 30,
            });
            trail.setDepth(4);
            proj.setData('trail', trail);
        } else if (s >= 1.1) {
            proj.setRotation(angle);
        }
        // pop di nascita: il colpo "esce" dal boss, non appare
        const pop = this.add.particles(x, y, 'p-dot', {
            speed: { min: 20, max: 80 }, scale: { start: 0.5, end: 0 },
            tint: color ?? 0xf87171, lifespan: 180, quantity: 3, stopAfter: 3,
        });
        pop.setDepth(4);
        this.time.delayedCall(400, () => pop.destroy());
        this.time.delayedCall(3200, () => proj.active && this.popProjectile(proj));
    }

    private onBossLamette({ xs, y }: { xs: number[]; y: number }): void {
        for (const x of xs) {
            // telegrafo a terra prima della lama
            const tele = this.add.particles(x, y + 40, 'p-dot', {
                speed: { min: 10, max: 50 },
                angle: { min: 250, max: 290 },
                scale: { start: 0.5, end: 0 },
                tint: 0xc084fc,
                lifespan: 350,
                quantity: 8,
                stopAfter: 8,
            });
            this.time.delayedCall(750, () => tele.destroy());
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
        (proj.getData('trail') as Phaser.GameObjects.Particles.ParticleEmitter | undefined)?.destroy();
        const pop = this.add.particles(proj.x, proj.y, 'p-dot', {
            speed: { min: 30, max: 90 },
            scale: { start: 0.4, end: 0 },
            lifespan: 200,
            quantity: 4,
            stopAfter: 4,
        });
        this.time.delayedCall(600, () => pop.destroy());
        proj.destroy();
    }

    private onEnemyDied({ x, y, kind, barre, splitsInto }: { x: number; y: number; kind: EnemyKind; barre: number; color: number; splitsInto: { kind: EnemyKind; count: number } | null }): void {
        this.shake(80, 0.004);
        sfx.death(kind);
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
        this.quests.onKill(kind);
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

    /** la prima volta che vedi un nemico simbolo, markolino ti dice come si batte */
    private updateLessons(time: number): void {
        if (time < this.nextLessonCheck || this.player.dead) return;
        this.nextLessonCheck = time + 300;
        for (const obj of this.enemies.getChildren()) {
            const e = obj as Enemy;
            if (!e.active || e.dormant) continue;
            const lesson = LESSONS[e.arch.kind];
            const flag = `lezione-${e.arch.kind}`;
            if (!lesson || state.hasFlag(flag) || (lesson.ability && !state.hasAbility(lesson.ability))) continue;
            if (Math.abs(e.x - this.player.x) > 520 || Math.abs(e.y - this.player.y) > 340) continue;
            if (!this.nav.sight(this.player.x, this.player.y - 10, e.x, e.y)) continue;
            state.setFlag(flag);
            bus.emit('wavesung', { sender: 'markolino', text: lesson.hint });
            return;
        }
    }

    /** la corazza suona, il punto debole brilla: la lezione si sente prima di leggerla */
    private weakFeedback(enemy: Enemy, mult: number): void {
        if (mult === 1) return;
        const weak = mult > 1;
        if (!weak) sfx.clang();
        const sparks = this.add.particles(enemy.x, enemy.y, 'p-spark', {
            speed: { min: 60, max: weak ? 260 : 140 }, scale: { start: weak ? 0.9 : 0.5, end: 0 },
            tint: weak ? 0xfacc15 : 0x9ca3af, lifespan: weak ? 380 : 220, quantity: weak ? 12 : 6, stopAfter: weak ? 12 : 6,
        }).setDepth(6);
        this.time.delayedCall(500, () => sparks.destroy());
    }

    /** il boss entra in scena: da qui parla, e se è l'ombra comincia a studiarti */
    private onBossEngaged(boss: Boss): void {
        this.silenceBoss();
        const set = barksFor(boss.def.kind);
        if (!set) return;
        const kind = boss.def.kind;
        const variant = kind === 'pedro' && state.hasFlag('quaderno-completo') ? '-quaderno' : '';
        this.voice = new BossVoice(this, set, { variant, texture: boss.def.texture });
        if (kind === 'ombra' && !state.hasFlag('tommasorveglianza')) this.voice.event('engage-beta');
        else if (kind === 'ticummi' && state.hasFlag('tommasorveglianza')) this.voice.event('engage-cliente');
        else this.voice.say('engage', true);
        if (kind === 'ombra') {
            const voice = this.voice;
            if (!voice) return;
            // la difficoltà è osservazione, non vita: un ritocco, mai una spugna
            const premium = state.save.ombra.premium;
            boss.empower(1 + Math.min(premium ? 0.12 : 0.03, state.save.ombra.sightings * 0.015));
            this.ombraBrain = new OmbraBrain({
                scene: this,
                boss,
                voice,
                player: this.player,
                profile: state.save.ombra,
                onInsight: (insight) => this.onOmbraInsight(insight),
            });
        }
    }

    /** l'ombra ha letto una mossa: etichetta, una riga, chip hud. niente numeri */
    private onOmbraInsight(insight: OmbraInsight): void {
        const boss = this.boss;
        if (!boss?.active || !this.voice) return;
        const label = `ha letto: ${insight.label}`;
        const txt = this.add.text(boss.x, boss.y - 100, label, {
            fontFamily: '"Martian Mono", monospace',
            fontSize: '12px',
            color: '#22d3ee',
            backgroundColor: 'rgba(0,0,0,0.55)',
        }).setOrigin(0.5).setDepth(9);
        this.tweens.add({ targets: txt, alpha: 0, y: boss.y - 118, duration: 1200, onComplete: () => txt.destroy() });
        const a = insight.action;
        let bark: string | null = null;
        if (a === 'attack-side') bark = 'spam-side';
        else if (a === 'attack-up') bark = 'spam-up';
        else if (a === 'attack-down') bark = 'spam-down';
        else if (a === 'dash') bark = 'learn-dash';
        else if (a === 'heal-start' || a === 'heal-done') bark = 'learn-heal';
        else if (a === 'wave-risonante' || a === 'wave-analisi') bark = 'learn-shot';
        else if ((a === 'wave-riflesso' || a === 'wave-acquatossica') && Math.random() < 0.3) bark = 'learn-shot';
        if (bark) this.voice.event(bark);
        bus.emit('ombra-read', { label });
    }

    private silenceBoss(): void {
        this.voice?.stop();
        this.voice = null;
        this.ombraBrain?.stop();
        this.ombraBrain = null;
    }

    private onBossDefeated({ kind, x, y }: { kind: BossKind; x: number; y: number }): void {
        this.boss = null;
        this.silenceBoss();
        bus.emit('bark-clear', {});
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
                    this.boss = this.makeBoss(rx, ry, replaced, hpOverride);
                    if (replaced === 'guggu' && state.hasFlag('ivan')) this.boss.invulnerable = false;
                    if (replaced === 'limite' && this.indiziRaccolti() >= 3) this.boss.invulnerable = false;
                    if (replaced === 'ticummi' && state.hasFlag('tommasorveglianza')) this.boss.summonOverride = 'eco';
                    this.lightBoss(this.boss, this.boss.def.glowColor, 280, 1.0);
                    this.setupBossColliders();
                }
            });
            return;
        }
        if (this.bossFight && !this.bossFight.hit) {
            unlockAchievement('intoccabile');
            if (state.save.chapterRun) state.save.chapterRun.noHitBosses++;
        }
        this.bossFight = null;
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
                this.spawnFragment(x, y + 60, 'rimbalzo', true);
                break;
            case 'breccio':
                this.startDialogue('breccio-morte', () => {
                    this.spawnFragment(x, y + 40, 'riflesso', true);
                });
                break;
            case 'notino':
                this.startDialogue('notino-sconfitto', () => {
                    this.spawnFragment(x, y + 40, 'risonante', true);
                    if (state.hasFlag('notino-a-casa') || state.hasFlag('notino-disarmato')) return;
                    const letto = state.save.collectedLore.includes('nota-tecnokill-1');
                    bus.emit('choice-show', {
                        title: letto
                            ? 'notino è a terra, lo sparacchino accanto. in tasca hai il post-it di sua madre.'
                            : 'notino è a terra, lo sparacchino accanto. piagnucola qualcosa su una pasta che si fredda.',
                        options: [{ label: 'rimandalo a casa' }, { label: 'sequestra lo sparacchino', danger: true }],
                        onPick: (i) => {
                            if (i === 0) {
                                state.setFlag('notino-a-casa');
                                this.startDialogue('notino-casa');
                            } else {
                                state.setFlag('notino-disarmato');
                                this.startDialogue('notino-disarmato', () => {
                                    expectCollectible(this.def.id, 'charm-sparacchino', 'thing', () => state.hasCharm('sparacchino'));
                                    state.giveCharm('sparacchino');
                                    bus.emit('charm-found', { id: 'sparacchino' });
                                });
                            }
                        },
                    });
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
                    this.spawnCuore(x, y + 40, 'cuore-lochef', true);
                    if (state.hasFlag('lochef-arrestato')) return;
                    state.setFlag('lochef-arrestato');
                    this.startDialogue('lochef-consegna', () => {
                        state.save.barre += 200;
                        state.persist();
                        bus.emit('barre-changed', { barre: state.save.barre, gained: true });
                        bus.emit('toast', { text: 'taglia della questura: +200 barre.' });
                        this.spawnOspite12();
                    });
                });
                break;
            case 'formicona':
                this.startDialogue('formicona-sconfitta', () => {
                    this.spawnCuore(x, y + 40, 'cuore-formicona', true);
                    this.spawnFragment(x + 60, y + 40, 'aggrappo', true);
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
                    this.spawnFragment(x, y + 40, 'acquatossica', true);
                    this.time.delayedCall(1500, () => bus.emit('wavesung', WAVESUNG.smelaRecensione));
                });
                break;
            case 'limite':
                this.startDialogue('romero-verdetto', () => {
                    state.setFlag('caso-risolto');
                    this.spawnCuore(x, y + 40, 'cuore-limite', true);
                });
                break;
            case 'teorema':
                this.startDialogue('mente-ordine', () => {
                    this.spawnFragment(x, y + 40, 'analisi', true);
                });
                break;
            case 'pedrino':
                this.startDialogue('pedrino-fine', () => {
                    state.setFlag('ricordi-visti');
                });
                break;
            case 'ombra':
                this.startDialogue('ombra-sconfitta', () => {
                    this.spawnFragment(x, y + 40, 'scudo', true);
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
                    this.spawnCuore(x, y + 40, 'cuore-barrato', true);
                    this.returnFromSecret(4500);
                });
                break;
            case 'custode':
                this.startDialogue('custode-morte', () => {
                    this.spawnCuore(x, y + 40, 'cuore-custode', true);
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
                    this.spawnCuore(x, y + 40, 'cuore-walter', true);
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
                                this.completeChapterAndGo('tana');
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
                this.startDialogue(state.hasFlag('quaderno-completo') ? 'pedro-sconfitto-quaderno' : 'pedro-sconfitto', () => this.sceltaFinale(x, y, false));
                break;
            case 'glitchpedro': {
                // il glitch si strappa via: pedro torna in sé
                const shell = this.pedroShell;
                this.nucleusStraightening?.shatter();
                if (shell?.scene) this.tweens.add({ targets: shell, alpha: 1, duration: 900 });
                state.setFlag('pedro-redento');
                this.startDialogue('pedro-redento', () => this.sceltaFinale(x, y, true));
                break;
            }
            case 'dei':
                this.time.delayedCall(800, () => {
                    this.endGame('dei');
                });
                break;
        }
    }

    /** il finale vero comincia qui: con le verità del void pedro si ferma e il nemico diventa l'ordine */
    private giorno30(): void {
        this.startDialogue('pedro-giorno30', () => {
            if (!state.hasFlag('void-concluso')) {
                this.startDialogue('pedro-giorno30-vuoto', () => this.boss?.engage());
                return;
            }
            this.startDialogue('pedro-verita', () => {
                const pedro = this.boss;
                if (!pedro) return;
                const { x, y } = pedro;
                this.boss = null;
                // pedro esce di scena spento: lo scontro con lui finisce qui
                bus.emit('boss-hp', null);
                this.silenceBoss();
                bus.emit('bark-clear', {});
                const boom = this.add.particles(x, y, 'p-spark', { speed: { min: 80, max: 260 }, scale: { start: 1.2, end: 0 }, tint: [0x22d3ee, 0xf87171], lifespan: 600, quantity: 30, stopAfter: 30 });
                this.time.delayedCall(1000, () => boom.destroy());
                this.tweens.add({ targets: pedro, alpha: 0.35, duration: 500 });
                // pedro resta lì, spento, mentre il glitch esce da lui
                pedro.engaged = false;
                pedro.setActive(false);
                (pedro.body as Phaser.Physics.Arcade.Body).enable = false;
                this.pedroShell = pedro;
                this.boss = this.makeBoss(x + 160, y - 60, 'glitchpedro');
                this.bossIntroShown = false;
                this.lightBoss(this.boss, this.boss.def.glowColor, 300, 1.1);
                this.setupBossColliders();
                this.startOrder();
                this.shake(500, 0.012);
            });
        });
    }

    /** l'ordine raddrizza il nucleo solo contro il glitch, mai per patto o dei */
    private startOrder(): void {
        const boss = this.boss;
        if (!boss || this.def.id !== 'nucleo' || !this.layout || !this.marks33) return;
        const room = this.roomAt(boss.x, boss.y);
        // nel ramo giorno 30 pedro non si è mai ingaggiato: l'arena si chiude
        // da sola dopo l'intro, qui basta che il glitch stia in una stanza arena
        if (!room || room.kind !== 'arena') {
            if (import.meta.env.DEV) console.warn('[ordine] niente arena valida, combattimento invariato');
            return;
        }
        const R = room.rect;
        this.nucleusStraightening?.destroy();
        this.nucleusStraightening = new NucleusStraightening({
            scene: this,
            player: this.player,
            terrain: this.terrain,
            marks: this.marks33,
            fakeWalls: this.level.fakeWalls,
            arenaBounds: new Phaser.Geom.Rectangle(R.x * TILE, R.y * TILE, R.w * TILE, R.h * TILE),
            arenaDoorRects: this.doorRects(room),
            solid: (c, r) => this.nav.solid(c, r),
            music,
            emitOrderShot: (x, y, tx, ty) => this.onEnemyShoot({ x, y, tx, ty, color: 0xf87171, speed: 360, size: 1 }),
        });
    }

    /** le wave dopo il finale vero: agli dei, a te, o a pedro */
    private sceltaFinale(x: number, y: number, redento: boolean): void {
        const after = () => {
            const options = [{ label: 'consegna le wave agli dei' }, { label: 'tienitele. sfida gli dei.', danger: true }];
            if (redento) options.push({ label: 'affidale a pedro, quello del giorno 30' });
            bus.emit('choice-show', {
                title: 'le wave tornano a chi le ha create?',
                options,
                onPick: (i) => {
                    if (i === 0) {
                        this.endGame('consegna');
                    } else if (i === 2) {
                        this.endGame('riscatto');
                    } else {
                        this.startDialogue('dei-rifiuto', () => {
                            this.finalGodsFight = true;
                            this.boss = this.makeBoss(x, y - 40, 'dei');
                            this.lightBoss(this.boss, 0xffffff, 320, 1.1);
                            this.setupBossColliders();
                            this.boss.engage();
                        });
                    }
                },
            });
        };
        if (!redento) {
            this.startDialogue('dei-incontro', after);
            return;
        }
        this.startDialogue('dei-processo', () => {
            if (state.hasFlag('caso-risolto') && state.hasFlag('pensiero-cancellato')) {
                // la riga originale l'hai cancellata tu: piema resta libero
                this.startDialogue('dei-processo-romero-solo', () => {
                    state.setFlag('lametta-arrestato');
                    this.startDialogue('dei-scelta-wave', after);
                });
            } else if (state.hasFlag('caso-risolto')) {
                this.startDialogue('dei-processo-romero', () => {
                    state.setFlag('dei-arrestati');
                    this.startDialogue('dei-scelta-wave', after);
                });
            } else {
                this.startDialogue('dei-scelta-wave', after);
            }
        });
    }

    /** colliders per un boss evocato dopo il create (gli dei) */
    private setupBossColliders(): void {
        if (!this.boss) return;
        this.physics.add.collider(this.boss, this.level.layer);
        this.physics.add.overlap(this.player.attackHitbox, this.boss, () => {
            if (!this.player.attackActive || !this.boss) return;
            this.player.attackActive = false;
            if (this.dmgTo(this.boss, this.player.attackDamage, this.player.x, this.player.attackDir)) {
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
            const level = (bullet.getData('level') as number | undefined) ?? -1;
            if (bullet.getData('reflected')) {
                const dmg = (bullet.getData('dmg') as number | undefined) ?? COMBAT.scudoReflectNormal;
                if (this.dmgTo(this.boss, dmg, bullet.x, 'shot')) this.player.onAttackHit();
            } else {
                const step = level === 2 ? 2 : level === 1 ? 1 : 0.5;
                if (this.dmgTo(this.boss, state.risonanteDamage * state.damageMult * step, bullet.x, 'shot')) {
                    this.player.onAttackHit();
                }
                if (level === 0) this.popProjectile(bullet);
            }
        });
    }

    private onPlayerDead(): void {
        state.save.record.deaths++;
        const lost = state.save.barre;
        // morto in uno scontro: la voce tace e la barra si toglie, alla ripresa si ricomincia
        this.silenceBoss();
        bus.emit('bark-clear', {});
        bus.emit('boss-hp', null);
        // le barre restano dove sei morto, stile souls
        state.dropped = lost > 0 ? { levelId: this.def.id, x: this.lastSafe.x, y: this.lastSafe.y, amount: lost } : null;
        state.save.barre = 0;
        state.persist();
        this.shake(300, 0.01);
        this.player.setTint(0xf87171);
        this.tweens.add({ targets: this.player, alpha: 0, angle: 180, duration: 600 });
        sfx.stopPad();
        music.tapeStop();
        acoustics.swell(1800, 0.8);
        this.time.delayedCall(900, () => {
            this.scene.pause();
            if (this.pattoActive) {
                // il patto finisce come doveva finire: morte definitiva
                this.endGame('pedro');
            } else if (this.finalGodsFight || this.collapsePedro) {
                // hai sfidato gli dei (o il collasso ti ha raggiunto): game over
                this.endGame('sconfitta');
            } else {
                bus.emit('player-died', { lost, score: runScore(this.liveChapterScore()) });
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
        const lit = this.add.particles(mic.x, mic.y - 10, 'p-spark', {
            speed: { min: 60, max: 180 },
            scale: { start: 0.8, end: 0 },
            tint: 0x4ade80,
            lifespan: 500,
            quantity: 16,
            stopAfter: 16,
        });
        this.time.delayedCall(900, () => lit.destroy());
    }

    /** chi è sveglio e cattivo, per i passanti che devono scappare */
    private threats(): { x: number; y: number }[] {
        const out = this.threatCache;
        out.length = 0;
        for (const child of this.enemies.getChildren()) {
            const e = child as Enemy;
            if (e.active && !e.dormant && (e.mode === 'chase' || e.mode === 'alert')) out.push({ x: e.x, y: e.y });
        }
        if (this.chaseSprite?.active) out.push({ x: this.chaseSprite.x, y: this.chaseSprite.y });
        return out;
    }

    private startDialogue(id: string, onEnd?: () => void): void {
        // mostra invece di raccontare: prima il flashback filmico, poi 1-2 righe al max
        const fbId = FLASHBACK_BEFORE[id];
        // certi flashback non si rigiocano: se visti altrove, solo le righe
        const already = fbId !== undefined && FLASHBACK_ONCE.has(id) && state.save.seenDialogues.includes(`fb-${fbId}`);
        if (fbId && !already && !flashback.isPlaying) {
            flashback.play(this, this.player, fbId, () => this.startLines(DIALOGUES[id], onEnd));
            return;
        }
        if (fbId && !already) {
            // un film sta già girando: si aspetta il suo turno, mai sopra
            this.time.delayedCall(1200, () => this.startDialogue(id, onEnd));
            return;
        }
        this.startLines(DIALOGUES[id], onEnd);
    }

    /** dialogo con righe costruite al volo (i passanti) */
    private startLines(lines: DialogueLine[] | undefined, onEnd?: () => void): void {
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
