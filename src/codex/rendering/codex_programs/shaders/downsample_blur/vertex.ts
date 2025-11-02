export const vertexShader = `#version 300 es
precision highp float;

in vec4 aPosition;
in vec2 aUv;

out highp vec2 vUv;
out highp vec4 vColour;

void main() {
    gl_Position = aPosition;

    vUv = aUv;
    vColour = vec4(1, 0, 0, 1);
}
`;