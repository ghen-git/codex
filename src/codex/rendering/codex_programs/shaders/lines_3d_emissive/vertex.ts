export const vertexShader = `#version 300 es
precision highp float;

in vec4 aPosition;
in vec3 aPreviousPoint;
in vec3 aNextPoint;
in float aNormalDir;
in vec4 aColour;
in float aModelViewMatrixIndex;

uniform mat4 uProjectionMatrix;
uniform float uViewportRatio;
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

    vec4 cameraPos = uProjectionMatrix * modelViewMatrix * aPosition;
    vec4 prevPointCameraPos = uProjectionMatrix * modelViewMatrix * vec4(aPreviousPoint.x, aPreviousPoint.y, aPreviousPoint.z, 1);
    vec4 nextPointCameraPos = uProjectionMatrix * modelViewMatrix * vec4(aNextPoint.x, aNextPoint.y, aNextPoint.z, 1);

    vec2 linePoint = vec2(cameraPos.x / cameraPos.w, cameraPos.y / cameraPos.w);
    vec2 prevLinePoint = vec2(prevPointCameraPos.x / cameraPos.w, prevPointCameraPos.y / cameraPos.w);
    vec2 nextLinePoint = vec2(nextPointCameraPos.x / cameraPos.w, nextPointCameraPos.y / cameraPos.w);

    vec2 tangent1 = normalize(linePoint - prevLinePoint);
    vec2 tangent2 = normalize(nextLinePoint - linePoint);

    if(prevLinePoint == linePoint)
      tangent1 = tangent2;

    if(linePoint == nextLinePoint)
      tangent2 = tangent1;

    vec2 avgTangent = (tangent1 + tangent2) / 2.0;

    vec2 prevNormal = normalize(vec2(-tangent1.y, tangent1.x));
    vec2 lineNormal = normalize(vec2(-avgTangent.y, avgTangent.x));

    float proportion = abs(dot(lineNormal, prevNormal));

    float lineDistance = 0.01;

    lineNormal = lineNormal * lineDistance * aNormalDir;

    gl_Position = vec4(cameraPos.x + (lineNormal.x * cameraPos.w), cameraPos.y + (lineNormal.y * cameraPos.w), cameraPos.z, cameraPos.w);

    float depthFog = clamp(1.0 / (gl_Position.w) * 20.0, 0.0, 1.0);
    vColour = aColour * vec4(depthFog, depthFog, depthFog, 1);
}

vec4 getValueByIndexFromTexture(sampler2D tex, int index) {
  int texWidth = textureSize(tex, 0).x;
  int col = index % texWidth;
  int row = index / texWidth;
  return texelFetch(tex, ivec2(col, row), 0);
}
`;