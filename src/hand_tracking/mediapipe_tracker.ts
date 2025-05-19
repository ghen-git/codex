// import { OrderedWorkerPool } from '../workers/ordered_worker_pool';
// import DetectionWorker from './workers/detection_worker?worker'
import { HandLandmarker, FilesetResolver, HandLandmarkerResult } from '@mediapipe/tasks-vision'
import { Hands } from './hand_processing/hand_types';
import { LandmarkerResultFormatter } from './hand_processing/hand_serializer';

export class MediapipeTracker {
    // workerPool: OrderedWorkerPool;
    handEventHandler: (data: Hands) => void;
    landmarker: HandLandmarker;
    lastFrame: number;
    video?: HTMLVideoElement;
    window: Window;
    running: boolean;

    constructor(handEventHandler: (data: Hands) => void, landmarker: HandLandmarker, window: Window/*, nWorkers: number*/) {
        this.handEventHandler = handEventHandler;
        this.landmarker = landmarker;
        this.lastFrame = -1;
        this.window = window;
        this.running = false;

        // this.workerPool = new OrderedWorkerPool(nWorkers, DetectionWorker);
    }

    public static async create(handEventHandler: (data: Hands) => void, window: Window) {
        const landmarker = await this.createLandmarker();
        const tracker = new MediapipeTracker(handEventHandler, landmarker, window);

        await tracker.setupVideoStream(window);

        return tracker;
    }

    processLandmarks(result: HandLandmarkerResult) {
        try {
            this.handEventHandler(LandmarkerResultFormatter.format(result, false, true));
        }
        catch(ex) {
            console.warn(ex);
        }
    }

    setupVideoStream(window: Window) {
        this.video = window.document.getElementById('webcam_displayer') as HTMLVideoElement;
        const video = this.video;

        const constraints = {
            video: true
        };

        return new Promise<void>(resolve => {
            window.navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
                video.srcObject = stream;
                video.addEventListener('loadeddata', () => {
                    this.accessWebcamFrame();
                    resolve();
                });
            })
        });
    }

    processWebcamFrame() {
        const startTimeMs = this.window.performance.now();
        const results = this.landmarker.detectForVideo(this.video!, startTimeMs);
        this.processLandmarks(results);
    }

    accessWebcamFrame() {
        if (!this.video || !this.running)
            return;

        if (this.lastFrame !== this.video.currentTime) {
            this.lastFrame = this.video.currentTime;
            this.processWebcamFrame();
        }

        window.requestAnimationFrame(() => this.accessWebcamFrame());
    }

    public start() {
        this.running = true;
        window.requestAnimationFrame(() => this.accessWebcamFrame());
    }

    public stop() {
        this.running = false;
    }

    static async createLandmarker() {
        const vision = await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm');
        return await HandLandmarker.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
                delegate: 'GPU'
            },
            runningMode: 'VIDEO',
            numHands: 2
        });
    };

    // processFrame(frame: any): Promise<any> {
    //     return this.workerPool.process(frame);
    // }
}