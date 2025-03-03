import { LinkedList, LinkedListNode } from "./linked_list";

export class Animator {
    private animationQueue: LinkedList<IAnimation>;
    private running: boolean;
    private lastFrameTime: number;

    constructor() {
        this.animationQueue = new LinkedList();
        this.running = false;
        this.lastFrameTime = -1;
    }

    queue(animation: IAnimation) {
        const node = this.animationQueue.push(animation);
        animation.node = node;
    }

    start() {
        this.running = true;
        this.lastFrameTime = Date.now();
        requestAnimationFrame(() => this.frame());
    }

    frame() {
        const frameTime = Date.now();
        const deltaTime = frameTime - this.lastFrameTime;

        this.animationQueue.forEach(animation => {
            animation.frame(deltaTime);

            if (animation.progress > animation.duration) {
                animation.end();
                this.animationQueue.remove(animation.node!);
                console.log(this);
            }
        });

        this.lastFrameTime = frameTime;

        if (this.running)
            requestAnimationFrame(() => this.frame());
    }

    stop() {
        this.running = false;
    }
}

interface IAnimation {
    progress: number,
    duration: number,
    frame: (deltaTime: number) => void,
    end: () => void,
    play: () => void,
    node?: LinkedListNode<IAnimation>,
}

export class Animation<T> implements IAnimation {
    onEnd: AnimationEvent;
    onStart: AnimationEvent;
    node?: LinkedListNode<IAnimation>;

    progress: number;
    duration: number;
    animator: Animator;

    data?: T;

    onFrame: (t: number, data?: T) => void;
    setup: () => T | undefined;
    cleanup: (data?: T) => void;

    constructor(duration: number, onFrame: (t: number, data?: T) => void, setup: () => T | undefined, cleanup: (data?: T) => void, animator: Animator) {
        this.animator = animator;

        this.onStart = new AnimationEvent(this);
        this.onEnd = new AnimationEvent(this);
        this.onFrame = onFrame;
        this.setup = setup;
        this.cleanup = cleanup;

        this.progress = 0;
        this.duration = duration;
    }

    play() {
        this.data = this.setup();
        this.animator.queue(this);
        this.onStart.triggerEvent();
    }

    frame(deltaTime: number) {
        const interpolationProgress = this.progress / this.duration;

        this.onFrame(interpolationProgress, this.data);

        this.progress += deltaTime;
    }

    end() {
        this.onFrame(1, this.data);
        this.onEnd.triggerEvent();
        this.cleanup(this.data);
    }
}

class AnimationEvent {
    onTrigger: IAnimation[];
    animation: IAnimation;

    constructor(animation: IAnimation) {
        this.onTrigger = [];
        this.animation = animation;
    }

    trigger(animation: IAnimation) {
        this.onTrigger.push(animation);
        return this.animation;
    }

    triggerEvent() {
        if (this.onTrigger)
            this.onTrigger.forEach(anim => anim.play());
    }
}