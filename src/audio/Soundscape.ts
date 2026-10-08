import Phaser from 'phaser';
import type { BiomeDef } from '../content/biomes';
import type { Room } from '../world/types';
import type { NavGraph } from '../world/NavGraph';
import type { Player } from '../entities/Player';
import { bus } from '../core/events';
import { sfx, type Bed, type StepMaterial } from './sfx';
import { acoustics, type Space } from './acoustics';
import { rng } from '../core/rng';

/* ascolta il posto in cui sta il geco: quanta roccia ha sopra la testa,
   quanto sono lontane le pareti, se è sott'acqua, se c'è un boss. da qui
   l'acustica (ovattato, riverbero, eco), i letti d'ambiente del bioma, i
   suoni sporadici, i passi sul materiale del pavimento e il cuore */

type OneShot = 'drip' | 'clankFar' | 'beep' | 'cricket' | 'bird' | 'crow' | 'whisper' | 'bubble' | 'chime' | 'horn' | 'squeak' | 'traffic' | 'creak' | 'buzz' | 'pebble' | 'growlFar';

interface BiomeSound {
    /** acustica sotto terra (in superficie si sente l'aperto o la strada) */
    under: Space;
    /** in superficie rimbalza sui palazzi */
    urban?: boolean;
    /** quanto la roccia ovatta la musica qui (il void e la mente sono sogni, non grotte) */
    muffle: number;
    surfaceBeds: Partial<Record<Bed, number>>;
    underBeds: Partial<Record<Bed, number>>;
    /** suoni sporadici: [suono, peso, solo di giorno/notte] */
    surface: [OneShot, number, ('day' | 'night')?][];
    below: [OneShot, number, ('day' | 'night')?][];
    /** coda dell'eco per questo bioma (1 = normale): la tana rimbomba più del dovuto */
    echo?: number;
}

const SOUNDS: Record<string, BiomeSound> = {
    crater: { under: 'cave', muffle: 1, surfaceBeds: { wind: 0.6 }, underBeds: { cave: 0.8 }, surface: [['crow', 2, 'day'], ['bird', 2, 'day'], ['cricket', 4, 'night'], ['pebble', 1]], below: [['drip', 5], ['pebble', 2], ['growlFar', 1]] },
    depot: { under: 'sewer', urban: true, muffle: 1, surfaceBeds: { city: 0.6, wind: 0.2 }, underBeds: { cave: 0.5, water: 0.25 }, surface: [['horn', 2], ['traffic', 3], ['clankFar', 1], ['bird', 1, 'day']], below: [['drip', 4], ['clankFar', 2], ['horn', 1], ['squeak', 1]] },
    sanctum: { under: 'crystal', muffle: 0.8, surfaceBeds: { wind: 0.35, crystal: 0.3 }, underBeds: { crystal: 0.7, cave: 0.3 }, surface: [['chime', 3], ['bird', 1, 'day']], below: [['chime', 4], ['drip', 3], ['whisper', 1]] },
    wasteland: { under: 'metal', muffle: 1, surfaceBeds: { wind: 0.85, fire: 0.25 }, underBeds: { hum: 0.4, cave: 0.4, fire: 0.2 }, surface: [['clankFar', 3], ['buzz', 2], ['crow', 2, 'day'], ['pebble', 1]], below: [['clankFar', 3], ['buzz', 2], ['drip', 2]] },
    lab: { under: 'sewer', muffle: 1, surfaceBeds: { water: 0.3, hum: 0.25 }, underBeds: { water: 0.5, hum: 0.35 }, surface: [['bubble', 3], ['beep', 2], ['buzz', 1]], below: [['bubble', 4], ['drip', 3], ['beep', 2], ['buzz', 1]] },
    burrow: { under: 'cave', muffle: 1, echo: 1.7, surfaceBeds: { cave: 0.4, wind: 0.2 }, underBeds: { cave: 0.9 }, surface: [['creak', 2], ['squeak', 1]], below: [['drip', 4], ['squeak', 2], ['creak', 2], ['pebble', 2], ['growlFar', 1]] },
    swamp: { under: 'sewer', muffle: 1, surfaceBeds: { water: 0.5, wind: 0.25 }, underBeds: { water: 0.7, cave: 0.4 }, surface: [['bubble', 3], ['bird', 2, 'day'], ['cricket', 4, 'night'], ['crow', 1]], below: [['bubble', 3], ['drip', 4], ['squeak', 1]] },
    factory: { under: 'metal', muffle: 1, surfaceBeds: { hum: 0.5, wind: 0.2 }, underBeds: { hum: 0.7, water: 0.2 }, surface: [['clankFar', 4], ['beep', 1], ['buzz', 1]], below: [['clankFar', 4], ['drip', 3], ['buzz', 2], ['beep', 1]] },
    library: { under: 'library', urban: true, muffle: 0.85, surfaceBeds: { city: 0.25, wind: 0.25 }, underBeds: { cave: 0.3 }, surface: [['creak', 2], ['bird', 1, 'day'], ['cricket', 2, 'night']], below: [['creak', 3], ['whisper', 1], ['pebble', 1]] },
    mind: { under: 'crystal', muffle: 0.55, surfaceBeds: { crystal: 0.4, void: 0.3 }, underBeds: { crystal: 0.5, void: 0.4 }, surface: [['whisper', 3], ['chime', 2]], below: [['whisper', 4], ['chime', 3]] },
    noir: { under: 'sewer', urban: true, muffle: 1, surfaceBeds: { city: 0.6, wind: 0.2 }, underBeds: { water: 0.35, cave: 0.4 }, surface: [['traffic', 3], ['horn', 1], ['drip', 2]], below: [['drip', 5], ['squeak', 1], ['clankFar', 1]] },
    servers: { under: 'room', muffle: 0.9, surfaceBeds: { servers: 0.6, hum: 0.3 }, underBeds: { servers: 0.8, hum: 0.4 }, surface: [['beep', 4], ['buzz', 1]], below: [['beep', 5], ['buzz', 2]] },
    cellar: { under: 'room', muffle: 1, surfaceBeds: { cave: 0.4 }, underBeds: { cave: 0.7 }, surface: [['creak', 2], ['squeak', 2]], below: [['drip', 4], ['squeak', 3], ['creak', 2]] },
    memory: { under: 'cavern', muffle: 0.7, surfaceBeds: { void: 0.35, wind: 0.2 }, underBeds: { void: 0.45, cave: 0.3 }, surface: [['whisper', 2], ['chime', 2], ['creak', 1]], below: [['whisper', 3], ['chime', 2], ['drip', 2]] },
    void: { under: 'void', muffle: 0.4, surfaceBeds: { void: 0.8 }, underBeds: { void: 1 }, surface: [['whisper', 3], ['chime', 1]], below: [['whisper', 4], ['chime', 1], ['growlFar', 1]] },
    core: { under: 'metal', muffle: 0.9, surfaceBeds: { hum: 0.5, servers: 0.4 }, underBeds: { hum: 0.7, servers: 0.5 }, surface: [['beep', 3], ['buzz', 2], ['clankFar', 1]], below: [['beep', 3], ['buzz', 3], ['clankFar', 2]] },
    province: { under: 'cave', urban: true, muffle: 1, surfaceBeds: { city: 0.35, wind: 0.45 }, underBeds: { cave: 0.7 }, surface: [['traffic', 3], ['bird', 2, 'day'], ['cricket', 3, 'night'], ['crow', 1]], below: [['drip', 4], ['pebble', 2]] },
    piazza: { under: 'room', urban: true, muffle: 1, surfaceBeds: { city: 0.55, wind: 0.2 }, underBeds: { cave: 0.5 }, surface: [['traffic', 3], ['bird', 2, 'day'], ['cricket', 2, 'night'], ['horn', 1]], below: [['drip', 3]] },
};

const RAYS = 16;
const REACH = 22;

export interface SoundscapeInput {
    player: Player;
    room: Room | null;
    night: number;
    boss: boolean;
    rain: number;
}

export class Soundscape {
    private biome: BiomeDef;
    private sound: BiomeSound;
    private nav: NavGraph;
    private horizonRow: number | null;
    private probeAt = 0;
    private nextShotAt = 0;
    private nextBeatAt = 0;
    private stepDist = 0;
    private lastX = 0;
    private airborne = false;
    private fallSpeed = 0;
    private hp = 99;
    private underground = 0;
    private offs: (() => void)[] = [];

    constructor(scene: Phaser.Scene, biome: BiomeDef, nav: NavGraph, horizonRow: number | null) {
        this.biome = biome;
        this.sound = SOUNDS[biome.id] ?? SOUNDS.crater;
        this.nav = nav;
        this.horizonRow = horizonRow;
        acoustics.reset();
        this.offs.push(
            bus.on('hp-changed', ({ hp }) => (this.hp = hp)),
            bus.on('dialogue-start', () => acoustics.setDuck(0.55)),
            bus.on('dialogue-end', () => acoustics.setDuck(1)),
        );
        scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            this.offs.forEach((off) => off());
            sfx.stopBeds();
            acoustics.reset();
        });
    }

    update(time: number, _delta: number, input: SoundscapeInput): void {
        const p = input.player;
        if (time >= this.probeAt) {
            this.probeAt = time + 220;
            this.probe(input);
        }
        this.footsteps(p);
        if (time >= this.nextShotAt) {
            this.nextShotAt = time + 1800 + rng.fx.next() * 4200;
            this.oneShot(input.night);
        }
        // l'ultimo cuore batte in testa
        if (this.hp === 1 && !p.dead && time >= this.nextBeatAt) {
            this.nextBeatAt = time + 880;
            sfx.heartbeat(input.boss ? 0.7 : 1);
        }
    }

    /** raggi nella roccia: distanza delle pareti, soffitto, quanto è chiuso */
    private probe(input: SoundscapeInput): void {
        const p = input.player;
        const T = 32;
        const c0 = Math.floor(p.x / T);
        const r0 = Math.floor((p.y - 12) / T);
        let hits = 0;
        let sum = 0;
        let ceiling = false;
        for (let i = 0; i < RAYS; i++) {
            const a = (i / RAYS) * Math.PI * 2;
            const dx = Math.cos(a);
            const dy = Math.sin(a);
            let d = REACH;
            for (let k = 1; k <= REACH; k++) {
                const c = Math.round(c0 + dx * k);
                const r = Math.round(r0 + dy * k);
                if (!this.nav.inside(c, r)) {
                    // fuori dalla mappa: sopra è cielo, sotto e ai lati roccia
                    if (r >= 0) d = k;
                    break;
                }
                if (this.nav.solid(c, r)) {
                    d = k;
                    break;
                }
            }
            if (d < REACH) hits++;
            if (d < REACH && dy < -0.9) ceiling = true;
            sum += d;
        }
        const enclosure = hits / RAYS;
        const mean = sum / RAYS;
        const size = Math.max(0, Math.min(1, (mean - 3) / 13));
        const room = input.room;
        const inRock = room ? !room.surface : !!this.biome.indoor;
        const depth = this.horizonRow !== null ? Math.max(0, Math.min(1, (r0 - this.horizonRow) / 45)) : inRock ? 0.5 : 0;
        // sotto terra si entra piano: la musica non scatta tra una stanza e l'altra
        const target = inRock ? 1 : ceiling && enclosure > 0.7 ? 0.45 : 0;
        this.underground += (target - this.underground) * 0.35;
        const u = this.underground;

        let space: Space;
        if (u > 0.5) {
            space = this.sound.under;
            if (space === 'cave' && size > 0.55) space = 'cavern';
            if (space === 'room' && size > 0.6) space = 'library';
        } else if (u > 0.2) {
            space = this.sound.urban ? 'room' : 'cave';
        } else {
            space = this.sound.urban && enclosure > 0.2 ? 'street' : 'open';
        }
        if (input.boss && room?.kind === 'arena') space = this.sound.under === 'void' ? 'void' : 'arena';

        // nei capitoli tutti sotto terra l'ovattato è la normalità: si sente, ma la musica resta godibile
        const indoor = this.biome.indoor ? 0.75 : 1;
        const muffle = Math.min(0.85, u * (0.35 + 0.3 * depth + 0.15 * enclosure) * this.sound.muffle * indoor);
        const underwater = input.player.headUnder;
        acoustics.set({
            space,
            size: u > 0.5 ? size : size * 0.5,
            muffle,
            underwater,
            boss: input.boss,
            danger: this.hp === 1 ? 1 : 0,
            echoMul: this.sound.echo ?? 1,
        });

        // letti d'ambiente: superficie e sottosuolo si mescolano col grado di "sotto"
        const beds: Partial<Record<Bed, number>> = {};
        const add = (src: Partial<Record<Bed, number>>, k: number) => {
            for (const [b, v] of Object.entries(src) as [Bed, number][]) beds[b] = (beds[b] ?? 0) + v * k;
        };
        add(this.sound.surfaceBeds, 1 - u);
        add(this.sound.underBeds, u);
        // il vento soffia forte solo dove c'è aria aperta attorno
        if (beds.wind) beds.wind *= 0.4 + 0.6 * (1 - enclosure);
        // la pioggia sopra la testa, quando si è al coperto ma vicini alla superficie
        if (input.rain > 0.05 && u > 0.2 && depth < 0.3) beds['rain-roof'] = input.rain * 0.8;
        // durante i boss l'ambiente si fa da parte, sott'acqua resta solo il fondo
        const k = (input.boss ? 0.35 : 1) * (underwater ? 0.4 : 1);
        for (const b of Object.keys(beds) as Bed[]) beds[b] = (beds[b] ?? 0) * k;
        sfx.setBeds(beds);
    }

    private oneShot(night: number): void {
        const list = this.underground > 0.5 ? this.sound.below : this.sound.surface;
        const isNight = night > 0.5;
        const ok = list.filter(([, , when]) => !when || (when === 'night') === isNight);
        const total = ok.reduce((s, [, w]) => s + w, 0);
        if (!total) return;
        let x = rng.fx.next() * total;
        for (const [name, w] of ok) {
            x -= w;
            if (x > 0) continue;
            const pan = (rng.fx.next() * 2 - 1) * 0.85;
            const vol = 0.45 + rng.fx.next() * 0.55;
            sfx[name](pan, vol);
            return;
        }
    }

    private material(p: Player): StepMaterial {
        if (p.submerged) return 'water';
        return this.biome.material;
    }

    /** passi a distanza fissa e un tonfo all'atterraggio, più forte da più in alto */
    private footsteps(p: Player): void {
        const body = p.body as Phaser.Physics.Arcade.Body | null;
        if (!body || p.dead) return;
        const ground = body.blocked.down;
        if (!ground) {
            this.airborne = true;
            this.fallSpeed = Math.max(this.fallSpeed, body.velocity.y);
            this.lastX = p.x;
            return;
        }
        if (this.airborne) {
            this.airborne = false;
            if (this.fallSpeed > 260) sfx.land(this.material(p), this.fallSpeed / 900);
            this.fallSpeed = 0;
            this.stepDist = 0;
        }
        const dx = Math.abs(p.x - this.lastX);
        this.lastX = p.x;
        if (Math.abs(body.velocity.x) < 60 || dx > 40) return;
        this.stepDist += dx;
        if (this.stepDist >= 52) {
            this.stepDist = 0;
            sfx.step(this.material(p));
        }
    }
}
