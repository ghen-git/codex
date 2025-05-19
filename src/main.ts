import { HandLandmarkerResult } from "@mediapipe/tasks-vision";
import { MediapipeTracker } from "./hand_tracking/mediapipe_tracker";
import { Finger, Hands } from "./hand_tracking/hand_processing/hand_types";

let leftWristMarker;
let rightWristMarker;

document.addEventListener('DOMContentLoaded', async () => {
  init();

  leftWristMarker = document.createElement('div');
  leftWristMarker.style.width = '25px';
  leftWristMarker.style.height = '25px';
  leftWristMarker.style.position = 'fixed';
  leftWristMarker.style.top = '0px';
  leftWristMarker.style.left = '50px';
  leftWristMarker.style.backgroundColor = 'blue';
  rightWristMarker = document.createElement('div');
  rightWristMarker.style.width = '25px';
  rightWristMarker.style.height = '25px';
  rightWristMarker.style.position = 'fixed';
  rightWristMarker.style.top = '0px';
  rightWristMarker.style.left = '150px';
  rightWristMarker.style.backgroundColor = 'blue';
  document.body.appendChild(leftWristMarker);
  document.body.appendChild(rightWristMarker);

  const tracker = await MediapipeTracker.create(onHands, window);
  tracker.start();
});

function onHands(data: Hands) {
  if (data.leftIsTracked) {
    leftWristMarker!.style.top = `${data.left!.wrist[2] * 100000000 * 5}px`
  }
  if (data.rightIsTracked) {
    rightWristMarker!.style.top = `${data.right!.wrist[2] * 100000000 * 5}px`
  }

  // const handLog = document.getElementById('hand_log');
  // handLog!.innerText = `
  // Left wrist z: ${data.left.wrist[2]}
  // Right wrist z: ${data.right.wrist[2]}
  // `;
}

function init() {
  const ws = new WebSocket("ws://localhost:6437/v6.json", "ultraleap-protocol");

  ws.onopen = () => {
    console.log("socket open, waiting for version…");
  };

  ws.onmessage = (ev) => {
    let msg;
    try {
      msg = JSON.parse(ev.data);
    } catch {
      console.error("non-JSON frame", ev.data);
      return;
    }

    if (msg.version === 6) {
      console.log("✅ version match; now sending config");
      ws.send(JSON.stringify({ focused: true }));
      ws.send(JSON.stringify({ background: true }));
    } else {
      console.log("frame:", msg);
    }
  };

  ws.onerror = (e) => console.error("WS error:", e);
  ws.onclose = (e) => console.warn("WS closed:", e);
}