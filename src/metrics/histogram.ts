export class Histogram {
  private buckets: number[];
  private counts: number[];
  private totalCount = 0;
  private totalSum = 0;

  constructor(buckets: number[]) {
    this.buckets = buckets;
    this.counts = new Array(buckets.length + 1).fill(0);
  }

  observe(value: number): void {
    this.totalCount++;
    this.totalSum += value;

    const index = this.buckets.findIndex(
      (bucket) => value <= bucket
    );

    if (index === -1) {
      this.counts[this.counts.length - 1]++;
    } else {
      this.counts[index]++;
    }
  }

  getData() {
    return {
      buckets: this.buckets,
      counts: this.counts,
      count: this.totalCount,
      sum: this.totalSum
    };
  }
}