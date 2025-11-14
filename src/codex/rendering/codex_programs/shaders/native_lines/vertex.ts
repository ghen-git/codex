export const vertexShader = `#version 300 es
precision highp float;

in vec4 aPosition;
in vec4 aColour;
in float aModelViewMatrixIndex;

uniform mat4 uCameraMatrix;
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

    gl_Position = uProjectionMatrix * uCameraMatrix * modelViewMatrix * aPosition;
    vColour = aColour;
}

vec4 getValueByIndexFromTexture(sampler2D tex, int index) {
  int texWidth = textureSize(tex, 0).x;
  int col = index % texWidth;
  int row = index / texWidth;
  return texelFetch(tex, ivec2(col, row), 0);
}
`;