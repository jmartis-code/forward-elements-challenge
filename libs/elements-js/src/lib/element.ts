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
  protected isMounted = false;
  protected isFrameLoaded = false;

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
    if (!this.frame || !this.frame.contentWindow) {
      this.logger.error("Cannot send message - iframe not found or not loaded");
      throw new Error(ErrNotMounted);
    }

    try {
      this.logger.log(`Sending message to iframe: ${JSON.stringify(message)}`);
      this.frame.contentWindow.postMessage(message, '*');
    } catch (error) {
      this.logger.error(`Failed to send message to iframe: ${error}`);
      throw error;
    }
  }
  
  public get mounted(): boolean {
    return this.isMounted && this.isFrameLoaded;
  }

  public mount(target: HTMLElement) {
    this.logger.log(`Mounting element to target`);
    
    // Ensure proper cleanup
    this.unmount();
    
    this.target = target;
    const frame = document.createElement('iframe');
    this.frame = frame;

    this.frame.src = this.url;
    this.frame.style.width = '100%';
    this.frame.style.height = '800px';
    this.frame.style.minHeight = '800px';
    this.frame.style.border = 'none';
    this.frame.style.overflow = 'hidden';
    this.frame.allow = 'payment';
    this.frame.title = 'Payment Form';
    this.frame.name = 'payment-form-iframe';
    this.frame.id = 'payment-form-iframe';
    
    this.logger.log(`Mounting iframe with URL: ${this.url}`);
    
    // Track load state
    this.isFrameLoaded = false;
    
    // Add load event listener to know when the iframe is ready
    this.frame.onload = this.onFrameLoaded;
    
    // Add error event listener to catch loading issues
    this.frame.onerror = (error) => {
      this.logger.error(`Error loading iframe: ${error}`);
      this.isFrameLoaded = false;
    };
    
    target.appendChild(frame);
    window.addEventListener('message', this.handleMessage.bind(this));
    this.isMounted = true;
    this.logger.log("Element mounted successfully");
    
    return this; // Return this to allow method chaining
  }

  public unmount() {
    if (this.frame) {
      this.logger.log("Unmounting element");
      window.removeEventListener('message', this.handleMessage.bind(this));
      
      if (this.frame.parentNode) {
        try {
          this.frame.parentNode.removeChild(this.frame);
        } catch (error) {
          this.logger.error(`Error removing iframe: ${error}`);
        }
      }
    }

    this.frame = null;
    this.target = null;
    this.listeners.clear();
    this.isMounted = false;
    this.isFrameLoaded = false;
    this.logger.log("Element unmounted successfully");
  }

  public subscribe(listener: L) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  protected onFrameLoaded = () => {
    this.logger.log(`Frame loaded: ${this.url}`);
    this.isFrameLoaded = true;
    
    // Dispatch a custom event that can be listened to
    const readyEvent = new CustomEvent('iframe-ready', {
      detail: {
        url: this.url,
        element: this,
        timestamp: Date.now()
      }
    });
    window.dispatchEvent(readyEvent);
    
    // Set initial height if needed
    this.setInitialHeight();
  };
  
  // Set an initial height if needed for certain elements
  protected setInitialHeight() {
    // Implementation can be overridden by subclasses
  }
}
