import { REGION_NOTES, PAGE_REGIONS, noteId, pageId, TOTAL_PAGES } from './arcs';
import { LEVELS } from './levels';

/* il codex del custode: tutte le storie sparse rileggibili in ordine.
   legge collectedLore + flags, niente stato nuovo: chi ha già letto
   trova tutto, chi non ha letto vede ??? e sa cosa gli manca */

export interface CodexSection {
    id: string;
    title: string;
    sub: string;
    entries: CodexEntry[];
}

export interface CodexEntry {
    id: string;
    title: string;
    region: string;
    index: number;
    total: number;
    collected: boolean;
    gated: boolean;
}

function regionTitle(r: string): string {
    const lv = (LEVELS as Record<string, { title?: string; accentWord?: string }>)[r];
    return lv ? `${(lv.title ?? r).toLowerCase()} ${lv.accentWord ?? ''}`.trim() : r;
}

export function codexSections(collected: string[], hasFlag: (f: string) => boolean): CodexSection[] {
    const has = (id: string) => collected.includes(id);
    const sections: CodexSection[] = [];

    // i misteri del cratere: il 33, il cartellino, la cartella IMPORTANTE. tutti e tre pagano
    const mysteries: CodexEntry[] = [
        { id: 'seme-33', title: 'il 33', region: 'perduta', index: 0, total: 0, collected: hasFlag('visto-bus'), gated: false },
        { id: 'seme-cartellino', title: hasFlag('quaderno-completo') ? 'il cartellino — custode' : 'il cartellino — custode provvisorio', region: 'perduta', index: 0, total: 0, collected: true, gated: false },
        { id: 'seme-importante', title: 'la cartella IMPORTANTE', region: 'ricordi', index: 0, total: 0, collected: hasFlag('ricordi-visti'), gated: false },
    ];
    sections.push({ id: 'misteri', title: 'i misteri', sub: 'tre domande aperte fin dal cratere', entries: mysteries });

    // il quaderno di pedro, in ordine 1..5
    const pages: CodexEntry[] = Array.from({ length: TOTAL_PAGES }, (_, i) => {
        const id = pageId(i);
        const region = (PAGE_REGIONS as readonly string[])[i] ?? '?';
        return { id, title: `pagina ${i + 1}/${TOTAL_PAGES} — ${regionTitle(region)}`, region, index: i, total: TOTAL_PAGES, collected: has(id), gated: false };
    });
    const anyPage = pages.some((p) => p.collected);
    if (anyPage || hasFlag('visto-bus')) {
        sections.push({ id: 'quaderno', title: 'il quaderno strappato di pedro', sub: 'il custode l\'ha scelto lui, non la wave', entries: pages });
    }

    // il pensiero sepolto: stato, non spoiler
    const thoughtDone = hasFlag('pensiero-cancellato') || hasFlag('pensiero-portato');
    if (hasFlag('visto-mente') || thoughtDone) {
        sections.push({
            id: 'pensiero', title: 'il pensiero sepolto di piema', sub: 'cancellarlo ti assolve, portarlo fuori lo condanna',
            entries: [{ id: 'pensiero-sepolto', title: thoughtDone ? (hasFlag('pensiero-portato') ? 'portato fuori — è agli atti' : 'cancellato — come fece lui') : 'ancora sepolto, in fondo alla mente', region: 'mente', index: 0, total: 1, collected: thoughtDone, gated: false }],
        });
    }

    // le note del realm, regione per regione, in ordine
    for (const [region, list] of Object.entries(REGION_NOTES)) {
        const entries: CodexEntry[] = list.map((_, i) => {
            const id = noteId(region, i);
            return { id, title: `${regionTitle(region)} — nota ${i + 1}/${list.length}`, region, index: i, total: list.length, collected: has(id), gated: false };
        });
        const any = entries.some((e) => e.collected);
        const seen = hasFlag(`visto-${region}`);
        if (any || seen) {
            sections.push({ id: `note-${region}`, title: regionTitle(region), sub: `${entries.filter((e) => e.collected).length}/${entries.length} note`, entries });
        }
    }
    return sections;
}

export const CODEX_HINT = 'tocca una riga per rileggerla nel mondo: ti porta al dialogo originale.';
