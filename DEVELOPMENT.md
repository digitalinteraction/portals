# Development

To develop on this repo you will need to have Node.js installed on your dev machine.
This guide assumes you have the repo checked out and are on macOS.

## Setup

You'll only need to follow this setup once for your dev machine.

```sh
# cd to/this/folder

# Install NPM dependencies
npm install

# setup git hooks
npx husky install
```

## Regular use

These are the commands you'll regularly run to develop the API, in no particular order.

```sh
# build the libraries
npm run build:lib

# run the example
# -> Runs on http://localhost:8080
# -> Need to build the library first
# -> Re-run to see changes
npm run serve:example
```

## Code formatting

This repo uses [Prettier](https://prettier.io/),
[husky](https://github.com/typicode/husky)
and [lint-staged](https://github.com/okonet/lint-staged)
to automatically format code when it is committed.
This should hook into your IDE
or you can manually run the formatter with `npm run format` if you like.

Prettier ignores files using .prettierignore and skips lines after a // prettier-ignore comment.

## Release

Use the `npm version` command to cut a new release of the library, then publish to NPM.
First make sure git is clean and changes are documented in [CHANGELOG.md](/CHANGELOG.md).

```sh
# cd to/this/folder

# Version the package which also builds the typescript
npm version # major | minor | patch | --help

git push --follow-tags

npm publish
```
