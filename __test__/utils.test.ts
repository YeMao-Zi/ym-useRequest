import { expect, test, vi, beforeAll, afterAll, describe } from 'vitest';
import { useDelay, TypeChecker, wrappedPromise } from '../lib/utils';

describe('utils with fake timers', () => {
  beforeAll(() => {
    vi.useFakeTimers();
  });

  afterAll(() => {
    vi.useRealTimers();
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
});

describe('utils without fake timers', () => {
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

  test('wrappedPromise with sync service and callback', async () => {
    const serviceFn = vi.fn().mockResolvedValue('test result');
    const callbackFn = vi.fn((result: string) => `processed: ${result}`);

    const wrapped = wrappedPromise(serviceFn, callbackFn);
    const result = await wrapped('param1', 'param2');

    expect(serviceFn).toHaveBeenCalledWith('param1', 'param2');
    expect(callbackFn).toHaveBeenCalledWith('test result', ['param1', 'param2']);
    expect(result).toBe('processed: test result');
  });

  test('wrappedPromise with async callback', async () => {
    const serviceFn = vi.fn().mockResolvedValue({ id: 1, name: 'test' });
    const asyncCallbackFn = vi.fn(async (result: { id: number; name: string }) => {
      return `async processed: ${result.name}`;
    });

    const wrapped = wrappedPromise(serviceFn, asyncCallbackFn);
    const result = await wrapped();

    expect(serviceFn).toHaveBeenCalled();
    expect(asyncCallbackFn).toHaveBeenCalledWith({ id: 1, name: 'test' }, []);
    expect(result).toBe('async processed: test');
  });

  test('wrappedPromise with rejected promise', async () => {
    const error = new Error('Service error');
    const serviceFn = vi.fn().mockRejectedValue(error);
    const callbackFn = vi.fn();

    const wrapped = wrappedPromise(serviceFn, callbackFn);

    await expect(wrapped()).rejects.toThrow('Service error');
    expect(serviceFn).toHaveBeenCalled();
    expect(callbackFn).not.toHaveBeenCalled();
  });
});
