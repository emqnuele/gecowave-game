import Phaser from 'phaser';
import { restLens, type Lens } from '../../rules/lens';

/* l'obiettivo della camera di gioco: un solo passaggio sull'immagine finita.
   ruota, ingrandisce, piega, separa i colori, ondeggia, glitcha, chiude il bordo.
   il canvas è trasparente sopra il fondale dom: il buio e i veli alzano anche l'alfa,
   così coprono pure il cielo. i colori sono premoltiplicati */

const FRAG = `
#define SHADER_NAME LENS_FS
precision mediump float;
uniform sampler2D uMainSampler;
uniform vec2 uRes;
uniform float uTime;
uniform float uAngle;
uniform float uZoom;
uniform float uBarrel;
uniform float uChroma;
uniform float uDesat;
uniform vec4 uTint;
uniform float uWave;
uniform float uGlitch;
uniform float uSeed;
uniform float uKeyhole;
uniform float uPulse;
uniform float uDark;
uniform vec4 uRing;
uniform vec2 uFocus;
varying vec2 outTexCoord;

float hash(float n) { return fract(sin(n) * 43758.5453); }

vec4 tap(vec2 uv) { return texture2D(uMainSampler, clamp(uv, 0.001, 0.999)); }

void main ()
{
    float aspect = uRes.x / uRes.y;
    vec2 p = outTexCoord - 0.5;
    p.x *= aspect;
    float s = sin(uAngle);
    float c = cos(uAngle);
    p = vec2(c * p.x - s * p.y, s * p.x + c * p.y) / uZoom;
    p *= 1.0 + uBarrel * dot(p, p);
    if (uRing.w > 0.0) {
        vec2 rc = uRing.xy - 0.5;
        rc.x *= aspect;
        vec2 d = p - rc;
        float dist = length(d);
        float band = exp(-pow((dist - uRing.z) * 16.0, 2.0));
        p -= d / max(dist, 0.0001) * band * uRing.w * 0.035;
    }
    if (uWave > 0.0) {
        p.x += sin(p.y * 34.0 + uTime * 2.6) * 0.0028 * uWave;
        p.y += cos(p.x * 21.0 + uTime * 1.9) * 0.0022 * uWave;
    }
    float jolt = 0.0;
    if (uGlitch > 0.0) {
        float row = floor(outTexCoord.y * 36.0);
        float h = hash(row * 12.9898 + uSeed);
        if (h < uGlitch * 0.45) {
            jolt = (hash(row + uSeed * 3.1) - 0.5) * 0.12 * uGlitch;
            p.x += jolt;
        }
    }
    p.x /= aspect;
    vec2 uv = p + 0.5;

    vec2 dir = uv - 0.5;
    float r = length(dir);
    vec2 off = dir / max(r, 0.0001) * (uChroma * (0.0015 + 0.006 * r) + abs(jolt) * 0.25);
    vec4 base = tap(uv);
    vec3 col = vec3(tap(uv + off).r, base.g, tap(uv - off).b);
    float a = base.a;

    float grey = dot(col, vec3(0.299, 0.587, 0.114));
    col = mix(col, vec3(grey), uDesat);
    col = max(col, 0.0);

    // da qui in poi veli sopra l'immagine: coprono anche il cielo dietro al canvas
    vec2 q = outTexCoord - 0.5;
    q.x *= aspect;
    float rq = length(q / vec2(aspect * 0.5, 0.5));
    col = col * (1.0 - uTint.a) + uTint.rgb * uTint.a;
    a = a * (1.0 - uTint.a) + uTint.a;

    float red = uPulse * smoothstep(0.35, 1.05, rq);
    col = col * (1.0 - red) + vec3(0.42, 0.02, 0.04) * red;
    a = a * (1.0 - red) + red;

    float shade = uDark * smoothstep(0.25, 1.0, rq);
    if (uKeyhole > 0.0) {
        // la serratura: tondo sopra, gamba svasata sotto (y dello schermo cresce verso il basso)
        vec2 f = uFocus - 0.5;
        f.x *= aspect;
        vec2 k = vec2(q.x - f.x, f.y - q.y);
        float ring = length(k - vec2(0.0, -0.05)) - 0.15;
        float leg = max(abs(k.x) - (0.045 + (k.y - 0.02) * 0.32), max(0.02 - k.y, k.y - 0.27));
        float hole = min(ring, leg);
        float outside = smoothstep(-0.006, 0.02, hole);
        shade = max(shade, uKeyhole * outside * 0.94);
    }
    col *= 1.0 - shade;
    a = a * (1.0 - shade) + shade;

    gl_FragColor = vec4(col, a);
}
`;

export class LensPipeline extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
    lens: Lens = restLens();
    /** zoom che copre gli angoli, già moltiplicato per quello voluto */
    coverZoom = 1;
    /** onda d'urto: centro in uv (y in alto), raggio, forza */
    ring: [number, number, number, number] = [0.5, 0.5, 0, 0];
    seed = 0;
    time = 0;
    /** dove guarda la serratura: il geco, in uv (y in alto) */
    focus: [number, number] = [0.5, 0.5];

    constructor(game: Phaser.Game) {
        super({ game, fragShader: FRAG });
    }

    onPreRender(): void {
        const l = this.lens;
        this.set2f('uRes', this.renderer.width, this.renderer.height);
        this.set1f('uTime', this.time);
        this.set1f('uAngle', l.angle);
        this.set1f('uZoom', this.coverZoom);
        this.set1f('uBarrel', l.barrel);
        this.set1f('uChroma', l.chroma);
        this.set1f('uDesat', l.desat);
        const t = l.tintColor;
        this.set4f('uTint', ((t >> 16) & 255) / 255, ((t >> 8) & 255) / 255, (t & 255) / 255, l.tint);
        this.set1f('uWave', l.wave);
        this.set1f('uGlitch', l.glitch);
        this.set1f('uSeed', this.seed);
        this.set1f('uKeyhole', l.keyhole);
        this.set1f('uPulse', l.pulse);
        this.set1f('uDark', l.dark);
        this.set4f('uRing', this.ring[0], this.ring[1], this.ring[2], this.ring[3]);
        this.set2f('uFocus', this.focus[0], this.focus[1]);
    }
}
