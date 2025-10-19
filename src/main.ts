import { vec3 } from "gl-matrix";
import { Meshes3DProgram } from "./codex/rendering/codex_programs/meshes_3d";
import { CodexRenderer } from "./codex/rendering/codex_renderer"
import { MeshBuilder } from "./codex/rendering/meshes/mesh_builder";
import { Polyline } from "./codex/rendering/polyline";
import { axisAngleToQuat, rand } from "./codex/math";

document.addEventListener('DOMContentLoaded', () => {
    CodexRenderer.start(window);

    const points: vec3[] = [];

    const steps = 3000;
    const span = 1500;
    for (let i = 0; i < steps; i++) {
        const dist = (i / steps) * span;
        const even = i % 2 == 0 ? -2 : -1;
        const height = i % 4 >= 2 ? -10 : 10;
        points.push([dist - (span/2), height, even]);
    }

    const polyline = new Polyline(points, [1, 1, 1, 1], 0.1);

    let progress = 0;

    CodexRenderer.meshes3DProgram.settings.frame = () => {
        polyline.mesh.data!.rotation = axisAngleToQuat([0, 1, 0, progress]);
        progress += 0.005;
        CodexRenderer.meshes3DProgram.shouldUpdateBuffers = true;
    }

    Meshes3DProgram.program3d.moveCameraBy([0, 0, 15])
    CodexRenderer.meshes3DProgram.shouldUpdateBuffers = true;
})