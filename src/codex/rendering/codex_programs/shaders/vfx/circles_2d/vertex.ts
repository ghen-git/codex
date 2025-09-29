export const vertexShader = `#version 300 es
precision highp float;

in vec4 aPosition;
in vec4 aColour;
in vec2 aUV;
in float aRadius;

uniform mat4 uProjectionMatrix;

out highp vec4 vColour;
out highp vec2 uvPos;
out highp float radius;

void main() {
    gl_Position = uProjectionMatrix * aPosition;

    vColour = aColour;

    uvPos = aUV;
    radius = aRadius;
}
`;