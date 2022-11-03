import { EventEmitter, InfoSignal, EventListener } from '../lib.js'
import { Portal } from './portal.js'
import { SignalingChannel, SignalingMessageComposer } from './signaler.js'

/** Options for creating a `PortalGun` */
export interface PortalGunOptions {
  room: string
  url: URL
  rtc: RTCConfiguration
  composeMessage?: SignalingMessageComposer
}

/** The events that can happen on a `PortalGun` */
export interface PortalGunEventMap {
  debug: [string, ...any[]]
  error: [Error]
  connection: [Portal]
  disconnection: [Portal]
  info: [InfoSignal]
}

/** Create a portal between multiple clients in a specific "room" */
export class PortalGun {
  events = new EventEmitter()
  connections = new Map<string, Portal>()
  signaler: SignalingChannel
  options: PortalGunOptions

  constructor(options: PortalGunOptions) {
    this.options = options
    this.signaler = new SignalingChannel({
      room: options.room,
      url: options.url,
      composeMessage: options.composeMessage,
    })

    this.onError = this.onError.bind(this)
    this.onInfo = this.onInfo.bind(this)
    this.onDebug = this.onDebug.bind(this)

    this.signaler.addEventListener('error', this.onError)
    this.signaler.addEventListener('info', this.onInfo)
    this.signaler.addEventListener('debug', this.onDebug)
  }
  /** Close the portal and clean up */
  close() {
    for (const connection of this.connections.values()) connection.close()
    this.signaler.removeEventListener('error', this.onError)
    this.signaler.removeEventListener('info', this.onInfo)
  }

  /** Listen for "info" signals and create/destroy connections accordingly */
  onInfo(payload: InfoSignal) {
    this.emit('info', payload)
    const activeIds = new Set()
    for (const member of payload.members) {
      activeIds.add(member.id)

      if (this.connections.has(member.id)) continue

      const connection = new Portal({
        rtc: this.options.rtc,
        signaler: this.signaler,
        target: member,
      })
      this.connections.set(member.id, connection)
      this.emit('connection', connection)
    }

    const toRemove = Array.from(this.connections).filter(
      ([id]) => !activeIds.has(id)
    )

    for (const [id, connection] of toRemove) {
      connection.close()
      this.connections.delete(id)
      this.emit('disconnection', connection)
    }
  }
  onError(error: Error) {
    this.close()
    this.emit('error', error)
  }
  onDebug(message: string, ...args: unknown[]) {
    this.emit('debug', message, ...args)
  }

  //
  // EventEmitter mixin
  //
  addEventListener<K extends keyof PortalGunEventMap>(
    name: K,
    listener: EventListener<PortalGunEventMap[K]>
  ) {
    this.events.addEventListener(name, listener)
  }
  removeEventListener<K extends keyof PortalGunEventMap>(
    name: K,
    listener: EventListener<PortalGunEventMap[K]>
  ) {
    this.events.removeEventListener(name, listener)
  }
  emit<K extends keyof PortalGunEventMap>(
    name: K,
    ...args: PortalGunEventMap[K]
  ) {
    this.events.emit(name, ...args)
  }
}
