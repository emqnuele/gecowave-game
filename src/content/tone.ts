/* la curva meme -> serio: a inizio realm si ride, alla fine si piange.
   atto 1 (meme): perduta, bus, santuario, tecnokill, trenbolone + segreti bus
   atto 2 (crepe): tana, rio, stabilimento, ruhra — la battuta si interrompe a metà
   atto 3 (serio): mente, caso, sorveglianza, cantina — quasi niente battute
   atto 4 (straziante): ricordi, void, nucleo, custode — solo verità
   il geco fa versi e gesti e parla solo al caso e al nucleo */

export type ToneAct = 1 | 2 | 3 | 4;

export interface ToneDef {
    /** 0 = meme puro, 100 = serio puro */
    level: number;
    act: ToneAct;
    /** battute dei passanti: meme sempre, miste, o quasi zitte */
    folk: 'meme' | 'misto' | 'quieto';
    /** frasi di morte: meme, miste, serie */
    deaths: 'meme' | 'miste' | 'serie';
}

const TONE: Record<string, ToneDef> = {
    perduta: { level: 0, act: 1, folk: 'meme', deaths: 'meme' },
    bus: { level: 5, act: 1, folk: 'meme', deaths: 'meme' },
    galliate: { level: 8, act: 1, folk: 'meme', deaths: 'meme' },
    marcetti: { level: 10, act: 1, folk: 'meme', deaths: 'meme' },
    santuario: { level: 12, act: 1, folk: 'meme', deaths: 'meme' },
    tecnokill: { level: 15, act: 1, folk: 'meme', deaths: 'meme' },
    trenbolone: { level: 22, act: 1, folk: 'meme', deaths: 'meme' },
    barrato: { level: 35, act: 2, folk: 'misto', deaths: 'miste' },
    tana: { level: 40, act: 2, folk: 'misto', deaths: 'miste' },
    rio: { level: 45, act: 2, folk: 'misto', deaths: 'miste' },
    stabilimento: { level: 52, act: 2, folk: 'misto', deaths: 'miste' },
    ruhra: { level: 60, act: 2, folk: 'misto', deaths: 'miste' },
    mente: { level: 72, act: 3, folk: 'misto', deaths: 'miste' },
    caso: { level: 78, act: 3, folk: 'misto', deaths: 'miste' },
    sorveglianza: { level: 84, act: 3, folk: 'misto', deaths: 'serie' },
    cantina: { level: 88, act: 3, folk: 'misto', deaths: 'serie' },
    ricordi: { level: 95, act: 4, folk: 'quieto', deaths: 'serie' },
    void: { level: 97, act: 4, folk: 'quieto', deaths: 'serie' },
    nucleo: { level: 100, act: 4, folk: 'quieto', deaths: 'serie' },
    custode: { level: 96, act: 4, folk: 'quieto', deaths: 'serie' },
    piazza: { level: 30, act: 2, folk: 'misto', deaths: 'miste' },
};

/** tono di un capitolo; gli id ignoti restano a metà strada */
export function toneFor(levelId: string): ToneDef {
    return TONE[levelId] ?? { level: 50, act: 2, folk: 'misto', deaths: 'miste' };
}

/** l'atto basta quando serve solo sapere se si può ancora ridere */
export function actFor(levelId: string): ToneAct {
    return toneFor(levelId).act;
}
