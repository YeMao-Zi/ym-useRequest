import { expect, test, vi, beforeAll } from 'vitest';
import { composeMiddleware, useDelay, TypeChecker } from '../lib/utils';

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

test('TypeChecker', () => {
  expect(TypeChecker.isArray([])).toBe(true);
  expect(TypeChecker.isBoolean(false)).toBe(true);
  expect(TypeChecker.isFunction(() => [])).toBe(true);
  expect(TypeChecker.isNull(null)).toBe(true);
  expect(TypeChecker.isNumber(2)).toBe(true);
  expect(TypeChecker.isObject({})).toBe(true);
  expect(TypeChecker.isPromise(new Promise((resolve) => resolve(0)))).toBe(true);
  expect(TypeChecker.isRegExp(/abcd/)).toBe(true);
  expect(TypeChecker.isString('123')).toBe(true);
  expect(TypeChecker.isUndefined(undefined)).toBe(true);
});
