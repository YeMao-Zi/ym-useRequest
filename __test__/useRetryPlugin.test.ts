import { expect, test, describe, vi, beforeAll } from 'vitest';
import { useRequest } from '../lib';
import { componentVue } from './utils';

const getData = (value = 1, time = 1000): Promise<number> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(value);
    }, time);
  });
};

const getError = () => {
  return new Promise((_resolve, reject) => {
    setTimeout(() => {
      reject(new Error('Err'));
    }, 1000);
  });
};

beforeAll(() => {
  vi.useFakeTimers();
});

describe('useRetryPlugin', () => {
  test('retry base', async () => {
    // 2s 4s 30s
    const callback = vi.fn();

    const demo = componentVue(() => {
      return useRequest(getError, {
        retryCount: 3,
        onError: callback,
      });
    });

    // call time: 1 1+2+1 1+2+1+4+1 1+2+1+4+1+8+1
    expect(callback).toHaveBeenCalledTimes(0);
    await vi.advanceTimersByTimeAsync(2000);
    expect(callback).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(2000);
    expect(callback).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(5000);
    expect(callback).toHaveBeenCalledTimes(3);
    await vi.advanceTimersByTimeAsync(9000);
    expect(callback).toHaveBeenCalledTimes(4);
    await vi.advanceTimersByTimeAsync(17000);
    expect(callback).toHaveBeenCalledTimes(4);
  });

  test('retryInterval', async () => {
    const callback = vi.fn();

    const demo = componentVue(() => {
      return useRequest(getError, {
        retryCount: 3,
        retryInterval: 1000,
        onError: callback,
      });
    });

    expect(callback).toHaveBeenCalledTimes(0);
    await vi.advanceTimersByTimeAsync(2000);
    expect(callback).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(2000);
    expect(callback).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(2000);
    expect(callback).toHaveBeenCalledTimes(3);
    await vi.advanceTimersByTimeAsync(2000);
    expect(callback).toHaveBeenCalledTimes(4);
    await vi.advanceTimersByTimeAsync(2000);
    expect(callback).toHaveBeenCalledTimes(4);
  });

  test('retry success', async () => {
    const callback = vi.fn();

    const demo = componentVue(() => {
      return useRequest(getData, {
        retryCount: 3,
        onFinally: callback,
      });
    });

    expect(callback).toHaveBeenCalledTimes(0);
    await vi.advanceTimersByTimeAsync(2000);
    expect(callback).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(2000);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  test('retry cancel', async () => {
    const callback = vi.fn();

    const demo = componentVue(() => {
      return useRequest(getError, {
        retryCount: 3,
        onError: callback,
      });
    });

    expect(callback).toHaveBeenCalledTimes(0);
    await vi.advanceTimersByTimeAsync(2000);
    expect(callback).toHaveBeenCalledTimes(1);
    demo.cancel();
    await vi.advanceTimersByTimeAsync(2000);
    expect(callback).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(10000);
    expect(callback).toHaveBeenCalledTimes(1);
  });
});
