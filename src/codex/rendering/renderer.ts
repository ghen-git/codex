import { ShaderProgram } from "./shader_program";

export class Renderer {
    public gl: WebGL2RenderingContext;
    private canvas: HTMLCanvasElement;
    private window: Window;
    private shaderPrograms: ShaderProgram[];
    public multisampleFrameBuffer: WebGLFramebuffer;
    public antialiasedFrameBuffer: WebGLFramebuffer;
    public colourRenderBuffer: WebGLRenderbuffer;
    public depthRenderBuffer: WebGLRenderbuffer;
    public frameBufferTexture: WebGLTexture;

    constructor(gl: WebGL2RenderingContext, canvas: HTMLCanvasElement, window: Window, shaderPrograms: ShaderProgram[]) {
        this.gl = gl;
        this.canvas = canvas;
        this.window = window;
        this.shaderPrograms = shaderPrograms;

        this.multisampleFrameBuffer = gl.createFramebuffer()!;
        this.antialiasedFrameBuffer = gl.createFramebuffer()!;
        this.depthRenderBuffer = gl.createRenderbuffer()!;
        this.colourRenderBuffer = gl.createRenderbuffer()!;
        this.frameBufferTexture = gl.createTexture()!;

        // multisample frame buffer setup for antialiasing
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.multisampleFrameBuffer);

        gl.bindRenderbuffer(gl.RENDERBUFFER, this.depthRenderBuffer);
        gl.renderbufferStorageMultisample(gl.RENDERBUFFER, gl.getParameter(gl.MAX_SAMPLES), gl.DEPTH_COMPONENT16, window.innerWidth, window.innerHeight);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.depthRenderBuffer);
        
        gl.bindRenderbuffer(gl.RENDERBUFFER, this.colourRenderBuffer);
        gl.renderbufferStorageMultisample(gl.RENDERBUFFER, gl.getParameter(gl.MAX_SAMPLES), gl.RGBA8, window.innerWidth, window.innerHeight);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, this.colourRenderBuffer);

        // frame buffer texture setup
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.frameBufferTexture);
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.antialiasedFrameBuffer);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.window.innerWidth, this.window.innerHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.frameBufferTexture, 0);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    public static create(window: Window, programs: ShaderProgram[]) {
        const canvas = window.document.createElement('canvas');
        canvas.style.position = 'fixed';
        canvas.style.left = '0px';
        canvas.style.top = '0px';
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        const gl = canvas.getContext('webgl2', { antialias: false });

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
        this.canvas.width = this.window.innerWidth;
        this.canvas.height = this.window.innerHeight;

        this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, this.depthRenderBuffer);
        this.gl.renderbufferStorageMultisample(this.gl.RENDERBUFFER, this.gl.getParameter(this.gl.MAX_SAMPLES), this.gl.DEPTH_COMPONENT16, window.innerWidth, window.innerHeight);
        this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, this.colourRenderBuffer);
        this.gl.renderbufferStorageMultisample(this.gl.RENDERBUFFER, this.gl.getParameter(this.gl.MAX_SAMPLES), this.gl.RGBA8, window.innerWidth, window.innerHeight);

        this.gl.bindTexture(this.gl.TEXTURE_2D, this.frameBufferTexture);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.window.innerWidth, this.window.innerHeight, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, null);

        this.gl.viewport(0, 0, this.window.innerWidth, this.window.innerHeight);
        this.shaderPrograms.forEach(program => program.updateWindowSize(this.window.innerWidth, this.window.innerHeight));
    }

    /**
     * starts the renderer (and the loop that re-renders the scene every frame)
     */
    start() {
        // const bg = this.backgroundColour;
        this.gl.clearColor(0, 0, 0, 1); // sets the value for the colour buffer bit

        // 3d with depth testing
        // this.gl.depthFunc(this.gl.LEQUAL); // sets the comparison to see if an object's z is closer than another to <=
        // this.gl.enable(this.gl.DEPTH_TEST); // activates depth testing (closer triangles get rendered on top of further ones)

        this.shaderPrograms.forEach(program => { 
            program.setup(this.gl, this);
        });
        this.loopOnAnimationFrame();
    }

    renderFrame() {
        // this.gl.viewport(0, 0, this.window.innerWidth, this.window.innerHeight);
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.multisampleFrameBuffer);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT) // clears buffers selected by a mask to a preset value
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT) // clears buffers selected by a mask to a preset value

        this.shaderPrograms.forEach(program => {
            if (program.meshes.length > 0 || program.updateModelBuffers || program.updateVertexBuffers || program.forceFrame) {
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