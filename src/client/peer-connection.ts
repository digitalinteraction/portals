import {
  CandidateSignal,
  DescriptionSignal,
  EventEmitter,
  EventListener,
  RoomMember,
} from "../lib.js";
import { SignalingChannel } from "./signaler.js";

// TODO: better name for PeerConnection...
// TODO: typed EventEmitter

/** The events that can happen on a `PeerConnection` */
export interface PeerConnectionEventMap {
  debug: [string, ...any[]];
  error: [Error];
  track: [MediaStreamTrack];
}

/** Options for creating a `PeerConnection` */
export interface PeerConnectionOptions {
  signaler: SignalingChannel;
  target: RoomMember;
  rtc: RTCConfiguration;
}

/** A process for connecting to another client through WebRTC via a signaller */
export class PeerConnection {
  signaler: SignalingChannel;
  target: RoomMember;
  peer: RTCPeerConnection;
  events = new EventEmitter();
  makingOffer = false;
  ignoreOffer = false;

  /** Create a start negotiating a connection with a client */
  constructor(options: PeerConnectionOptions) {
    this.signaler = options.signaler;
    this.target = options.target;
    this.peer = new RTCPeerConnection(options.rtc);

    this.onDescription = this.onDescription.bind(this);
    this.onCandidate = this.onCandidate.bind(this);

    this.peer.onnegotiationneeded = async () => {
      try {
        this.makingOffer = true;
        await this.peer.setLocalDescription();
        this.signaler.send(
          "description",
          this.peer.localDescription,
          this.target.id
        );
      } catch (error) {
        this.emit("error", error as Error);
      } finally {
        this.makingOffer = false;
      }
    };

    this.peer.onicecandidate = (event) => {
      this.signaler.send("candidate", event.candidate, this.target.id);
    };
    this.peer.oniceconnectionstatechange = () => {
      if (this.peer.iceConnectionState === "failed") {
        this.peer.restartIce();
      }
    };
    this.peer.ontrack = (event) => {
      this.emit("track", event.track);
    };

    this.signaler.addEventListener("description", this.onDescription);
    this.signaler.addEventListener("candidate", this.onCandidate);
  }
  /** Close the connection with the other client */
  close() {
    this.signaler.removeEventListener("description", this.onDescription);
    this.signaler.removeEventListener("candidate", this.onCandidate);
    this.peer.close();
  }

  //
  // Negotiating
  //
  async onDescription(payload: DescriptionSignal, from: string | null) {
    if (from !== this.target.id) return;

    const offerCollision =
      payload.type === "offer" &&
      (this.makingOffer || this.peer.signalingState !== "stable");

    this.ignoreOffer = !this.target.polite && offerCollision;
    if (this.ignoreOffer) return;

    await this.peer.setRemoteDescription(payload);

    if (payload.type === "offer") {
      await this.peer.setLocalDescription();
      this.signaler.send(
        "description",
        this.peer.localDescription,
        this.target.id
      );
    }
  }
  async onCandidate(payload: CandidateSignal, from: string | null) {
    if (from !== this.target.id) return;

    try {
      await this.peer.addIceCandidate(payload);
    } catch (error) {
      if (!this.ignoreOffer) this.emit("error", error as Error);
    }
  }

  //
  // Helpers
  //

  /** @unstable */
  addMediaStream(stream: MediaStream) {
    for (const track of stream.getTracks()) {
      this.peer.addTrack(track, stream);
    }
  }

  //
  // EventEmitter mixin
  //
  addEventListener<K extends keyof PeerConnectionEventMap>(
    name: K,
    listener: EventListener<PeerConnectionEventMap[K]>
  ) {
    this.events.addEventListener(name, listener);
  }
  removeEventListener<K extends keyof PeerConnectionEventMap>(
    name: K,
    listener: EventListener<PeerConnectionEventMap[K]>
  ) {
    this.events.removeEventListener(name, listener);
  }
  emit<K extends keyof PeerConnectionEventMap>(
    name: K,
    ...args: PeerConnectionEventMap[K]
  ) {
    this.events.emit(name, ...args);
  }
}