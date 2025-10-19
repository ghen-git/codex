import { vec3, vec4 } from "gl-matrix";
import { Meshes3DProgram } from "./codex/rendering/codex_programs/meshes_3d";
import { CodexRenderer } from "./codex/rendering/codex_renderer"
import { MeshBuilder } from "./codex/rendering/meshes/mesh_builder";
import { Polyline } from "./codex/rendering/polyline";
import { axisAngleToQuat, rand } from "./codex/math";
import { PolylineGPU } from "./codex/rendering/polyline_gpu";
import { Lines3DProgram } from "./codex/rendering/codex_programs/lines_3d";
//@ts-expect-error
import teapotObj from "./obj/teapot.obj?raw";
import { RenderableMesh } from "./codex/rendering/shader_program";
import { PolylineGroup } from "./codex/rendering/polyline_group";
import { PolylineGPUGroup } from "./codex/rendering/polyline_gpu_group";

document.addEventListener('DOMContentLoaded', () => {
    CodexRenderer.start(window);
    MeshBuilder.overrideColourWithRandomColours = true;

    const teapot = MeshBuilder.parseObj(teapotObj);
    MeshBuilder.flatColourVertices(teapot.vertices, [1, 0, 0, 1]);

    const wireframe = buildWireframe(teapot, [1, 1, 1, 0.003], 0.001);
    CodexRenderer.lines3DProgram.renderMesh(wireframe.mesh);
    console.log(wireframe.mesh);
    // CodexRenderer.meshes3DProgram.renderMesh(teapot);

    wireframe.mesh.data!.position[1] -= 2;

    let progress = 0;
    CodexRenderer.lines3DProgram.settings.frame = (p, deltaTime) => {
        wireframe.mesh.data!.rotation = axisAngleToQuat([0, 1, 0, progress]);
        progress += 0.0001 * deltaTime;
        CodexRenderer.lines3DProgram.shouldUpdateBuffers = true;
    }

    Lines3DProgram.program3d.moveCameraBy([0, 0, 5])
    CodexRenderer.lines3DProgram.shouldUpdateBuffers = true;
})

function buildWireframe(mesh: RenderableMesh, colour: vec4, thickness: number) {
    const group = new PolylineGPUGroup();

    mesh.triangles.forEach(triangle => {
        const polyline = new PolylineGPU([
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

function meshes() {
    const points: vec3[] = [];

    const steps = 3000;
    const span = 1500;
    for (let i = 0; i < steps; i++) {
        const dist = (i / steps) * span;
        const even = i % 2 == 0 ? -2 : -1;
        const height = i % 4 >= 2 ? -10 : 10;
        points.push([dist - (span / 2), height, even]);
    }

    const polyline = new Polyline(points, [1, 1, 1, 1], 0.1);

    let progress = 0;

    // CodexRenderer.meshes3DProgram.settings.frame = () => {
    //     polyline.mesh.data!.rotation = axisAngleToQuat([0, 1, 0, progress]);
    //     progress += 0.005;
    //     CodexRenderer.meshes3DProgram.shouldUpdateBuffers = true;
    // }
}

function lines() {
    const points: vec3[] = [];

    const steps = 20;
    const span = 20;
    for (let i = 0; i < steps; i++) {
        const dist = (i / steps) * span;
        const even = i % 2 == 0 ? -2 : -1;
        const height = i % 4 >= 2 ? -5 : -2;
        points.push([dist - (span / 2), dist - (span / 2), even]);
    }

    const polyline = new PolylineGPU(points, [1, 1, 1, 1], 0.5);

    let progress = 0;
    polyline.mesh.data!.rotation = axisAngleToQuat([0, 1, 0, 0.5]);
    polyline.mesh.data!.position[2] = -7;

    CodexRenderer.lines3DProgram.settings.frame = () => {
        polyline.mesh.data!.rotation = axisAngleToQuat([0, 1, 0, progress]);
        progress += 0.005;
        CodexRenderer.lines3DProgram.shouldUpdateBuffers = true;
    }

    Lines3DProgram.program3d.moveCameraBy([0, 0, 10])
    CodexRenderer.lines3DProgram.shouldUpdateBuffers = true;
}