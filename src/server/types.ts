/** A client that wants to join a room and communicate with other clients in that room */
export interface Traveller {
  id: string
  room: string
  send<T = unknown>(type: string, payload?: T, from?: string): void
}

/** A message sent between the client and server */
export interface PortalMessage {
  type: string
  payload: unknown
  target?: string
}
