export class ShuffleBag<T> {
  private pool: T[];
  private bag: T[] = [];
  private lastPicked: T | null = null;
  private rng: () => number;

  constructor(pool: readonly T[], rng: () => number = Math.random) {
    if (!pool || pool.length === 0) {
      throw new Error('ShuffleBag requires a non-empty pool');
    }
    this.pool = [...pool];
    this.rng = rng;
    this.refill();
  }

  private refill(): void {
    const nextBag = [...this.pool];
    // Fisher-Yates shuffle
    for (let i = nextBag.length - 1; i > 0; i--) {
      const j = Math.floor(this.rng() * (i + 1));
      [nextBag[i], nextBag[j]] = [nextBag[j], nextBag[i]];
    }

    // Boundary deduplication when pool size > 1
    if (this.lastPicked !== null && nextBag.length > 1 && nextBag[0] === this.lastPicked) {
      // Swap first item with last item
      const lastIndex = nextBag.length - 1;
      [nextBag[0], nextBag[lastIndex]] = [nextBag[lastIndex], nextBag[0]];
    }

    this.bag = nextBag;
  }

  public next(): T {
    if (this.bag.length === 0) {
      this.refill();
    }
    const item = this.bag.shift()!;
    this.lastPicked = item;
    return item;
  }

  public reset(): void {
    this.lastPicked = null;
    this.refill();
  }

  public resetPool(newPool: readonly T[]): void {
    if (!newPool || newPool.length === 0) {
      throw new Error('ShuffleBag requires a non-empty pool');
    }
    this.pool = [...newPool];
    this.lastPicked = null;
    this.refill();
  }
}
