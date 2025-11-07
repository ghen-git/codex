import { DownsampleBlurProgram } from "./codex_programs/downsample_blur";
import { Lines3DProgram } from "./codex_programs/lines_3d";
import { Meshes3DProgram } from "./codex_programs/meshes_3d";
import { Meshes3DEmissiveProgram } from "./codex_programs/meshes_3d_emissive";
import { NativeLinesProgram } from "./codex_programs/native_lines";
import { PostProcessingProgram } from "./codex_programs/postprocessing";
import { UpsampleBlurProgram } from "./codex_programs/upsample_blur";
import { Renderer } from "./renderer";
import { ShaderProgram } from "./shader_program";

/**
 * TEXTURE USAGES:
 * 
 * 0:
 */

export class CodexRenderer {
    public static meshes3DProgram: ShaderProgram;
    public static meshes3DEmissiveProgram: ShaderProgram;
    public static lines3DProgram: ShaderProgram;
    public static nativeLinesProgram: ShaderProgram;
    public static downsampleBlurProgram: ShaderProgram;
    public static upsampleBlurProgram: ShaderProgram;
    public static postProcessingProgram: ShaderProgram;

    public static start(window: Window) {
        CodexRenderer.meshes3DProgram = Meshes3DProgram.create(window);
        CodexRenderer.meshes3DEmissiveProgram = Meshes3DEmissiveProgram.create(window);
        CodexRenderer.lines3DProgram = Lines3DProgram.create(window);
        CodexRenderer.nativeLinesProgram = NativeLinesProgram.create(window);
        CodexRenderer.downsampleBlurProgram = DownsampleBlurProgram.create(window);
        CodexRenderer.upsampleBlurProgram = UpsampleBlurProgram.create(window);
        CodexRenderer.postProcessingProgram = PostProcessingProgram.create(window);

        const renderer = Renderer.create(window, [
            CodexRenderer.meshes3DProgram,
            CodexRenderer.lines3DProgram,
            CodexRenderer.nativeLinesProgram,
            CodexRenderer.meshes3DEmissiveProgram,
            CodexRenderer.downsampleBlurProgram,
            CodexRenderer.upsampleBlurProgram,
            CodexRenderer.postProcessingProgram,
        ]);

        renderer!.start();
    }
}