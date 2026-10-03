import type { AbilityId, DialogueLine, ZoneColor } from '../types';
import type { ChapterSummary, FinalSummary } from './ChapterCompletion';

/** eventi tra mondo phaser e ui dom */
export interface GameEvents {
    'hp-changed': { hp: number; maxHp: number; hurt: boolean };
    'flow-changed': { flow: number; maxFlow: number };
    'barre-changed': { barre: number; gained: boolean };
    'fragments-changed': { count: number; total: number };
    'zone-changed': { title: string; accentWord: string; color: ZoneColor; punchline: string; showCard: boolean };
    'abilities-changed': { abilities: AbilityId[] };
    'dialogue-start': { lines: DialogueLine[]; onEnd?: () => void };
    'dialogue-end': {};
    'player-died': { lost: number; score: number | null };
    'toast': { text: string };
    'wavesung': { sender: string; text: string };
    'ability-unlocked': { ability: AbilityId };
    'boss-hp': { hp: number; maxHp: number; name: string } | null;
    'choice-show': { title: string; options: { label: string; danger?: boolean }[]; onPick: (index: number) => void };
    'ending': { id: 'consegna' | 'dei' | 'pedro' | 'sconfitta' | 'riscatto'; score?: number | null; rank?: number };
    'doomsday-changed': { value: number; active: boolean };
    'request-pause': {};
    'inventory-changed': {};
    'messages-changed': {};
    'charm-found': { id: string };
    'achievement': { id: string };
    'travel-show': { stops: { key: string; levelId: string; label: string }[]; current: string; onPick: (key: string) => void };
    'trial-timer': { left: number; total: number } | null;
    'chapter-score': { id: string; score: number; best: boolean; assisted: boolean; timeMs: number };
    /** riepilogo animato di fine capitolo: la ui anima lo snapshot e poi chiama onContinue */
    'chapter-summary-show': { summary: ChapterSummary; onContinue: () => void };
    /** riepilogo animato di fine gioco: stesso palco, un piano sopra */
    'final-summary-show': { summary: FinalSummary; onContinue: () => void };
    /** battuta parlata a gioco in corso: sottotitolo che non ferma niente */
    'bark': { speaker: string; color: ZoneColor; text: string; glitch?: boolean; urgent?: boolean };
    'bark-clear': {};
    /** la tana ti ha sentito nell'armadio: lochef torna in caccia da vicino */
    'tana-sniffed': {};
}

type Handler<T> = (payload: T) => void;

class EventBus {
    private handlers = new Map<string, Set<Handler<unknown>>>();

    on<K extends keyof GameEvents>(event: K, handler: Handler<GameEvents[K]>): () => void {
        if (!this.handlers.has(event)) this.handlers.set(event, new Set());
        this.handlers.get(event)!.add(handler as Handler<unknown>);
        return () => this.handlers.get(event)?.delete(handler as Handler<unknown>);
    }

    emit<K extends keyof GameEvents>(event: K, payload: GameEvents[K]): void {
        this.handlers.get(event)?.forEach((h) => h(payload));
    }
}

export const bus = new EventBus();
