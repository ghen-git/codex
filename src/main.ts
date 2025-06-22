import { BoxGeometry, Mesh, MeshBasicMaterial, MeshPhongMaterial, Quaternion, SphereGeometry, Vector3 } from "three";
import { World } from "./graphics/world";
import { Finger, FingerFast, HandFast, Hands, HandsFast } from "./hand_tracking/hand_processing/hand_types";
import { UltraleapTracker } from "./hand_tracking/ultraleap_tracker";
import { vec3 } from "gl-matrix";
import { cubeToUV } from "three/src/nodes/TSL.js";
import { pinchingAny, touchingEachOthersTips } from "./hand_tracking/gestures/helper";
import { MediapipeTracker } from "./hand_tracking/mediapipe_tracker";

let world: World;

interface BlockBuilding {
    cube: Mesh,
    scaling: boolean
}

document.addEventListener('DOMContentLoaded', async () => {
    document.getElementById('setup_screen')!.hidden = true;

    setup3DHands();
});

function setup3DHands() {
    document.getElementById('setup_screen')!.hidden = false;
    document.getElementById('start_receiver')!.addEventListener('click', setupReceiver);
    document.getElementById('start_transmitter')!.addEventListener('click', setupTransmitter);
}

let depthThisFrame = false;

async function setupReceiver() {
    document.getElementById('setup_screen')!.remove();

    world = new World(window);
    buildWorld();
    world.moveCamera(new Vector3(5, 5, 5));
    world.activeCamera.lookAt(0, 0, 0);

    const tracker = await MediapipeTracker.create((handsFast: HandsFast, zImproved: boolean) => {
        depthThisFrame = zImproved;
        const hands = preprocessHands(handsFast);
        if (hands.left)
            console.log(hands.left.wrist.z);
        moveFingertips(hands);
        updateBlockBuilder(hands);
    }, window, true);
    tracker.start();

    const socket = new WebSocket('ws://192.168.54.2:8400/', 'receiver');
    socket.onmessage = (e) => {
        tracker.updateZCameraHands(JSON.parse(e.data));
    };
}

let lastHands: Hands;

function preprocessHands(handsFast: HandsFast): Hands {
    const hands: Hands = {
        none: handsFast.none,
        leftIsTracked: handsFast.leftIsTracked,
        rightIsTracked: handsFast.rightIsTracked
    }

    if (handsFast.left) {
        if (lastHands && lastHands.left)
            hands.left = {
                wrist: trackerToWorld(handsFast.left.wrist, lastHands.left.wrist),
                thumb: fingerToWorld(handsFast.left.thumb, lastHands.left.thumb),
                index: fingerToWorld(handsFast.left.index, lastHands.left.index),
                middle: fingerToWorld(handsFast.left.middle, lastHands.left.middle),
                ring: fingerToWorld(handsFast.left.ring, lastHands.left.ring),
                pinky: fingerToWorld(handsFast.left.pinky, lastHands.left.pinky)
            }
        else
            hands.left = {
                wrist: trackerToWorld(handsFast.left.wrist),
                thumb: fingerToWorld(handsFast.left.thumb),
                index: fingerToWorld(handsFast.left.index),
                middle: fingerToWorld(handsFast.left.middle),
                ring: fingerToWorld(handsFast.left.ring),
                pinky: fingerToWorld(handsFast.left.pinky)
            }
    }
    if (handsFast.right) {
        if (lastHands && lastHands.right)
            hands.right = {
                wrist: trackerToWorld(handsFast.right.wrist, lastHands.right.wrist),
                thumb: fingerToWorld(handsFast.right.thumb, lastHands.right.thumb),
                index: fingerToWorld(handsFast.right.index, lastHands.right.index),
                middle: fingerToWorld(handsFast.right.middle, lastHands.right.middle),
                ring: fingerToWorld(handsFast.right.ring, lastHands.right.ring),
                pinky: fingerToWorld(handsFast.right.pinky, lastHands.right.pinky)
            }
        else
            hands.right = {
                wrist: trackerToWorld(handsFast.right.wrist),
                thumb: fingerToWorld(handsFast.right.thumb),
                index: fingerToWorld(handsFast.right.index),
                middle: fingerToWorld(handsFast.right.middle),
                ring: fingerToWorld(handsFast.right.ring),
                pinky: fingerToWorld(handsFast.right.pinky)
            }
    }

    lastHands = hands;
    return hands;
}

function fingerToWorld(finger: FingerFast, oldFinger?: Finger) {
    if (oldFinger)
        return {
            metacarpal: trackerToWorld(finger.metacarpal, oldFinger.metacarpal),
            proximal: trackerToWorld(finger.proximal, oldFinger.proximal),
            middle: trackerToWorld(finger.middle, oldFinger.middle),
            tip: trackerToWorld(finger.tip, oldFinger.tip),
        }
    else
        return {
            metacarpal: trackerToWorld(finger.metacarpal),
            proximal: trackerToWorld(finger.proximal),
            middle: trackerToWorld(finger.middle),
            tip: trackerToWorld(finger.tip),
        }
}

function trackerToWorld(trackerVec3: vec3, oldVec?: Vector3) {
    const v = new Vector3(-trackerVec3[0], -trackerVec3[1], trackerVec3[2]);
    v.multiplyScalar(10);
    v.add(new Vector3(2.5, 2.5, -1));

    if (!oldVec)
        return v;

    if(!depthThisFrame) 
        v.setZ(oldVec.z);
    v.lerpVectors(v, oldVec, 0.5);
    return v;
}

function setupTransmitter() {
    document.getElementById('setup_screen')!.remove();

    const socket = new WebSocket('ws://192.168.54.2:8400/', 'transmitter');
    socket.onopen = async () => {
        const tracker = await MediapipeTracker.create((hands: HandsFast) => {
            socket.send(JSON.stringify(hands));
        }, window);
        tracker.start();
    };
}

const leftFingertipCursors: Mesh[] = [];
const rightFingertipCursors: Mesh[] = [];

function createFingertips() {
    for (let i = 0; i < 20; i++) {
        const leftCursor = getCube(0xff0000);
        const rightCursor = getCube(0x0000ff);
        leftFingertipCursors.push(leftCursor);
        rightFingertipCursors.push(rightCursor);
        world.add(leftCursor);
        world.add(rightCursor);
    }
}

function moveFingertips(hands: Hands) {
    if (hands.left) {
        leftFingertipCursors[0].position.set(hands.left.thumb.tip.x, hands.left.thumb.tip.y, hands.left.thumb.tip.z);
        leftFingertipCursors[1].position.set(hands.left.index.tip.x, hands.left.index.tip.y, hands.left.index.tip.z);
        leftFingertipCursors[2].position.set(hands.left.middle.tip.x, hands.left.middle.tip.y, hands.left.middle.tip.z);
        leftFingertipCursors[3].position.set(hands.left.ring.tip.x, hands.left.ring.tip.y, hands.left.ring.tip.z);
        leftFingertipCursors[4].position.set(hands.left.pinky.tip.x, hands.left.pinky.tip.y, hands.left.pinky.tip.z);
        leftFingertipCursors[5].position.set(hands.left.thumb.middle.x, hands.left.thumb.middle.y, hands.left.thumb.middle.z);
        leftFingertipCursors[6].position.set(hands.left.index.middle.x, hands.left.index.middle.y, hands.left.index.middle.z);
        leftFingertipCursors[7].position.set(hands.left.middle.middle.x, hands.left.middle.middle.y, hands.left.middle.middle.z);
        leftFingertipCursors[8].position.set(hands.left.ring.middle.x, hands.left.ring.middle.y, hands.left.ring.middle.z);
        leftFingertipCursors[9].position.set(hands.left.pinky.middle.x, hands.left.pinky.middle.y, hands.left.pinky.middle.z);
        leftFingertipCursors[10].position.set(hands.left.thumb.proximal.x, hands.left.thumb.proximal.y, hands.left.thumb.proximal.z);
        leftFingertipCursors[11].position.set(hands.left.index.proximal.x, hands.left.index.proximal.y, hands.left.index.proximal.z);
        leftFingertipCursors[12].position.set(hands.left.middle.proximal.x, hands.left.middle.proximal.y, hands.left.middle.proximal.z);
        leftFingertipCursors[13].position.set(hands.left.ring.proximal.x, hands.left.ring.proximal.y, hands.left.ring.proximal.z);
        leftFingertipCursors[14].position.set(hands.left.pinky.proximal.x, hands.left.pinky.proximal.y, hands.left.pinky.proximal.z);
        leftFingertipCursors[15].position.set(hands.left.thumb.metacarpal.x, hands.left.thumb.metacarpal.y, hands.left.thumb.metacarpal.z);
        leftFingertipCursors[16].position.set(hands.left.index.metacarpal.x, hands.left.index.metacarpal.y, hands.left.index.metacarpal.z);
        leftFingertipCursors[17].position.set(hands.left.middle.metacarpal.x, hands.left.middle.metacarpal.y, hands.left.middle.metacarpal.z);
        leftFingertipCursors[18].position.set(hands.left.ring.metacarpal.x, hands.left.ring.metacarpal.y, hands.left.ring.metacarpal.z);
        leftFingertipCursors[19].position.set(hands.left.pinky.metacarpal.x, hands.left.pinky.metacarpal.y, hands.left.pinky.metacarpal.z);
    }
    if (hands.right) {
        rightFingertipCursors[0].position.set(hands.right.thumb.tip.x, hands.right.thumb.tip.y, hands.right.thumb.tip.z);
        rightFingertipCursors[1].position.set(hands.right.index.tip.x, hands.right.index.tip.y, hands.right.index.tip.z);
        rightFingertipCursors[2].position.set(hands.right.middle.tip.x, hands.right.middle.tip.y, hands.right.middle.tip.z);
        rightFingertipCursors[3].position.set(hands.right.ring.tip.x, hands.right.ring.tip.y, hands.right.ring.tip.z);
        rightFingertipCursors[4].position.set(hands.right.pinky.tip.x, hands.right.pinky.tip.y, hands.right.pinky.tip.z);
        rightFingertipCursors[5].position.set(hands.right.thumb.middle.x, hands.right.thumb.middle.y, hands.right.thumb.middle.z);
        rightFingertipCursors[6].position.set(hands.right.index.middle.x, hands.right.index.middle.y, hands.right.index.middle.z);
        rightFingertipCursors[7].position.set(hands.right.middle.middle.x, hands.right.middle.middle.y, hands.right.middle.middle.z);
        rightFingertipCursors[8].position.set(hands.right.ring.middle.x, hands.right.ring.middle.y, hands.right.ring.middle.z);
        rightFingertipCursors[9].position.set(hands.right.pinky.middle.x, hands.right.pinky.middle.y, hands.right.pinky.middle.z);
        rightFingertipCursors[10].position.set(hands.right.thumb.proximal.x, hands.right.thumb.proximal.y, hands.right.thumb.proximal.z);
        rightFingertipCursors[11].position.set(hands.right.index.proximal.x, hands.right.index.proximal.y, hands.right.index.proximal.z);
        rightFingertipCursors[12].position.set(hands.right.middle.proximal.x, hands.right.middle.proximal.y, hands.right.middle.proximal.z);
        rightFingertipCursors[13].position.set(hands.right.ring.proximal.x, hands.right.ring.proximal.y, hands.right.ring.proximal.z);
        rightFingertipCursors[14].position.set(hands.right.pinky.proximal.x, hands.right.pinky.proximal.y, hands.right.pinky.proximal.z);
        rightFingertipCursors[15].position.set(hands.right.thumb.metacarpal.x, hands.right.thumb.metacarpal.y, hands.right.thumb.metacarpal.z);
        rightFingertipCursors[16].position.set(hands.right.index.metacarpal.x, hands.right.index.metacarpal.y, hands.right.index.metacarpal.z);
        rightFingertipCursors[17].position.set(hands.right.middle.metacarpal.x, hands.right.middle.metacarpal.y, hands.right.middle.metacarpal.z);
        rightFingertipCursors[18].position.set(hands.right.ring.metacarpal.x, hands.right.ring.metacarpal.y, hands.right.ring.metacarpal.z);
        rightFingertipCursors[19].position.set(hands.right.pinky.metacarpal.x, hands.right.pinky.metacarpal.y, hands.right.pinky.metacarpal.z);
    }
}

let blockBuildingState: BlockBuilding;
function updateBlockBuilder(hands: Hands) {
    if (hands.left && hands.right) {
        if (blockBuildingState && blockBuildingState.scaling) {
            stickTopAndBottomToPoints(blockBuildingState.cube, hands.left.index.tip, hands.right.index.tip);
        }

        if ((!blockBuildingState || !blockBuildingState.scaling) &&
            pinchingAny(hands.left) &&
            pinchingAny(hands.right) &&
            touchingEachOthersTips(hands.left, hands.right)) {
            const cube = getCube(0xffffff);
            console.log('yoo');
            blockBuildingState = {
                cube: cube,
                scaling: true
            }
            world.add(cube);
        }

        if (blockBuildingState &&
            blockBuildingState.scaling &&
            (!pinchingAny(hands.left) || !pinchingAny(hands.right))) {
            blockBuildingState.scaling = false;
        }
    }
}

function buildWorld() {
    createFingertips();
}

function stickTopAndBottomToPoints(cube: Mesh, top: Vector3, bottom: Vector3) {
    const distance = top.distanceTo(bottom);
    const midPoint = top.clone().lerp(bottom, 0.5);
    cube.position.set(midPoint.x, midPoint.y, midPoint.z);
    cube.lookAt(top);
    cube.scale.x = distance;
    cube.scale.y = distance;
    cube.scale.z = distance;
}

function getCube(color: number) {
    const geometry = new BoxGeometry(1, 1, 1); const material = new MeshPhongMaterial({
        color: color,    // red (can also use a CSS color string here)
        flatShading: true,
    });
    const cube = new Mesh(geometry, material);
    cube.scale.x = 0.1;
    cube.scale.y = 0.1;
    cube.scale.z = 0.1;

    return cube;
}