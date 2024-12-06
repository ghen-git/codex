export const vertexShader = `#version 300 es
precision highp float;

in vec4 aVertexPosition;
in vec4 aVertexColour;
in vec4 aVertexNormal;
in float aModelViewMatrixIndex;

uniform mat4 uProjectionMatrix;
uniform sampler2D uModelViewMatricesTexture;

out highp vec4 vColour;

vec4 getValueByIndexFromTexture(sampler2D tex, int index);

void main() {
    mat4 modelViewMatrix = mat4(
        getValueByIndexFromTexture(uModelViewMatricesTexture, int(aModelViewMatrixIndex) * 4 + 0),
        getValueByIndexFromTexture(uModelViewMatricesTexture, int(aModelViewMatrixIndex) * 4 + 1),
        getValueByIndexFromTexture(uModelViewMatricesTexture, int(aModelViewMatrixIndex) * 4 + 2),
        getValueByIndexFromTexture(uModelViewMatricesTexture, int(aModelViewMatrixIndex) * 4 + 3)
    );

    gl_Position = uProjectionMatrix * modelViewMatrix * aVertexPosition;
    
    float depthFog = gl_Position.w > 0.0 ? clamp(1.0 / (gl_Position.w) * 20.0, 0.0, 1.0) : 1.0;
    vColour = aVertexColour * vec4(depthFog, depthFog, depthFog, 1);
}

vec4 getValueByIndexFromTexture(sampler2D tex, int index) {
  int texWidth = textureSize(tex, 0).x;
  int col = index % texWidth;
  int row = index / texWidth;
  return texelFetch(tex, ivec2(col, row), 0);
}
`;