import { CodexRenderer } from "./codex/rendering/codex_renderer"
import { RenderableMesh } from "./codex/rendering/shader_program";

document.addEventListener('DOMContentLoaded', () => {
    CodexRenderer.start(window);

    const quad2: RenderableMesh = {
        triangles: [
            [0, 1, 2],
            [2, 3, 0]
        ],
        vertices: [
            { position: [60, 60, 0], data: { colour: [1, 1, 0, 0.1] } },
            { position: [100, 60, 0], data: { colour: [1, 1, 0, 0.1] } },
            { position: [100, 100, 0], data: { colour: [1, 1, 0, 0.1] } },
            { position: [60, 100, 0], data: { colour: [1, 1, 0, 0.1] } },
        ],
    };
    const quad: RenderableMesh = {
        triangles: [
            [0, 1, 2],
            [2, 3, 0]
        ],
        vertices: [
            { position: [50, 50, 0], data: { colour: [1, 0, 0, 0.1] } },
            { position: [100, 50, 0], data: { colour: [1, 0, 0, 0.1] } },
            { position: [100, 100, 0], data: { colour: [1, 0, 0, 0.1] } },
            { position: [50, 100, 0], data: { colour: [1, 0, 0, 0.1] } },
        ],
    };

    const circle: RenderableMesh = {
        triangles: [
            [0, 1, 2],
            [2, 3, 0]
        ],
        vertices: [
            { position: [0, 0, 0], data: { colour: [1, 1, 0, 0.1], uv: [0, 0], radius: 250 } },
            { position: [500, 0, 0], data: { colour: [1, 1, 0, 0.1], uv: [1, 0], radius: 250 } },
            { position: [500, 500, 0], data: { colour: [1, 1, 0, 0.1], uv: [1, 1], radius: 250 } },
            { position: [0, 500, 0], data: { colour: [1, 1, 0, 0.1], uv: [0, 1], radius: 250 } }
        ]
    };

    CodexRenderer.quads2DProgram.renderMesh(quad2);
    CodexRenderer.quads2DProgram.renderMesh(quad);
    // CodexRenderer.circles2DProgram.renderMesh(circle);
})