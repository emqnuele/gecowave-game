import Phaser from 'phaser';
import { TILE } from '../config';
import { MECHANIC_HINTS } from '../content/story';
import { LEVELS, TOTAL_FRAGMENTS } from '../content/levels';
import { bus } from '../engine/events';
import { biomeFor } from '../content/biomes';
import { AmbienceManager } from '../engine/AmbienceManager';
import { DecorationManager } from '../engine/DecorationManager';
import { TerrainRenderer } from '../engine/TerrainRenderer';
import { WaterRenderer } from '../engine/WaterRenderer';
import { LightingManager } from '../engine/LightingManager';
import { loadLevel } from '../engine/LevelLoader';
import { ParallaxManager } from '../engine/ParallaxManager';
import { RoomBackdrops } from '../engine/RoomBackdrops';
import { loadRegion } from '../world/registry';
import { NavGraph } from '../engine/nav/NavGraph';
import { FolkManager } from '../engine/FolkManager';
import { TrapManager } from '../engine/TrapManager';
import { HazardManager } from '../engine/HazardManager';
import { StoryManager } from '../engine/StoryManager';
import { StagingManager } from '../engine/StagingManager';
import { flashback, type FilmHost } from '../engine/FlashbackManager';
import { QuestManager } from '../engine/QuestManager';
import { Atmosphere } from '../engine/Atmosphere';
import { Soundscape } from '../engine/audio/Soundscape';
import { expectBossRewards, sealLevel } from '../engine/ChapterCompletion';
import { hashString } from '../engine/art/ink';
import { sfx } from '../engine/sfx';
import { state } from '../engine/state';
import { music } from '../engine/music';
import { generateFogTexture } from '../engine/textures';
import { ensurePlayerSkin } from '../engine/playerSkin';
import { ensureAbilityFx } from '../engine/art/abilityFx';
import { prewarmCreatures } from '../engine/art/creatures';
import { Player, type PlayerHost } from '../entities/Player';
import { PedroApparition } from '../engine/PedroApparition';
import { TrentatreMarks } from '../engine/TrentatreMarks';
import { AbilitySeals } from '../engine/AbilitySeals';
import { createMechanic, type Mechanic } from '../engine/mechanics';
import { Input } from '../engine/input/Input';
import { RestartCarry } from '../game/carry';
import { GameContext } from '../game/context';
import { LevelWorld } from '../game/world/LevelWorld';
import { Dialogues } from '../game/Dialogues';
import { Interactions, type Interactable } from '../game/Interactions';
import { Rewards } from '../game/Rewards';
import { Arena } from '../game/Arena';
import { Bosses } from '../game/Bosses';
import { Enemies } from '../game/Enemies';
import { Feel } from '../game/Feel';
import { GameGroups } from '../game/groups';
import { Abilities } from '../game/abilities';
import { Combat } from '../game/Combat';
import { SafeGround } from '../game/SafeGround';
import { Challenges } from '../game/Challenges';
import { Doomsday } from '../game/Doomsday';
import { Guide } from '../game/Guide';
import { Progression } from '../game/Progression';
import { Travel } from '../game/Travel';
import { Npcs } from '../game/Npcs';
import { createChapter, indiziRaccolti, type ChapterScript } from '../game/chapters';
import { waveOnce } from '../game/chapters/shared/wave';
import type { SceneData } from '../game/context';
import { emitWorld, offWorld, onWorld, type WorldEvent, type WorldHandler } from '../engine/worldEvents';

const FALL_DEATH_MARGIN = 3000;

export class GameScene extends Phaser.Scene implements FilmHost, PlayerHost {
    private readonly carry = new RestartCarry();
    private ctx!: GameContext;
    private world!: LevelWorld;
    private player!: Player;
    /** il livello input: nessuno legge più tasti fisici */
    private controls!: Input;
    private bosses!: Bosses;
    private arena!: Arena;
    private groups!: GameGroups;
    private feel!: Feel;
    private enemies!: Enemies;
    private interactions!: Interactions;
    private dialogues!: Dialogues;
    private rewards!: Rewards;
    private abilities!: Abilities;
    private combat!: Combat;
    private safe!: SafeGround;
    private npcs!: Npcs;
    private chapter!: ChapterScript;
    private progression!: Progression;
    private travel!: Travel;
    private guide!: Guide;
    private challenges!: Challenges;
    private doomsday!: Doomsday;
    private lighting!: LightingManager;
    private parallax!: ParallaxManager;
    private terrain!: TerrainRenderer;
    private ambience!: AmbienceManager;
    private water!: WaterRenderer;
    /** pubblico per la facciata del film: le comparse si fermano durante il ricordo */
    folk!: FolkManager;
    private traps!: TrapManager;
    private hazards!: HazardManager;
    private story: StoryManager | null = null;
    private pedroGhost: PedroApparition | null = null;
    private marks33: TrentatreMarks | null = null;
    /** un frammento apre il mondo: sigilli sulle porte laterali, mai sul percorso */
    private seals: AbilitySeals | null = null;
    private staging: StagingManager | null = null;
    private quests!: QuestManager;
    private atmosphere!: Atmosphere;
    private soundscape!: Soundscape;
    /** la meccanica del bioma (porte a orario, correnti, telecamere...) */
    private mechanic: Mechanic | null = null;
    private playerLightRef: Phaser.GameObjects.Light | null = null;
    /** il flashback la spegne e la riaccende invece di distruggerla */
    vignette: Phaser.FX.Vignette | null = null;

    constructor() {
        super('GameScene');
    }

    init(data: SceneData): void {
        this.ctx = new GameContext(this, this.carry);
        const region = loadRegion(this, data.levelId);
        const def = region?.def ?? LEVELS[data.levelId];
        if (!def) throw new Error(`livello sconosciuto: ${data.levelId}`);
        this.world = this.ctx.world = new LevelWorld(this.ctx, def, region?.layout ?? null);
        music.playLevel(data.levelId);
    }

    create(data: SceneData): void {
        this.progression = this.ctx.flow = new Progression(this.ctx);
        this.bosses = this.ctx.bosses = new Bosses(this.ctx);
        this.arena = this.ctx.arena = new Arena(this.ctx);
        this.feel = this.ctx.feel = new Feel(this);
        this.enemies = this.ctx.enemies = new Enemies(this.ctx);
        this.bosses.silence();
        this.interactions = this.ctx.interactions = new Interactions(this.ctx);
        this.dialogues = this.ctx.dialogues = new Dialogues(this.ctx, this);
        this.rewards = this.ctx.rewards = new Rewards(this.ctx);
        this.abilities = this.ctx.abilities = new Abilities(this.ctx);
        this.combat = this.ctx.combat = new Combat(this.ctx);
        this.npcs = this.ctx.npcs = new Npcs(this.ctx);
        this.chapter = this.ctx.chapter = createChapter(this.ctx, this.world.def.id);
        this.travel = this.ctx.travel = new Travel(this.ctx);
        this.guide = this.ctx.guide = new Guide(this.ctx);
        this.doomsday = this.ctx.doomsday = new Doomsday(this.ctx);
        this.challenges = this.ctx.challenges = new Challenges(this.ctx);
        this.seals = null;
        // il capitolo comincia quando ci entri da fuori: morire e riprovare non azzera il cronometro
        if (state.save.chapterRun?.id !== data.levelId) {
            state.save.chapterRun = { id: data.levelId, startMs: state.save.record.playMs, deaths0: state.save.record.deaths, kills0: state.save.record.kills, noHitBosses: 0 };
        }

        generateFogTexture(this);
        // la pelle scelta alla forgia va in texture prima del player (costo una tantum)
        ensurePlayerSkin(this, state.save.skin);

        this.world.biome = biomeFor(this.world.def);
        this.lighting = this.ctx.lighting = new LightingManager(this);
        this.lighting.enable(this.world.biome);

        this.world.level = loadLevel(this, this.world.def, this.world.biome);
        ensureAbilityFx(this);
        prewarmCreatures(this, this.world.level.entities.map((e) => e.spec));
        this.world.level.layer.setDepth(2);
        this.world.level.spikes.setDepth(3, 0);
        this.world.nav = new NavGraph(this.world.def.grid);

        const t0 = performance.now();
        this.terrain = this.ctx.terrain = new TerrainRenderer(this, this.world.biome);
        this.terrain.build({ grid: this.world.def.grid, biome: this.world.biome, seedKey: this.world.def.id });
        if (import.meta.env.DEV) console.info(`[terrain] ${this.world.def.id}: ${Math.round(performance.now() - t0)}ms`);
        if (this.world.layout) new RoomBackdrops(this).build(this.world.layout, this.world.biome);

        this.parallax = new ParallaxManager(this);
        const reserved = [
            this.world.level.spawn,
            ...this.world.level.checkpoints,
            ...this.world.level.entities,
            ...this.world.level.exits.map((r) => ({ x: r.centerX, y: r.centerY })),
        ];
        new DecorationManager(this, this.lighting).decorate(this.world.def.grid, this.world.biome, this.world.def.id, reserved);
        this.water = new WaterRenderer(this);
        this.water.build(this.world.level.water, this.world.biome, this.lighting);
        this.ambience = new AmbienceManager(this);
        this.ambience.build(this.world.biome, this.world.def.grid, this.world.def.id);

        let sp = this.world.level.spawn;
        const cpId = data.checkpointId ?? null;
        if (cpId) {
            const cp = this.world.level.checkpoints.find((c) => c.id === cpId);
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
        this.player = new Player(this, sp.x, sp.y, this.controls, this);
        this.ctx.player = this.player;
        this.ctx.controls = this.controls;
        this.player.setDepth(4);
        this.playerLightRef = this.lighting.playerLight(this.player);
        this.safe = this.ctx.safe = new SafeGround(this.ctx, sp);

        this.groups = this.ctx.groups = new GameGroups(this);

        this.spawnEntities();
        this.enemies.spawnCaveSpawners();
        this.chapter.populate?.();
        this.travel.spawnCheckpoints();
        this.travel.spawnBusStops();
        this.folk = new FolkManager(this, this.world.nav, (lines) => this.dialogues.lines(lines));
        this.folk.populate({
            seed: this.world.def.id,
            biomeId: this.world.biome.id,
            eye: this.world.biome.accent,
            layout: this.world.layout,
            avoid: this.world.level.entities.filter((e) => e.spec.type === 'enemy' || e.spec.type === 'spawner' || e.spec.type === 'boss').map((e) => ({ x: e.x, y: e.y })),
            widthPx: this.world.level.widthPx,
            crowd: this.world.def.hub ? 18 : undefined,
        });
        this.interactions.add(...this.folk.talkables);
        this.quests = this.ctx.quests = new QuestManager(this, this.lighting, (lines, onEnd) => this.dialogues.lines(lines, onEnd));
        this.quests.setup(this.world.def.id, this.world.layout, this.world.biome.accent, this.player, [
            ...this.world.level.entities.filter((e) => e.spec.type !== 'enemy').map((e) => ({ x: e.x, y: e.y })),
            ...this.world.level.checkpoints.map((c) => ({ x: c.x, y: c.y })),
        ]);
        this.interactions.add(...this.quests.talkables);
        this.challenges.spawnChallenge();
        this.challenges.spawnTrial();
        this.story = new StoryManager(this, this.lighting, {
            dialogue: (id, onEnd) => this.dialogues.start(id, onEnd),
            choice: (title, options, onPick) => bus.emit('choice-show', { title, options, onPick }),
            forget: (t) => {
                this.interactions.remove(t);
            },
        });
        this.story.setup(this.world.def.id, this.world.layout, [
            sp,
            ...this.interactions.points(),
            ...this.world.level.entities.filter((e) => e.spec.type !== 'enemy').map((e) => ({ x: e.x, y: e.y })),
        ]);
        this.interactions.add(...this.story.talkables);
        // catalogo completo: da qui i denominatori del riepilogo sono stabili
        sealLevel(this.world.def.id, this.world.layout?.rooms.length ?? 0);
        // pedro in scena una volta per regione: due righe, poi si sfalda
        this.pedroGhost = new PedroApparition(this, this.lighting);
        this.pedroGhost.setup(this.world.def.id, this.world.layout);
        this.marks33 = this.ctx.marks33 = new TrentatreMarks(this);
        // il 33 affonda nel muro: roccia del bioma verso il fondo
        const rock = Phaser.Display.Color.IntegerToColor(this.world.biome.rock);
        const deep = Phaser.Display.Color.IntegerToColor(this.world.biome.deep);
        const tint = Phaser.Display.Color.GetColor(
            Math.round(rock.red * 0.35 + deep.red * 0.65),
            Math.round(rock.green * 0.35 + deep.green * 0.65),
            Math.round(rock.blue * 0.35 + deep.blue * 0.65),
        );
        this.marks33.build(this.world.def.id, [this.world.level.fakeWalls, this.world.level.breakableWalls], tint);
        // staging muto: una scena ambientale per regione, zero dialoghi
        this.staging = new StagingManager(this, this.lighting);
        this.staging.setup(this.world.def.id, this.world.layout, this.player);
        this.traps = this.ctx.traps = new TrapManager(this, this.world.nav);
        this.traps.populate({
            seed: this.world.def.id,
            biomeId: this.world.biome.id,
            layout: this.world.layout,
            rim: this.world.biome.rim,
            avoid: [
                sp,
                ...this.world.level.entities.filter((e) => e.spec.type !== 'enemy').map((e) => ({ x: e.x, y: e.y })),
                ...this.world.level.checkpoints.map((c) => ({ x: c.x, y: c.y })),
                ...this.travel.busStops,
                ...this.quests.talkables.map((t) => ({ x: t.x, y: t.y })),
                ...this.challenges.challengePoints(),
            ],
        });
        this.hazards = new HazardManager(this, this.world.nav, () => this.atmosphere?.weather === 'temporale' || this.atmosphere?.weather === 'pioggia');
        this.hazards.populate({
            seed: this.world.def.id,
            biomeId: this.world.biome.id,
            layout: this.world.layout,
            rim: this.world.biome.rim,
            deep: this.world.biome.rock,
            avoid: [sp, ...this.world.level.checkpoints.map((c) => ({ x: c.x, y: c.y })), ...this.travel.busStops],
        });
        this.physics.add.collider(this.player, this.hazards.group,
            (_p, slab) => this.hazards.landOn(slab as Phaser.GameObjects.GameObject),
            (_p, slab) => this.hazards.canLand(this.player, slab as Phaser.GameObjects.GameObject));
        if (this.world.layout && this.playerLightRef) {
            const enemyKinds = [...new Set(Object.values(this.world.def.entities).flatMap((e) => (e.type === 'enemy' ? [e.kind] : [])))]
                .filter((k) => k !== 'notino-mini' && k !== 'pittura-mini');
            this.mechanic = createMechanic({
                scene: this, regionId: this.world.def.id, nav: this.world.nav, layout: this.world.layout, water: this.world.level.water,
                lighting: this.lighting, playerLight: this.playerLightRef, player: this.player,
                avoid: [sp, ...this.world.level.checkpoints.map((c) => ({ x: c.x, y: c.y })), ...this.travel.busStops, ...this.interactions.points(),
                    ...this.world.level.entities.filter((e) => e.spec.type !== 'enemy').map((e) => ({ x: e.x, y: e.y }))],
                enemyKinds,
                spawnHunter: (kind, x, y) => {
                    const at = this.world.openSpotNear(x, y, 8);
                    this.enemies.spawnEnemy(kind, at.x, at.y, { hunting: true });
                },
                awakeEnemies: () => this.enemies.awakeEnemies(),
                quizDoor: (id, x, y) => this.chapter.quizDoor?.(id, x, y),
                trialRunning: () => !!this.challenges.trial?.active,
                chaseRunning: () => !!this.chapter.pursuer?.()?.active,
                chaseRanges: () => this.chapter.chaseRanges?.() ?? [],
                addInteractable: (x, y, range, onInteract) => {
                    const entry: Interactable = { x, y, range, onInteract };
                    this.interactions.add(entry);
                    return () => {
                        this.interactions.remove(entry);
                    };
                },
            });
        }
        // la casa ti sente: lochef torna in caccia da vicino
        const sniffedOff = bus.on('tana-sniffed', () => this.chapter.sniffed?.());
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            this.mechanic?.destroy();
            this.mechanic = null;
            this.bosses.silence();
            sniffedOff();
            this.pedroGhost?.destroy();
            this.pedroGhost = null;
            this.seals?.destroy();
            this.seals = null;
            this.chapter.destroy();
            this.marks33?.destroy();
            this.marks33 = null;
            this.folk.destroy();
            this.traps.destroy();
            this.hazards.destroy();
            this.challenges.trial?.stop();
        });
        this.rewards.spawnDroppedBarre();
        this.combat.setupColliders();
        this.setupEvents();
        this.setupCamera();
        this.parallax.build(this.world.def.color, this.world.def.id, this.world.biome, this.world.layout ? this.world.layout.horizonRow * TILE : this.world.level.heightPx);
        this.parallax.resize();
        this.atmosphere = new Atmosphere(this);
        this.atmosphere.build(this.world.biome, this.world.def.id);
        this.soundscape = new Soundscape(this, this.world.biome, this.world.nav, this.world.layout ? this.world.layout.horizonRow : null);
        this.interactions.buildPrompt();
        // i sigilli vivono nelle porte laterali: barriere, 33 e premi col save
        this.seals = new AbilitySeals({
            scene: this,
            regionId: this.world.def.id,
            layout: this.world.layout,
            player: this.player,
            nav: this.world.nav,
            lighting: this.lighting,
            fakeWalls: this.world.level.fakeWalls,
            breakableWalls: this.world.level.breakableWalls,
            getClone: () => {
                const c = this.abilities.decoy();
                if (!c?.active) return null;
                const body = c.body as Phaser.Physics.Arcade.Body | null;
                return { x: c.x, y: c.y, w: body?.width ?? 36, h: body?.height ?? 55 };
            },
            giveHeart: (x, y, key) => this.rewards.spawnCuore(x, y, key, true),
            giveItem: (x, y, item, key) => this.rewards.spawnItemPickup(x, y, item, 1, key, true),
            giveBarre: (x, y, amount, key) => this.rewards.spawnBarrePickup(x, y, amount, key),
            giveNotch: (x, y, key) => this.rewards.spawnItemPickup(x, y, 'tacca', 1, key, true),
        });
        this.guide.buildGuide(this.seals);

        this.chapter.dressStage?.();

        state.setFlag(`visto-${this.world.def.id}`);

        bus.emit('zone-changed', {
            title: this.world.def.title,
            accentWord: this.world.def.accentWord,
            color: this.world.def.color,
            punchline: this.world.def.punchline,
            showCard: data.showCard !== false,
        });
        bus.emit('barre-changed', { barre: state.save.barre, gained: false });
        bus.emit('abilities-changed', { abilities: state.abilities });
        bus.emit('fragments-changed', { count: state.abilities.length, total: TOTAL_FRAGMENTS });

        let introId = this.world.def.introDialogue;
        if (introId && this.chapter.introDialogue) introId = this.chapter.introDialogue(introId);
        this.dialogues.playIntro(introId, !!this.chapter.startsInDark?.());

        this.setupScript();
    }

    /* ---------- costruzione ---------- */

    private spawnEntities(): void {
        for (const { spec, x, y } of this.world.level.entities) {
            switch (spec.type) {
                case 'enemy': {
                    // una parte dei nemici dorme: si passa piano, o si sveglia tutto
                    const h = hashString(`${this.world.def.id}:${x}:${y}`);
                    const elite = this.enemies.isEliteSpot(x, y, h);
                    this.enemies.spawnEnemy(spec.kind, x, y, { sleeping: h % 100 < 35, elite, trait: elite ? null : this.enemies.traitFor(spec.kind, x, y, h) });
                    break;
                }
                case 'spawner': {
                    this.enemies.spawnSpawner(spec.kind, x, y, {
                        maxAlive: spec.maxAlive ?? 3,
                        intervalMs: spec.intervalMs ?? 3500,
                        radius: spec.radius ?? 600,
                    });
                    break;
                }
                case 'npc':
                    this.npcs.spawn(spec.id, x, y);
                    break;
                case 'ability':
                    if (!state.hasAbility(spec.ability)) this.rewards.spawnFragment(x, y, spec.ability);
                    break;
                case 'lore':
                    this.rewards.spawnLore(spec.id, x, y);
                    break;
                case 'barre':
                    this.rewards.spawnBarrePickup(x, y, spec.amount);
                    break;
                case 'cuore':
                    this.rewards.spawnCuore(x, y, `cuore-${this.world.def.id}-${Math.round(x)}-${Math.round(y)}`);
                    break;
                case 'maschera':
                    this.rewards.spawnMaschera(x, y, `maschera-${this.world.def.id}`);
                    break;
                case 'portal':
                    this.travel.spawnPortal(x, y, spec.to, spec.needsFlag, spec.label);
                    break;
                case 'item':
                    this.rewards.spawnItemPickup(x, y, spec.item, spec.amount ?? 1, `item-${this.world.def.id}-${Math.round(x)}-${Math.round(y)}`);
                    break;
                case 'boss': {
                    // i premi attesi si registrano al caricamento, anche a boss già caduto
                    expectBossRewards(this.world.def.id, spec.kind);
                    // i boss sconfitti restano sconfitti, regola souls
                    if (state.hasFlag(`boss-down-${spec.kind}`)) {
                        this.bosses.recoverReward(spec.kind, x, y);
                        break;
                    }
                    // l'ombra senza abbonamento è addestrata su poco footage
                    const hpOverride = spec.kind === 'ombra' && !state.hasFlag('tommasorveglianza') ? 34 : undefined;
                    this.bosses.current = this.bosses.make(x, y, spec.kind, hpOverride);
                    // pedro finale forte come il pedro del doomsday: raffica e inseguimento
                    if (spec.kind === 'pedro') this.bosses.current.frenzy = true;
                    // in ng+ ivan è già dei nostri: guggu si taglia subito
                    if (spec.kind === 'guggu' && state.hasFlag('ivan')) this.bosses.current.invulnerable = false;
                    // il limite si arresta solo con tutti e tre gli indizi
                    if (spec.kind === 'limite' && indiziRaccolti() >= 3) this.bosses.current.invulnerable = false;
                    // da cliente premium ticummi ha i tuoi dati: evoca echi di te
                    if (spec.kind === 'ticummi' && state.hasFlag('tommasorveglianza')) this.bosses.current.summonOverride = 'eco';
                    this.bosses.light(this.bosses.current, this.bosses.current.def.glowColor, 280, 1.0);
                    break;
                }
            }
        }
    }

    private setupCamera(): void {
        const cam = this.cameras.main;
        const pad = this.world.layout ? 220 : 0;
        cam.setBounds(0, -pad, this.world.level.widthPx, this.world.level.heightPx + pad * 2);
        // sotto la mappa c'è solo roccia: il margine della camera non deve mostrare il parallasse
        if (pad) this.add.rectangle(0, this.world.level.heightPx, this.world.level.widthPx, pad + 40, this.world.biome.deep).setOrigin(0, 0).setDepth(2);
        this.physics.world.setBounds(0, 0, this.world.level.widthPx, this.world.level.heightPx);
        cam.startFollow(this.player, true, 0.12, 0.12);
        cam.setDeadzone(50, 36);
        const applyZoom = () => {
            cam.setZoom(Math.max(1.05, this.scale.height / this.world.level.heightPx));
            this.parallax?.resize();
        };
        applyZoom();
        this.scale.on('resize', applyZoom);
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scale.off('resize', applyZoom));
        // chi comincia al buio resta al buio: gli occhi si aprono a fine intro
        if (this.chapter.startsInDark?.()) cam.fadeOut(0, 0, 0, 0);
        else cam.fadeIn(500, 0, 0, 0);
        this.vignette = cam.postFX ? cam.postFX.addVignette(0.5, 0.5, 0.86) : null;
    }

    private setupScript(): void {
        const hint = MECHANIC_HINTS[this.world.def.id];
        if (hint && this.mechanic) waveOnce(this, `meccanica-${this.world.def.id}`, hint, 12000);
        this.chapter.setup?.();
    }

    /* ---------- eventi ---------- */

    private setupEvents(): void {
        const on = <K extends WorldEvent>(event: K, fn: WorldHandler<K>, owner: object = this) => {
            onWorld(this, event, fn, owner);
            this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => offWorld(this, event, fn, owner));
        };
        on('player-risonante', this.abilities.onRisonante, this.abilities);
        on('player-riflesso', this.abilities.onRiflesso, this.abilities);
        on('player-riflesso-swap', this.abilities.onRiflessoSwap, this.abilities);
        on('player-analisi', this.abilities.onAnalisi, this.abilities);
        on('player-scudo', this.abilities.onScudo, this.abilities);
        on('player-acqua', this.abilities.onAcquaTossica, this.abilities);
        on('enemy-shoot', this.combat.onEnemyShoot, this.combat);
        on('enemy-died', this.enemies.onEnemyDied, this.enemies);
        on('enemy-explode', this.combat.onEnemyExplode, this.combat);
        on('enemy-fuse', () => sfx.fuse());
        on('enemy-drop', () => sfx.shriek());
        on('enemy-alert', this.enemies.onEnemyAlert, this.enemies);
        on('player-dead', this.progression.onPlayerDead, this.progression);
        on('boss-summon', this.enemies.onBossSummon, this.enemies);
        on('boss-lamette', this.combat.onBossLamette, this.combat);
        on('boss-defeated', this.bosses.onDefeated, this.bosses);
        on('boss-engaged', this.bosses.onEngaged, this.bosses);
        on('boss-dying', () => this.bosses.silence());
        // ogni mossa del geco nutre il profilo: l'ombra lo leggerà alla fine
        on('player-act', (act) => {
            state.observeOmbra(act);
            this.bosses.observe(act);
        });
        // mangiare è un canale da interrompere: l'ombra legge inizio e fine
        const offHealed = bus.on('player-healed', () => {
            emitWorld(this, 'player-act', { act: 'heal' });
        });
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => offHealed());
        // dal telefono si ordina, nel mondo si mangia: il boccone parte qui
        const offEat = bus.on('eat-requested', ({ id }) => {
            const msg = this.player.startEat(id);
            if (msg) bus.emit('toast', { text: msg });
        });
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => offEat());
        on('boss-phase', (({ phase }: { phase: number }) => this.bosses.onPhase(phase)));
    }

    /* ---------- facciata per film e geco ---------- */

    /** facciata del geco: con il clone vivo la seconda pressione è uno scambio */
    get cloneAlive(): boolean {
        return this.abilities.cloneAlive;
    }

    /** facciata del film: microfoni e pali si spengono durante il ricordo */
    setPropsVisible(v: boolean): void {
        this.travel.setPropsVisible(v);
    }

    /** facciata del film: i nemici spariscono durante il ricordo */
    get enemyGroup(): Phaser.GameObjects.Group {
        return this.groups.enemies;
    }

    /** facciata del film: il palco non va mai nell'arena del boss */
    findFlatStage(x: number, y: number): { x: number; y: number } | null {
        const bossRoom = this.bosses.current?.active ? this.world.roomAt(this.bosses.current.x, this.bosses.current.y) : null;
        return this.world.findFlatStage(x, y, bossRoom);
    }

    /* ---------- loop ---------- */

    update(time: number, delta: number): void {
        if (!this.player) return;
        this.controls.update();
        if (this.controls.pressed('interact')) this.tryInteract();
        else if (this.controls.device === 'gamepad' && this.controls.pressed('up')
            && !this.controls.down('wave') && this.player.still && this.interactions.nearest()) {
            // col pad interagisci premendo su da fermo, come a hallownest
            this.tryInteract();
        }
        if (this.controls.pressed('pause')) bus.emit('request-pause', {});
        this.player.update(time, delta);
        this.mechanic?.update(time, delta);

        if (!this.player.dead && this.player.y > this.world.level.heightPx + FALL_DEATH_MARGIN) {
            this.player.kill();
        }

        const target: Phaser.GameObjects.Sprite = this.abilities.decoy() ?? this.player;
        // durante un flashback il ricordo è solo suo: il combattimento si congela
        const film = flashback.isPlaying;
        if (!film) {
            this.enemies.updateEnemies(time, delta, target);
            this.enemies.updateSpawners(time);
            if (this.ctx.simulates) this.bosses.current?.update(time, delta, target);
            this.chapter.updateFoes?.(time);
            this.bosses.updateVoices(time);
        }
        this.pedroGhost?.update(this.player);
        this.marks33?.update(this.player);
        this.seals?.update(time);
        this.enemies.updateLessons(time);
        this.lighting.update();
        this.terrain.update(this.cameras.main.worldView);
        this.parallax.update(time);
        this.ambience.update(this.world.layout ? !!this.world.roomAt(this.player.x, this.player.y)?.surface : !this.world.biome.indoor);
        this.water.update(time);

        this.safe.track(delta);
        state.save.record.playMs += delta;
        state.flushPersist();
        state.run.nearMic = this.world.level.checkpoints.some((cp) => Math.abs(cp.x - this.player.x) < 110 && Math.abs(cp.y - this.player.y) < 110);
        this.progression.checkExits();
        this.interactions.updatePrompt();
        // l'ingaggio aspetta la fine del film: niente dialoghi sopra il ricordo
        if (!flashback.isPlaying) this.bosses.updateTrigger();
        this.enemies.magnetBarre();
        this.abilities.updateClone(time, delta);
        this.rewards.updateHoming(delta);
        this.folk.update(time, delta, this.player, this.threats(), !!this.bosses.current?.engaged);
        this.traps.update(time, delta, this.player);
        this.hazards.update(time, delta, this.player);
        this.challenges.trial?.update(this.player);
        this.updateArenaLock(time);
        this.progression.updateExplore();
        this.travel.updateBusStops();
        this.progression.updateTrophies(time);
        const here = this.world.layout ? this.world.roomAt(this.player.x, this.player.y) : null;
        this.atmosphere.update(time, delta, this.world.layout ? !!here?.surface : !this.world.biome.indoor);
        // la notte ovatta la musica, ma i boss si sentono sempre a pieno
        music.setNight(this.bosses.current?.engaged ? 0 : this.atmosphere.night * 0.85);
        // le vasche fisse del livello contano come le piene: testa sotto, mondo ovattato
        if (!this.player.headUnder && this.world.level.water.some((r) => r.contains(this.player.x, this.player.y - 16))) this.player.headUnder = true;
        this.soundscape.update(time, delta, { player: this.player, room: here, night: this.atmosphere.night, boss: !!this.bosses.current?.engaged, rain: this.atmosphere.rainLevel });
        this.guide.updateGuide(time);
        this.abilities.updateAnalisi(time);
        this.abilities.updateScudo(time);
        this.abilities.updateAcquaTossica(time);
        this.abilities.updateAbilityFx(time);
        this.abilities.updatePoison(time);
        this.chapter.update?.(time, delta);
        this.updateFakeWalls();
        if (this.player.consumeSlamLanding()) this.combat.slamLand(this.player.x, this.player.y);
        this.doomsday.update(time, delta);
        this.bosses.updateRhythm(time);

        if (state.run.trenbolone && Math.random() < 0.2) {
            this.feel.shake(60, 0.0006);
        }
    }

    private updateFakeWalls(): void {
        this.terrain.updateReveal(this.player.x, this.player.y);
    }

    /** l'arena si chiude a scontro iniziato col player dentro, si riapre a boss caduto */
    private updateArenaLock(time: number): void {
        if (this.challenges.active) {
            this.challenges.updateChallenge(time);
            return;
        }
        this.arena.updateBossLock(time);
    }

    private tryInteract(): void {
        if (this.player.dead || this.progression.exiting) return;
        this.interactions.nearest()?.onInteract();
    }

    /** chi è sveglio e cattivo, per i passanti che devono scappare: i nemici e lochef in caccia */
    private threats(): { x: number; y: number }[] {
        const out = this.enemies.threats();
        const chaser = this.chapter.pursuer?.();
        if (chaser?.active) out.push({ x: chaser.x, y: chaser.y });
        return out;
    }
}
