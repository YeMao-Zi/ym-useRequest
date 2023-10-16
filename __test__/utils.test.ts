import { expect, test, vi, beforeAll } from 'vitest';
import { composeMiddleware, useDelay, type } from '../lib/utils';

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

test('type', () => {
  expect(type.isArray([])).toBe(true);
  expect(type.isBoolean(false)).toBe(true);
  expect(type.isFunction(() => [])).toBe(true);
  expect(type.isNull(null)).toBe(true);
  expect(type.isNumber(2)).toBe(true);
  expect(type.isObject({})).toBe(true);
  expect(type.isPromise(new Promise((resolve) => resolve(0)))).toBe(true);
  expect(type.isRegExp(/abcd/)).toBe(true);
  expect(type.isString('123')).toBe(true);
  expect(type.isUndefined(undefined)).toBe(true);
});
