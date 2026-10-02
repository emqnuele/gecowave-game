import type { AbilityId, DialogueLine, ZoneColor } from '../types';

/** eventi tra mondo phaser e ui dom */
export interface GameEvents {
    'hp-changed': { hp: number; maxHp: number; hurt: boolean };
    'flow-changed': { flow: number; maxFlow: number };
    'barre-changed': { barre: number; gained: boolean };
    'fragments-changed': { count: number; total: number };
    'zone-changed': { title: string; accentWord: string; color: ZoneColor; punchline: string; showCard: boolean };
    'abilities-changed': { abilities: AbilityId[] };
    'dialogue-start': { lines: DialogueLine[]; onEnd?: () => void };
    'player-died': { lost: number };
    'toast': { text: string };
    'wavesung': { sender: string; text: string };
    'ability-unlocked': { ability: AbilityId };
    'boss-hp': { hp: number; maxHp: number; name: string } | null;
    'choice-show': { title: string; options: { label: string; danger?: boolean }[]; onPick: (index: number) => void };
    'ending': { id: 'consegna' | 'dei' | 'pedro' | 'sconfitta' | 'riscatto' };
    'doomsday-changed': { value: number; active: boolean };
    'request-pause': {};
    'inventory-changed': {};
    'messages-changed': {};
    'charm-found': { id: string };
    'achievement': { id: string };
    'travel-show': { stops: { key: string; levelId: string; label: string }[]; current: string; onPick: (key: string) => void };
    'chapter-score': { id: string; score: number; best: boolean; assisted: boolean; lines: [string, string][] };
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
