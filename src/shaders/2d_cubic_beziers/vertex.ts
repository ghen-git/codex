export const vertexShader = `#version 300 es
#define BEZIER_WIDTH 0.05
precision highp float;

in vec4 aVertexPosition;
in vec4 aVertexColour;
in vec4 aVertexNormal;

in vec2 aA;
in vec2 aB;
in vec2 aC;
in vec2 aD;

in float aModelViewMatrixIndex;

uniform mat4 uProjectionMatrix;
uniform sampler2D uModelViewMatricesTexture;

out highp vec2 pos;
out highp vec4 vColour;

flat out highp vec2 a;
flat out highp vec2 b;
flat out highp vec2 c;
flat out highp vec2 d;

void main() {
    gl_Position = uProjectionMatrix * aVertexPosition;

    vColour = aVertexColour;
    pos = aVertexPosition.xy;

    a = aA;
    b = aB;
    c = aC;
    d = aD;
}
`;