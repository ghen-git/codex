import { vec3 } from "gl-matrix";
import { Finger, Hand, Hands } from "./hand_types";

export function transformHandsCoords(rawHands: Hands) {
    if (rawHands.leftIsTracked)
        transformHandCoords(rawHands.left!);
    if (rawHands.rightIsTracked)
        transformHandCoords(rawHands.right!);
}

export function transformHandCoords(rawHand: Hand) {
    const scalingFactor = vec3.distance(rawHand.wrist, rawHand.middle.metacarpal) - defaultDistance;

    transformFingerCoords(rawHand.thumb, rawHand, scalingFactor);
    transformFingerCoords(rawHand.index, rawHand, scalingFactor);
    transformFingerCoords(rawHand.middle, rawHand, scalingFactor);
    transformFingerCoords(rawHand.ring, rawHand, scalingFactor);
    transformFingerCoords(rawHand.pinky, rawHand, scalingFactor);
    transformHandPointCoord(rawHand.wrist, scalingFactor);
}

export function transformFingerCoords(rawFinger: Finger, rawHand: Hand, scalingFactor: number) {
    transformHandPointCoord(rawFinger.metacarpal, scalingFactor);
    transformHandPointCoord(rawFinger.proximal, scalingFactor);
    transformHandPointCoord(rawFinger.middle, scalingFactor);
    transformHandPointCoord(rawFinger.tip, scalingFactor);
}


/**
 * sqrt((xb - xa)^2 + (yb - ya)^2 + (zb - za)^2) = d
 * 
 * c = (xb - xa)^2 + (yb - ya)^2
 * 
 * sqrt(c + (zb - za)^2) = d
 * c + (zb - za)^2 = d^2
 * (zb - za)^2 = d^2 - c
 * 
 * zb - za = +-sqrt(d^2 - c)
 * -za = +-sqrt(d^2 - c) - zb
 * za = +-sqrt(d^2 - c) + zb
 * 
 * za = zb +-sqrt(d^2 - c)
 */

function fixPointLength(pivot: vec3, toFix: vec3, distance: number) {
    const c = (pivot[0] - toFix[0]) * (pivot[0] - toFix[0]) + (pivot[1] - toFix[1]) * (pivot[1] - toFix[1]);

    const fixedZ1 = pivot[2] + Math.sqrt(distance * distance - c);
    const fixedZ2 = pivot[2] - Math.sqrt(distance * distance - c);

    console.log(toFix[2] - fixedZ1);
    console.log(toFix[2] - fixedZ2);
}

const defaultDistance = vec3.distance([0.5669440627098083,
    1.0298391580581665,
    7.05850936810748e-7
], [0.5668288469314575,
    0.7187896966934204,
    -0.055894635617733]);

function transformHandPointCoord(v: vec3, scalingFactor: number) {
    v[0] -= 0.5;
    v[1] = -v[1];
    v[1] += 0.5;
    v[2] *= 2;

    vec3.scale(v, v, (defaultDistance / (defaultDistance + scalingFactor)));
    vec3.scale(v, v, 10);

    v[2] -= scalingFactor * 30;

    v[2] += 5;
}