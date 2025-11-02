export const fragmentShader = `#version 300 es
precision highp float;

in highp vec4 vColour;
in highp vec2 vUv;

uniform sampler2D uTexture;
uniform vec2 uTexelSize;

out vec4 fragColor;

void main() {
    vec3 A = texture(uTexture, vUv + uTexelSize * vec2(-1.0,  1.0)).rgb;
    vec3 B = texture(uTexture, vUv + uTexelSize * vec2( 0.0,  1.0)).rgb;
    vec3 C = texture(uTexture, vUv + uTexelSize * vec2( 1.0,  1.0)).rgb;
    vec3 D = texture(uTexture, vUv + uTexelSize * vec2(-0.5,  0.5)).rgb;
    vec3 E = texture(uTexture, vUv + uTexelSize * vec2( 0.5,  0.5)).rgb;
    vec3 F = texture(uTexture, vUv + uTexelSize * vec2(-1.0,  0.0)).rgb;
    vec3 G = texture(uTexture, vUv                                ).rgb;
    vec3 H = texture(uTexture, vUv + uTexelSize * vec2( 1.0,  0.0)).rgb;
    vec3 I = texture(uTexture, vUv + uTexelSize * vec2(-0.5, -0.5)).rgb;
    vec3 J = texture(uTexture, vUv + uTexelSize * vec2( 0.5, -0.5)).rgb;
    vec3 K = texture(uTexture, vUv + uTexelSize * vec2(-1.0, -1.0)).rgb;
    vec3 L = texture(uTexture, vUv + uTexelSize * vec2( 0.0, -1.0)).rgb;
    vec3 M = texture(uTexture, vUv + uTexelSize * vec2( 1.0, -1.0)).rgb;

    /*  SAMPLES PATTERN
            -1   0   1
            + ----------
        1 |  A   B   C
            |    D   E
        0 |  F   G   H   ←  [0,0] = G
            |    I   J
        -1 |  K   L   M
    */

    // Corner samples
    vec3 quad_NW  = (A + B + F + G) * 0.25;  // average of ABGF
    vec3 quad_NE  = (B + C + G + H) * 0.25;  // average of BCGH
    vec3 quad_SW  = (F + G + K + L) * 0.25;  // average of FGLK
    vec3 quad_SE  = (G + H + L + M) * 0.25;  // average of GHML

    // Central sample
    vec3 quad_C  = (D + E + I + J) * .25;   // average of DEIJ


    vec3 sum = 0.125 * (quad_NW + quad_NE + quad_SW + quad_SE)
                + 0.5   * quad_C;
                // .125 + .125 + .125 + .125 + .5 = 1.0
                // The combined sample weights sum to exactly 1.0, so no change in brightness

    fragColor = vec4(sum, 1.0);
}
`;