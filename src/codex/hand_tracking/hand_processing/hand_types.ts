import { NormalizedLandmark } from "@mediapipe/tasks-vision";
import { vec3 } from "gl-matrix";

export interface Hands {
    leftIsTracked: boolean,
    rightIsTracked: boolean,
    none: boolean,
    left?: Hand,
    right?: Hand,
    leftLandmarks?: NormalizedLandmark[],
    rightLandmarks?: NormalizedLandmark[]
}

export interface Hand {
    wrist: vec3,
    thumb: Finger,
    index: Finger,
    middle: Finger,
    ring: Finger,
    pinky: Finger
}

export interface Finger {
    metacarpal: vec3, // metacarpal
    proximal: vec3, // proximal phalanx
    middle: vec3, // middle phalanx
    tip: vec3 // distal phalanx
}