import { NormalizedLandmark } from "@mediapipe/tasks-vision";
import { vec3 } from "gl-matrix";
import { Vector3 } from "three";

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
    wrist: Vector3,
    thumb: Finger,
    index: Finger,
    middle: Finger,
    ring: Finger,
    pinky: Finger
}

export interface Finger {
    metacarpal: Vector3, // metacarpal
    proximal: Vector3, // proximal phalanx
    middle: Vector3, // middle phalanx
    tip: Vector3 // distal phalanx
}

export interface HandsFast {
    leftIsTracked: boolean,
    rightIsTracked: boolean,
    none: boolean,
    left?: HandFast,
    right?: HandFast,
    leftLandmarks?: NormalizedLandmark[],
    rightLandmarks?: NormalizedLandmark[]
}

export interface HandFast {
    wrist: vec3,
    thumb: FingerFast,
    index: FingerFast,
    middle: FingerFast,
    ring: FingerFast,
    pinky: FingerFast
}

export interface FingerFast {
    metacarpal: vec3, // metacarpal
    proximal: vec3, // proximal phalanx
    middle: vec3, // middle phalanx
    tip: vec3 // distal phalanx
}