export const fragmentShader = `#version 300 es
precision highp float;

in highp vec4 vColour;
out vec4 fragColor;

in highp vec2 uvPos;
in highp float radiusSq;
in highp float length;

void main() {
    if(uvPos.x > radiusSq && uvPos.x < length - radiusSq) {
        fragColor = vColour;
    }
    else {
        vec2 leftCircle = vec2(radiusSq + 1.0, radiusSq);
        vec2 rightCircle = vec2(length - radiusSq - 1.0, radiusSq);
        float transparency = 0.0;

        if(distance(uvPos + vec2(0.25, 0.25), leftCircle) < radiusSq ||
        distance(uvPos + vec2(0.25, 0.25), rightCircle) < radiusSq)
            transparency += 0.25;

        if(distance(uvPos + vec2(0.75, 0.25), leftCircle) < radiusSq ||
        distance(uvPos + vec2(0.75, 0.75), rightCircle) < radiusSq)
            transparency += 0.25;

        if(distance(uvPos + vec2(0.25, 0.75), leftCircle) < radiusSq ||
        distance(uvPos + vec2(0.75, 0.75), rightCircle) < radiusSq)
            transparency += 0.25;

        if(distance(uvPos + vec2(0.75, 0.75), leftCircle) < radiusSq ||
        distance(uvPos + vec2(0.75, 0.75), rightCircle) < radiusSq)
            transparency += 0.25;

        fragColor = vec4(vColour.x, vColour.y, vColour.z, transparency);
    }
}
`;