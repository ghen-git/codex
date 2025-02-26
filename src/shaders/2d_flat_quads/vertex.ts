export const vertexShader = `#version 300 es
#define BEZIER_WIDTH 0.05
precision highp float;

in vec4 aVertexPosition;
in vec4 aVertexColour;
in vec4 aVertexNormal;

in float aModelViewMatrixIndex;

uniform mat4 uProjectionMatrix;
uniform sampler2D uModelViewMatricesTexture;

out highp vec4 vColour;

void main() {
    gl_Position = uProjectionMatrix * aVertexPosition;

    vColour = aVertexColour;
}
`;