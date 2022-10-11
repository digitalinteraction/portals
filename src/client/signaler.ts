import { EventEmitter, EventListener, InfoSignal } from "../lib.js";

export type SignalingChannelEventMap = Record<string, unknown[]> & {
  debug: [string, ...unknown[]];
  error: [Error];
};

/** Options for creating a `SignalingChannel` */
export interface SignalingOptions {
  room: string;
  url: URL;
}

/** A connection to a `PortalServer` to manage connections and negotiating */
export class SignalingChannel {
  socket: WebSocket;
  upstream: string[] = [];
  events = new EventEmitter();
  id: string | undefined = undefined;
  pingCounter = 0;

  constructor(options: SignalingOptions) {
    const url = new URL(options.url);
    url.searchParams.set("room", options.room);
    this.socket = this.connect(url);

    this.addEventListener("info", (payload: InfoSignal) => {
      this.id = payload.id;
    });

    setInterval(() => this.send("ping", ++this.pingCounter), 10_000);
  }

  /** Attempt to connect to the `PortalServer` */
  connect(url: URL) {
    const socketUrl = new URL(url);

    if (this.id) {
      socketUrl.searchParams.set("id", this.id);
    }

    this.emit("debug", "connect");
    this.socket = new WebSocket(socketUrl);

    this.socket.onmessage = (event) => {
      const { type, [type]: payload, from } = JSON.parse(event.data);
      this.emit("debug", `signaler@${type}`);
      this.emit(type, payload, from);
    };

    this.socket.onopen = () => {
      this.emit("debug", "signaler@open");
      for (const msg of this.upstream) this.socket.send(msg);
      this.upstream = [];
    };

    this.socket.onclose = (event) => {
      this.emit("debug", "socket@close", event);
      setTimeout(() => {
        this.emit("debug", "signaler reconnecting...");
        this.connect(url);
      }, 2_000);
    };

    this.socket.onerror = (event) => {
      this.emit("error", new Error("WebSocket error: " + event));
      console.error("socket@error", event);
    };

    return this.socket;
  }

  /** Send a message to the `PortalServer`, optionally to a specific target */
  send(type: string, payload: any = {}, target: string | null = null) {
    const message = JSON.stringify({
      type,
      [type]: payload,
      target,
    });

    if (this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(message);
    } else {
      this.upstream.push(message);
    }
  }

  //
  // EventEmitter mixin
  //
  addEventListener(name: string, listener: EventListener) {
    this.events.addEventListener(name, listener);
  }
  removeEventListener(name: string, listener: EventListener) {
    this.events.removeEventListener(name, listener);
  }
  emit(name: string, ...args: unknown[]) {
    this.events.emit(name, ...args);
  }
}
