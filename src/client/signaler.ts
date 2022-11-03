import { EventEmitter, EventListener, InfoSignal } from '../lib.js'

const PING_TIMEOUT_MS = 5_000
const PING_INTERVAL = 10_000
const RETRY_TIMEOUT = 2_000

export type SignalingChannelEventMap = Record<string, unknown[]> & {
  debug: [string, ...unknown[]]
  error: [Error]
}

export interface SignalingMessageComposer {
  (type: string, payload: unknown, target?: string): string
}
export interface SignalingMessageParser<T = unknown> {
  (body: string): { type: string; payload: T; from?: string }
}

const composeMessage: SignalingMessageComposer = (type, payload, target) => {
  return JSON.stringify({ type, [type]: payload, target })
}

const parseMessage: SignalingMessageParser = (body) => {
  const { type, [type]: payload, from } = JSON.parse(body)
  return { type, payload, from }
}

/** Options for creating a `SignalingChannel` */
export interface SignalingOptions {
  room: string
  url: URL

  /** @unstable */ composeMessage?: SignalingMessageComposer
  /** @unstable */ parseMessage?: SignalingMessageParser
}

/** A connection to a `PortalServer` to manage connections and negotiating */
export class SignalingChannel {
  socket: WebSocket
  upstream: string[] = []
  events = new EventEmitter()
  id?: string
  pingCounter = 0
  pingTimeout?: any

  composeMessage: SignalingMessageComposer
  parseMessage: SignalingMessageParser

  constructor(options: SignalingOptions) {
    const url = new URL(options.url)
    url.searchParams.set('room', options.room)
    this.socket = this.connect(url)
    this.composeMessage = options.composeMessage ?? composeMessage
    this.parseMessage = options.parseMessage ?? parseMessage

    this.addEventListener('info', (payload: InfoSignal) => {
      this.id = payload.id
    })

    setInterval(() => this.sendPing(url), PING_INTERVAL)

    this.addEventListener('pong', (pingNumber) => {
      if (this.pingTimeout && this.pingCounter === pingNumber) {
        clearTimeout(this.pingTimeout)
        this.pingTimeout = undefined
      }
    })
  }

  /** Attempt to connect to the `PortalServer` */
  connect(url: URL) {
    const socketUrl = new URL(url)

    if (this.id) {
      socketUrl.searchParams.set('id', this.id)
    }

    this.emit('debug', 'connect')
    this.socket = new WebSocket(socketUrl)

    this.socket.onmessage = (event) => {
      const { type, payload, from } = this.parseMessage(event.data)
      this.emit('debug', `signaler@${type}`)
      this.emit(type, payload, from)
    }

    this.socket.onopen = () => {
      this.emit('debug', 'signaler@open')
      for (const msg of this.upstream) this.socket.send(msg)
      this.upstream = []
    }

    this.socket.onclose = (event) => {
      this.emit('debug', 'socket@close', event)
      setTimeout(() => {
        this.emit('debug', 'signaler reconnecting...')
        this.connect(url)
      }, RETRY_TIMEOUT)
    }

    this.socket.onerror = (event) => {
      this.emit('error', new Error('WebSocket error: ' + event))
      console.error('socket@error', event)
    }

    return this.socket
  }

  /** Send a message to the `PortalServer`, optionally to a specific target */
  send(type: string, payload: any = {}, target?: string) {
    const message = JSON.stringify({
      type,
      [type]: payload,
      target,
    })

    if (this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(message)
    } else {
      this.upstream.push(message)
    }
  }

  sendPing(url: URL) {
    this.pingTimeout = setTimeout(() => {
      setTimeout(() => {
        this.emit('debug', 'ping failed, reconnecting...')
        this.connect(url)
      }, RETRY_TIMEOUT)
    }, PING_TIMEOUT_MS)

    this.send('ping', ++this.pingCounter)
  }

  //
  // EventEmitter mixin
  //
  addEventListener(name: string, listener: EventListener) {
    this.events.addEventListener(name, listener)
  }
  removeEventListener(name: string, listener: EventListener) {
    this.events.removeEventListener(name, listener)
  }
  emit(name: string, ...args: unknown[]) {
    this.events.emit(name, ...args)
  }
}
