import Phaser from 'phaser';

/* la foschia vera: rumore frattale che scorre e si arriccia, calcolato dalla scheda video.
   sta tra un piano e l'altro del parallasse e davanti al geco, al posto del velo a macchie */

const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 resolution;
uniform float uTime;
uniform vec3 uColor;
uniform float uAlpha;
uniform vec2 uScroll;
uniform float uScale;
uniform vec2 uBand;
uniform float uFloor;
varying vec2 fragCoord;

float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}

float fbm(vec2 p) {
    float a = 0.5;
    float s = 0.0;
    for (int i = 0; i < 4; i++) {
        s += a * noise(p);
        p = p * 2.03 + vec2(17.1, 9.2);
        a *= 0.5;
    }
    return s;
}

void main ()
{
    vec2 px = vec2(fragCoord.x, resolution.y - fragCoord.y);
    vec2 p = (px + uScroll) / uScale;
    p.x *= 0.42;
    float warp = fbm(p + vec2(uTime * 0.021, 0.0));
    float n = fbm(p + vec2(warp * 1.7 - uTime * 0.034, warp * 0.9 + uTime * 0.008));
    float band = smoothstep(uBand.x, uBand.y, px.y / resolution.y);
    float wisps = smoothstep(0.3, 0.8, n);
    float a = clamp(wisps * band + band * band * uFloor, 0.0, 1.0) * uAlpha;
    gl_FragColor = vec4(uColor * a, a);
}
`;

const KEY = 'mist';

export interface MistLook {
    color: number;
    alpha: number;
    /** grandezza delle volute in pixel */
    scale: number;
    /** da dove comincia e dove è piena, in frazioni dell'altezza dall'alto */
    band: [number, number];
    /** quanta foschia resta ferma in fondo, sotto le volute */
    floor: number;
}

export class Mist {
    readonly shader: Phaser.GameObjects.Shader;
    private look: MistLook;

    /** null dove non c'è webgl: lì resta il velo dipinto */
    static add(scene: Phaser.Scene, depth: number, look: MistLook): Mist | null {
        if (scene.renderer.type !== Phaser.WEBGL) return null;
        return new Mist(scene, depth, look);
    }

    private constructor(scene: Phaser.Scene, depth: number, look: MistLook) {
        this.look = look;
        const base = new Phaser.Display.BaseShader(KEY, FRAG, undefined, {
            uTime: { type: '1f', value: 0 },
            uColor: { type: '3f', value: { x: 1, y: 1, z: 1 } },
            uAlpha: { type: '1f', value: 0 },
            uScroll: { type: '2f', value: { x: 0, y: 0 } },
            uScale: { type: '1f', value: look.scale },
            uBand: { type: '2f', value: { x: look.band[0], y: look.band[1] } },
            uFloor: { type: '1f', value: look.floor },
        });
        this.shader = scene.add.shader(base, 0, 0, 16, 16).setOrigin(0.5).setScrollFactor(0).setDepth(depth);
        this.shader.setUniform('uColor.value', {
            x: ((look.color >> 16) & 255) / 255,
            y: ((look.color >> 8) & 255) / 255,
            z: (look.color & 255) / 255,
        });
    }

    place(cx: number, cy: number, w: number, h: number): void {
        this.shader.setPosition(cx, cy);
        this.shader.setSize(w, h);
        // setSize non riallinea l'origine: senza questo il velo copre solo un quarto di schermo
        this.shader.updateDisplayOrigin();
    }

    /** lift sposta la fascia in su o in giù insieme ai piani, in frazioni d'altezza */
    update(timeMs: number, scrollX: number, scrollY: number, lift = 0, strength = 1): void {
        const a = this.look.alpha * strength;
        this.shader.setVisible(a > 0.004);
        this.shader.setUniform('uTime.value', timeMs / 1000);
        this.shader.setUniform('uAlpha.value', a);
        this.shader.setUniform('uScroll.value', { x: scrollX, y: scrollY });
        this.shader.setUniform('uBand.value', { x: this.look.band[0] + lift, y: this.look.band[1] + lift });
    }
}
