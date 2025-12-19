import { vec3 } from "gl-matrix";
import { Finger, Hand, Hands } from "./hand_types";

const defaultHand: Hand = {
    wrist: [0.5669440627098083,
        1.0298391580581665,
        7.05850936810748e-7
    ],
    thumb: {
        metacarpal: [0.49074333906173706,
            0.9680367112159729,
            -0.032750532031059265],
        proximal: [0.4377189874649048,
            0.8699391484260559,
            -0.057520341128110886],
        middle: [0.3881138265132904,
            0.7926067113876343,
            -0.08057576417922974],
        tip: [0.33426105976104736,
            0.7363665103912354,
            -0.10552292317152023]
    },
    index: {
        metacarpal: [0.5074736475944519,
            0.7146417498588562,
            -0.04421912878751755],
        proximal: [0.49041199684143066,
            0.5863471031188965,
            -0.07436853647232056],
        middle: [0.47917258739471436,
            0.5049828290939331,
            -0.09760132431983948],
        tip: [0.4731135368347168,
            0.43263089656829834,
            -0.11622301489114761]
    },
    middle: {
        metacarpal: [0.5668288469314575,
            0.7187896966934204,
            -0.055894635617733],
        proximal: [0.5760791301727295,
            0.5749584436416626,
            -0.0838271751999855],
        middle: [0.5827620029449463,
            0.4830351173877716,
            -0.10782847553491592],
        tip: [0.5885341167449951,
            0.4029473066329956,
            -0.12650927901268005]
    },
    ring: {
        metacarpal: [0.6200831532478333,
            0.7555913329124451,
            -0.0717674121260643],
        proximal: [0.6449142694473267,
            0.6212022304534912,
            -0.10765111446380615],
        middle: [0.6566663384437561,
            0.5322971940040588,
            -0.1345491111278534],
        tip: [0.664206326007843,
            0.44720491766929626,
            -0.1540575474500656]
    },
    pinky: {
        metacarpal: [0.6658382415771484,
            0.8161850571632385,
            -0.0891476571559906],
        proximal: [0.7172236442565918,
            0.7348819375038147,
            -0.1254451721906662],
        middle: [0.751701831817627,
            0.6733691692352295,
            -0.1443624645471573],
        tip: [0.7801733016967773,
            0.6081857681274414,
            -0.1579592525959015]
    }
};

const defaultDistances: number[][] = [
    [
        vec3.distance(defaultHand.wrist, defaultHand.thumb.metacarpal), 
        vec3.distance(defaultHand.thumb.metacarpal, defaultHand.thumb.proximal), 
        vec3.distance(defaultHand.thumb.proximal, defaultHand.thumb.middle), 
        vec3.distance(defaultHand.thumb.middle, defaultHand.thumb.tip)
    ],
    [
        vec3.distance(defaultHand.wrist, defaultHand.index.metacarpal), 
        vec3.distance(defaultHand.index.metacarpal, defaultHand.index.proximal), 
        vec3.distance(defaultHand.index.proximal, defaultHand.index.middle), 
        vec3.distance(defaultHand.index.middle, defaultHand.index.tip)
    ],
    [
        vec3.distance(defaultHand.wrist, defaultHand.middle.metacarpal), 
        vec3.distance(defaultHand.middle.metacarpal, defaultHand.middle.proximal), 
        vec3.distance(defaultHand.middle.proximal, defaultHand.middle.middle), 
        vec3.distance(defaultHand.middle.middle, defaultHand.middle.tip)
    ],
    [
        vec3.distance(defaultHand.wrist, defaultHand.ring.metacarpal), 
        vec3.distance(defaultHand.ring.metacarpal, defaultHand.ring.proximal), 
        vec3.distance(defaultHand.ring.proximal, defaultHand.ring.middle), 
        vec3.distance(defaultHand.ring.middle, defaultHand.ring.tip)
    ],
    [
        vec3.distance(defaultHand.wrist, defaultHand.pinky.metacarpal), 
        vec3.distance(defaultHand.pinky.metacarpal, defaultHand.pinky.proximal), 
        vec3.distance(defaultHand.pinky.proximal, defaultHand.pinky.middle), 
        vec3.distance(defaultHand.pinky.middle, defaultHand.pinky.tip)
    ]
]

export function transformHandsCoords(rawHands: Hands) {
    if (rawHands.leftIsTracked)
        transformHandCoords(rawHands.left!);
    if (rawHands.rightIsTracked)
        transformHandCoords(rawHands.right!);
}

export function transformHandCoords(rawHand: Hand) {
    const scalingFactor = vec3.distance(rawHand.wrist, rawHand.middle.metacarpal) - vec3.distance(defaultHand.wrist, defaultHand.middle.metacarpal);

    transformFingerCoords(rawHand.thumb, defaultDistances[0], rawHand, scalingFactor);
    transformFingerCoords(rawHand.index, defaultDistances[1], rawHand, scalingFactor);
    transformFingerCoords(rawHand.middle, defaultDistances[2], rawHand, scalingFactor);
    transformFingerCoords(rawHand.ring, defaultDistances[3], rawHand, scalingFactor);
    transformFingerCoords(rawHand.pinky, defaultDistances[4], rawHand, scalingFactor);
    transformHandPointCoord(rawHand.wrist, scalingFactor);
}

export function transformFingerCoords(rawFinger: Finger, defaultFingerDistances: number[], rawHand: Hand, scalingFactor: number) {
    fixPointLength(rawHand.wrist, rawFinger.metacarpal, defaultFingerDistances[0]);
    fixPointLength(rawFinger.metacarpal, rawFinger.proximal, defaultFingerDistances[1]);
    fixPointLength(rawFinger.proximal, rawFinger.middle, defaultFingerDistances[2]);
    fixPointLength(rawFinger.middle, rawFinger.tip, defaultFingerDistances[3]);

    console.log(vec3.dist(rawFinger.metacarpal, rawFinger.proximal));
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
    const c = (pivot[0] - toFix[0])*(pivot[0] - toFix[0]) + (pivot[1] - toFix[1])*(pivot[1] - toFix[1]);

    const fixedZ1 = pivot[2] + Math.sqrt(Math.abs(distance*distance - c));
    const fixedZ2 = pivot[2] - Math.sqrt(Math.abs(distance*distance - c));

    if(toFix[2] - pivot[2] > 0)
        toFix[2] = fixedZ1;
    else
        toFix[2] = fixedZ2;
}

function transformHandPointCoord(v: vec3, scalingFactor: number) {
    v[0] -= 0.5;
    v[1] = -v[1];
    v[1] += 0.5;
    v[2] *= 2;

    vec3.scale(v, v, (defaultDistances[2][0] / (defaultDistances[2][0] + scalingFactor)));
    vec3.scale(v, v, 10);

    v[2] -= scalingFactor * 30;

    v[2] += 5;
}