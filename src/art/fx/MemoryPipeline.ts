import Phaser from 'phaser';

/* il "sembra un ricordo": seppia sbiadita da pellicola vecchia.
   uStrength 0 = frame intatto, 1 = memoria (desaturato ~62%, neri
   alzati, grana animata, tinta del ricordo ai bordi). Gli accenti
   forti (rosso, ambra) restano leggibili: non è un bianco e nero. */

const FRAG = [
    '#define SHADER_NAME MEMORY_FS',
    'precision mediump float;',
    'uniform sampler2D uMainSampler;',
    'uniform float uTime;',
    'uniform float uStrength;',
    'uniform vec3 uTint;',
    'varying vec2 outTexCoord;',
    'float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }',
    'void main ()',
    '{',
    '    vec2 uv = outTexCoord;',
    '    vec4 col = texture2D(uMainSampler, uv);',
    '    float luma = dot(col.rgb, vec3(0.299, 0.587, 0.114));',
    '    vec3 bw = vec3(luma);',
    '    vec3 sepia = vec3(',
    '        clamp(luma * 1.07 + 0.04, 0.0, 1.0),',
    '        clamp(luma * 0.97 + 0.015, 0.0, 1.0),',
    '        clamp(luma * 0.82, 0.0, 1.0));',
    '    vec3 graded = mix(bw * vec3(1.05, 0.98, 0.88), sepia, 0.7);',
    '    graded = mix(col.rgb, graded, 0.75);',
    '    graded = graded * 0.84 + vec3(0.10, 0.085, 0.07);',
    '    float edge = smoothstep(0.3, 1.0, length((uv - vec2(0.5, 0.52)) * vec2(1.78, 1.0)));',
    '    graded = mix(graded, uTint * (0.35 + 0.65 * luma), edge * 0.35);',
    '    float g = hash(uv * vec2(1920.0, 1080.0) + fract(uTime) * 7.13) - 0.5;',
    '    graded += g * 0.07;',
    '    graded *= 0.975 + 0.025 * sin(uTime * 43.0);',
    '    vec3 outc = mix(col.rgb, graded, uStrength);',
    '    gl_FragColor = vec4(outc, 1.0);',
    '}',
].join('\n');

export class MemoryPipeline extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
    strength = 0;
    tint: [number, number, number] = [0, 0, 0];

    constructor(game: Phaser.Game) {
        super({ game, fragShader: FRAG });
    }

    onPreRender(): void {
        this.set1f('uTime', this.game.loop.time / 1000);
        this.set1f('uStrength', this.strength);
        this.set3f('uTint', this.tint[0], this.tint[1], this.tint[2]);
    }
}
