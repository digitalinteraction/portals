// Common errors to throw and catch

/** Thrown when a `Traveller` tries to interact with a room that doesn't exist */
export class RoomNotFoundError extends Error {
  constructor(public room: string) {
    super('Room not found')
    this.name = 'RoomNotFoundError'
    Error.captureStackTrace(this, RoomNotFoundError)
  }
}

/** Encapsulates an `RTCPeerConnectionIceErrorEvent` into an `Error` */
export class IceCandidateError extends Error {
  readonly address: string | null
  readonly errorCode: number
  readonly errorText: string
  readonly port: number | null
  readonly url: string

  constructor(event: RTCPeerConnectionIceErrorEvent) {
    super('Ice exchange failed')
    this.address = event.address
    this.errorCode = event.errorCode
    this.errorText = event.errorText
    this.port = event.port
    this.url = event.url
    this.name = 'IceCandidateError'
    Error.captureStackTrace(this, RoomNotFoundError)
  }
}
