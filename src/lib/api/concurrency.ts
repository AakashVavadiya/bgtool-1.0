/**
 * Async Concurrency Semaphore & Queue for heavy AI Inference workloads.
 * Protects 15 GB RAM VPS from memory exhaustion and CPU thrashing.
 */

export class ConcurrencyLimiter {
  private maxConcurrency: number;
  private currentRunning: number = 0;
  private queue: Array<() => void> = [];
  private maxQueueSize: number;

  constructor(maxConcurrency = 3, maxQueueSize = 25) {
    this.maxConcurrency = maxConcurrency;
    this.maxQueueSize = maxQueueSize;
  }

  public get running(): number {
    return this.currentRunning;
  }

  public get queued(): number {
    return this.queue.length;
  }

  public async acquire(timeoutMs = 15000): Promise<() => void> {
    if (this.currentRunning < this.maxConcurrency) {
      this.currentRunning++;
      let released = false;
      return () => {
        if (!released) {
          released = true;
          this.release();
        }
      };
    }

    if (this.queue.length >= this.maxQueueSize) {
      throw new Error("QUEUE_FULL");
    }

    return new Promise<() => void>((resolve, reject) => {
      let timer: NodeJS.Timeout | null = null;
      let released = false;

      const execute = () => {
        if (timer) clearTimeout(timer);
        this.currentRunning++;
        resolve(() => {
          if (!released) {
            released = true;
            this.release();
          }
        });
      };

      timer = setTimeout(() => {
        // Remove from queue if timed out
        const idx = this.queue.indexOf(execute);
        if (idx !== -1) {
          this.queue.splice(idx, 1);
        }
        reject(new Error("QUEUE_TIMEOUT"));
      }, timeoutMs);

      this.queue.push(execute);
    });
  }

  private release(): void {
    this.currentRunning = Math.max(0, this.currentRunning - 1);
    if (this.queue.length > 0 && this.currentRunning < this.maxConcurrency) {
      const next = this.queue.shift();
      if (next) {
        next();
      }
    }
  }
}

// Single instance for heavy AI inference (remove-bg, watermark, face blur)
const defaultMaxConcurrency = Math.max(1, Number(process.env["API_MAX_CONCURRENT"]) || 3);
const defaultMaxQueue = Math.max(1, Number(process.env["API_MAX_QUEUE"]) || 30);
export const inferenceLimiter = new ConcurrencyLimiter(defaultMaxConcurrency, defaultMaxQueue);
