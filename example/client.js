import { PortalGun, debounce } from "@openlab/portals/client.js";

//
// An example client that connects to the PortalServer and receives connections
//

const grid = document.getElementById("grid");
const title = document.getElementById("title");
const version = document.getElementById("version");
version.innerText = "0.1";

const rtc = {
  iceServers: [
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
};

async function main() {
  const url = new URL(location.href);
  const room = "home";
  const server = new URL("portal", location.href);
  server.protocol = server.protocol.replace(/^http/, "ws");

  const stream = await navigator.mediaDevices.getUserMedia({
    video: { width: 1280, height: 720 },
  });

  if (url.searchParams.has("self")) {
    const localVideo = document.getElementById("localVideo");
    localVideo.removeAttribute("aria-hidden");
    localVideo.srcObject = stream;
  }

  const portalGun = new PortalGun({ room, url: server, rtc });

  portalGun.addEventListener("connection", (portal) => {
    portal.addMediaStream(stream);
    portal.peer.addEventListener("track", (event) => {
      event.track.onunmute = () => {
        updatePeer(portal.target.id, event.streams[0]);
      };
    });
  });

  portalGun.addEventListener("disconnection", (portal) =>
    updatePeer(portal.target.id, null)
  );
  portalGun.addEventListener("info", (info) => updateState(info));
  portalGun.addEventListener("debug", console.debug);
  portalGun.addEventListener("error", console.error);

  window.addEventListener(
    "resize",
    debounce(200, () => {
      console.log("onResize");
      updateGrid(grid.children.length);
    })
  );
}

/** @param {string} id  @param {MediaStream} stream */
function updatePeer(id, stream) {
  console.log("setRemoteStream", id);

  /** @type {HTMLVideoElement} */
  let elem = document.querySelector(`#grid > [data-video="${id}"]`);

  if (stream) {
    if (!elem) {
      elem = document.createElement("video");
      elem.muted = true;
      elem.autoplay = true;
      elem.dataset.video = id;
      grid.appendChild(elem);
    }

    elem.srcObject = stream;
  } else if (elem) {
    grid.removeChild(elem);
  }

  updateGrid(grid.children.length);
}

function updateGrid(count) {
  const aspect = 16 / 9;
  const { innerHeight, innerWidth } = window;

  let [columns, rows] = [1, 1];
  for (let requiredColumns = 1; requiredColumns <= count; requiredColumns++) {
    const w = innerWidth / requiredColumns;
    const h = w / aspect;
    const requiredRows = Math.ceil(count / requiredColumns);
    const requiredHeight = requiredRows * h;
    if (requiredHeight <= innerHeight) {
      [columns, rows] = [requiredColumns, requiredRows];
      break;
    }
  }

  grid.style = `--columns: ${columns};`;

  if (count > 0) {
    title.setAttribute("aria-hidden", "true");
    version.setAttribute("aria-hidden", "true");
  } else {
    title.removeAttribute("aria-hidden");
    version.removeAttribute("aria-hidden");
    title.textContent;
  }
}

function updateState(info) {
  console.log("info", info);
}

main();
