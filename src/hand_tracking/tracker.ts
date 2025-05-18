import { OrderedWorkerPool } from '../workers/ordered_worker_pool';
//@ts-expect-error
import DetectionWorker from './workers/detection_worker?worker'

export class Tracker {
    workerPool: OrderedWorkerPool;

    constructor(nWorkers: number) {
        this.workerPool = new OrderedWorkerPool(nWorkers, DetectionWorker);
    }

    processFrame(frame: any): Promise<any> {
        return this.workerPool.process(frame);
    }
}