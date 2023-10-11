import { expect, test, vi, beforeAll } from 'vitest';
import { composeMiddleware, useDelay } from '../lib/utils';

beforeAll(() => {
  vi.useFakeTimers();
});

test('useDelay', async () => {
  let data: any[] = [];
  useDelay(() => data.push(1));
  expect(data).toEqual([1]);
  useDelay(() => data.push(1), 2000);
  expect(data).toEqual([1]);
  await vi.advanceTimersByTimeAsync(2000);
  expect(data).toEqual([1, 1]);
});

test('composeMiddleware', async () => {
  let data: any[] = [];
  function fn1(serve: Function) {
    data.push(1);
    return serve;
  }
  function fn2(serve: Function) {
    data.push(2);
    return serve;
  }
  function serve() {
    data.push('serve');
  }
  const arr = [fn1, fn2];
  composeMiddleware(arr, serve)();
  expect(data).toEqual([2, 1, 'serve']);
});
