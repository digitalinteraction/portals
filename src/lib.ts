export type EventListener<T extends any[] = any> = (...args: T) => void

// TODO: better generics integration / a mixin / decorator

export class EventEmitter {
  #listeners = new Map<string, EventListener[]>()

  addEventListener(name: string, listener: EventListener) {
    this.#listeners.set(name, [...(this.#listeners.get(name) ?? []), listener])
  }
  removeEventListener(name: string, listener: EventListener) {
    this.#listeners.set(
      name,
      this.#listeners.get(name)?.filter((l) => l !== listener) ?? []
    )
  }
  emit(name: string, ...args: unknown[]) {
    this.#listeners.get(name)?.forEach((l) => l(...args))
  }
}

export interface RoomMember {
  id: string
  polite: boolean
}
export interface InfoSignal {
  id: string
  members: RoomMember[]
}
export interface ErrorSignal {
  code: string
}

export type DescriptionSignal = RTCSessionDescription
export type CandidateSignal = RTCIceCandidate | undefined

export function pause(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** @unstable */
export function debounce(ms: number, fn: () => void) {
  let timerid: any = null
  return () => {
    if (timerid !== null) clearTimeout(timerid)
    timerid = setTimeout(fn, ms)
  }
}
