export const fragmentShader = `#version 300 es
#define BEZIER_WIDTH 5.0 * 0.0005
#define BEZIER_HEIGHT 5.0 * 0.0005
precision highp float;

in highp vec4 vColour;
in highp vec2 pos;

flat in highp vec2 a;
flat in highp vec2 b;
flat in highp vec2 c;
flat in highp vec2 d;

out vec4 fragColor;

float distance_function(float t, vec2 p, float[8] coeffs);
float distance_derivative(float t, vec2 p, float[8] coeffs);
float distance_derivative_derivative(float t, vec2 p, float[8] coeffs);
vec2 point_on_cubic(float t, float[8] coeffs);
float[8] compute_coeffs(vec2 a, vec2 b, vec2 c, vec2 d);
float min_distance_newton(vec2 p, vec2 a, vec2 b, vec2 c, vec2 d); 

void main() {
    float[8] coeffs = compute_coeffs(a, b, c, d);

    if(distance(pos, a) < 0.005)
        fragColor = vec4(0.5);
    else if(distance(pos, b) < 0.005)
        fragColor = vec4(0.5);
    else if(distance(pos, c) < 0.005)
        fragColor = vec4(0.5);
    else if(distance(pos, d) < 0.005)
        fragColor = vec4(0.5);
    else
        fragColor = vec4(min_distance_newton(pos, a, b, c, d));

}

float[8] compute_coeffs(vec2 a, vec2 b, vec2 c, vec2 d)
{
    float coeffs[8] = float[8](
        d.x - 3.0*c.x + 3.0*b.x - a.x,
        3.0*c.x - 6.0*b.x + 3.0*a.x,
        3.0*b.x - 3.0*a.x,
        a.x,
        d.y - 3.0*c.y + 3.0*b.y - a.y,
        3.0*c.y - 6.0*b.y + 3.0*a.y,
        3.0*b.y - 3.0*a.y,
        a.y
    );

    return coeffs;
}

// split 0 - 1 in 5 intervals (0.0 - 0.2, 0.2 - 04, 0.4 - 0.6, 0.6 - 0.8, 0.8 - 1.0)
// check for sign changes beteween the intervals
// in the intervals where a sign change occours, use netwtons method

float min_distance_newton(vec2 p, vec2 a, vec2 b, vec2 c, vec2 d) {
    float[8] coeffs = compute_coeffs(a, b, c, d);

    int n_roots = 1;
    float[1] roots = float[1](0.5);

    int steps = 5;

    for(int i = 0; i < steps; i++) {
        for(int j = 0; j < n_roots; j++) {
            float der_root = distance_derivative_derivative(roots[j], p, coeffs);
            roots[j] = roots[j] - distance_derivative(roots[j], p, coeffs)/der_root;
        }
    }

    float min_root = distance_function(roots[0], p, coeffs);
        
    for(int j = 1; j < n_roots; j++) {
        roots[j] = distance_function(roots[j], p, coeffs);
        if(roots[j] < min_root)
            min_root = roots[j];
    }

    float dist_start = distance_function(0.0, p, coeffs);
    float dist_end = distance_function(1.0, p, coeffs);

    return min_root;
}

// the function that outputs the distance between a point p
// and a cubic bezier curve defined by a, b, c and d
float distance_function(float t, vec2 p, float[8] coeffs) {
    float t_2 = t*t;
    float t_3 = t_2*t;
    
    float fx_t = coeffs[0]*t_3 + coeffs[1]*t_2 + coeffs[2]*t + coeffs[3];
    float fy_t = coeffs[4]*t_3 + coeffs[5]*t_2 + coeffs[6]*t + coeffs[7];
    
    return (fx_t - p.x)*(fx_t - p.x) + (fy_t - p.y)*(fy_t - p.y);
}

// the derivative of the function that outputs the distance between a point p
// and a cubic bezier curve defined by a, b, c and d
float distance_derivative(float t, vec2 p, float[8] coeffs) {
    float t_2 = t*t;
    float t_3 = t_2*t;
    
    float fx_t = coeffs[0]*t_3 + coeffs[1]*t_2 + coeffs[2]*t + coeffs[3];
    float f1x_t = 3.0*coeffs[0]*t_2 + 2.0*coeffs[1]*t + coeffs[2];

    float fy_t = coeffs[4]*t_3 + coeffs[5]*t_2 + coeffs[6]*t + coeffs[7];
    float f1y_t = 3.0*coeffs[4]*t_2 + 2.0*coeffs[5]*t + coeffs[6];
    
    return (2.0 * (fx_t - p.x) * f1x_t) + (2.0 * (fy_t - p.y) * f1y_t);
}

// the derivative of the derivative of the function that outputs the distance between a point p
// and a cubic bezier curve defined by a, b, c and d
float distance_derivative_derivative(float t, vec2 p, float[8] coeffs) {
    float t_2 = t*t;
    float t_3 = t_2*t;
    
    float fx_t = coeffs[0]*t_3 + coeffs[1]*t_2 + coeffs[2]*t + coeffs[3];
    float f1x_t = 3.0*coeffs[0]*t_2 + 2.0*coeffs[1]*t + coeffs[2];
    float f2x_t = 6.0*coeffs[0]*t + 2.0*coeffs[1];

    float fy_t = coeffs[4]*t_3 + coeffs[5]*t_2 + coeffs[6]*t + coeffs[7];
    float f1y_t = 3.0*coeffs[4]*t_2 + 2.0*coeffs[5]*t + coeffs[6];
    float f2y_t = 6.0*coeffs[4]*t + 2.0*coeffs[5];

    float x_component = 2.0 * (f1x_t * f2x_t + f1x_t * f1x_t);
    float y_component = 2.0 * (f1y_t * f2y_t + f1y_t * f1y_t);
    
    return x_component + y_component;
}

vec2 point_on_cubic(float t, float[8] coeffs) {
    float t_2 = t*t;
    float t_3 = t_2*t;

    float f_t_x = coeffs[0]*t_3 + coeffs[1]*t_2 + coeffs[2]*t + coeffs[3];
    float f_t_y = coeffs[4]*t_3 + coeffs[5]*t_2 + coeffs[6]*t + coeffs[7];

    return vec2(f_t_x, f_t_y);
}
`;