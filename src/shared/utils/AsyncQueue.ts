export class AsyncQueue {
  private promiseChain = Promise.resolve();

  enqueue<T>(task: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.promiseChain = this.promiseChain
        .then(task)
        .then(resolve)
        .catch(reject);
    });
  }
}
