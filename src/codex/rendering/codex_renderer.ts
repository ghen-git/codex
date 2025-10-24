import { Lines3DProgram } from "./codex_programs/lines_3d";
import { Meshes3DProgram } from "./codex_programs/meshes_3d";
import { NativeLinesProgram } from "./codex_programs/native_lines";
import { PostProcessingProgram } from "./codex_programs/postprocessing";
import { Renderer } from "./renderer";
import { ShaderProgram } from "./shader_program";

export class CodexRenderer {
    public static meshes3DProgram: ShaderProgram;
    public static lines3DProgram: ShaderProgram;
    public static nativeLinesProgram: ShaderProgram;
    public static postProcessingProgram: ShaderProgram;

    public static start(window: Window) {
        CodexRenderer.meshes3DProgram = Meshes3DProgram.create(window);
        CodexRenderer.lines3DProgram = Lines3DProgram.create(window);
        CodexRenderer.nativeLinesProgram = NativeLinesProgram.create(window);
        CodexRenderer.postProcessingProgram = PostProcessingProgram.create(window);

        const renderer = Renderer.create(window, [
            CodexRenderer.meshes3DProgram,
            CodexRenderer.lines3DProgram,
            CodexRenderer.nativeLinesProgram,
            CodexRenderer.postProcessingProgram,
        ]);

        renderer!.start();
    }
}