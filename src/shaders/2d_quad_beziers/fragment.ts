export const fragmentShader = `#version 300 es
#define BEZIER_WIDTH 5.0 * 0.0005
#define BEZIER_HEIGHT 5.0 * 0.0005
precision highp float;

in highp vec4 vColour;
in highp vec2 pos;

flat in highp vec2 a;
flat in highp vec2 b;
flat in highp vec2 c;

out vec4 fragColor;

void draw_bezier(vec2 a, vec2 b, vec2 c, bool inverse);
float find_delta(float a, float b, float c);

void main() {
    vec2 offset = vec2(BEZIER_WIDTH * 0.5, BEZIER_HEIGHT * 0.5);

    draw_bezier(a + offset, b + offset, c + offset, false);
    draw_bezier(a - offset, b - offset, c - offset, true);

    
}

void draw_bezier(vec2 a, vec2 b, vec2 c, bool inverse) {
    float x_eq_a = a.x - 2.0*b.x + c.x;
    float x_eq_b = 2.0*(b.x - a.x);
    float x_eq_c = a.x;
    
    float y_eq_a = a.y - 2.0*b.y + c.y;
    float y_eq_b = 2.0*(b.y - a.y);
    float y_eq_c = a.y;

    float x_eq_delta = find_delta(x_eq_a, x_eq_b, x_eq_c - pos.x);
    float y_eq_delta = find_delta(y_eq_a, y_eq_b, y_eq_c - pos.y);

    if(x_eq_delta >= 0.0) {
        float delta_sqrt = sqrt(x_eq_delta);
        float x_eq_t1 = (-x_eq_b + delta_sqrt) / (2.0*x_eq_a);
        float x_eq_t2 = (-x_eq_b - delta_sqrt) / (2.0*x_eq_a);

        float y_on_curve_1 = x_eq_t1*x_eq_t1*y_eq_a + x_eq_t1*y_eq_b + y_eq_c;
        float y_on_curve_2 = x_eq_t2*x_eq_t2*y_eq_a + x_eq_t2*y_eq_b + y_eq_c;
        float x_on_curve_1 = x_eq_t1*x_eq_t1*x_eq_a + x_eq_t1*x_eq_b + x_eq_c;
        float x_on_curve_2 = x_eq_t2*x_eq_t2*x_eq_a + x_eq_t2*x_eq_b + x_eq_c;

        if(!inverse) {
            if((x_eq_t1 >= 0.0 && x_eq_t1 <= 1.0 && y_on_curve_1 - pos.y > 0.0 && y_on_curve_1 - pos.y < BEZIER_HEIGHT) || 
            (x_eq_t2 >= 0.0 && x_eq_t2 <= 1.0 && y_on_curve_2 - pos.y > 0.0 && y_on_curve_2 - pos.y < BEZIER_HEIGHT)) {
                fragColor = vColour;
                return;
            }
        } else {
            if((x_eq_t1 >= 0.0 && x_eq_t1 <= 1.0 && pos.y - y_on_curve_1 > 0.0 && pos.y - y_on_curve_1 < BEZIER_HEIGHT) || 
            (x_eq_t2 >= 0.0 && x_eq_t2 <= 1.0 && pos.y - y_on_curve_2 > 0.0 && pos.y - y_on_curve_2 < BEZIER_HEIGHT)) {
                fragColor = vColour;
                return;
            }
        }
    }

    if(y_eq_delta >= 0.0) {
        float delta_sqrt = sqrt(y_eq_delta);
        float y_eq_t1 = (-y_eq_b + delta_sqrt) / (2.0*y_eq_a);
        float y_eq_t2 = (-y_eq_b - delta_sqrt) / (2.0*y_eq_a);

        float x_on_curve_1 = y_eq_t1*y_eq_t1*x_eq_a + y_eq_t1*x_eq_b + x_eq_c;
        float x_on_curve_2 = y_eq_t2*y_eq_t2*x_eq_a + y_eq_t2*x_eq_b + x_eq_c;

        if(!inverse) {
            if((y_eq_t1 >= 0.0 && y_eq_t1 <= 1.0 && x_on_curve_1 - pos.x > 0.0 && x_on_curve_1 - pos.x < BEZIER_WIDTH) || 
            (y_eq_t2 >= 0.0 && y_eq_t2 <= 1.0 && x_on_curve_2 - pos.x > 0.0 && x_on_curve_2 - pos.x < BEZIER_WIDTH)) {
                fragColor = vColour;
                return;
            }
        } else {
            if((y_eq_t1 >= 0.0 && y_eq_t1 <= 1.0 && pos.x - x_on_curve_1 > 0.0 && pos.x - x_on_curve_1 < BEZIER_WIDTH) || 
            (y_eq_t2 >= 0.0 && y_eq_t2 <= 1.0 && pos.x - x_on_curve_2 > 0.0 && pos.x - x_on_curve_2 < BEZIER_WIDTH)) {
                fragColor = vColour;
                return;
            }
        }
    }
    fragColor = vec4(0);
}

float find_delta(float a, float b, float c) {
    return b*b - 4.0*a*c;
}
`;