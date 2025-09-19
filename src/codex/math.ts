import { mat4, quat, vec2, vec3, vec4 } from "gl-matrix";

export const EPSILON = 0.00001;

/**
 * translates a rotation expressed in the axis angle format to
 * a quaternion
 */
export function axisAngleToQuat(axisAngle: vec4) {
    const angle = axisAngle[3];
    const normalizedDir = vec3.normalize(vec3.create(), vec3.fromValues(axisAngle[0], axisAngle[1], axisAngle[2]))

    return quat.fromValues(
        normalizedDir[0] * Math.sin(angle / 2),
        normalizedDir[1] * Math.sin(angle / 2),
        normalizedDir[2] * Math.sin(angle / 2),
        Math.cos(angle / 2)
    )
}

export function quatToAxisAngle(quat: quat) {
    const angle = Math.acos(quat[3]) * 2;

    return vec4.fromValues(
        quat[0] / Math.sin(angle / 2),
        quat[1] / Math.sin(angle / 2),
        quat[2] / Math.sin(angle / 2),
        angle
    )
}

/**
 * converts degrees to radians
 */
export function toRad(degs: number) {
    return (degs / 180) * Math.PI;
}

/**
 * multiplies two quaternions
 */
export function quatMul(p: quat, q: quat): quat {
    return quat.fromValues(
        p[3] * q[0] + p[0] * q[3] + p[1] * q[2] - p[2] * q[1],
        p[3] * q[1] + p[1] * q[3] - p[0] * q[2] + p[2] * q[0],
        p[3] * q[2] + p[0] * q[1] - p[1] * q[0] + p[2] * q[3],
        p[3] * q[3] - p[0] * q[0] - p[1] * q[1] - p[2] * q[2],
    );
}

/**
 * applies a rotation in quaternion format (q) to a vector
 */
export function applyQuatToVec3(q: quat, v: vec3) {
    const conj = quat.conjugate(quat.create(), q);
    return quatMul(quatMul(q, [v[0], v[1], v[2], 0]), conj);
}

/**
 * converts colour values from 0-255 to 0-1
 */
export function rgbToScreenSpace(r: number, g: number, b: number): vec4 {
    return [
        r / 255, g / 255, b / 255, 1
    ];
}

export function quaternionToRotationMatrix(q: quat) {
    const out = mat4.create();

    const [x, y, z, w] = q;

    const xx = x * x, yy = y * y, zz = z * z;
    const xy = x * y, xz = x * z, yz = y * z;
    const wx = w * x, wy = w * y, wz = w * z;

    out[0] = 1 - 2 * (yy + zz);
    out[1] = 2 * (xy + wz);
    out[2] = 2 * (xz - wy);
    out[3] = 0;

    out[4] = 2 * (xy - wz);
    out[5] = 1 - 2 * (xx + zz);
    out[6] = 2 * (yz + wx);
    out[7] = 0;

    out[8] = 2 * (xz + wy);
    out[9] = 2 * (yz - wx);
    out[10] = 1 - 2 * (xx + yy);
    out[11] = 0;

    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;

    return out;
}

export function rand(min: number, max: number) {
    return Math.random() * (max - min) + (min);
}

export function randInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min) + (min));
}

export function createProjectionMatrix2d(width: number, height: number) {
    return mat4.fromValues(
        2 / width, 0, 0, 0,
        0, -2 / height, 0, 0,
        0, 0, 1, 0,
        -1, 1, 0, 1
    );
}

export function findBoundsOfPoints(points: vec2[]) {
    let minX = points[0][0], maxX = points[0][0], minY = points[0][1], maxY = points[0][1];

    points.forEach(p => {
        if(p[0] < minX)
            minX = p[0];
        else if(p[0] > maxX)
            maxX = p[0];
        if(p[1] < minY)
            minY = p[1];
        else if(p[1] > maxY)
            maxY = p[1];
    })

    return [minX, minY, maxX, maxY]
}

export function magnitude(v: vec2): number {
    return distance([0, 0], v);
}


export function normalize(v: vec2): vec2 {
    const magn = magnitude(v);
    return [
        v[0] / magn,
        v[1] / magn
    ]
}

export function vecFrom2Points(p1: vec2, p2: vec2) {
    return vec2.sub(vec2.create(), p2, p1);
}

export function distance(v1: vec2, v2: vec2) {
    const diff = [v2[0] - v1[0], v2[1] - v1[1]];
    return Math.sqrt(diff[0]*diff[0] + diff[1]*diff[1]);
}

export function rotate180(v: vec2) {
    return [-v[0], -v[1]];
}

export function lerpVec2(p1: vec2, p2: vec2, t: number) {
    return vec2.fromValues(
        (1 - t) * p1[0] + p2[0] * t,
        (1 - t) * p1[1] + p2[1] * t,
    );
}

export function lerpVec4(p1: vec4, p2: vec4, t: number) {
    return vec4.fromValues(
        (1 - t) * p1[0] + p2[0] * t,
        (1 - t) * p1[1] + p2[1] * t,
        (1 - t) * p1[2] + p2[2] * t,
        (1 - t) * p1[3] + p2[3] * t,
    );
}

export function lerp(n1: number, n2: number, t: number) {
    return (1 - t) * n1 + n2 * t;
}

export function randomOrderArray(length: number) {
    const arr: any[] = [];

    for(let i = 0; i < length; i++) 
        arr[i] = i;

    for(let i = 0; i < length - 1; i++) {
        const target = randInt(i + 1, length - 1);

        const targetValue = arr[target];
        arr[target] = arr[i];
        arr[i] = targetValue;
    }

    return arr;
}

export function createProjectionMatrix(width: number, height: number, fov: number, near: number, far: number) {
    const aspectRatio = width / height;

    const t = Math.tan(toRad(fov) / 2) * near;
    const b = -t;
    const r = aspectRatio * t;
    const l = -r;

    return mat4.fromValues(
        (2 * near) / (r - l), 0.0, 0, 0.0,
        0.0, (2 * near) / (t - b), 0, 0.0,
        (r + l) / (r - l), (t + b) / (t - b), -(far + near) / (far - near), -1,
        0.0, 0.0, -(2 * far * near) / (far - near), 0
    );
}