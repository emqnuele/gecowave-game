import type { FilmScript, Frame } from '../story/film/types';

// i fatti di ogni film sono quelli delle vecchie didascalie: si vedono invece di leggerli

const at = (x: number, y: number, zoom: number, rot?: number): Frame => ({ x, y, zoom, ...(rot ? { rot } : {}) });
const WIDE = at(600, -200, 1);

export const FILMS: Record<string, FilmScript> = {
    // lametta, notte fonda, carte ovunque: scrive «raddrizzalo tu», timbro alle 03:58, pedro esegue
    'fb-ordine': {
        set: 'studio', mood: 'notte', clock: '03:56',
        cast: {
            lametta: { who: 'lametta', x: 470, face: 1 },
            pedro: { who: 'pedro', x: 1140, face: -1, hidden: true },
        },
        props: {
            foglio: { kind: 'foglio', x: 580, y: -118, rot: 0.2 },
            matita: { kind: 'matita', x: 600, y: -150, rot: -0.5, hidden: true },
            timbro: { kind: 'timbro', x: 660, y: -112 },
        },
        shots: [
            { ms: 4400, cam: WIDE, to: { zoom: 1.08, x: 560 }, cues: [
                [200, { do: 'lean', who: 'lametta', angle: 0.16, ms: 1400 }],
                [1600, { do: 'sfx', play: 'scricchiolio' }],
                [2300, { do: 'say', who: 'lametta', text: 'sistemare il realm. stanotte no.' }],
                [4000, { do: 'sfx', play: 'porta' }],
            ] },
            { ms: 3600, cam: at(800, -130, 1.45), to: { x: 700 }, cues: [
                [0, { do: 'show', who: 'pedro', ms: 300 }],
                [100, { do: 'walk', who: 'pedro', to: 650, ms: 2000 }],
                [2200, { do: 'face', who: 'pedro', dir: -1 }],
                [2500, { do: 'lean', who: 'lametta', angle: 0, ms: 600 }],
                [2600, { do: 'say', who: 'pedro', text: 'mi hai chiamato?' }],
            ] },
            { ms: 3600, cam: at(560, -120, 2.5), to: { zoom: 2.7 }, focus: true, cues: [
                [100, { do: 'lean', who: 'lametta', angle: 0.22, ms: 400 }],
                [200, { do: 'prop', id: 'foglio', to: { x: 590, y: -110, rot: 0 }, ms: 400 }],
                [500, { do: 'prop', id: 'matita', show: true }],
                [600, { do: 'prop', id: 'matita', to: { x: 615, y: -122 }, ms: 300 }],
                [600, { do: 'sfx', play: 'matita' }],
                [950, { do: 'prop', id: 'matita', to: { x: 595, y: -116 }, ms: 300 }],
                [1000, { do: 'sfx', play: 'matita' }],
                [1350, { do: 'prop', id: 'matita', to: { x: 620, y: -114 }, ms: 300 }],
                [1700, { do: 'say', who: 'lametta', text: 'raddrizzalo tu.' }],
            ] },
            { ms: 1900, cam: at(600, -470, 2.3), cues: [
                [400, { do: 'clock', text: '03:58' }],
                [900, { do: 'sfx', play: 'timbro' }],
                [900, { do: 'shake', ms: 120, force: 0.006 }],
            ] },
            { ms: 4400, cam: at(560, -120, 1.5), to: { x: 640, zoom: 1.35 }, cues: [
                [0, { do: 'lean', who: 'lametta', angle: 0, ms: 200 }],
                [0, { do: 'prop', id: 'matita', hide: true }],
                [100, { do: 'give', id: 'foglio', from: 'lametta', to: 'pedro', ms: 900 }],
                [1300, { do: 'nod', who: 'pedro' }],
                [2000, { do: 'prop', id: 'foglio', hide: true }],
                [2000, { do: 'sfx', play: 'carta' }],
                [2400, { do: 'walk', who: 'pedro', to: 1140, ms: 1800 }],
                [4000, { do: 'sfx', play: 'porta' }],
                [4100, { do: 'hide', who: 'pedro', ms: 250 }],
            ] },
        ],
    },

    // la bottega prima della chiusura: lametta incappucciato compra una boccetta in più, scontrino delle 03:58
    'fb-notte': {
        set: 'bottega', mood: 'notte', clock: '03:57',
        cast: {
            stagista: { who: 'stagista', x: 560, face: 1 },
            lametta: { who: 'lametta', x: 1260, face: -1, tint: 0x6a6070 },
        },
        props: {
            boccetta: { kind: 'boccetta', x: 520, y: -300, hidden: true },
            scontrino: { kind: 'scontrino', x: 676, y: -150, hidden: true },
        },
        shots: [
            { ms: 4200, cam: WIDE, to: { zoom: 1.06 }, cues: [
                [300, { do: 'lean', who: 'stagista', angle: -0.08, ms: 1200 }],
                [1500, { do: 'sfx', play: 'campanello' }],
                [1800, { do: 'walk', who: 'lametta', to: 800, ms: 2200 }],
            ] },
            { ms: 4400, cam: at(690, -130, 1.5), cues: [
                [200, { do: 'say', who: 'lametta', text: 'una boccetta. anzi, una in più.' }],
                [2300, { do: 'nod', who: 'stagista' }],
                [2900, { do: 'give', id: 'boccetta', from: 'stagista', to: 'lametta', ms: 900 }],
                [3700, { do: 'sfx', play: 'vetro' }],
            ] },
            { ms: 3600, cam: at(800, -150, 2.5), to: { zoom: 2.7 }, focus: true, cues: [
                [300, { do: 'shiver', who: 'lametta', ms: 700 }],
                [400, { do: 'say', who: 'lametta', text: 'domani mi libero di un pensiero.' }],
            ] },
            { ms: 2200, cam: at(676, -180, 2.8), focus: true, cues: [
                [100, { do: 'sfx', play: 'cassa' }],
                [300, { do: 'prop', id: 'scontrino', show: true }],
                [300, { do: 'prop', id: 'scontrino', to: { y: -205 }, ms: 1200 }],
            ] },
            { ms: 1700, cam: at(600, -520, 2.4), cues: [
                [500, { do: 'clock', text: '03:58' }],
                [500, { do: 'sfx', play: 'clic' }],
            ] },
            { ms: 3400, cam: WIDE, cues: [
                [100, { do: 'walk', who: 'lametta', to: 1260, ms: 2000 }],
                [1800, { do: 'sfx', play: 'campanello' }],
                [2300, { do: 'light', id: 'lampada', intensity: 0.45, ms: 700 }],
            ] },
        ],
    },

    // l'atelier, pomeriggio: tre pennellate e gli occhi storti; prima dell'alba pedro trova il ritratto
    'fb-ritratto': {
        set: 'atelier', mood: 'pomeriggio',
        cast: {
            pedro: { who: 'pedro', x: 300, face: 1 },
            lametta: { who: 'lametta', x: 720, face: -1 },
            ritratto: { who: 'pedro', x: 580, y: -160, h: 150, rot: 0.14, tint: 0x3a2c40, still: true, hidden: true, depth: 2 },
        },
        shots: [
            { ms: 4400, cam: WIDE, to: { zoom: 1.05 }, cues: [
                [600, { do: 'sfx', play: 'pennello' }],
                [700, { do: 'alpha', who: 'ritratto', to: 0.35, ms: 300 }],
                [1700, { do: 'sfx', play: 'pennello' }],
                [1800, { do: 'alpha', who: 'ritratto', to: 0.7, ms: 300 }],
                [2800, { do: 'sfx', play: 'pennello' }],
                [2900, { do: 'alpha', who: 'ritratto', to: 1, ms: 300 }],
            ] },
            { ms: 3600, cam: at(700, -140, 1.6), cues: [
                [200, { do: 'walk', who: 'lametta', to: 800, ms: 500 }],
                [800, { do: 'face', who: 'lametta', dir: -1 }],
                [1000, { do: 'say', who: 'lametta', text: 'gli occhi un po\' storti. fidati, è arte.' }],
            ] },
            { ms: 2400, cam: at(300, -110, 2.2), focus: true, cues: [
                [600, { do: 'hop', who: 'pedro' }],
            ] },
            { ms: 4800, cam: WIDE, to: { x: 520, zoom: 1.12 }, cues: [
                [0, { do: 'light', id: 'finestra', intensity: 0.14, ms: 0 }],
                [0, { do: 'light', id: 'finestra2', intensity: 0.1, ms: 0 }],
                [0, { do: 'dark', to: 0.5, ms: 0 }],
                [0, { do: 'hide', who: 'lametta', ms: 0 }],
                [400, { do: 'sfx', play: 'grilli' }],
                [600, { do: 'walk', who: 'pedro', to: 470, ms: 1900 }],
                [2700, { do: 'lean', who: 'pedro', angle: 0.14, ms: 800 }],
                [3800, { do: 'say', who: 'pedro', text: 'venuto bene.' }],
            ] },
        ],
    },

    // il deserto sopra la 14 barrato: ivan spinge il bus sepolto, il bus non si muove; guggu da allora gira in tondo
    'fb-bus': {
        set: 'deserto', mood: 'notte',
        cast: {
            ivan: { who: 'ivan', x: 120, face: 1 },
            guggu: { who: 'bus', x: 1300, y: -10, face: -1, h: 120, hidden: true },
        },
        shots: [
            { ms: 4600, cam: at(330, -200, 1), to: { x: 560, zoom: 1.05 }, cues: [
                [200, { do: 'sfx', play: 'vento' }],
                [400, { do: 'walk', who: 'ivan', to: 350, ms: 3200 }],
            ] },
            { ms: 4400, cam: at(400, -100, 1.7), to: { zoom: 1.85 }, cues: [
                [100, { do: 'lean', who: 'ivan', angle: 0.42, ms: 500 }],
                [700, { do: 'sfx', play: 'spinta' }],
                [700, { do: 'shiver', who: 'ivan', ms: 3000 }],
                [800, { do: 'shake', ms: 2600, force: 0.003 }],
                [1800, { do: 'sfx', play: 'sabbia' }],
                [2900, { do: 'sfx', play: 'spinta' }],
            ] },
            { ms: 2600, cam: at(610, -60, 2.3), focus: true, cues: [
                [200, { do: 'sfx', play: 'sabbia' }],
                [300, { do: 'shake', ms: 900, force: 0.002 }],
            ] },
            { ms: 3000, cam: at(360, -110, 1.7), cues: [
                [300, { do: 'lean', who: 'ivan', angle: 0, ms: 700 }],
                [1100, { do: 'walk', who: 'ivan', to: 290, ms: 900 }],
                [2200, { do: 'face', who: 'ivan', dir: 1 }],
            ] },
            { ms: 4600, cam: at(640, -230, 0.92), cues: [
                [0, { do: 'hide', who: 'ivan', ms: 1200 }],
                [300, { do: 'show', who: 'guggu', ms: 600 }],
                [400, { do: 'walk', who: 'guggu', to: 160, ms: 3800 }],
                [900, { do: 'sfx', play: 'clacson' }],
                [3600, { do: 'sfx', play: 'clacson' }],
            ] },
        ],
    },

    // la piazza alle quattro: pedro sale sul muro accanto al geco, «ciao.», nessuno risponde; giorno 24, va a lui
    'fb-muro': {
        set: 'piazza', mood: 'notte',
        cast: {
            geco: { who: 'geco', x: 960, y: -150, face: -1 },
            pedro: { who: 'pedro', x: 420, face: 1 },
        },
        shots: [
            { ms: 4400, cam: at(720, -280, 1), to: { x: 800, zoom: 1.06 }, cues: [
                [300, { do: 'sfx', play: 'grilli' }],
                [2400, { do: 'sfx', play: 'grilli' }],
            ] },
            { ms: 4400, cam: at(760, -170, 1.4), cues: [
                [100, { do: 'walk', who: 'pedro', to: 840, ms: 2300 }],
                [2500, { do: 'move', who: 'pedro', y: -150, ms: 900 }],
                [2600, { do: 'sfx', play: 'scricchiolio' }],
                [3500, { do: 'face', who: 'pedro', dir: 1 }],
            ] },
            { ms: 3800, cam: at(900, -210, 2.3), focus: true, cues: [
                [500, { do: 'say', who: 'pedro', text: 'ciao.' }],
                [2400, { do: 'sfx', play: 'grilli' }],
            ] },
            { ms: 2400, cam: at(960, -190, 2.8), focus: true },
            { ms: 4200, cam: at(860, -210, 2.2), to: { zoom: 2.4 }, focus: true, cues: [
                [400, { do: 'face', who: 'pedro', dir: 1 }],
                [700, { do: 'say', who: 'pedro', text: 'giorno 24. se mi succede qualcosa, va a lui.' }],
            ] },
        ],
    },

    // la sala monitor: 41.077 secondi di te, la stampa, la clausola 12; dai nastri scende la tua ombra
    'fb-ombra': {
        set: 'monitor', mood: 'neon', clock: '41.077',
        cast: {
            occhio: { who: 'occhio', x: 150, y: -440, face: 1 },
            geco: { who: 'geco', x: 520, y: -248, face: 1, h: 34, depth: 3 },
            ombra: { who: 'ombra', x: 1040, face: -1, hidden: true, h: 104, glow: 0x22d3ee },
        },
        props: {
            striscia: { kind: 'striscia', x: 1055, y: -100, hidden: true },
            striscia2: { kind: 'striscia', x: 1062, y: -100, hidden: true },
        },
        shots: [
            { ms: 4200, cam: WIDE, to: { zoom: 1.06 }, cues: [
                [100, { do: 'sfx', play: 'ronzio' }],
                [300, { do: 'screen', id: 's0', on: true }],
                [600, { do: 'screen', id: 's1', on: true }],
                [900, { do: 'screen', id: 's2', on: true }],
                [1200, { do: 'screen', id: 's3', on: true }],
                [1500, { do: 'screen', id: 's4', on: true }],
                [1500, { do: 'sfx', play: 'bip' }],
                [1800, { do: 'screen', id: 's5', on: true }],
                [1600, { do: 'walk', who: 'geco', to: 650, ms: 2400 }],
            ] },
            { ms: 3400, cam: at(585, -300, 2.5), focus: true, cues: [
                [100, { do: 'walk', who: 'geco', to: 530, ms: 2600 }],
                [1200, { do: 'sfx', play: 'bip' }],
            ] },
            { ms: 3800, cam: at(1050, -130, 2.1), cues: [
                [200, { do: 'sfx', play: 'stampante' }],
                [300, { do: 'prop', id: 'striscia', show: true }],
                [300, { do: 'prop', id: 'striscia', to: { y: -150 }, ms: 1200 }],
                [1700, { do: 'sfx', play: 'stampante' }],
                [1800, { do: 'prop', id: 'striscia2', show: true }],
                [1800, { do: 'prop', id: 'striscia2', to: { y: -150, rot: 0.1 }, ms: 1200 }],
            ] },
            { ms: 3000, cam: at(170, -430, 2.6), focus: true, cues: [
                [400, { do: 'say', who: 'occhio', text: 'clausola 12. i tuoi dati possono eliminarti.' }],
            ] },
            { ms: 4800, cam: at(900, -180, 1.3), to: { zoom: 1.6, x: 880 }, cues: [
                [0, { do: 'light', id: 'schermi', intensity: 0.35, ms: 900 }],
                [400, { do: 'show', who: 'ombra', ms: 1600 }],
                [600, { do: 'sfx', play: 'cuore' }],
                [2200, { do: 'walk', who: 'ombra', to: 860, ms: 1600 }],
                [2400, { do: 'sfx', play: 'cuore' }],
                [3900, { do: 'face', who: 'ombra', dir: -1 }],
            ] },
        ],
    },

    // giorno 42: pedro rilegge gli appunti per terra, «sistemare = togliere ciò che è storto», alza lo sguardo e conclude
    'fb-glitch': {
        set: 'studio', mood: 'notte', day: 42,
        cast: {
            pedro: { who: 'pedro', x: 380, face: 1 },
            realm: { who: 'realm', x: 860, face: -1, hidden: true, h: 130, glow: 0xf87171 },
            realm2: { who: 'realm', x: 1010, face: -1, hidden: true, h: 110, glow: 0xf87171 },
        },
        props: {
            f1: { kind: 'foglio', x: 340, y: -8, rot: 1.4 },
            f2: { kind: 'foglio', x: 470, y: -8, rot: 1.7 },
            f3: { kind: 'foglio', x: 560, y: -8, rot: 1.5 },
            f4: { kind: 'foglio', x: 650, y: -8, rot: 1.2 },
            matita: { kind: 'matita', x: 420, y: -60 },
        },
        shots: [
            { ms: 4200, cam: WIDE, to: { zoom: 1.06 }, cues: [
                [200, { do: 'lean', who: 'pedro', angle: 0.35, ms: 900 }],
                [900, { do: 'sfx', play: 'carta' }],
                [1900, { do: 'walk', who: 'pedro', to: 470, ms: 1200 }],
                [3300, { do: 'sfx', play: 'carta' }],
            ] },
            { ms: 3600, cam: at(520, -50, 2.4), to: { x: 640 }, focus: true, cues: [
                [200, { do: 'walk', who: 'pedro', to: 600, ms: 2600 }],
                [900, { do: 'sfx', play: 'carta' }],
                [2200, { do: 'sfx', play: 'carta' }],
            ] },
            { ms: 4200, cam: at(600, -110, 2.1), focus: true, cues: [
                [300, { do: 'say', who: 'pedro', text: 'sistemare vuol dire togliere ciò che è storto.' }],
            ] },
            { ms: 3600, cam: at(820, -200, 1.2, 0.09), to: { rot: 0.16, zoom: 1.3 }, cues: [
                [0, { do: 'lean', who: 'pedro', angle: 0, ms: 300 }],
                [200, { do: 'show', who: 'realm', ms: 700 }],
                [200, { do: 'lean', who: 'realm', angle: 0.3, ms: 100 }],
                [500, { do: 'show', who: 'realm2', ms: 700 }],
                [500, { do: 'lean', who: 'realm2', angle: -0.25, ms: 100 }],
                [600, { do: 'sfx', play: 'glitch' }],
                [1400, { do: 'lean', who: 'realm', angle: 0.45, ms: 1600 }],
            ] },
            { ms: 2800, cam: at(600, -120, 2.6), focus: true, cues: [
                [500, { do: 'nod', who: 'pedro' }],
                [1600, { do: 'flash', ms: 140 }],
                [1600, { do: 'sfx', play: 'glitch' }],
                [1600, { do: 'shake', ms: 500, force: 0.01 }],
            ] },
        ],
    },

    // la cantina dei server: lametta guardava pedro dormire; scende, «non voglio vedere.», stacca la spina
    'fb-telecamera': {
        set: 'server', mood: 'notte',
        cast: {
            lametta: { who: 'lametta', x: 300, y: -280, face: 1 },
            pedro: { who: 'pedro', x: 1095, y: -205, h: 46, rot: 1.45, depth: 3, still: true },
        },
        shots: [
            { ms: 4200, cam: WIDE, to: { zoom: 1.05 }, cues: [
                [0, { do: 'screen', id: 'pedro', on: true }],
                [200, { do: 'sfx', play: 'ronzio' }],
                [2600, { do: 'sfx', play: 'ronzio' }],
            ] },
            { ms: 4400, cam: at(520, -170, 1.25), to: { x: 760 }, cues: [
                [100, { do: 'move', who: 'lametta', x: 540, y: 0, ms: 2400 }],
                [300, { do: 'sfx', play: 'passo' }],
                [1100, { do: 'sfx', play: 'passo' }],
                [1900, { do: 'sfx', play: 'passo' }],
                [2600, { do: 'walk', who: 'lametta', to: 960, ms: 1600 }],
            ] },
            { ms: 3200, cam: at(1095, -245, 2.7), focus: true, cues: [
                [300, { do: 'sfx', play: 'ronzio' }],
            ] },
            { ms: 3000, cam: at(960, -150, 2.3), focus: true, cues: [
                [500, { do: 'say', who: 'lametta', text: 'non voglio vedere.' }],
            ] },
            { ms: 2000, cam: at(1030, -60, 2.6), focus: true, cues: [
                [700, { do: 'sfx', play: 'clic' }],
                [700, { do: 'screen', id: 'pedro', on: false }],
                [700, { do: 'light', id: 'monitor', intensity: 0, ms: 60 }],
                [700, { do: 'hide', who: 'pedro', ms: 60 }],
            ] },
            { ms: 3200, cam: WIDE, cues: [
                [600, { do: 'sfx', play: 'ronzio' }],
                [1600, { do: 'hide', who: 'lametta', ms: 1400 }],
            ] },
        ],
    },

    // l'archivio della ruhra, notte del giorno 42: piema cancella la riga sette e scrive in blu; il socio è salvo
    'fb-riscrive': {
        set: 'archivio', mood: 'notte', day: 42,
        cast: {
            piema: { who: 'piema', x: -60, face: 1 },
        },
        props: {
            cassetto: { kind: 'cassetto', x: 380, y: -224 },
            registro: { kind: 'fogli', x: 380, y: -230, hidden: true },
            matita: { kind: 'matita', x: 900, y: -104, rot: 0.3 },
        },
        shots: [
            { ms: 4600, cam: WIDE, to: { zoom: 1.05 }, cues: [
                [100, { do: 'walk', who: 'piema', to: 330, ms: 2200 }],
                [2500, { do: 'prop', id: 'cassetto', to: { x: 410 }, ms: 400 }],
                [2500, { do: 'sfx', play: 'scricchiolio' }],
                [3300, { do: 'give', id: 'registro', from: 'piema', to: 'piema', ms: 400 }],
            ] },
            { ms: 3200, cam: at(620, -150, 1.3), to: { x: 760 }, cues: [
                [100, { do: 'walk', who: 'piema', to: 760, ms: 1800 }],
                [2100, { do: 'prop', id: 'registro', to: { x: 860, y: -106 }, ms: 500 }],
                [2600, { do: 'sfx', play: 'carta' }],
            ] },
            { ms: 4000, cam: at(870, -120, 2.7), focus: true, cues: [
                [300, { do: 'say', who: 'piema', text: 'riga sette. «lametta ordina a pedro di raddrizzare il realm.»' }],
                [3000, { do: 'sfx', play: 'matita' }],
                [3400, { do: 'sfx', play: 'matita' }],
            ] },
            { ms: 3400, cam: at(870, -120, 2.9), focus: true, cues: [
                [200, { do: 'prop', id: 'matita', to: { x: 860, y: -112, rot: -0.2 }, ms: 300 }],
                [300, { do: 'sfx', play: 'matita' }],
                [500, { do: 'say', who: 'piema', text: 'piema indaga sull\'anomalia.' }],
            ] },
            { ms: 3800, cam: WIDE, cues: [
                [200, { do: 'walk', who: 'piema', to: 330, ms: 1600 }],
                [1900, { do: 'prop', id: 'cassetto', to: { x: 380 }, ms: 300 }],
                [1900, { do: 'sfx', play: 'scricchiolio' }],
                [2300, { do: 'say', who: 'piema', text: 'il socio è salvo.' }],
                [2600, { do: 'light', id: 'lampada', intensity: 0.4, ms: 900 }],
            ] },
        ],
    },

    // giorno 30, mattina buona: «perché ho la tua faccia?» «perché sei la cosa migliore che ho disegnato.» cartella IMPORTANTE
    'fb-giorno30': {
        set: 'atelier', mood: 'mattina', day: 30,
        cast: {
            pedro: { who: 'pedro', x: 380, face: 1 },
            lametta: { who: 'lametta', x: 720, face: -1 },
        },
        props: {
            pennello: { kind: 'pennello', x: 668, y: -96, rot: -0.4 },
            cartella: { kind: 'cartella', x: 420, y: -60, hidden: true },
        },
        shots: [
            { ms: 4000, cam: WIDE, to: { zoom: 1.05 }, cues: [
                [200, { do: 'sfx', play: 'uccelli' }],
                [900, { do: 'sfx', play: 'pennello' }],
                [2200, { do: 'sfx', play: 'pennello' }],
            ] },
            { ms: 3000, cam: at(400, -110, 2.1), focus: true, cues: [
                [300, { do: 'say', who: 'pedro', text: 'perché ho la tua faccia?' }],
            ] },
            { ms: 4600, cam: at(700, -150, 1.9), to: { zoom: 2.05 }, focus: true, cues: [
                [400, { do: 'prop', id: 'pennello', to: { x: 760, y: -20, rot: 0 }, ms: 600 }],
                [1100, { do: 'face', who: 'lametta', dir: -1 }],
                [1300, { do: 'say', who: 'lametta', text: 'perché sei la cosa migliore che ho disegnato.' }],
            ] },
            { ms: 3600, cam: at(410, -100, 2.6), focus: true, cues: [
                [400, { do: 'sfx', play: 'cuore' }],
                [900, { do: 'prop', id: 'cartella', show: true }],
                [900, { do: 'prop', id: 'cartella', to: { y: -66 }, ms: 400 }],
                [1600, { do: 'hop', who: 'pedro' }],
            ] },
            { ms: 3200, cam: WIDE, to: { zoom: 0.96 }, cues: [
                [600, { do: 'prop', id: 'pennello', to: { x: 668, y: -96, rot: -0.4 }, ms: 600 }],
                [1300, { do: 'sfx', play: 'pennello' }],
            ] },
        ],
    },

    // la mattina del giorno 42: tende tirate, boccetta vuota, il foglio firmato letto a metà e girato; lametta esce
    'fb-mattina': {
        set: 'studio', mood: 'mattina', day: 42,
        cast: {
            lametta: { who: 'lametta', x: 1140, face: -1 },
            occhio: { who: 'occhio', x: 80, y: -500, face: 1 },
        },
        props: {
            boccetta: { kind: 'boccetta', x: 600, y: -113 },
            foglio: { kind: 'foglio', x: 520, y: -118, rot: 0.1 },
        },
        shots: [
            { ms: 4200, cam: WIDE, to: { zoom: 1.04 }, cues: [
                [0, { do: 'light', id: 'luna', intensity: 0.45, ms: 0 }],
                [0, { do: 'light', id: 'lampada', intensity: 0.2, ms: 0 }],
                [0, { do: 'dark', to: 0.25, ms: 0 }],
                [300, { do: 'sfx', play: 'porta' }],
                [500, { do: 'walk', who: 'lametta', to: 640, ms: 2800 }],
            ] },
            { ms: 3000, cam: at(570, -120, 2.7), to: { x: 600 }, focus: true, cues: [
                [600, { do: 'prop', id: 'boccetta', to: { rot: 0.4 }, ms: 200 }],
                [600, { do: 'sfx', play: 'vetro' }],
            ] },
            { ms: 3800, cam: at(600, -150, 1.8), cues: [
                [200, { do: 'give', id: 'foglio', from: 'lametta', to: 'lametta', ms: 500 }],
                [900, { do: 'lean', who: 'lametta', angle: 0.12, ms: 600 }],
                [2400, { do: 'shiver', who: 'lametta', ms: 400 }],
            ] },
            { ms: 2400, cam: at(530, -118, 2.9), focus: true, cues: [
                [200, { do: 'prop', id: 'foglio', to: { x: 520, y: -112, rot: 3.1 }, ms: 500 }],
                [500, { do: 'sfx', play: 'carta' }],
            ] },
            { ms: 4000, cam: WIDE, cues: [
                [300, { do: 'lean', who: 'lametta', angle: 0, ms: 300 }],
                [500, { do: 'walk', who: 'lametta', to: 1140, ms: 2600 }],
                [3100, { do: 'sfx', play: 'porta' }],
                [3300, { do: 'hide', who: 'lametta', ms: 300 }],
            ] },
        ],
    },

    // giorno 37, l'atelier: pennello in bocca; «cosa succede se divento storto?» «ti raddrizzo io.» mai più ricordato
    'fb-promessa': {
        set: 'atelier', mood: 'pomeriggio', day: 37,
        cast: {
            pedro: { who: 'pedro', x: 380, face: 1 },
            lametta: { who: 'lametta', x: 700, face: -1 },
        },
        props: {
            pennello: { kind: 'pennello', x: 668, y: -140, rot: 0.1 },
        },
        shots: [
            { ms: 4000, cam: WIDE, to: { zoom: 1.05 }, cues: [
                [600, { do: 'sfx', play: 'pennello' }],
                [1900, { do: 'sfx', play: 'pennello' }],
                [3100, { do: 'sfx', play: 'pennello' }],
            ] },
            { ms: 3200, cam: at(400, -110, 2.2), focus: true, cues: [
                [300, { do: 'say', who: 'pedro', text: 'cosa succede se divento storto?' }],
            ] },
            { ms: 3400, cam: at(690, -150, 2.3), focus: true, cues: [
                [500, { do: 'sfx', play: 'pennello' }],
                [700, { do: 'say', who: 'lametta', text: 'ti raddrizzo io.' }],
            ] },
            { ms: 4200, cam: WIDE, to: { zoom: 0.95 }, cues: [
                [200, { do: 'light', id: 'finestra', intensity: 0.35, ms: 3600 }],
                [200, { do: 'light', id: 'finestra2', intensity: 0.25, ms: 3600 }],
                [200, { do: 'dark', to: 0.45, ms: 3600 }],
                [1200, { do: 'sfx', play: 'pennello' }],
                [2600, { do: 'sfx', play: 'pennello' }],
            ] },
        ],
    },

    // quarant'anni fa, l'aula di analisi 1 che fuma: piema riscrive il verbale, il limite tende a infinito
    'fb-verbale': {
        set: 'aula', mood: 'notte',
        cast: {
            piema: { who: 'piema', x: 1260, face: -1 },
            limite: { who: 'limite', x: 330, face: 1, hidden: true, glow: 0x60a5fa },
        },
        props: {
            verbale: { kind: 'fogli', x: 690, y: -100 },
            matita: { kind: 'matita', x: 740, y: -96, rot: 0.3 },
        },
        shots: [
            { ms: 4400, cam: WIDE, to: { zoom: 1.05 }, cues: [
                [200, { do: 'sfx', play: 'fuoco' }],
                [700, { do: 'walk', who: 'piema', to: 790, ms: 2600 }],
                [2200, { do: 'sfx', play: 'fuoco' }],
            ] },
            { ms: 4200, cam: at(700, -110, 2.7), focus: true, cues: [
                [300, { do: 'prop', id: 'matita', to: { x: 700, y: -104, rot: -0.2 }, ms: 300 }],
                [500, { do: 'sfx', play: 'matita' }],
                [900, { do: 'sfx', play: 'matita' }],
                [1700, { do: 'say', who: 'piema', text: 'il limite notevole.' }],
            ] },
            { ms: 4600, cam: at(420, -180, 1.4), to: { x: 300, zoom: 1.2 }, cues: [
                [100, { do: 'show', who: 'limite', ms: 600 }],
                [900, { do: 'move', who: 'limite', x: 80, y: -120, ms: 3400 }],
                [900, { do: 'scale', who: 'limite', by: 0.15, ms: 3400 }],
                [2600, { do: 'alpha', who: 'limite', to: 0, ms: 1600 }],
                [1200, { do: 'sfx', play: 'vento' }],
            ] },
            { ms: 3000, cam: at(790, -150, 2.2), focus: true, cues: [
                [400, { do: 'face', who: 'piema', dir: -1 }],
                [1400, { do: 'sfx', play: 'fuoco' }],
            ] },
        ],
    },
};
