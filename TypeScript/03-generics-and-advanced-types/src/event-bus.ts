/**
 * 03 · Generics & Advanced Types — a fully type-safe event bus, built from
 * mapped types + generics. Adding an event to the map is the only change
 * needed for `on`/`emit` to stay correct.
 *
 * Guide sections covered: §16 Generics, §20 Mapped Types, §30 Symbols.
 */

/** The single source of truth: event name → payload shape. */
export interface OrderEvents {
  "order:created": { orderId: string; total: number };
  "order:paid": { orderId: string; paidAt: Date };
  "order:cancelled": { orderId: string; reason: string };
}

type Handler<P> = (payload: P) => void;

/** Mapped type: for each event name, a set of handlers for that payload. */
type HandlerMap<E> = {
  [K in keyof E]?: Set<Handler<E[K]>>;
};

export class TypedEventBus<E> {
  /** §30 — a symbol key keeps the internal store off the public surface. */
  readonly #handlers: HandlerMap<E> = {};
  readonly #id = Symbol("event-bus");

  get busId(): symbol {
    return this.#id;
  }

  /** `K extends keyof E` ties the payload type to the chosen event name. */
  on<K extends keyof E>(event: K, handler: Handler<E[K]>): () => void {
    const set = (this.#handlers[event] ??= new Set<Handler<E[K]>>());
    set.add(handler);
    return () => set.delete(handler);
  }

  once<K extends keyof E>(event: K, handler: Handler<E[K]>): () => void {
    const off = this.on(event, (payload) => {
      off();
      handler(payload);
    });
    return off;
  }

  emit<K extends keyof E>(event: K, payload: E[K]): number {
    const set = this.#handlers[event];
    if (!set) return 0;
    for (const handler of [...set]) handler(payload);
    return set.size;
  }

  listenerCount<K extends keyof E>(event: K): number {
    return this.#handlers[event]?.size ?? 0;
  }

  /** §31 — the bus itself is iterable over its registered event names. */
  *[Symbol.iterator](): IterableIterator<keyof E & string> {
    for (const key of Object.keys(this.#handlers)) yield key as keyof E & string;
  }
}

/**
 * Deriving a "handlers object" type from the event map — one optional method
 * per event. Useful when you want to pass a bag of handlers instead of
 * registering them one by one.
 */
export type HandlersFor<E> = {
  [K in keyof E]?: Handler<E[K]>;
};

export function registerAll<E>(bus: TypedEventBus<E>, handlers: HandlersFor<E>): () => void {
  const offs = (Object.keys(handlers) as (keyof E)[]).map((key) => {
    const handler = handlers[key];
    return handler ? bus.on(key, handler) : () => false;
  });
  return () => offs.forEach((off) => off());
}
