# Development

Working towards
https://github.com/digitalinteraction/deconf/blob/main/experiments/peers/portals-lib.md

## scripts

```sh
# setup git hooks
npx husky install

# build typescript
npx tsc

# run the example server
./example/server.js
open http://localhost:8080
```

## future work

- designing the server to be scalable
  - can rooms be in redis somehow, or backed by socket.io?
- dynamic rooms / API for existing rooms
- Data connections
- automated tests
- code todos
- explore Deno usage
- publish on npm
- flesh out documentation

**better ping**

```js
const PING_TIMEOUT_MS = 30_000;

class SignalingChannel {
  pingTimeout = null;
  pingCounter = null;

  setup() {
    // ...

    // Recieve a pong and cancel the timeout
    this.on("pong", (pingNumber) => {
      if (this.pingCounter === pingNumber && this.pingTimeout) {
        clearTimeout(this.pingTimeout);
      }
    });
  }

  // Send the ping and trigger the timeout if no pong is recieved
  sendPing() {
    this.pingTimeout = setTimeout(() => {
      // ping fail logic (e.g. restart connection)
    }, PING_TIMEOUT_MS);
    this.send("ping", ++this.pingCounter);
  }
}
```
