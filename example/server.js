#!/usr/bin/env node --loader=ts-node/esm

import http from "http";
import path from "path";
import url from "url";
import esbuild from "esbuild";
import express from "express";

import { NodePortalServer } from "../dist/node_server.js";

const app = express()
  .use(express.static(path.dirname(url.fileURLToPath(import.meta.url))))
  .use(express.text());

// Hack to bundle the javascript
app.get("/app.js", async (req, res) => {
  res.contentType("text/javascript");
  const file = new URL("client.js", import.meta.url);
  const app = await esbuild.build({
    entryPoints: [file.pathname],
    bundle: true,
    write: false,
  });
  res.send(app.outputFiles[0].text);
});

const rooms = ["coffee-chat", "home", "misc"];
const server = http.createServer(app);
const portal = new NodePortalServer({ server, path: "/portal", rooms });

server.listen(8080, () => console.log("Listening on :8080"));
server.on("close", () => portal.close());
