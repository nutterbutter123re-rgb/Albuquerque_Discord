import { DiscordSDK } from "@discord/embedded-app-sdk";

const CLIENT_ID = "1565952191817064518";
const video = document.getElementById("v");

let applyingRemote = false;
let ws;

function send() {
  if (applyingRemote || ws?.readyState !== WebSocket.OPEN) return;
  ws.send(JSON.stringify({ playing: !video.paused, time: video.currentTime }));
}

async function applyRemote({ playing, time }) {
  applyingRemote = true;
  if (Math.abs(video.currentTime - time) > 0.5) video.currentTime = time;
  try {
    if (playing && video.paused) await video.play();
    if (!playing && !video.paused) video.pause();
  } catch {
    // autoplay blocked until the user interacts; they can press play
  }
  setTimeout(() => (applyingRemote = false), 300);
}

function connect(room) {
  ws = new WebSocket(`wss://${location.host}/.proxy/ws/${room}`);
  ws.onmessage = (e) => applyRemote(JSON.parse(e.data));
  ws.onclose = () => setTimeout(() => connect(room), 2000);
}

async function init() {
  const sdk = new DiscordSDK(CLIENT_ID);
  await sdk.ready();
  connect(sdk.instanceId);

  video.addEventListener("play", send);
  video.addEventListener("pause", send);
  video.addEventListener("seeked", send);
}

init();
