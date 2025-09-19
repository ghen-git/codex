import { ShaderProgram } from "./shader_program";

export class Renderer {
    public gl: WebGL2RenderingContext;
    private canvas: HTMLCanvasElement;
    private window: Window;
    private shaderPrograms: ShaderProgram[];

    constructor(gl: WebGL2RenderingContext, canvas: HTMLCanvasElement, window: Window, shaderPrograms: ShaderProgram[]) {
        this.gl = gl;
        this.canvas = canvas;
        this.window = window;
        this.shaderPrograms = shaderPrograms;
    }

    public static create(window: Window, programs: ShaderProgram[]) {
        const canvas = window.document.createElement('canvas');
        canvas.style.position = 'fixed';
        canvas.style.left = '0px';
        canvas.style.top = '0px';
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        const gl = canvas.getContext('webgl2', { antialias: true });

        if (gl == null) {
            console.error('unable to initialize WebGL');
            return;
        }

        const renderer = new Renderer(gl, canvas, window, programs);
        window.addEventListener('resize', () => renderer.resizeCanvas());

        window.document.body.appendChild(canvas);
        return renderer;
    }

    public resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    /**
     * starts the renderer (and the loop that re-renders the scene every frame)
     */
    start() {
        // const bg = this.backgroundColour;
        this.gl.clearColor(0, 0, 0, 0); // sets the value for the colour buffer bit

        // 3d with depth testing
        // this.gl.depthFunc(this.gl.LEQUAL); // sets the comparison to see if an object's z is closer than another to <=
        // this.gl.enable(this.gl.DEPTH_TEST); // activates depth testing (closer triangles get rendered on top of further ones)

        this.shaderPrograms.forEach(program => program.setup(this.gl));
        this.loopOnAnimationFrame();
    }

    renderFrame() {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT) // clears buffers selected by a mask to a preset value

        this.shaderPrograms.forEach(program => {
            if (program.meshes.length > 0 || program.shouldUpdateBuffers) {
                program.renderFrame()
            }
        });
    }

    /**
     * adds a call to the renderframe function of this renderer to the animation frame
     */
    loopOnAnimationFrame() {
        this.window.requestAnimationFrame(() => {
            this.renderFrame();
            this.loopOnAnimationFrame();
        });
    }
}