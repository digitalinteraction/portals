import { Traveller } from "./types.js";

/** A group of travellers that want to communicate via WebRTC */
export class Room {
  members = new Map<string, Traveller>();

  constructor(public id: string) {}

  /** Send an "info" packet to each connection container every-other member & politeness */
  update() {
    for (const conn of this.members.values()) {
      conn.send("info", {
        id: conn.id,
        members: Array.from(this.members.values())
          .filter((m) => m.id !== conn.id)
          .map((peer) => ({
            id: peer.id,
            polite: conn.id > peer.id,
          })),
      });
    }
  }
}
