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
