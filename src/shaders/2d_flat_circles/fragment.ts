export const fragmentShader = `#version 300 es
precision highp float;

in highp vec4 vColour;
out vec4 fragColor;

in highp vec2 uvPos;
in highp float radius;

float distance_squared(vec2 p1, vec2 p2);

void main() {
    vec2 centre = vec2(radius + 0.5, radius + 0.5);
    vec2 pos = uvPos * (radius * 2.0);
    float radiusSq = radius*radius;
    
    vec2 p1 = pos + vec2(0.25, 0.25);
    vec2 p2 = pos + vec2(0.75, 0.25);
    vec2 p3 = pos + vec2(0.25, 0.75);
    vec2 p4 = pos + vec2(0.75, 0.75);

    float alpha_multiplier = 0.0;

    if(distance_squared(p1, centre) <= radiusSq) 
        alpha_multiplier += 0.25;

    if(distance_squared(p2, centre) <= radiusSq) 
        alpha_multiplier += 0.25;

    if(distance_squared(p3, centre) <= radiusSq) 
        alpha_multiplier += 0.25;

    if(distance_squared(p4, centre) <= radiusSq) 
        alpha_multiplier += 0.25;

    fragColor = vec4(vColour.xyz, vColour.w * alpha_multiplier);
}

float distance_squared(vec2 p1, vec2 p2) {
    vec2 diff = p2 - p1;

    return dot(diff, diff);
}
`;