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
float min_distance_newton(vec2 p, vec2 a, vec2 b, vec2 c, vec2 d, out vec2 min_root_pos, out float min_root); 

void main() {
    float[8] coeffs = compute_coeffs(a, b, c, d);

    if(distance(pos, a) < 5.0)
        fragColor = vec4(0.5);
    else if(distance(pos, b) < 5.0)
        fragColor = vec4(0.5);
    else if(distance(pos, c) < 5.0)
        fragColor = vec4(0.5);
    else if(distance(pos, d) < 5.0)
        fragColor = vec4(0.5);
    else {
        vec2 min_root_pos;
        float min_root;

        if(min_distance_newton(pos, a, b, c, d, min_root_pos, min_root) < 5.0) 
            fragColor = vec4(1);
        else{
            vec2 ray = normalize(pos - min_root_pos);
            vec2 tangent = normalize(point_on_cubic(min_root + 0.1, coeffs) - min_root_pos);
            fragColor = vec4(sign(dot(tangent, ray)), 0, 0, 1);
        }
    }

}

float[8] compute_coeffs(vec2 a, vec2 b, vec2 c, vec2 d)
{
    float a1_x = d.x - 3.0*c.x + 3.0*b.x - a.x;
    float b1_x = 3.0*c.x - 6.0*b.x + 3.0*a.x;
    float c1_x = 3.0*b.x - 3.0*a.x;
    float d1_x = a.x;
    float a1_y = d.y - 3.0*c.y + 3.0*b.y - a.y;
    float b1_y = 3.0*c.y - 6.0*b.y + 3.0*a.y;
    float c1_y = 3.0*b.y - 3.0*a.y;
    float d1_y = a.y;

    float coeffs[8] = float[8](
        a1_x, b1_x, c1_x, d1_x, a1_y, b1_y, c1_y, d1_y
    );

    return coeffs;
}

// split 0 - 1 in 5 intervals (0.0 - 0.2, 0.2 - 04, 0.4 - 0.6, 0.6 - 0.8, 0.8 - 1.0)
// check for sign changes beteween the intervals
// in the intervals where a sign change occours, use netwtons method

float min_distance_newton(vec2 p, vec2 a, vec2 b, vec2 c, vec2 d, out vec2 min_root_pos, out float min_root) {
    float[8] coeffs = compute_coeffs(a, b, c, d);   

    int n_roots = 7;
    float[7] roots = float[7](0.0, 0.1, 0.3, 0.5, 0.7, 0.9, 1.0);

    int steps = 7;

    for(int i = 0; i < steps; i++) {
        for(int j = 0; j < n_roots; j++) {
            float der_root = distance_derivative_derivative(roots[j], p, coeffs);
            if(abs(der_root) > 1e-6)
                roots[j] = roots[j] - distance_derivative(roots[j], p, coeffs)/der_root;
        }
    }

    float min_distance = distance_function(roots[0], p, coeffs);
    min_root = roots[0];
    if(roots[0] < 0.0 || roots[0] > 1.0) {
        min_distance = 100000.0;
    }
    float distance_buffer = min_distance;

        
    for(int j = 1; j < n_roots; j++) {
        if(roots[j] >= 0.0 && roots[j] <= 1.0) {
            distance_buffer = distance_function(roots[j], p, coeffs);
            if(distance_buffer < min_distance) {
                min_distance = distance_buffer;
                min_root = roots[j];
            }
        }
    }

    float dist_start = distance_function(0.0, p, coeffs);
    float dist_end = distance_function(1.0, p, coeffs);

    if(dist_start < min_distance) {
        min_distance = dist_start;
        min_root_pos = a;
    }
    else if(dist_end < min_distance) {
        min_distance = dist_end;
        min_root_pos = d;
    }
    else 
        min_root_pos = point_on_cubic(min_root, coeffs);

    return min_distance;
}

// the function that outputs the distance between a point p
// and a cubic bezier curve defined by a, b, c and d
float distance_function(float t, vec2 p, float[8] coeffs) {
    float t_2 = t*t;
    float t_3 = t_2*t;
    
    float fx_t = coeffs[0]*t_3 + coeffs[1]*t_2 + coeffs[2]*t + coeffs[3];
    float fy_t = coeffs[4]*t_3 + coeffs[5]*t_2 + coeffs[6]*t + coeffs[7];

    float x_component = (fx_t - p.x)*(fx_t - p.x);
    
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

    float x_component = 2.0 * (fx_t - p.x) * f1x_t;
    float y_component = 2.0 * (fy_t - p.y) * f1y_t;
    
    return x_component + y_component;
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

    float x_component = 2.0 * ((fx_t - p.x) * f2x_t + f1x_t * f1x_t);
    float y_component = 2.0 * ((fy_t - p.y) * f2y_t + f1y_t * f1y_t);
    
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