export const fragmentShader = `#version 300 es
precision highp float;

in highp vec4 vColour;
in highp vec2 vUv;

uniform sampler2D uFrameBufferTexture;
uniform sampler2D uEmissiveTexture;

out vec4 fragColor;

// Another curve-fitting approximation. I can't find where I got this, but I think it was on Math Exchange.
vec3 superfastTanh(vec3 x)
{
    vec3 x2 = x * x;
    return x * (27.0 + x2) / (27.0 + 9.0*x2);
}

void main() {
    vec4 frameBufferColour = texture(uFrameBufferTexture, vUv);
    vec4 emissiveColour = texture(uEmissiveTexture, vUv);
    // emissiveColour.rgb = superfastTanh(emissiveColour.rgb);

    vec4 hdrColour = vec4(frameBufferColour.rgb * frameBufferColour.a + emissiveColour.rgb, frameBufferColour.a + emissiveColour.a);

    vec4 sdrColour = vec4(superfastTanh(hdrColour.rgb), hdrColour.a);

    fragColor = sdrColour;
    
    fragColor.rgb = hdrColour.rgb;
}
`;