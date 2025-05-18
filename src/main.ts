import { Tracker } from "./hand_tracking/tracker";

document.addEventListener('DOMContentLoaded', async () => {
    const tracker = new Tracker(4);

    for(let i = 0; i < 10; i++) {
        console.log(await tracker.processFrame(i));
    }
});