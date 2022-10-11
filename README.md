# portals.js

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
- migrate and fill out documentation for implemented API
- code todos
- explore Deno usage
- publish on npm
- improve example app
