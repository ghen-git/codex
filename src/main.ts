import { Meshes3DProgram } from "./codex/rendering/codex_programs/meshes_3d";
import { CodexRenderer } from "./codex/rendering/codex_renderer"
import { MeshBuilder } from "./codex/rendering/meshes/mesh_builder";
import { Polyline } from "./codex/rendering/polyline";

document.addEventListener('DOMContentLoaded', () => {
    CodexRenderer.start(window);

    const polyline = new Polyline([[-3, -3, 0], [-2, -2, -1], [-1, -1, -2]], [1, 0, 0, 1], 2);

    Meshes3DProgram.moveCameraBy([0, 2, 10])
    CodexRenderer.meshes3DProgram.shouldUpdateBuffers = true;
})