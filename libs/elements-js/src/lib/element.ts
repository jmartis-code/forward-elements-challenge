export interface Logger {
  log: (message: string) => void;
  error: (message: string) => void;
  warn: (message: string) => void;
}

export const ErrAlreadyMounted = 'Element already mounted';
export const ErrNotMounted = 'Element not mounted';

type Listener<T> = (event: T) => void;

export abstract class Element<E, L extends Listener<E>> {
  protected target: HTMLElement | null = null;
  protected frame: HTMLIFrameElement | null = null;
  protected listeners = new Set<L>();
  protected url: string;
  protected logger: Logger;
  protected origin: string;

  constructor(url: string, logger?: Logger) {
    this.url = url;
    this.origin = new URL(url).origin;
    this.logger = logger ?? {
      log: console.log,
      error: console.error,
      warn: console.warn,
    };
  }

  protected emit(event: E) {
    this.listeners.forEach((listener) => listener(event));
  }

  protected abstract handleMessage(event: MessageEvent): void;
  protected sendMessage(message: unknown): void {
    if (!this.frame) {
      throw new Error(ErrNotMounted);
    }

    this.frame.contentWindow?.postMessage(message, '*');
  }

  public mount(target: HTMLElement) {
    if (this.target) {
      throw new Error(ErrAlreadyMounted);
    }

    this.target = target;
    const frame = document.createElement('iframe');
    this.frame = frame;

    this.frame.src = this.url;
    this.frame.style.width = '100%';
    this.frame.style.height = '100%';
    this.frame.style.border = 'none';
    target.appendChild(frame);
    window.addEventListener('message', this.handleMessage.bind(this));
  }

  public unmount() {
    if (this.frame) {
      window.removeEventListener('message', this.handleMessage);
    }

    if (this.target && this.frame) {
      this.target.removeChild(this.frame);
    }

    this.frame = null;
    this.target = null;
    this.listeners.clear();
  }

  public subscribe(listener: L) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}
