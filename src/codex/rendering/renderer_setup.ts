import { flatCirclesDrawCall, flatQuadsDrawCall, setupDrawCalls } from "./draw_calls";
import { rgbToScreenSpace } from "../../math_ops";
import { init } from "./renderer";

export function setupRenderer(canvas: HTMLCanvasElement) {
    setupDrawCalls();

    const renderer = init(canvas, window, rgbToScreenSpace(17, 17, 17), [
        flatQuadsDrawCall,
    ])!;

    renderer.start();
}