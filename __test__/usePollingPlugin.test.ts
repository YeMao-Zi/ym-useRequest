import { expect, test, describe, vi, beforeAll } from 'vitest';
import { ref } from 'vue';
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

describe('usePollingPlugin', () => {
  test('polling with ref', async () => {
    const pollingIntervalRef = ref(500);
    const callback = vi.fn();

    const demo = componentVue(() => {
      return useRequest(getData, {
        defaultParams: [1, 100],
        pollingInterval: pollingIntervalRef,
        onFinally: callback,
      });
    });

    expect(callback).toHaveBeenCalledTimes(0);
    // 立即执行一次
    await vi.advanceTimersByTimeAsync(100);
    expect(callback).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(600);
    expect(callback).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(600);
    expect(callback).toHaveBeenCalledTimes(3);
    await vi.advanceTimersByTimeAsync(600);
    expect(callback).toHaveBeenCalledTimes(4);
    pollingIntervalRef.value = 1000;
    await vi.advanceTimersByTimeAsync(600);
    expect(callback).toHaveBeenCalledTimes(4);
    await vi.advanceTimersByTimeAsync(500);
    expect(callback).toHaveBeenCalledTimes(5);
    await vi.advanceTimersByTimeAsync(1100);
    expect(callback).toHaveBeenCalledTimes(6);
    demo.cancel();
    await vi.advanceTimersByTimeAsync(1100);
    expect(callback).toHaveBeenCalledTimes(6);
  });

  test('polling in onSuccess', async () => {
    let count = 0;

    const demo = componentVue(() => {
      const instance = useRequest(getData, {
        defaultParams: [1],
        pollingInterval: 1000,
        onBefore() {
          count++;
        },
        onSuccess() {
          if (count === 2) {
            instance.cancel();
          }
        },
      });

      return instance;
    });

    expect(demo.loading).toBe(true);
    expect(count).toBe(1);
    await vi.advanceTimersByTimeAsync(1500);
    expect(demo.loading).toBe(false);
    expect(count).toBe(1);
    await vi.advanceTimersByTimeAsync(1000);
    expect(count).toBe(2);
    expect(demo.loading).toBe(true);
    await vi.advanceTimersByTimeAsync(1500);
    expect(demo.loading).toBe(false);
    expect(count).toBe(2);
  });

  test('polling in onFinally', async () => {
    let count = 0;

    const demo = componentVue(() => {
      const instance = useRequest(getData, {
        pollingInterval: 1000,
        onBefore() {
          count++;
        },
        onFinally() {
          if (count === 2) {
            instance.cancel();
          }
        },
      });
      return instance;
    });

    expect(demo.loading).toBe(true);
    expect(count).toBe(1);
    await vi.advanceTimersByTimeAsync(1500);
    expect(demo.loading).toBe(false);
    expect(count).toBe(1);
    await vi.advanceTimersByTimeAsync(1000);
    expect(count).toBe(2);
    expect(demo.loading).toBe(true);
    await vi.advanceTimersByTimeAsync(1500);
    expect(demo.loading).toBe(false);
    expect(count).toBe(2);
  });

  test('polling in onError', async () => {
    let count = 0;

    const demo = componentVue(() => {
      const instance = useRequest(getError, {
        pollingInterval: 1000,
        onBefore() {
          count++;
        },
        onError() {
          if (count === 2) {
            instance.cancel();
          }
        },
      });
      return instance;
    });

    expect(demo.loading).toBe(true);
    expect(count).toBe(1);
    await vi.advanceTimersByTimeAsync(1500);
    expect(demo.loading).toBe(false);
    expect(count).toBe(1);
    await vi.advanceTimersByTimeAsync(1000);
    expect(count).toBe(2);
    expect(demo.loading).toBe(true);
    await vi.advanceTimersByTimeAsync(1500);
    expect(demo.loading).toBe(false);
    expect(count).toBe(2);
  });

  test('error retry', async () => {
    const callback = vi.fn();

    const demo = componentVue(() => {
      return useRequest(getError, {
        pollingInterval: 1000,
        pollingErrorRetryCount: 3,
        onFinally: callback,
        onError() {},
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

  test('pollingCount', async () => {
    const demo = componentVue(() => {
      const instance = useRequest(getData, {
        pollingInterval: 100,
        onSuccess() {
          if (instance.pollingCount.value === 3) {
            instance.cancel();
          }
        },
      });

      return instance;
    });

    expect(demo.pollingCount).toBe(0);
    await vi.advanceTimersByTimeAsync(1100);
    expect(demo.pollingCount).toBe(1);
    await vi.advanceTimersByTimeAsync(1100);
    expect(demo.pollingCount).toBe(2);
    await vi.advanceTimersByTimeAsync(1100);
    expect(demo.pollingCount).toBe(3);
    await vi.advanceTimersByTimeAsync(100);
    expect(demo.pollingCount).toBe(3);
    expect(demo.pollingCount).toBe(3);
  });
});
