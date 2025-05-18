self.onmessage = (e: MessageEvent) => {
    const bitmapImg = parseFloat(e.data);
    self.postMessage(bitmapImg * -1);
};