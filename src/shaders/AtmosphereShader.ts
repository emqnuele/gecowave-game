export const ATMOSPHERE_FS = `
#define SHADER_NAME ATMOSPHERE_FS
precision mediump float;
uniform sampler2D uMainSampler;
varying vec2 outTexCoord;
varying vec4 outTint;
void main()
{
    vec4 texColor = texture2D(uMainSampler, outTexCoord);

    vec2 center = vec2(0.5, 0.5);
    float dist = distance(outTexCoord, center);
    float darkness = 1.0 - smoothstep(0.1, 0.75, dist);

    vec3 baseColor = texColor.rgb * darkness;
    float luma = dot(baseColor, vec3(0.299, 0.587, 0.114));
    vec3 desaturated = mix(baseColor, vec3(luma), 0.35);
    vec3 graded = mix(desaturated, vec3(0.04, 0.08, 0.22), 0.6);
    graded = pow(graded, vec3(1.1));

    vec2 texel = fwidth(outTexCoord);
    vec3 blurColor = (
        texture2D(uMainSampler, outTexCoord + vec2(texel.x, 0.0)).rgb +
        texture2D(uMainSampler, outTexCoord + vec2(-texel.x, 0.0)).rgb +
        texture2D(uMainSampler, outTexCoord + vec2(0.0, texel.y)).rgb +
        texture2D(uMainSampler, outTexCoord + vec2(0.0, -texel.y)).rgb
    ) * 0.25;

    float edgeMask = 1.0 - smoothstep(0.25, 0.75, texColor.a);
    vec3 finalColor = mix(graded, blurColor, edgeMask * 0.75);

    float softAlpha = smoothstep(0.05, 0.7, texColor.a);
    gl_FragColor = vec4(finalColor * outTint.rgb, softAlpha * outTint.a);
}
`;
