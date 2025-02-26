export const fragmentShader = `#version 300 es
precision highp float;

in highp vec4 vColour;
out vec4 fragColor;

in highp vec2 uvPos;

float distance_squared(vec2 p1, vec2 p2);

void main() {
    vec2 centre = vec2(0.5, 0.5);

    float alpha_multiplier = 0.0;

    if(distance_squared(uvPos, centre) <= 0.25) {
        fragColor = vColour;
    } else {
        fragColor = vec4(0.0);
    }
}

float distance_squared(vec2 p1, vec2 p2) {
    vec2 diff = p2 - p1;

    return dot(diff, diff);
}
`;