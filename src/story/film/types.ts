// le inquadrature si scrivono in coordinate di palco (pavimento a y = 0), così un copione non dipende dallo schermo

export const STAGE_W = 1200;

export type CastName = 'lametta' | 'pedro' | 'ivan' | 'bus' | 'geco' | 'occhio' | 'stagista' | 'realm' | 'piema' | 'limite' | 'ombra';

export type SetKind = 'studio' | 'bottega' | 'atelier' | 'deserto' | 'piazza' | 'monitor' | 'server' | 'archivio' | 'aula';

export type Mood = 'notte' | 'pomeriggio' | 'mattina' | 'neon';

export interface PropDef {
    kind: 'foglio' | 'fogli' | 'boccetta' | 'pennello' | 'scontrino' | 'matita' | 'timbro' | 'cassetto' | 'striscia' | 'cartella' | 'quadro';
    x: number;
    y: number;
    hidden?: boolean;
    rot?: number;
}

export interface ActorDef {
    who: CastName;
    x: number;
    face?: 1 | -1;
    hidden?: boolean;
    y?: number;
    h?: number;
    rot?: number;
    tint?: number;
    // un ritratto o un attore dentro uno schermo non respira e non fa ombra sul muro
    still?: boolean;
    depth?: number;
    // chi deve farsi vedere nel buio (l'ombra, il glitch) porta una luce sua
    glow?: number;
}

export interface Frame {
    x: number;
    y: number;
    zoom: number;
    rot?: number;
}

export type Action =
    | { do: 'walk'; who: string; to: number; ms: number }
    | { do: 'face'; who: string; dir: 1 | -1 }
    | { do: 'hop'; who: string }
    | { do: 'nod'; who: string }
    | { do: 'lean'; who: string; angle: number; ms?: number }
    | { do: 'shiver'; who: string; ms: number }
    | { do: 'move'; who: string; x?: number; y?: number; ms: number }
    | { do: 'scale'; who: string; by: number; ms: number }
    | { do: 'alpha'; who: string; to: number; ms?: number }
    | { do: 'show'; who: string; ms?: number }
    | { do: 'hide'; who: string; ms?: number }
    | { do: 'say'; who: string; text: string; ms?: number }
    | { do: 'prop'; id: string; to?: { x?: number; y?: number; rot?: number }; ms?: number; show?: boolean; hide?: boolean }
    | { do: 'give'; id: string; from: string; to: string; ms: number }
    | { do: 'sfx'; play: SfxCue }
    | { do: 'light'; id: string; intensity: number; ms?: number }
    | { do: 'flash'; ms?: number }
    | { do: 'shake'; ms: number; force?: number }
    | { do: 'screen'; id: string; on: boolean }
    | { do: 'clock'; text: string }
    | { do: 'dark'; to: number; ms?: number };

export type SfxCue =
    | 'passo' | 'carta' | 'timbro' | 'porta' | 'scricchiolio' | 'vetro' | 'versa' | 'cassa'
    | 'pennello' | 'clic' | 'ronzio' | 'bip' | 'stampante' | 'sabbia' | 'spinta' | 'clacson'
    | 'grilli' | 'campanello' | 'cuore' | 'matita' | 'fuoco' | 'glitch' | 'rombo' | 'uccelli' | 'vento';

export interface Shot {
    ms: number;
    cam: Frame;
    to?: Partial<Frame>;
    focus?: boolean;
    cues?: [number, Action][];
}

export interface FilmScript {
    set: SetKind;
    mood: Mood;
    clock?: string;
    // la cronologia della storia si legge nel set, non in una didascalia
    day?: number;
    cast: Record<string, ActorDef>;
    props?: Record<string, PropDef>;
    shots: Shot[];
}
