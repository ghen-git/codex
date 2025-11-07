//@ts-expect-error
import tizianoObj from "./obj/UELAGIOVACOMEOUMA.obj?raw";

import { vec3, vec4 } from "gl-matrix";
import { Meshes3DProgram } from "./codex/rendering/codex_programs/meshes_3d";
import { CodexRenderer } from "./codex/rendering/codex_renderer"
import { MeshBuilder } from "./codex/rendering/meshes/mesh_builder";
import { axisAngleToQuat, quatMul } from "./codex/math";
import { RenderableMesh, ShaderProgram } from "./codex/rendering/shader_program";
import { PolylineGroup } from "./codex/rendering/polylines/polyline_group";
import { NativeLinesProgram } from "./codex/rendering/codex_programs/native_lines";
import { Meshes3DEmissiveProgram } from "./codex/rendering/codex_programs/meshes_3d_emissive";
import { Lines3DProgram } from "./codex/rendering/codex_programs/lines_3d";
import { PolylineType } from "./codex/rendering/polylines/polyline";
import { PolylineNative } from "./codex/rendering/polylines/polyline_native";

const rotatingMeshes: RenderableMesh[] = [];

document.addEventListener('DOMContentLoaded', () => {
    CodexRenderer.start(window);
    // MeshBuilder.overrideColourWithRandomColours = true;

    const teapot = MeshBuilder.parseObj(tizianoObj);
    const teapotColour: vec4 = [1, 0, 0, 1];
    const wireframeColour: vec4 = [1, 0, 0, 1];
    // turnColourNeon(teapotColour, 0.5);
    turnColourNeon(wireframeColour, 0.5);
    MeshBuilder.flatColourVertices(teapot.vertices, teapotColour);
    const wireframe = buildWireframe(teapot, wireframeColour, 0.01);

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
            CodexRenderer.nativeLinesProgram.renderMesh(wireframeClone);

            wireframeClone.data!.position[0] += (j * gridWidth) - (gridWidth * (gridCount / 2)) + gridWidth / 2;
            wireframeClone.data!.position[2] += (i * gridWidth) - (gridWidth * (gridCount / 2)) + gridWidth / 2;

            const rotationAxis: vec3 = [1, 0, 0];
            vec3.normalize(rotationAxis, rotationAxis);
            teapotClone.data!.rotation = axisAngleToQuat([rotationAxis[0], rotationAxis[1], rotationAxis[2], Math.PI / 6]);
            wireframeClone.data!.rotation = axisAngleToQuat([rotationAxis[0], rotationAxis[1], rotationAxis[2], Math.PI / 6]);
            
            wireframeClone.data!.pivot = [-9, 0, 0];

            rotatingMeshes.push(teapotClone);
            rotatingMeshes.push(wireframeClone);
            console.log(wireframeClone);
        }
    }


    CodexRenderer.nativeLinesProgram.settings.frame = frame;

    const cameraDistance = 20;
    const cameraOffset = 0;
    const cameraHeight =2;

    NativeLinesProgram.program3d.moveCameraBy([cameraOffset, cameraHeight, cameraDistance]);
    Meshes3DProgram.program3d.moveCameraBy([cameraOffset, cameraHeight, cameraDistance]);
    Lines3DProgram.program3d.moveCameraBy([cameraOffset, cameraHeight, cameraDistance]);
    Meshes3DEmissiveProgram.program3d.moveCameraBy([cameraOffset, cameraHeight, cameraDistance]);
})

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

function frame(_: ShaderProgram, deltaTime: number) {
    rotatingMeshes.forEach(mesh => {
        const rotationAxis: vec3 = [0, 1, 0];
        mesh.data!.rotation = quatMul(mesh.data!.rotation, axisAngleToQuat([rotationAxis[0], rotationAxis[1], rotationAxis[2], 0.0005 * deltaTime]))
    })
    // CodexRenderer.meshes3DProgram.updateModelBuffers = true;
    // CodexRenderer.lines3DProgram.updateModelBuffers = true;
    CodexRenderer.meshes3DEmissiveProgram.updateModelBuffers = true;
    CodexRenderer.nativeLinesProgram.updateModelBuffers = true;
}

function buildWireframe(mesh: RenderableMesh, colour: vec4, thickness: number) {
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