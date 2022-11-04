/** Thrown when a `Traveller` tries to interact with a room that doesn't exist */
export class RoomNotFoundError extends Error {
  constructor(public room: string) {
    super('Room not found')
    this.name = 'RoomNotFoundError'
    Error.captureStackTrace(this, RoomNotFoundError)
  }
}
