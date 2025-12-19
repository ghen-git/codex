//@ts-expect-error
import tizianoObj from "./obj/UELAGIOVACOMEOUMA.obj?raw";

import { vec3, vec4 } from "gl-matrix";
import { CodexRenderer } from "./codex/rendering/codex_renderer"
import { MeshBuilder } from "./codex/rendering/meshes/mesh_builder";
import { axisAngleToQuat, basisFromQuat, basisToQuaternion, basisToRotationMat, quatMul, vecToBasis } from "./codex/math";
import { RenderableMesh, ShaderProgram } from "./codex/rendering/shader_program";
import { PolylineGroup } from "./codex/rendering/polylines/polyline_group";
import { PolylineType } from "./codex/rendering/polylines/polyline";
import { PolylineNative } from "./codex/rendering/polylines/polyline_native";
import { MediapipeTracker } from "./codex/hand_tracking/mediapipe_tracker";
import { Finger, Hand, Hands } from "./codex/hand_tracking/hand_processing/hand_types";
import { transformHandsCoords } from "./codex/hand_tracking/hand_processing/hand_resizing";

const rotatingMeshes: RenderableMesh[] = [];

document.addEventListener('DOMContentLoaded', () => {
    CodexRenderer.start(window);

    document.addEventListener('mousemove', moveRotation);
    document.addEventListener('wheel', zoomEvent);

    setupHands();
    renderObj();
});

let leftThumb: PolylineNative;
let leftIndex: PolylineNative;
let leftMiddle: PolylineNative;
let leftRing: PolylineNative;
let leftPinky: PolylineNative;
let rightThumb: PolylineNative;
let rightIndex: PolylineNative;
let rightMiddle: PolylineNative;
let rightRing: PolylineNative;
let rightPinky: PolylineNative;

function handsFrame(hands: Hands) {
    if (hands.leftIsTracked) {
        changeFingerPoints(leftThumb, hands.left!.thumb, hands.left!);
        changeFingerPoints(leftIndex, hands.left!.index, hands.left!);
        changeFingerPoints(leftMiddle, hands.left!.middle, hands.left!);
        changeFingerPoints(leftRing, hands.left!.ring, hands.left!);
        changeFingerPoints(leftPinky, hands.left!.pinky, hands.left!);
    }
    if (hands.rightIsTracked) {
        changeFingerPoints(rightThumb, hands.right!.thumb, hands.right!);
        changeFingerPoints(rightIndex, hands.right!.index, hands.right!);
        changeFingerPoints(rightMiddle, hands.right!.middle, hands.right!);
        changeFingerPoints(rightRing, hands.right!.ring, hands.right!);
        changeFingerPoints(rightPinky, hands.right!.pinky, hands.right!);
    }

    if(hands.leftIsTracked && hands.rightIsTracked && isPinching(hands.left!) && isPinching(hands.right!)) {
        betweenIndices.changePoints([hands.left!.index.tip, hands.right!.index.tip]);

        resizeBox(hands.left!.index.tip, hands.right!.index.tip);
        // console.log(vec3.normalize(vec3.create(), vec3.sub(vec3.create(), hands.left!.index.tip, hands.right!.index.tip)));
        // const basis = vecToBasis(vec3.normalize(vec3.create(), vec3.sub(vec3.create(), hands.left!.index.tip, hands.right!.index.tip)));
        // rotatingMeshes[0].data!.rotation = basisToQuaternion(basis);
    }
}

function isPinching(hand: Hand) {
    return vec3.distance(hand.thumb.tip, hand.index.tip) < 1.0;
}

function changeFingerPoints(fingerPolyline: PolylineNative, finger: Finger, hand: Hand) {
    fingerPolyline.changePoints([
        hand.wrist,
        finger.metacarpal,
        finger.proximal,
        finger.middle,
        finger.tip
    ]);
}

let betweenIndices: PolylineNative;

const boxVertices: vec3[] = [
    vec3.create(), // t bl
    vec3.create(), // t br
    vec3.create(), // t tr
    vec3.create(), // t tl
    vec3.create(), // b bl
    vec3.create(), // b br
    vec3.create(), // b tr
    vec3.create(), // b tl
]

function resizeBox(topLeft: vec3, bottomRight: vec3) {
    vec3.copy(boxVertices[0], topLeft);
    vec3.set(boxVertices[1], bottomRight[0], topLeft[1], topLeft[2]);
    vec3.set(boxVertices[2], bottomRight[0], topLeft[1], bottomRight[2]);
    vec3.set(boxVertices[3], topLeft[0], topLeft[1], bottomRight[2]);
    vec3.set(boxVertices[4], topLeft[0], bottomRight[1], topLeft[2]);
    vec3.set(boxVertices[5], bottomRight[0], bottomRight[1], topLeft[2]);
    vec3.copy(boxVertices[6], bottomRight);
    vec3.set(boxVertices[7], topLeft[0], bottomRight[1], bottomRight[2]);

    console.log(boxPolylineGroup);

    CodexRenderer.nativeLinesProgram.updateVertexBuffers = true;
}

let boxPolylineGroup: PolylineGroup;

async function setupHands() {
    const handColour: vec4 = [0.5, 1, 1, 1];
    const boxColour: vec4 = [1, 1, 1, 1];
    turnColourNeon(handColour, 1.0)
    turnColourNeon(boxColour, 1.0)
    leftThumb = new PolylineNative([], handColour, true);
    leftIndex = new PolylineNative([], handColour, true);
    leftMiddle = new PolylineNative([], handColour, true);
    leftRing = new PolylineNative([], handColour, true);
    leftPinky = new PolylineNative([], handColour, true);
    rightThumb = new PolylineNative([], handColour, true);
    rightIndex = new PolylineNative([], handColour, true);
    rightMiddle = new PolylineNative([], handColour, true);
    rightRing = new PolylineNative([], handColour, true);
    rightPinky = new PolylineNative([], handColour, true);
    betweenIndices = new PolylineNative([], [1, 0, 0, 1], false);

    boxPolylineGroup = new PolylineGroup(PolylineType.NATIVE);
    boxPolylineGroup.addPolyline(new PolylineNative([boxVertices[0], boxVertices[1], boxVertices[2], boxVertices[3], boxVertices[0]], boxColour));
    boxPolylineGroup.addPolyline(new PolylineNative([boxVertices[4], boxVertices[5], boxVertices[6], boxVertices[7], boxVertices[4]], boxColour));
    boxPolylineGroup.addPolyline(new PolylineNative([boxVertices[0], boxVertices[4]], boxColour));
    boxPolylineGroup.addPolyline(new PolylineNative([boxVertices[1], boxVertices[5]], boxColour));
    boxPolylineGroup.addPolyline(new PolylineNative([boxVertices[2], boxVertices[6]], boxColour));
    boxPolylineGroup.addPolyline(new PolylineNative([boxVertices[3], boxVertices[7]], boxColour));
    CodexRenderer.nativeLinesProgram.renderMesh(boxPolylineGroup.mesh);

    const tracker = await MediapipeTracker.create((hands: Hands) => {
        console.log('hey');
        transformHandsCoords(hands);
        handsFrame(hands);
    }, window, false);
    tracker.start();
}

function renderObj() {
    // MeshBuilder.overrideColourWithRandomColours = true;

    const teapot = MeshBuilder.parseObj(tizianoObj);
    const teapotColour: vec4 = [1, 0, 0, 1];
    const wireframeColour: vec4 = [1, 0, 0, 1];
    // turnColourNeon(teapotColour, 0.5);
    turnColourNeon(wireframeColour, 0.5);
    MeshBuilder.flatColourVertices(teapot.vertices, teapotColour);
    const wireframe = buildWireframe(teapot, wireframeColour);

    MeshBuilder.computeNormalsFromTriangles(teapot);
    // MeshBuilder.computeNormalsFromTriangles(wireframe.mesh);

    const gridWidth = 7.5;
    const gridCount = 1;

    for (let i = 0; i < gridCount; i++) {
        for (let j = 0; j < gridCount; j++) {
            const teapotClone = MeshBuilder.cloneMesh(teapot);
            const wireframeClone = MeshBuilder.cloneMesh(wireframe.mesh);

            teapotClone.data!.position[0] += (j * gridWidth) - (gridWidth * (gridCount / 2)) + gridWidth / 2;
            teapotClone.data!.position[2] += (i * gridWidth) - (gridWidth * (gridCount / 2)) + gridWidth / 2;

            // CodexRenderer.meshes3DProgram.renderMesh(teapotClone);
            // CodexRenderer.nativeLinesProgram.renderMesh(wireframeClone);

            wireframeClone.data!.position[0] += (j * gridWidth) - (gridWidth * (gridCount / 2)) + gridWidth / 2;
            wireframeClone.data!.position[2] += (i * gridWidth) - (gridWidth * (gridCount / 2)) + gridWidth / 2;

            teapotClone.data!.pivot = [-9, 0, 0];
            wireframeClone.data!.pivot = [-9, 0, 0];

            wireframeClone.data!.rotation = axisAngleToQuat([0, 1, 0, -Math.PI / 2]);

            // rotatingMeshes.push(teapotClone);
            rotatingMeshes.push(wireframeClone);
            console.log(wireframeClone);
        }
    }

    CodexRenderer.nativeLinesProgram.settings.frame = frame;

    const cameraDistance = 50;
    const cameraOffset = 0;
    const cameraHeight = 2;

    CodexRenderer.camera.position = [cameraOffset, cameraHeight, cameraDistance];
    CodexRenderer.updateCamera();

}

function turnColourNeon(colour: vec4, intensity: number = 1.0) {
    if (colour[0] == 0)
        colour[0] = 0.1;
    if (colour[1] == 0)
        colour[1] = 0.1;
    if (colour[2] == 0)
        colour[2] = 0.1;

    colour[0] = colour[0] * 1.5 * intensity;
    colour[1] = colour[1] * 1.5 * intensity;
    colour[2] = colour[2] * 1.5 * intensity;
}

let pitchProgress = -0.5;
let yawProgress = 0.5;
const movementStrength = 0.01;
let zoom = 30;

function moveRotation(event: MouseEvent) {
    if (event.buttons == 1) {
        yawProgress += event.movementX * movementStrength;
        pitchProgress -= event.movementY * movementStrength;
    }
}

function zoomEvent(event: WheelEvent) {
    zoom += event.deltaY * movementStrength;
}

function frame(_: ShaderProgram, deltaTime: number) {
    let rotation = axisAngleToQuat([0, 1, 0, yawProgress]);
    rotation = quatMul(rotation, axisAngleToQuat([1, 0, 0, pitchProgress]));

    rotatingMeshes.forEach(mesh => {
        // const rotationAxis: vec3 = [0, 1, 0];
        // mesh.data!.rotation = quatMul(mesh.data!.rotation, axisAngleToQuat([rotationAxis[0], rotationAxis[1], rotationAxis[2], 0.0005 * deltaTime]))

        // mesh.data!.rotation = rotation;
    });

    const basis = basisFromQuat(rotation);
    const cameraPos = vec3.scale(vec3.create(), basis.forward, zoom);

    CodexRenderer.camera.position = cameraPos;
    CodexRenderer.camera.rotationMat = basisToRotationMat(basis);
    CodexRenderer.updateCamera();

    CodexRenderer.meshes3DEmissiveProgram.updateModelBuffers = true;
    CodexRenderer.nativeLinesProgram.updateModelBuffers = true;
}

function buildWireframe(mesh: RenderableMesh, colour: vec4) {
    const group = new PolylineGroup(PolylineType.NATIVE);

    mesh.triangles.forEach(triangle => {
        const polyline = new PolylineNative([
            mesh.vertices[triangle[0]].position,
            mesh.vertices[triangle[1]].position,
            mesh.vertices[triangle[2]].position,
            mesh.vertices[triangle[0]].position
        ], colour);

        group.addPolyline(polyline, false);
    })

    group.rebuildMesh();
    console.log(group);

    return group;
}

// function meshes() {
//     const points: vec3[] = [];

//     const steps = 3000;
//     const span = 1500;
//     for (let i = 0; i < steps; i++) {
//         const dist = (i / steps) * span;
//         const even = i % 2 == 0 ? -2 : -1;
//         const height = i % 4 >= 2 ? -10 : 10;
//         points.push([dist - (span / 2), height, even]);
//     }

//     const polyline = new Polyline(points, [1, 1, 1, 1], 0.1);

//     let progress = 0;

//     // CodexRenderer.meshes3DProgram.settings.frame = () => {
//     //     polyline.mesh.data!.rotation = axisAngleToQuat([0, 1, 0, progress]);
//     //     progress += 0.005;
//     //     CodexRenderer.meshes3DProgram.shouldUpdateBuffers = true;
//     // }
// }

// function lines() {
//     const points: vec3[] = [];

//     const steps = 20;
//     const span = 20;
//     for (let i = 0; i < steps; i++) {
//         const dist = (i / steps) * span;
//         const even = i % 2 == 0 ? -2 : -1;
//         const height = i % 4 >= 2 ? -5 : -2;
//         points.push([dist - (span / 2), dist - (span / 2), even]);
//     }

//     const polyline = new PolylineGPU(points, [1, 1, 1, 1], 0.5);

//     let progress = 0;
//     polyline.mesh.data!.rotation = axisAngleToQuat([0, 1, 0, 0.5]);
//     polyline.mesh.data!.position[2] = -7;

//     CodexRenderer.lines3DProgram.settings.frame = () => {
//         polyline.mesh.data!.rotation = axisAngleToQuat([0, 1, 0, progress]);
//         progress += 0.005;
//         CodexRenderer.lines3DProgram.updateModelBuffers = true;
//     }

//     Lines3DProgram.program3d.moveCameraBy([0, 0, 10])
//     CodexRenderer.lines3DProgram.updateModelBuffers = true;
// }