type EventListener<Args extends readonly unknown[]> = (...args: Args) => void;

export type EventMap = Record<string, readonly unknown[]>;

export class EventEmitter<Events extends EventMap = EventMap> {
  private readonly listeners = new Map<string, Set<EventListener<readonly unknown[]>>>();

  on<K extends keyof Events & string>(
    event: K,
    listener: EventListener<Events[K]>,
  ): () => void {
    let handlers = this.listeners.get(event);
    if (!handlers) {
      handlers = new Set();
      this.listeners.set(event, handlers);
    }
    handlers.add(listener as EventListener<readonly unknown[]>);

    return () => {
      this.off(event, listener);
    };
  }

  once<K extends keyof Events & string>(
    event: K,
    listener: EventListener<Events[K]>,
  ): () => void {
    const wrapped = ((...args: Events[K]) => {
      unsubscribe();
      listener(...args);
    }) as EventListener<Events[K]>;
    const unsubscribe = this.on(event, wrapped);

    return unsubscribe;
  }

  off<K extends keyof Events & string>(
    event: K,
    listener: EventListener<Events[K]>,
  ): void {
    const handlers = this.listeners.get(event);
    if (!handlers) {
      return;
    }
    handlers.delete(listener as EventListener<readonly unknown[]>);
    if (handlers.size === 0) {
      this.listeners.delete(event);
    }
  }

  removeAllListeners<K extends keyof Events & string>(event?: K): void {
    if (event === undefined) {
      this.listeners.clear();
      return;
    }

    this.listeners.delete(event);
  }

  protected emit<K extends keyof Events & string>(
    event: K,
    ...args: Events[K]
  ): void {
    const handlers = this.listeners.get(event);
    if (!handlers) {
      return;
    }

    for (const handler of [...handlers]) {
      (handler as EventListener<Events[K]>)(...args);
    }
  }
}
