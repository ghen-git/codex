export const vertexShader = `#version 300 es
precision highp float;

in vec4 aPosition;
in vec4 aColour;

uniform mat4 uProjectionMatrix;

out highp vec4 vColour;

void main() {
    gl_Position = uProjectionMatrix * aPosition;

    vColour = aColour;
}
`;