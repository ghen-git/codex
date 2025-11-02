export const fragmentShader = `#version 300 es
precision highp float;

in highp vec4 vColour;
in highp vec2 vUv;

uniform sampler2D uDownsampledTexture;
uniform sampler2D uPreviousPassTexture;
uniform vec2 uTexelSize;

out vec4 fragColor;

void main()
{
    /*  SAMPLES PATTERN
             -1   1
           + ------
        1  |  A   B
           |    +      ←  + = [0,0]
        -1 |  C   D
    */

    // This is the single sample for the unblurred, larger texture
    vec3 largeSample = texture(uDownsampledTexture, vUv).rgb;

    // These are the four samples for blurring the smaller texture
    vec3 A = texture(uPreviousPassTexture, vUv + uTexelSize * vec2(-1, 1)).rgb;
    vec3 B = texture(uPreviousPassTexture, vUv + uTexelSize * vec2( 1, 1)).rgb;
    vec3 C = texture(uPreviousPassTexture, vUv + uTexelSize * vec2(-1,-1)).rgb;
    vec3 D = texture(uPreviousPassTexture, vUv + uTexelSize * vec2( 1,-1)).rgb;

    vec3 blurSample = (A + B + C + D) * .25;

    // Add 100% of the blur sample with 100% of the larger, unblurred sample
    //                ↓blur samples↓      ↓unblurred↓
    fragColor.rgb =  blurSample      +    largeSample;

    fragColor.a = 1.0;
}
`;