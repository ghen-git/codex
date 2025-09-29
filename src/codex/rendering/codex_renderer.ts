import { Meshes3DProgram } from "./codex_programs/meshes_3d";
import { VfxCircles2DProgram } from "./codex_programs/vfx/circles_2d";
import { VfxQuads2DProgram } from "./codex_programs/vfx/quads_2d";
import { Renderer } from "./renderer";
import { ShaderProgram } from "./shader_program";

export class CodexRenderer {
    public static quads2DProgram: ShaderProgram;
    public static circles2DProgram: ShaderProgram;
    public static meshes3DProgram: ShaderProgram;

    public static start(window: Window) {
        CodexRenderer.quads2DProgram = VfxQuads2DProgram.create(window);
        CodexRenderer.circles2DProgram = VfxCircles2DProgram.create(window);
        CodexRenderer.meshes3DProgram = Meshes3DProgram.create(window);

        const renderer = Renderer.create(window, [
            // CodexRenderer.circles2DProgram,
            // CodexRenderer.quads2DProgram,
            CodexRenderer.meshes3DProgram,
        ]);

        renderer!.start();
    }
}