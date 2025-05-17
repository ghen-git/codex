export class WorkerPool {
    private maxWorkers: number;
    private currentWorkers: number;
    private queue: Array<() => void>;

    constructor(maxWorkers: number) {
        this.maxWorkers = maxWorkers;
        this.currentWorkers = 0;
        this.queue = [];
    }

    // Method to add a new worker to the pool
    addWorker(worker: Worker, data: any): Promise<any> {
        return new Promise((resolve, reject) => {
            const task = () => {
                this.currentWorkers++;
                worker.postMessage(data);

                // Listen for worker result
                worker.onmessage = (e: MessageEvent) => {
                    resolve(e.data); // Resolve the Promise when worker completes
                    this.currentWorkers--;
                    this.next(); // Start the next worker in the queue, if any
                };

                worker.onerror = (e: ErrorEvent) => {
                    reject(e); // Reject the Promise if worker encounters an error
                    this.currentWorkers--;
                    this.next(); // Start the next worker in the queue, if any
                };
            };

            if (this.currentWorkers < this.maxWorkers) {
                task();
            } else {
                this.queue.push(task); // Queue the task if the limit is reached
            }
        });
    }

    // Method to start the next task in the queue
    private next() {
        if (this.queue.length > 0) {
            const task = this.queue.shift();
            if (task) {
                task();
            }
        }
    }
}