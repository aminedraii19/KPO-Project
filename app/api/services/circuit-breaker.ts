export class CircuitBreaker {
  private failures = 0;
  private openedAt = 0;
  private readonly threshold: number;
  private readonly cooldownMs: number;

  constructor(threshold = 3, cooldownMs = 30_000) {
    this.threshold = threshold;
    this.cooldownMs = cooldownMs;
  }

  async run<T>(operation: () => Promise<T>): Promise<T> {
    if (this.failures >= this.threshold && Date.now() - this.openedAt < this.cooldownMs) {
      throw new Error("Circuit breaker is open");
    }
    try {
      const result = await operation();
      this.failures = 0;
      return result;
    } catch (error) {
      this.failures += 1;
      this.openedAt = Date.now();
      throw error;
    }
  }
}
