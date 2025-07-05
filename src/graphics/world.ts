import { AmbientLight, Camera, DirectionalLight, Mesh, PerspectiveCamera, Scene, Vector3, WebGLRenderer } from "three";

export class World {
    scene: Scene;
    public activeCamera: PerspectiveCamera;

    renderer: WebGLRenderer;
    frameCallbacks: (() => void)[] = [];

    constructor(window: Window) {
        this.scene = new Scene();
        this.activeCamera = new PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 1000000);
        this.renderer = new WebGLRenderer();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        window.document.body.appendChild(this.renderer.domElement);

        this.setupLighting();

        this.renderer.setAnimationLoop(() => this.frame());
    }

    public moveCamera(offset: Vector3) {
        this.activeCamera.position.add(offset);
    }

    public add(mesh: Mesh) {
        this.scene.add(mesh);
    }

    public runOnFrame(callback: () => void) {
        this.frameCallbacks.push(callback);
    }

    setupLighting() {
        const color = 0xFFFFFF;
        const intensity = 1;
        const ambient = new AmbientLight(color, intensity);
        this.scene.add(ambient);

        const sun = new DirectionalLight(color, intensity * 100);
        sun.position.set(0, 10, 0);
        sun.target.position.set(-5, 0, -5);
        this.scene.add(sun);
        this.scene.add(sun.target);
    }

    frame() {
        this.frameCallbacks.forEach(callback => callback());
        this.renderer.render(this.scene, this.activeCamera);
    }
}