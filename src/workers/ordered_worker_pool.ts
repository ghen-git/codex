export class OrderedWorkerPool {
    workers: Worker[];
    count: number;

    workerResolvers: ((value: any | PromiseLike<any>) => any)[];

    workerDonePromises: Promise<void>[];
    workerDoneResolvers: ((value: void | PromiseLike<void>) => void)[];
    workerDone: boolean[];

    currentWorkerIndex: number;

    constructor(poolSize: number, workerDefinition: any) {
        this.count = poolSize;
        this.workers = [];
        this.workerResolvers = [];

        this.workerDonePromises = [];
        this.workerDoneResolvers = [];
        this.workerDone = [];

        this.currentWorkerIndex = -1;

        for (let i = 0; i < this.count; i++) {
            const worker = this.buildWorker(workerDefinition, i);
            this.workers[i] = worker;
            this.workerDone[i] = false;
        }

        this.workerDone[this.count - 1] = true;
    }

    process(inputData: any) {
        this.currentWorkerIndex = this.next(this.currentWorkerIndex);
        console.log(this.currentWorkerIndex);

        return new Promise(resolve => {
            this.workerDone[this.currentWorkerIndex] = false;
            this.workerResolvers[this.currentWorkerIndex] = resolve;

            this.setupWorkerDonePromise(this.currentWorkerIndex);

            this.workers[this.currentWorkerIndex].postMessage(inputData);
        });
    }

    setupWorkerDonePromise(workerIndex: number) {
        this.workerDonePromises[workerIndex] = new Promise<void>(resolve => {
            this.workerDoneResolvers[workerIndex] = resolve;
        })
    }

    buildWorker(definition: any, index: number): Worker {
        const worker: Worker = new definition();

        worker.onmessage = e => this.handleMessage(e, index);

        return worker;
    }

    async handleMessage(e: MessageEvent<any>, workerIndex: number) {
        const data = e.data;
        const lastWorkerIndex = this.previous(workerIndex);
        const lastWorkerDone = this.workerDone[lastWorkerIndex];

        if(!lastWorkerDone) // if the last worker isn't done
            await this.workerDonePromises[lastWorkerIndex]; // wait for it to finish

        this.workerDone[workerIndex] = true;

        this.workerResolvers[workerIndex](data);
        this.workerDoneResolvers[workerIndex]();
    }

    previous(currentIndex: number) {
        if (currentIndex == 0)
            return this.count - 1;

        return currentIndex - 1;
    }

    next(currentIndex: number) {
        if (currentIndex == this.count - 1)
            return 0;

        return currentIndex + 1;
    }

    public stop() {
        this.workers.forEach(worker => {
            worker.terminate();
        });
    }
}