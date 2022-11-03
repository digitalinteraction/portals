# portals.js

Portals is a pair of libraries for creating WebRTC connections between multiple parties, a "portal".

> **portals.js** is ESM only.

## Server

All connections in a portal are peer-to-peer, but the first step needs a signalling server to establish those connections.
Portals provides an [agnostic library](#agnostic-library) to perform the signalling and a specific version
tailored for Node.js and [ws](https://github.com/websockets/ws).

**Node.js + express + ws**

```js
import http from 'http'
import path from 'path'
import url from 'url'
import express from 'express'

import { NodePortalServer } from '@openlab/portals/node-server.js'

const app = express()
  .use(express.static(path.dirname(url.fileURLToPath(import.meta.url))))
  .use(express.text())

const rooms = ['coffee-chat', 'home', 'misc']
const server = http.createServer(app)
const portal = new NodePortalServer({ server, path: '/portal', rooms })

server.listen(8080, () => console.log('Listening on :8080'))
```

## Client

On the client, there is a library for connecting to the signalling server,
connecting to a room and handling connections and disconnections within that room.

```js
import { PortalGun } from '../src/client.js'

const rtc = {
  iceServers: [
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
}

async function main() {
  // Determine the room to join somehow
  const url = new URL(location.href)
  const room = url.searchParams.get('room')

  // Create a WebSocket URL to the PortalServer
  const server = new URL('portal', location.href)
  server.protocol = server.protocol.replace(/^http/, 'ws')

  // Request a MediaStream from the client's webcam
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { width: 1280, height: 720 },
  })

  // Create the portal gun
  const portalGun = new PortalGun({ room, url: server, rtc })

  portalGun.addEventListener('connection', (portal) => {
    // Add the local MediaStream to send video through the portal
    // Note: This API is currently unstable
    portal.addMediaStream(stream)

    // Listen for tracks from the peer to recieve video through the portal
    portal.peer.addEventListener('track', (event) => {
      event.track.onunmute = () => {
        console.debug('@connected', portal.target.id, event.streams[0])
        // Render the track somehow
      }
    })
  })

  // Stop rendering a peer that has disconnected
  portalGun.addEventListener('disconnection', (portal) => {
    console.debug('@disconnection', portal.target.id, null)
  })
}

main()
```

You create a `PortalGun` which is responsible for talking to the signalling server and telling you about new and closed connections, known as "portals".

When you recieve a new portal, through `"connection"`, you pass it the local `MediaStream` and listen for tracks that it is sending. Its up to you what to do with those streams.
You have `portal.target.id` which is a unique id for that portal.

When a portal closes, through `"disconnection"`, you can clean up any rendering you previously did for it.

The `rtc` config is directly passed to the constructor of [RTCPeerConnection](https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/RTCPeerConnection), so you can put any of those parameters in there.

## Full example

For a detailed example, see [example](./example) which is a full use of `NodePortalServer` on the backend and `PortalGun` on the frontend. The example is a local-cctv like system where any user that joins the room is added to a video-only screen where everyone can see everyone else.

It has a small server-side hack to bundle the client-side code using [esbuild](https://esbuild.github.io/).

## Agnostic library

If you don't want to use Node.js or want to use different libraries,
there is an an agnostic version of the server.
Below is an example for hooking up the portals library with a hypothetical socket server.
It needs to call these methods at the right times:

- `onConnection` - when a new socket has connected, it should implement `Traveller`
- `onMessage` - when a socket recieved a message from the portals client
- `onClose` - when a socket disconnected

There are extra hooks for debugging, exposed as events:

- `error` (Error) - emits when an error occured
- `debug` (string) - outputs debug messages

```ts
import { CustomSocketServer, CustomSocket } from 'custom-socket-lib'
import { PortalServer, Traveller } from '@openlab/portals/server.js'

const portals = new PortalServer({ rooms: ['home'] })
function getConnection(socket: CustomSocket, request: Request): Traveller {
  const { id, room } = '/* get from socket */'
  function send(type, payload, from) {
    socket.send(JSON.stringify({ type, [type]: payload, from }))
  }
  return { id, room, send }
}

const sockets = new CustomSocketServer(/* ... */)
sockets.addEventListener('connection', (socket) => {
  // 1. Tell portals about the new connection
  const connection = getConnection(socket)
  portals.onConnection(connection)

  // 2. Tell portals about new messages
  socket.addEventListener('message', (message) => {
    const { type, [type]: payload, target = null } = JSON.parse(message)
    portals.onMessage(connection, type, payload, target)
  })

  // 3. Tell portals about connections closing
  socket.addEventListener('close', () => {
    portals.onClose(connection)
  })
})

// Optionally debug things
portals.addEventListener('error', (error) => console.error(error))
portals.addEventListener('debug', (message) => console.debug(message))
```

You wrap your library's transport into a `Traveller` object that the library
will store and use to send messages to clients as part of signalling.
You can get the `id` or `room` from the connecting client or you can generate them.
The client expects WebSocket messages in a certain format, defined below,
so the `send` method should format them in this way.

> `crypto.randomUUID()` is good for generating client ids.

When a client disconnects you need to tell the PortalServer with `onClose` and pass the traveller object.

When a client recieves a message, tell the PortalServer with `onMessage`.
The client has a default payload structure, defined below.

**client → server messages**

The client sends messages up to the server as JSON.
It always has `type` as a string, then the "type" is used as a key is used to put the payload in.
`target` is optional and may contain the id of the specific client they want to talk to.

```json
{ "type": "ice", "ice": { "key": "value" }, "target": "abcdef" }
```

On the client, you can pass a `composeMessage` method to provide your own format.

**server → client messages**

The server sends messages down to the client as JSON.
It always has `type` as a string, then the "type" is used as a key is used to put the payload in.
`from` is optional and may contain the id of the specific client that send the message.

```json
{ "type": "ice", "ice": { "key": "value" }, "target": "abcdef" }
```

On the client, you can pass a `parseMessage` method to parse a custom format your server might use.
