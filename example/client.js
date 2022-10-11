import { Portal } from "../dist/client.js";

//
// An example client that connects to the PortalServer and recieves connections
//

const rtc = {
  iceServers: [
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
};

async function main() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { width: 1280, height: 720 },
  });

  const room = "home";
  const url = new URL("portal", location.href);
  url.protocol = serverUrl.protocol.replace(/^http/, "ws");

  const portal = new Portal({ room, url, rtc });

  portal.addEventListener("connection", (connection) => {
    connection.addMediaStream(stream);
    connection.addEventListener("track", (track) =>
      renderTrack(connection, track)
    );
  });

  portal.addEventListener("disconnection", (connection) =>
    renderTrack(connection, null)
  );
  portal.addEventListener("info", (info) => updateState(info));
  portal.addEventListener("debug", console.debug);
  portal.addEventListener("error", console.error);
}

function renderTrack(connection, track) {
  console.log("renderTrack", connection, track);
}

function updateState(info) {
  console.log("info", info);
}

main();
