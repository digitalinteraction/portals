# portals.js

Portals is a pair of libraries for creating WebRTC connections between multiple parties, a "portal".

> **portals.js** is ESM only.

## Server

All connections in a portal are peer-to-peer, but the first step needs a signalling server to establish those connections.
Portals provides an agnostic library to perform the signalling and also a specific version
for running a signaller with Node.js and [ws](https://github.com/websockets/ws).

### Node.js + express + ws

```js
import http from "http";
import path from "path";
import url from "url";
import esbuild from "esbuild";
import express from "express";

import { NodePortalServer } from "@openlab/portals/node-server.js";

const app = express()
  .use(express.static(path.dirname(url.fileURLToPath(import.meta.url))))
  .use(express.text());

const rooms = ["coffee-chat", "home", "misc"];
const server = http.createServer(app);
const portal = new NodePortalServer({ server, path: "/portal", rooms });

server.listen(8080, () => console.log("Listening on :8080"));
server.on("close", () => portal.close());
```

### Agnostic library

If you don't want to use Node.js or want to use different libraries,
there is an an agnostic version of the server.
e.g. `ws` + `koa`:

> TODO: document agnostic library usage

## Client

On the client, there is a library for connecting to the signalling server,
connecting to a room and handling connections and disconnections.

```js
import { PortalGun } from "../src/client.js";

const rtc = {
  iceServers: [
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
};

async function main() {
  // Determine the room to join somehow
  const url = new URL(location.href);
  const room = url.searchParams.get("room");

  // Create a WebSocket URL to the PortalServer
  const server = new URL("portal", location.href);
  server.protocol = server.protocol.replace(/^http/, "ws");

  // Request a MediaStream from the client's webcam
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { width: 1280, height: 720 },
  });

  // Create the portal gun
  const portalGun = new PortalGun({ room, url: server, rtc });

  portalGun.addEventListener("connection", (portal) => {
    // Add the local MediaStream to send video through the portal
    portal.addMediaStream(stream);

    // Listen for tracks from the peer to recieve video through the portal
    portal.peer.addEventListener("track", (event) => {
      event.track.onunmute = () => {
        console.debug("@connected", portal.target.id, event.streams[0]);
        // Render the track somehow
      };
    });
  });

  // Stop rendering a peer that has disconnected
  portalGun.addEventListener("disconnection", (portal) => {
    console.debug("@disconnection", portal.target.id, null);
  });
}

main();
```

You create a `PortalGun` which is responsible for talking to the signalling server and telling you about new and closed connections, known as "portals".

When you recieve a new portal, through `"connection"`, you pass it the local `MediaStream` and listen for tracks that it is sending. Its up to you what to do with those streams.
You have `portal.target.id` which is a unique id for that portal.

When a portal closes, through `"disconnection"`, you can clean up any rendering you previously did for it.

## Full example

For a detailed example, see [example](./example) which is a full use of `NodePortalServer` on the backend and `PortalGun` on the frontend. The example is a local-cctv like system where any user that joins the room is added to a video-only screen where everyone can see everyone else.

It has a small server-side hack to bundle the client-side code using [esbuild](https://esbuild.github.io/).
