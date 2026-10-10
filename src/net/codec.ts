/** scrittura binaria little-endian che cresce da sola: i pacchetti veloci non passano mai da json */
export class ByteWriter {
    private buf: ArrayBuffer;
    private view: DataView;
    private bytes: Uint8Array;
    private at = 0;

    constructor(capacity = 256) {
        this.buf = new ArrayBuffer(capacity);
        this.view = new DataView(this.buf);
        this.bytes = new Uint8Array(this.buf);
    }

    get length(): number {
        return this.at;
    }

    private room(n: number): void {
        if (this.at + n <= this.buf.byteLength) return;
        let size = this.buf.byteLength * 2;
        while (size < this.at + n) size *= 2;
        const next = new ArrayBuffer(size);
        new Uint8Array(next).set(this.bytes.subarray(0, this.at));
        this.buf = next;
        this.view = new DataView(next);
        this.bytes = new Uint8Array(next);
    }

    u8(v: number): this {
        this.room(1);
        this.view.setUint8(this.at, v & 0xff);
        this.at += 1;
        return this;
    }

    u16(v: number): this {
        this.room(2);
        this.view.setUint16(this.at, v & 0xffff, true);
        this.at += 2;
        return this;
    }

    i16(v: number): this {
        this.room(2);
        this.view.setInt16(this.at, Math.max(-32768, Math.min(32767, Math.round(v))), true);
        this.at += 2;
        return this;
    }

    u32(v: number): this {
        this.room(4);
        this.view.setUint32(this.at, v >>> 0, true);
        this.at += 4;
        return this;
    }

    f32(v: number): this {
        this.room(4);
        this.view.setFloat32(this.at, v, true);
        this.at += 4;
        return this;
    }

    /** interi senza segno a lunghezza variabile: gli id piccoli costano un byte */
    varu(v: number): this {
        let n = Math.max(0, Math.floor(v));
        while (n >= 0x80) {
            this.u8((n & 0x7f) | 0x80);
            n = Math.floor(n / 128);
        }
        return this.u8(n);
    }

    str(s: string): this {
        const enc = new TextEncoder().encode(s);
        this.varu(enc.length);
        this.room(enc.length);
        this.bytes.set(enc, this.at);
        this.at += enc.length;
        return this;
    }

    finish(): Uint8Array {
        return this.bytes.slice(0, this.at);
    }
}

/** lettura che non lancia mai: oltre la fine dà zero e segna il pacchetto come rotto */
export class ByteReader {
    private readonly view: DataView;
    private readonly bytes: Uint8Array;
    private at = 0;
    /** vero se qualcuno ha letto oltre la fine: il pacchetto va scartato */
    broken = false;

    constructor(data: Uint8Array) {
        this.bytes = data;
        this.view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    }

    get left(): number {
        return this.bytes.byteLength - this.at;
    }

    private need(n: number): boolean {
        if (this.at + n <= this.bytes.byteLength) return true;
        this.broken = true;
        this.at = this.bytes.byteLength;
        return false;
    }

    u8(): number {
        if (!this.need(1)) return 0;
        const v = this.view.getUint8(this.at);
        this.at += 1;
        return v;
    }

    u16(): number {
        if (!this.need(2)) return 0;
        const v = this.view.getUint16(this.at, true);
        this.at += 2;
        return v;
    }

    i16(): number {
        if (!this.need(2)) return 0;
        const v = this.view.getInt16(this.at, true);
        this.at += 2;
        return v;
    }

    u32(): number {
        if (!this.need(4)) return 0;
        const v = this.view.getUint32(this.at, true);
        this.at += 4;
        return v;
    }

    f32(): number {
        if (!this.need(4)) return 0;
        const v = this.view.getFloat32(this.at, true);
        this.at += 4;
        return v;
    }

    varu(): number {
        let out = 0;
        let mul = 1;
        for (let i = 0; i < 6; i++) {
            const b = this.u8();
            out += (b & 0x7f) * mul;
            if (!(b & 0x80)) return out;
            mul *= 128;
        }
        this.broken = true;
        return 0;
    }

    str(): string {
        const n = this.varu();
        if (!this.need(n)) return '';
        const s = new TextDecoder().decode(this.bytes.subarray(this.at, this.at + n));
        this.at += n;
        return s;
    }
}

/** sequenze a 16 bit che girano: a è più nuovo di b anche dopo il giro */
export function seqNewer(a: number, b: number): boolean {
    const d = (a - b) & 0xffff;
    return d !== 0 && d < 0x8000;
}
