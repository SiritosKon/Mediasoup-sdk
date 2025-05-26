import { AsyncQueue } from "../../shared/utils/AsyncQueue";

describe("AsyncQueue", () => {
  let queue: AsyncQueue;

  beforeEach(() => {
    queue = new AsyncQueue();
  });

  it("should process operations in sequence", async () => {
    const results: number[] = [];

    const p1 = queue.enqueue(async () => {
      await new Promise((r) => setTimeout(r, 100));
      results.push(1);
    });

    const p2 = queue.enqueue(async () => {
      results.push(2);
    });

    const p3 = queue.enqueue(async () => {
      await new Promise((r) => setTimeout(r, 50));
      results.push(3);
    });

    await Promise.all([p1, p2, p3]);

    expect(results).toEqual([1, 2, 3]);
  });
});
