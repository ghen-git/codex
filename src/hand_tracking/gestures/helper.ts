import { Vector3 } from "three";
import { Finger, FingerFast, Hand, HandFast } from "../hand_processing/hand_types";

export function touchingEachOthersTips(hand1: Hand, hand2: Hand, maxTouchingDistance: number = 0.4) {
    return touchingTips(hand1.thumb, hand2.thumb, maxTouchingDistance) ||
        touchingTips(hand1.index, hand2.index, maxTouchingDistance) ||
        touchingTips(hand1.middle, hand2.middle, maxTouchingDistance) ||
        touchingTips(hand1.ring, hand2.ring, maxTouchingDistance) ||
        touchingTips(hand1.pinky, hand2.pinky, maxTouchingDistance);
}

export function pinchingAny(hand: Hand, maxPinchDistance: number =  0.4) {
    return touchingTips(hand.thumb, hand.index, maxPinchDistance) ||
        touchingTips(hand.thumb, hand.middle, maxPinchDistance) ||
        touchingTips(hand.thumb, hand.ring, maxPinchDistance) ||
        touchingTips(hand.thumb, hand.pinky, maxPinchDistance);
}

export function pinching(hand: Hand, maxPinchDistance: number =  0.4) {
    return touchingTips(hand.thumb, hand.index, maxPinchDistance);
}

export function touchingTips(finger1: Finger, finger2: Finger, maxTouchingDistance: number =  0.4) {
    return finger1.tip.distanceTo(finger2.tip) < maxTouchingDistance;
}