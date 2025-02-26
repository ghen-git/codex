export const vertexShader = `#version 300 es
#define BEZIER_WIDTH 0.05
precision highp float;

in vec4 aVertexPosition;
in vec4 aVertexColour;
in vec4 aVertexNormal;

in vec2 aUV;

in float aModelViewMatrixIndex;

uniform mat4 uProjectionMatrix;
uniform sampler2D uModelViewMatricesTexture;

out highp vec4 vColour;
out highp vec2 uvPos;

void main() {
    gl_Position = uProjectionMatrix * aVertexPosition;

    vColour = aVertexColour;

    uvPos = aUV;
}
`;