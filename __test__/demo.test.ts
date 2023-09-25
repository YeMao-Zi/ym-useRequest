import { describe, it, expect, test, vi } from 'vitest';

export class User {
  id: string;

  constructor(id: string) {
    this.id = id;
  }
  fetchData(callback: (data: string) => void, delay: number): void {
    setTimeout(() => {
      const data = `Data for user with id: ${this.id}`;
      callback(data);
    }, delay);
  }
}

describe('setTimeout', () => {
  it('should fetch User data', () => {
    vi.useFakeTimers();
    const user = new User('1');

    const callback = vi.fn();
    user.fetchData(callback, 100);
    vi.runAllTimers();
    expect(callback).toBeCalledWith('Data for user with id: 1');
  });
});
