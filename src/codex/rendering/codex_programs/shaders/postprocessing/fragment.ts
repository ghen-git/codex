export const fragmentShader = `#version 300 es
precision highp float;

in highp vec4 vColour;
in highp vec2 vUv;

uniform sampler2D uFrameBufferTexture;

out vec4 fragColor;

void main() {
    vec4 colour = texture(uFrameBufferTexture, vUv);
    fragColor = colour;
}
`;