import { Vector2, Vector3 } from "three";
import { World } from "../../graphics/world";

export class KeyboardMovement {
    world: World;
    window: Window;

    movement: Vector3;
    mouseOffset: Vector2;
    prevMousePos: Vector2;

    constructor(world: World, window: Window) {
        this.world = world;
        this.window = window;
        this.movement = new Vector3(0);
        this.mouseOffset = new Vector2(0);
        this.prevMousePos = new Vector2(window.innerWidth / 2, window.innerHeight / 2);

        this.window.addEventListener('keydown', (e) => { this.movementKeysHandler(e, false) })
        this.window.addEventListener('keyup', (e) => { this.movementKeysHandler(e, true) })
        this.window.addEventListener('mousemove', (e) => { this.movementMouseHandler(e) })

        this.world.runOnFrame(() => this.updateCamera());
    }

    updateCamera() {
        const speed = 0.005;
        this.world.activeCamera.position.add(this.movement.clone().multiplyScalar(speed).applyAxisAngle(this.world.activeCamera.up, this.world.activeCamera.rotation.y));

        console.log(this.world.activeCamera.up, this.world.activeCamera.rotation.y);
        this.world.activeCamera.setRotationFromEuler()

        this.prevMousePos.copy(this.mouseOffset);
    }

    movementMouseHandler(e: MouseEvent) {
        this.mouseOffset.set(e.clientX, e.clientY);
    }

    movementKeysHandler(e: KeyboardEvent, keyUp: boolean) {
        const newMovement = keyUp ? 0 : 1;

        switch (e.code) {
            case 'KeyW':
                this.movement.setZ(-newMovement);
                break;
            case 'KeyS':
                this.movement.setZ(newMovement);
                break;
            case 'KeyA':
                this.movement.setX(-newMovement);
                break;
            case 'KeyD':
                this.movement.setX(newMovement);
                break;
            case 'Space':
                this.movement.setY(newMovement);
                break;
            case 'ShiftLeft':
                this.movement.setY(-newMovement);
                break;
        }
    }
}