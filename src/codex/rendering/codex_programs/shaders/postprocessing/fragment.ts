export const fragmentShader = `#version 300 es
precision highp float;

in highp vec4 vColour;
in highp vec2 vUv;

uniform sampler2D uFrameBufferTexture;

out vec4 fragColor;

void main() {
    vec4 colour = texture(uFrameBufferTexture, vUv);
    float brightness = max(colour.x, max(colour.y, colour.z));

    // if(colour.x > 0.0 && colour.x < 0.2)
    //     colour.x = 0.1;
    // if(colour.x > 0.1 && colour.x < 0.5)
    //     colour.x = 0.3;
    // if(colour.x > 0.3 && colour.x < 0.9)
    //     colour.x = 0.5;
    // if(colour.x > 0.5){
    //     colour.y = 0.7;
    //     colour.z = 0.7;}

    fragColor = colour;
}
`;