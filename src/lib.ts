export type EventListener<T extends any[] = any> = (...args: T) => void;

// TODO: better generics / mixin

export class EventEmitter {
  #listeners = new Map<string, EventListener[]>();

  addEventListener(name: string, listener: EventListener) {
    this.#listeners.set(name, [...(this.#listeners.get(name) ?? []), listener]);
  }
  removeEventListener(name: string, listener: EventListener) {
    this.#listeners.set(
      name,
      this.#listeners.get(name)?.filter((l) => l !== listener) ?? []
    );
  }
  emit(name: string, ...args: unknown[]) {
    this.#listeners.get(name)?.forEach((l) => l(...args));
  }

  // static mixin<T extends Record<string, any[]>>(base?: SomeClass) {
  //   return class extends (base ?? class {}) {
  //     events = new EventEmitter();
  //     addEventListener<K extends keyof T>(
  //       name: K,
  //       listener: EventListener<T[K]>
  //     ) {
  //       this.events.addEventListener(name as string, listener);
  //     }
  //     removeEventListener<K extends keyof T>(
  //       name: K,
  //       listener: EventListener<T[K]>
  //     ) {
  //       this.events.removeEventListener(name as string, listener);
  //     }
  //     emit<K extends keyof T>(name: K, ...args: T[K]) {
  //       this.events.emit(name as string, ...args);
  //     }
  //   };
  // }
}

export interface RoomMember {
  id: string;
  polite: boolean;
}
export interface InfoSignal {
  id: string;
  members: RoomMember[];
}
export interface ErrorSignal {
  code: string;
}

export type DescriptionSignal = RTCSessionDescriptionInit;
export type CandidateSignal = RTCIceCandidateInit | undefined;

export function pause(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function debounce(ms: number, fn: () => void) {
  let timerid: any = null;
  return () => {
    if (timerid !== null) clearTimeout(timerid);
    timerid = window.setTimeout(fn, ms);
  };
}
