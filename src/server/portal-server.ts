import {
  ErrorSignal,
  EventEmitter,
  EventListener,
  RoomNotFoundError,
} from '../lib.js'
import { Room } from './room.js'
import { PortalMessage, Traveller } from './types.js'

/** The events that can happen on a `PortalServer` */
export interface PortalServerEventMap {
  debug: [string, ...any[]]
  error: [Error]
}

/** Options for creating a `PortalServer` */
export type PortalServerOptions = {
  rooms: string[]
}

/** An abstract server for connecting peers in rooms and negotiating WebRTC connections */
export class PortalServer {
  #rooms = new Map<string, Room>()
  #events = new EventEmitter()

  constructor(options: PortalServerOptions) {
    for (const id of options.rooms) this.#rooms.set(id, new Room(id))
  }

  close() {
    // TODO: ...
  }

  /** Tell the server about a new connection */
  onConnection(traveller: Traveller) {
    const room = this.#rooms.get(traveller.room)
    if (!room) throw new RoomNotFoundError(traveller.room)

    this.emit('debug', `socket@connect id=${traveller.id}`)

    // TODO: boot out old traveller?

    room.members.set(traveller.id, traveller)
    room.update()
  }

  /** Tell the server about a message to be transmitted */
  onMessage(traveller: Traveller, { type, payload, target }: PortalMessage) {
    const room = this.#rooms.get(traveller.room)
    if (!room) throw new RoomNotFoundError(traveller.room)

    this.emit(
      'debug',
      `traveller@message id=${traveller.id} type=${type} to=${target}`
    )

    if (type === 'ping' && typeof payload === 'number') {
      traveller.send('pong', payload)
      return
    }

    if (!target) {
      this.emit('error', new Error('traveller@message untargeted message'))
      return
    }

    const other = room.members.get(target)
    if (!other) {
      this.emit('error', new Error('traveller@message target not online'))
      return
    }

    other.send(type, payload, traveller.id)
  }

  /** Tell the server about a closed connection */
  onClose(traveller: Traveller) {
    const room = this.#rooms.get(traveller.room)
    if (!room) throw new RoomNotFoundError(traveller.room)

    this.emit('debug', `traveller@close id=${traveller.id}`)

    room.members.delete(traveller.id)
    room.update()
  }

  handleTravellerError(error: unknown, traveller: Traveller) {
    this.emit('debug', `traveller@error ${error}`)

    if (error instanceof RoomNotFoundError) {
      traveller.send<ErrorSignal>('error', { code: 'room_not_found' })
    } else {
      this.emit('error', error as Error)
    }
  }

  //
  // Events mixin
  //
  addEventListener<K extends keyof PortalServerEventMap>(
    name: K,
    listener: EventListener<PortalServerEventMap[K]>
  ) {
    this.#events.addEventListener(name, listener)
  }
  removeEventListener<K extends keyof PortalServerEventMap>(
    name: K,
    listener: EventListener<PortalServerEventMap[K]>
  ) {
    this.#events.removeEventListener(name, listener)
  }
  emit<K extends keyof PortalServerEventMap>(
    name: K,
    ...args: PortalServerEventMap[K]
  ) {
    this.#events.emit(name, ...args)
  }
}
