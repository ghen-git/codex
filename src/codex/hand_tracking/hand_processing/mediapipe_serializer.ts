import { Category, HandLandmarkerResult, NormalizedLandmark } from "@mediapipe/tasks-vision";
import { Hand, Hands } from "./hand_types";
import { vec3 } from "gl-matrix";

export class LandmarkerResultFormatter {
    public static format(result: HandLandmarkerResult, fast: boolean = false, invertHands: boolean = false): Hands {
        const hands: Hands = {
            leftIsTracked: false,
            rightIsTracked: false,
            none: result.handedness.length < 1 // checks if any hands are tracked
        }

        if (hands.none)
            return hands;

        result.handedness.forEach((handedness, i) => {
            LandmarkerResultFormatter.fillSingleHand(hands, handedness, result.landmarks[i], fast, invertHands);
        });

        return hands;
    }

    public static improveZ(hands: Hands, bottomUpHands: Hands) {
        if(hands.none)
            return;

        if(hands.left && bottomUpHands.left)
            this.improveZHand(hands.left, bottomUpHands.left);
        if(hands.right && bottomUpHands.right)
            this.improveZHand(hands.right, bottomUpHands.right);
    }

    public static improveZHand(hand: Hand, bottomUpHand: Hand) {
        hand.wrist[2] = bottomUpHand.wrist[1];

        hand.thumb.metacarpal[2] = bottomUpHand.thumb.metacarpal[1];
        hand.thumb.proximal[2] = bottomUpHand.thumb.proximal[1];
        hand.thumb.middle[2] = bottomUpHand.thumb.middle[1];
        hand.thumb.tip[2] = bottomUpHand.thumb.tip[1];

        hand.index.metacarpal[2] = bottomUpHand.index.metacarpal[1];
        hand.index.proximal[2] = bottomUpHand.index.proximal[1];
        hand.index.middle[2] = bottomUpHand.index.middle[1];
        hand.index.tip[2] = bottomUpHand.index.tip[1];

        hand.middle.metacarpal[2] = bottomUpHand.middle.metacarpal[1];
        hand.middle.proximal[2] = bottomUpHand.middle.proximal[1];
        hand.middle.middle[2] = bottomUpHand.middle.middle[1];
        hand.middle.tip[2] = bottomUpHand.middle.tip[1];

        hand.ring.metacarpal[2] = bottomUpHand.ring.metacarpal[1];
        hand.ring.proximal[2] = bottomUpHand.ring.proximal[1];
        hand.ring.middle[2] = bottomUpHand.ring.middle[1];
        hand.ring.tip[2] = bottomUpHand.ring.tip[1];

        hand.pinky.metacarpal[2] = bottomUpHand.pinky.metacarpal[1];
        hand.pinky.proximal[2] = bottomUpHand.pinky.proximal[1];
        hand.pinky.middle[2] = bottomUpHand.pinky.middle[1];
        hand.pinky.tip[2] = bottomUpHand.pinky.tip[1];
    }

    static fillSingleHand(hands: Hands, handedness: Category[], landmarks: NormalizedLandmark[], fast: boolean, invertHands: boolean) {
        let isRight = handedness[0].index == 1;

        if (invertHands)
            isRight = !isRight;

        if (isRight) {
            hands.rightIsTracked = true;
            if (!fast)
                hands.right = LandmarkerResultFormatter.formatHand(landmarks);
            else
                hands.rightLandmarks = landmarks;
        }
        else {
            hands.leftIsTracked = true;
            if (!fast)
                hands.left = LandmarkerResultFormatter.formatHand(landmarks);
            else
                hands.leftLandmarks = landmarks;
        }
    }

    static formatHand(landmarks: NormalizedLandmark[]): Hand {
        return {
            wrist: vec3.fromValues(landmarks[0].x, landmarks[0].y, landmarks[0].z),
            thumb: {
                metacarpal: vec3.fromValues(landmarks[1].x, landmarks[1].y, landmarks[1].z),
                proximal: vec3.fromValues(landmarks[2].x, landmarks[2].y, landmarks[2].z),
                middle: vec3.fromValues(landmarks[3].x, landmarks[3].y, landmarks[3].z),
                tip: vec3.fromValues(landmarks[4].x, landmarks[4].y, landmarks[4].z)
            },
            index: {
                metacarpal: vec3.fromValues(landmarks[5].x, landmarks[5].y, landmarks[5].z),
                proximal: vec3.fromValues(landmarks[6].x, landmarks[6].y, landmarks[6].z),
                middle: vec3.fromValues(landmarks[7].x, landmarks[7].y, landmarks[7].z),
                tip: vec3.fromValues(landmarks[8].x, landmarks[8].y, landmarks[8].z)
            },
            middle: {
                metacarpal: vec3.fromValues(landmarks[9].x, landmarks[9].y, landmarks[9].z),
                proximal: vec3.fromValues(landmarks[10].x, landmarks[10].y, landmarks[10].z),
                middle: vec3.fromValues(landmarks[11].x, landmarks[11].y, landmarks[11].z),
                tip: vec3.fromValues(landmarks[12].x, landmarks[12].y, landmarks[12].z)
            },
            ring: {
                metacarpal: vec3.fromValues(landmarks[13].x, landmarks[13].y, landmarks[13].z),
                proximal: vec3.fromValues(landmarks[14].x, landmarks[14].y, landmarks[14].z),
                middle: vec3.fromValues(landmarks[15].x, landmarks[15].y, landmarks[15].z),
                tip: vec3.fromValues(landmarks[16].x, landmarks[16].y, landmarks[16].z)
            },
            pinky: {
                metacarpal: vec3.fromValues(landmarks[17].x, landmarks[17].y, landmarks[17].z),
                proximal: vec3.fromValues(landmarks[18].x, landmarks[18].y, landmarks[18].z),
                middle: vec3.fromValues(landmarks[19].x, landmarks[19].y, landmarks[19].z),
                tip: vec3.fromValues(landmarks[20].x, landmarks[20].y, landmarks[20].z)
            }
        }
    }
}