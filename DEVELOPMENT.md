# Development

Working towards
https://github.com/digitalinteraction/deconf/blob/main/experiments/peers/portals-lib.md

## setup

```sh
# cd to/this/folder

# Install NPM dependencies
npm install

# setup git hooks
npx husky install
```

## regular use

```sh
# build the libraries
npm run build:lib

# run the example
# -> Runs on http://localhost:8080
# -> Need to build the library first
# -> Re-run to see changes
npm run serve:example
```

## code formatting

This repo uses [Prettier](https://prettier.io/),
[husky](https://github.com/typicode/husky)
and [lint-staged](https://github.com/okonet/lint-staged)
to automatically format code when it is committed.
This should hook into your IDE
or you can manually run the formatter with `npm run format` if you like.

Prettier ignores files using .prettierignore and skips lines after a // prettier-ignore comment.

## release

Use the `npm version` command to cut a new release of the library, then publish to NPM.
First make sure git is clean and changes are documented in [CHANGELOG.md](/CHANGELOG.md).

```sh
# cd to/this/folder

npm version # major | minor | patch | --help

git push --follow-tags

npm publish
```

## future work

- designing the server to be scalable
  - can rooms be in redis somehow, or backed by socket.io?
- dynamic rooms / API for existing rooms
- Data connections
- automated tests
- explore Deno usage

**better ping**

```js
const PING_TIMEOUT_MS = 30_000

class SignalingChannel {
  pingTimeout = null
  pingCounter = null

  setup() {
    // ...

    // Recieve a pong and cancel the timeout
    this.on('pong', (pingNumber) => {
      if (this.pingCounter === pingNumber && this.pingTimeout) {
        clearTimeout(this.pingTimeout)
      }
    })
  }

  // Send the ping and trigger the timeout if no pong is recieved
  sendPing() {
    this.pingTimeout = setTimeout(() => {
      // ping fail logic (e.g. restart connection)
    }, PING_TIMEOUT_MS)
    this.send('ping', ++this.pingCounter)
  }
}
```
