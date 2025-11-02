import { quat, vec3, vec4 } from "gl-matrix";
import { Meshes3DProgram } from "./codex/rendering/codex_programs/meshes_3d";
import { CodexRenderer } from "./codex/rendering/codex_renderer"
import { MeshBuilder } from "./codex/rendering/meshes/mesh_builder";
import { Polyline } from "./codex/rendering/polyline";
import { axisAngleToQuat } from "./codex/math";
//@ts-expect-error
import teapotObj from "./obj/teapot.obj?raw";
import { RenderableMesh, ShaderProgram } from "./codex/rendering/shader_program";
import { PolylineGroup } from "./codex/rendering/polyline_group";
import { NativeLinesProgram } from "./codex/rendering/codex_programs/native_lines";
import { Meshes3DEmissiveProgram } from "./codex/rendering/codex_programs/meshes_3d_emissive";

const rotatingMeshes: RenderableMesh[] = [];

document.addEventListener('DOMContentLoaded', () => {
    CodexRenderer.start(window);
    // MeshBuilder.overrideColourWithRandomColours = true;

    const teapot = MeshBuilder.parseObj(teapotObj);
    MeshBuilder.flatColourVertices(teapot.vertices, [1, 0, 0, 1]);
    const wireframe = buildWireframe(teapot, [1, 0.3, 0.3, 1], 0.01);

    MeshBuilder.computeNormalsFromTriangles(teapot);
    MeshBuilder.computeNormalsFromTriangles(wireframe.mesh);

    const gridWidth = 7.5;
    const gridCount = 2;

    for (let i = 0; i < gridCount; i++) {
        for (let j = 0; j < gridCount; j++) {
            const teapotClone = MeshBuilder.cloneMesh(teapot);
            const wireframeClone = MeshBuilder.cloneMesh(wireframe.mesh);

            teapotClone.data!.position[0] += (j * gridWidth) - (gridWidth * (gridCount / 2)) + gridWidth / 2;
            teapotClone.data!.position[2] += (i * gridWidth) - (gridWidth * (gridCount / 2)) + gridWidth / 2;
            teapotClone.data!.position[1] -= 5;

            CodexRenderer.meshes3DEmissiveProgram.renderMesh(wireframeClone);
            
            wireframeClone.data!.position[0] += (j * gridWidth) - (gridWidth * (gridCount / 2)) + gridWidth / 2;
            wireframeClone.data!.position[2] += (i * gridWidth) - (gridWidth * (gridCount / 2)) + gridWidth / 2;
            wireframeClone.data!.position[1] -= 2;

            rotatingMeshes.push(teapotClone);
            rotatingMeshes.push(wireframeClone);
        }
    }

    CodexRenderer.meshes3DEmissiveProgram.settings.frame = frame;

    const nativeLineTest: RenderableMesh = {
        vertices: [
            { position: [0, 0, 0], data: { colour: [1, 0, 0, 1] } },
            { position: [1, 1, 0], data: { colour: [1, 0, 0, 1] } },
            { position: [0, 2, 0], data: { colour: [1, 0, 0, 1] } },
            { position: [-1, 1, 0], data: { colour: [1, 0, 0, 1] } },
        ],
        triangles: [],
        data: {
            position: vec3.fromValues(0, 0, 0),
            rotation: quat.create(),
            lines: [
                [0, 1],
                [1, 2],
                [2, 3],
                [3, 0]
            ]
        }
    }

    rotatingMeshes.push(nativeLineTest);

    const cameraDistance = 10;
    const cameraOffset = 0;

    CodexRenderer.nativeLinesProgram.renderMesh(nativeLineTest);
    NativeLinesProgram.program3d.moveCameraBy([cameraOffset, 0, cameraDistance]);
    Meshes3DProgram.program3d.moveCameraBy([cameraOffset, 0, cameraDistance]);
    Meshes3DEmissiveProgram.program3d.moveCameraBy([cameraOffset, 0, cameraDistance]);
})

let progress = 0;
function frame(_: ShaderProgram, deltaTime: number) {
    rotatingMeshes.forEach(mesh => {
        mesh.data!.rotation = axisAngleToQuat([0, 1, 0, progress]);
    })
    progress += 0.0005 * deltaTime;
    CodexRenderer.meshes3DProgram.updateModelBuffers = true;
    CodexRenderer.meshes3DEmissiveProgram.updateModelBuffers = true;
    CodexRenderer.nativeLinesProgram.updateModelBuffers = true;
}

function buildWireframe(mesh: RenderableMesh, colour: vec4, thickness: number) {
    const group = new PolylineGroup();

    mesh.triangles.forEach(triangle => {
        const polyline = new Polyline([
            mesh.vertices[triangle[0]].position,
            mesh.vertices[triangle[1]].position,
            mesh.vertices[triangle[2]].position,
            mesh.vertices[triangle[0]].position
        ], colour, thickness);

        group.addPolyline(polyline, false);
    })

    group.rebuildMesh();

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