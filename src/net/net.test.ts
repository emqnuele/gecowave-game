import { afterEach, describe, expect, it, vi } from 'vitest';
import { ByteReader, ByteWriter, seqNewer } from './codec';
import { InterpDelay, Track } from './interp';
import { makeCode, normalizeCode, CODE_LENGTH } from './rooms';
import { FAST_GAME, NetSession } from './session';
import { MemoryTransport } from './transport';

type Msgs = { greet: { who: string }; big: { blob: string } };

const flush = async () => {
    for (let i = 0; i < 10; i++) await Promise.resolve();
};

describe('codec', () => {
    it('rilegge quello che scrive, anche oltre la capacità iniziale', () => {
        const w = new ByteWriter(4);
        w.u8(250).u16(65000).i16(-1234).u32(4000000000).f32(1.5).varu(0).varu(300).varu(2 ** 31).str('gecò');
        const r = new ByteReader(w.finish());
        expect([r.u8(), r.u16(), r.i16(), r.u32(), r.f32(), r.varu(), r.varu(), r.varu(), r.str()]).toEqual([250, 65000, -1234, 4000000000, 1.5, 0, 300, 2 ** 31, 'gecò']);
        expect(r.broken).toBe(false);
        expect(r.left).toBe(0);
    });

    it('un pacchetto corto si segna rotto invece di lanciare', () => {
        const r = new ByteReader(new Uint8Array([1]));
        expect(r.u32()).toBe(0);
        expect(r.broken).toBe(true);
    });

    it('i numeri di sequenza restano in ordine dopo il giro', () => {
        expect(seqNewer(1, 0)).toBe(true);
        expect(seqNewer(0, 65535)).toBe(true);
        expect(seqNewer(65535, 0)).toBe(false);
        expect(seqNewer(5, 5)).toBe(false);
    });
});

describe('codici delle stanze', () => {
    it('un codice generato è sempre valido e si legge anche sporco', () => {
        for (let i = 0; i < 50; i++) {
            const c = makeCode();
            expect(c).toHaveLength(CODE_LENGTH);
            expect(normalizeCode(` ${c.toLowerCase().slice(0, 2)}-${c.slice(2)} `)).toBe(c);
        }
    });

    it('rifiuta lettere che non usiamo e lunghezze sbagliate', () => {
        expect(normalizeCode('ABCD')).toBeNull();
        expect(normalizeCode('ABCDO')).toBeNull();
        expect(normalizeCode('ABCD1')).toBeNull();
    });
});

describe('sessione', () => {
    afterEach(() => vi.useRealTimers());

    it('si stringono la mano e si parlano', async () => {
        const [a, b] = MemoryTransport.pair();
        const sa = new NetSession<Msgs>(a, { build: '1' });
        const sb = new NetSession<Msgs>(b, { build: '1' });
        const ready = vi.fn();
        sb.onReady = ready;
        const got: string[] = [];
        sb.on('greet', (m) => got.push(m.who));
        sa.send('greet', { who: 'geco' });
        await flush();
        expect(ready).toHaveBeenCalledOnce();
        expect(got).toEqual(['geco']);
        sa.close();
        sb.close();
    });

    it('i messaggi grandi arrivano interi', async () => {
        const [a, b] = MemoryTransport.pair();
        const sa = new NetSession<Msgs>(a, { build: '1' });
        const sb = new NetSession<Msgs>(b, { build: '1' });
        const blob = 'x'.repeat(200000) + 'fine';
        let got = '';
        sb.on('big', (m) => {
            got = m.blob;
        });
        sa.send('big', { blob });
        await flush();
        expect(got).toBe(blob);
        sa.close();
        sb.close();
    });

    it('due build diverse si salutano e chiudono con il perché', async () => {
        const [a, b] = MemoryTransport.pair();
        const sa = new NetSession<Msgs>(a, { build: '1.0.0' });
        const sb = new NetSession<Msgs>(b, { build: '1.0.1' });
        const reasons: string[] = [];
        sa.onClose = (r) => reasons.push(r);
        sb.onClose = (r) => reasons.push(r);
        await flush();
        expect(sa.open).toBe(false);
        expect(sb.open).toBe(false);
        expect(reasons.some((r) => r.includes('versioni diverse'))).toBe(true);
    });

    it('i pacchetti veloci portano l’ora di chi li manda', async () => {
        const [a, b] = MemoryTransport.pair();
        let clockA = 1000;
        const sa = new NetSession<Msgs>(a, { build: '1' }, () => clockA);
        const sb = new NetSession<Msgs>(b, { build: '1' }, () => 5000);
        let seen: { v: number; at: number } | null = null;
        sb.onFast(FAST_GAME, (r, at) => {
            seen = { v: r.u16(), at };
        });
        clockA = 1234;
        sa.sendFast(FAST_GAME, (w) => w.u16(42));
        await flush();
        expect(seen).toEqual({ v: 42, at: 1234 });
        sa.close();
        sb.close();
    });

    it('il battito misura il ritardo e l’orologio dell’altro', async () => {
        vi.useFakeTimers();
        let now = 0;
        const [a, b] = MemoryTransport.pair((fn) => setTimeout(fn, 20));
        const sa = new NetSession<Msgs>(a, { build: '1' }, () => now);
        const sb = new NetSession<Msgs>(b, { build: '1' }, () => now + 7000);
        for (let i = 0; i < 400; i++) {
            now += 10;
            await vi.advanceTimersByTimeAsync(10);
        }
        expect(sa.rtt).toBeGreaterThan(30);
        expect(sa.rtt).toBeLessThan(60);
        expect(Math.abs(sa.offset - 7000)).toBeLessThan(15);
        expect(Math.abs(sb.offset + 7000)).toBeLessThan(15);
        sa.close();
        sb.close();
    });

    it('il silenzio lungo chiude la sessione', async () => {
        vi.useFakeTimers();
        let now = 0;
        const [a, b] = MemoryTransport.pair((fn) => setTimeout(fn, 5));
        const sa = new NetSession<Msgs>(a, { build: '1' }, () => now);
        const links: string[] = [];
        sa.onLink = (s) => links.push(s);
        const closed = vi.fn();
        sa.onClose = closed;
        // l'altro capo non risponde mai
        b.onReliable = () => {};
        b.onFast = () => {};
        for (let i = 0; i < 40; i++) {
            now += 500;
            await vi.advanceTimersByTimeAsync(500);
        }
        expect(links[0]).toBe('instabile');
        expect(closed).toHaveBeenCalledWith('connessione persa');
    });
});

describe('interpolazione', () => {
    it('sta tra due stati e non inventa oltre il dovuto', () => {
        const tr = new Track();
        tr.push({ t: 0, x: 0, y: 0, vx: 100, vy: 0 });
        tr.push({ t: 100, x: 10, y: 0, vx: 100, vy: 0 });
        tr.push({ t: 50, x: 999, y: 999, vx: 0, vy: 0 });
        const out = { x: 0, y: 0, vx: 0, vy: 0 };
        tr.at(50, out);
        expect(out.x).toBeCloseTo(5);
        tr.at(1000, out);
        expect(out.x).toBeCloseTo(10 + 100 * 0.12);
    });

    it('un salto enorme non si spalma: si teletrasporta', () => {
        const tr = new Track();
        tr.push({ t: 0, x: 0, y: 0, vx: 0, vy: 0 });
        tr.push({ t: 100, x: 5000, y: 0, vx: 0, vy: 0 });
        const out = { x: 0, y: 0, vx: 0, vy: 0 };
        tr.at(30, out);
        expect(out.x).toBe(0);
        tr.at(70, out);
        expect(out.x).toBe(5000);
    });

    it('il ritardo cresce col tremolio dei pacchetti', () => {
        const calm = new InterpDelay(33);
        const shaky = new InterpDelay(33);
        let t = 0;
        for (let i = 0; i < 100; i++) {
            calm.arrived((t += 33));
        }
        t = 0;
        for (let i = 0; i < 100; i++) shaky.arrived((t += i % 2 ? 10 : 90));
        expect(shaky.ms).toBeGreaterThan(calm.ms);
        expect(calm.ms).toBeLessThan(100);
    });
});
