import { ShaderProgram } from "./shader_program";

export interface SavedFrameBuffer {
    frameBuffer: WebGLFramebuffer,
    texture: WebGLTexture,
    textureIndex: number
}

export class Renderer {
    public gl: WebGL2RenderingContext;
    private canvas: HTMLCanvasElement;
    private window: Window;
    private shaderPrograms: ShaderProgram[];
    public multisampleFrameBuffer: WebGLFramebuffer;
    public colourRenderBuffer: WebGLRenderbuffer;
    public depthRenderBuffer: WebGLRenderbuffer;
    public savedBuffers: SavedFrameBuffer[];
    private antialiasingSamples: number = 4;

    constructor(gl: WebGL2RenderingContext, canvas: HTMLCanvasElement, window: Window, shaderPrograms: ShaderProgram[]) {
        this.gl = gl;
        this.canvas = canvas;
        this.window = window;
        this.shaderPrograms = shaderPrograms;
        this.savedBuffers = [];

        this.multisampleFrameBuffer = gl.createFramebuffer()!;
        this.depthRenderBuffer = gl.createRenderbuffer()!;
        this.colourRenderBuffer = gl.createRenderbuffer()!;

        // multisample frame buffer setup for antialiasing
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.multisampleFrameBuffer);

        this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, this.depthRenderBuffer);
        this.gl.renderbufferStorageMultisample(this.gl.RENDERBUFFER, this.antialiasingSamples, this.gl.DEPTH_COMPONENT16, window.innerWidth, window.innerHeight);
        // binds the bound frame buffer to the bound render buffer for the depth attachment
        this.gl.framebufferRenderbuffer(this.gl.FRAMEBUFFER, this.gl.DEPTH_ATTACHMENT, this.gl.RENDERBUFFER, this.depthRenderBuffer);
        
        this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, this.colourRenderBuffer);
        this.gl.renderbufferStorageMultisample(this.gl.RENDERBUFFER, this.antialiasingSamples, this.gl.RGBA8, window.innerWidth, window.innerHeight);
        // binds the bound frame buffer to the bound render buffer for the colour attachment
        this.gl.framebufferRenderbuffer(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.RENDERBUFFER, this.colourRenderBuffer);

        this.createSavedBuffer(0);
        this.createSavedBuffer(1);

        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.multisampleFrameBuffer);
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    }

    createSavedBuffer(textureIndex: number) {
        const frameBuffer = this.gl.createFramebuffer()!;
        const texture = this.gl.createTexture()!;

        // frame buffer texture setup
        this.gl.activeTexture(this.gl.TEXTURE0 + textureIndex);
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, frameBuffer);

        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);

        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.window.innerWidth, this.window.innerHeight, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, null);
        
        this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, texture, 0);

        this.savedBuffers.push({
            frameBuffer: frameBuffer,
            texture: texture,
            textureIndex: textureIndex
        });
    }

    /**
     * Processes the multisamples in the multisampleFrameBuffer and stores them in
     * the antialiasedFrameBuffer, which stores the image in a texture that can be
     * rendered on the postprocessing quad.
     */
    public processAntialiasing(antialiasedFrameBuffer: WebGLFramebuffer) {
        this.gl.bindFramebuffer(this.gl.READ_FRAMEBUFFER, this.multisampleFrameBuffer);
        this.gl.bindFramebuffer(this.gl.DRAW_FRAMEBUFFER, antialiasedFrameBuffer);

        this.gl.clearBufferfv(this.gl.COLOR, 0, [1.0, 1.0, 1.0, 1.0]);

        this.gl.blitFramebuffer(0, 0, this.window.innerWidth, this.window.innerHeight,
            0, 0, this.window.innerWidth, this.window.innerHeight,
            this.gl.COLOR_BUFFER_BIT, this.gl.LINEAR);
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

        this.updateBuffersSize();
        this.updateTexturesSize();

        this.gl.viewport(0, 0, this.window.innerWidth, this.window.innerHeight);
        this.shaderPrograms.forEach(program => program.updateWindowSize(this.window.innerWidth, this.window.innerHeight));
    }

    updateBuffersSize() {
        this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, this.depthRenderBuffer);
        this.gl.renderbufferStorageMultisample(this.gl.RENDERBUFFER, this.gl.getParameter(this.gl.MAX_SAMPLES), this.gl.DEPTH_COMPONENT16, this.window.innerWidth, this.window.innerHeight);
        this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, this.colourRenderBuffer);
        this.gl.renderbufferStorageMultisample(this.gl.RENDERBUFFER, this.gl.getParameter(this.gl.MAX_SAMPLES), this.gl.RGBA8, this.window.innerWidth, this.window.innerHeight);
    }

    updateTexturesSize() {
        this.savedBuffers.forEach(savedBuffer => {
            this.gl.bindTexture(this.gl.TEXTURE_2D, savedBuffer.texture);
            this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.window.innerWidth, this.window.innerHeight, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, null);
        });
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
        this.clearFrameBuffers();

        this.shaderPrograms.forEach(program => {
            if (program.meshes.length > 0 || program.updateModelBuffers || program.updateVertexBuffers || program.forceFrame) {
                program.renderFrame()
            }
        });
    }

    clearFrameBuffers() {
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.multisampleFrameBuffer);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT) // clears buffers selected by a mask to a preset value
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT) // clears buffers selected by a mask to a preset value
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