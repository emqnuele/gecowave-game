import Phaser from 'phaser';

/* Il tornado è uno shader vero sul frame live della camera, non linee disegnate.
   uProgress 0 = frame intatto, 1 = tutto risucchiato nel nero.
   La tinta del ricordo colora i bordi mentre risucchia. */

const FRAG = [
    '#define SHADER_NAME VORTEX_FS',
    'precision mediump float;',
    'uniform sampler2D uMainSampler;',
    'uniform float uProgress;',
    'uniform float uTime;',
    'uniform vec3 uTint;',
    'varying vec2 outTexCoord;',
    'void main ()',
    '{',
    '    vec2 uv = outTexCoord;',
    '    vec2 center = vec2(0.5, 0.52);',
    '    float aspect = 1.77778;',
    '    vec2 d = vec2((uv.x - center.x) * aspect, uv.y - center.y);',
    '    float r = length(d);',
    '    float ang = atan(d.y, d.x);',
    '    float inner = 1.0 - smoothstep(0.0, 1.05, r);',
    '    float twist = uProgress * (10.0 * inner * inner + uTime * 0.6 * inner);',
    '    float pull = 1.0 - uProgress * 0.7 * (1.0 - smoothstep(0.0, 0.75, r));',
    '    float r2 = r * pull;',
    '    vec2 suv = center + vec2(cos(ang + twist) * r2 / aspect, sin(ang + twist) * r2);',
    '    vec4 col = texture2D(uMainSampler, suv);',
    '    float edge = smoothstep(0.35, 1.1, r) * uProgress;',
    '    vec3 tinted = mix(col.rgb, uTint * 0.3, edge);',
    '    float toBlack = smoothstep(0.75, 1.05, uProgress + r * 0.25 * uProgress);',
    '    gl_FragColor = vec4(mix(tinted, vec3(0.0), toBlack), 1.0);',
    '}',
].join('\n');

export class VortexPipeline extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
    progress = 0;
    tint: [number, number, number] = [0, 0, 0];

    constructor(game: Phaser.Game) {
        super({ game, fragShader: FRAG });
    }

    onPreRender(): void {
        this.set1f('uProgress', this.progress);
        this.set1f('uTime', this.game.loop.time / 1000);
        this.set3f('uTint', this.tint[0], this.tint[1], this.tint[2]);
    }
}

/** hex -> rgb 0..1 per l'uniforme uTint */
export function hexToTint(hex: number): [number, number, number] {
    return [((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255];
}
