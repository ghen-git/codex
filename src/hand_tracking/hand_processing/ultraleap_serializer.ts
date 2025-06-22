import { HandFast, HandsFast } from "./hand_types";
import { vec3 } from "gl-matrix";

export class UltraleapDataFormatter {
    public static format(data: any): HandsFast {
        const hands: HandsFast = {
            leftIsTracked: false,
            rightIsTracked: false,
            none: data.hands.length < 1 // checks if any hands are tracked
        }

        if (hands.none)
            return hands;

        UltraleapDataFormatter.linkFingersToHandArrays(data);

        data.hands.forEach((hand: any) => {
            UltraleapDataFormatter.fillSingleHand(hands, hand);
        });

        return hands;
    }

    static linkFingersToHandArrays(data: any) {
        const handIdsMap: { [id: number]: number } = {};

        data.hands.forEach((hand: any, i: number) => {
            handIdsMap[hand.id] = i;
            hand.fingers = [];
        });

        data.pointables.forEach((pointable: any) => {
            const hand = data.hands[handIdsMap[pointable.handId]];
            hand.fingers.push(pointable);
        })
    }

    static fillSingleHand(hands: HandsFast, handData: any) {
        let isRight = handData.type == 'right';

        const formattedHand = UltraleapDataFormatter.formatHand(handData);

        if (isRight) {
            hands.rightIsTracked = true;
            hands.right = formattedHand;
        }
        else {
            hands.leftIsTracked = true;
            hands.left = formattedHand;
        }
    }

    static formatHand(hand: any): HandFast {
        const fingers = hand.fingers;

        return {
            wrist: vec3.fromValues(hand.wrist[0], hand.wrist[1], hand.wrist[2]),
            thumb: {
                metacarpal: vec3.fromValues(fingers[0].mcpPosition[0], fingers[0].mcpPosition[1], fingers[0].mcpPosition[2]),
                proximal: vec3.fromValues(fingers[0].pipPosition[0], fingers[0].pipPosition[1], fingers[0].pipPosition[2]),
                middle: vec3.fromValues(fingers[0].dipPosition[0], fingers[0].dipPosition[1], fingers[0].dipPosition[2]),
                tip: vec3.fromValues(fingers[0].tipPosition[0], fingers[0].tipPosition[1], fingers[0].tipPosition[2])
            },
            index: {
                metacarpal: vec3.fromValues(fingers[1].mcpPosition[0], fingers[1].mcpPosition[1], fingers[1].mcpPosition[2]),
                proximal: vec3.fromValues(fingers[1].pipPosition[0], fingers[1].pipPosition[1], fingers[1].pipPosition[2]),
                middle: vec3.fromValues(fingers[1].dipPosition[0], fingers[1].dipPosition[1], fingers[1].dipPosition[2]),
                tip: vec3.fromValues(fingers[1].tipPosition[0], fingers[1].tipPosition[1], fingers[1].tipPosition[2])
            },
            middle: {
                metacarpal: vec3.fromValues(fingers[2].mcpPosition[0], fingers[2].mcpPosition[1], fingers[2].mcpPosition[2]),
                proximal: vec3.fromValues(fingers[2].pipPosition[0], fingers[2].pipPosition[1], fingers[2].pipPosition[2]),
                middle: vec3.fromValues(fingers[2].dipPosition[0], fingers[2].dipPosition[1], fingers[2].dipPosition[2]),
                tip: vec3.fromValues(fingers[2].tipPosition[0], fingers[2].tipPosition[1], fingers[2].tipPosition[2])
            },
            ring: {
                metacarpal: vec3.fromValues(fingers[3].mcpPosition[0], fingers[3].mcpPosition[1], fingers[3].mcpPosition[2]),
                proximal: vec3.fromValues(fingers[3].pipPosition[0], fingers[3].pipPosition[1], fingers[3].pipPosition[2]),
                middle: vec3.fromValues(fingers[3].dipPosition[0], fingers[3].dipPosition[1], fingers[3].dipPosition[2]),
                tip: vec3.fromValues(fingers[3].tipPosition[0], fingers[3].tipPosition[1], fingers[3].tipPosition[2])
            },
            pinky: {
                metacarpal: vec3.fromValues(fingers[4].mcpPosition[0], fingers[4].mcpPosition[1], fingers[4].mcpPosition[2]),
                proximal: vec3.fromValues(fingers[4].pipPosition[0], fingers[4].pipPosition[1], fingers[4].pipPosition[2]),
                middle: vec3.fromValues(fingers[4].dipPosition[0], fingers[4].dipPosition[1], fingers[4].dipPosition[2]),
                tip: vec3.fromValues(fingers[4].tipPosition[0], fingers[4].tipPosition[1], fingers[4].tipPosition[2])
            }
        }
    }
}