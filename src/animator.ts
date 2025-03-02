
self.onmessage = (e: MessageEvent) => {
    const stepFunction = e.data[0];
    
    stepFunction();
};