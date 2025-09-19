import { VfxCircles2DProgram } from "./codex_programs/vfx_circles_2d";
import { VfxQuads2DProgram } from "./codex_programs/vfx_quads_2d";
import { Renderer } from "./renderer";
import { ShaderProgram } from "./shader_program";

export class CodexRenderer {
    public static quads2DProgram: ShaderProgram;
    public static circles2DProgram: ShaderProgram;

    public static start(window: Window) {
        CodexRenderer.quads2DProgram = VfxQuads2DProgram.create(window);
        CodexRenderer.circles2DProgram = VfxCircles2DProgram.create(window);

        const renderer = Renderer.create(window, [
            CodexRenderer.circles2DProgram,
            CodexRenderer.quads2DProgram,
        ]);

        renderer!.start();
    }
}