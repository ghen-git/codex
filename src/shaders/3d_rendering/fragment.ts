export const fragmentShader = `#version 300 es
precision highp float;

in highp vec4 vColour;
out vec4 fragColor;
void main() {
    fragColor = vColour;
}
`;