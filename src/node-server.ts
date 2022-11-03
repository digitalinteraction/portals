import crypto from 'crypto'
import {
  WebSocketServer,
  ServerOptions as SocketServerOptions,
  WebSocket,
} from 'ws'
import { ErrorSignal } from './lib.js'
import { PortalServer, PortalServerOptions } from './server/portal-server.js'
import { Traveller } from './server/types.js'

export * from './server.js'

/** A WebSocketServer-based `Traveller` */
class SocketTraveller implements Traveller {
  constructor(
    public socket: WebSocket,
    public id: string,
    public room: string
  ) {}

  send<T = unknown>(type: string, payload: T, from?: string) {
    this.socket.send(JSON.stringify({ type, [type]: payload, from }))
  }
}

const UNKNOWN_ROOM = '__unknown__'

/** Options for creating a Node.js-based PortalServer */
export type NodeServerOptions = PortalServerOptions &
  Omit<SocketServerOptions, 'noServer'>

/** A handy Node.js + "ws" PortalServer for quick prototyping */
export class NodePortalServer extends PortalServer {
  #wss: WebSocketServer

  constructor(options: NodeServerOptions) {
    super(options)

    // Create the WebSocketServer and hook it up to the parent `PortalServer`
    this.#wss = new WebSocketServer(options)
    this.#wss.addListener('connection', (socket, request) => {
      const url = new URL(request.url!, 'http://localhost')
      const room = url.searchParams.get('room') ?? UNKNOWN_ROOM

      const traveller = new SocketTraveller(
        socket,
        url.searchParams.get('id') ?? crypto.randomUUID(),
        room
      )

      if (room === UNKNOWN_ROOM) {
        traveller.send<ErrorSignal>('error', { code: 'room_not_set' })
        return
      }
      this.onConnection(traveller)

      socket.addEventListener('message', (event) => {
        try {
          if (typeof event.data !== 'string') throw new Error('bad_message')
          const { type, [type]: payload, target } = JSON.parse(event.data)
          this.onMessage(traveller, { type, payload, target })
        } catch (error) {
          this.emit('error', error as Error)
        }
      })
      socket.addEventListener('close', () => {
        this.onClose(traveller)
      })
    })

    options.server?.addListener('close', () => this.close())
  }
}
