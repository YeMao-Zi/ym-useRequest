import { expect, test, describe, vi, beforeAll } from 'vitest';
import { ref } from 'vue';
import { useRequest } from '../lib';

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
    const pollingIntervalRef = ref(null);
    const callback = vi.fn();
    const { run, cancel } = useRequest(getData, {
      defaultParams: 1,
      pollingInterval: pollingIntervalRef,
      onFinally: callback,
    });
    expect(callback).toHaveBeenCalledTimes(0);
    await vi.advanceTimersByTimeAsync(1000);
    expect(callback).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1000);
    expect(callback).toHaveBeenCalledTimes(1);
    pollingIntervalRef.value = 0;
    run();
    await vi.advanceTimersByTimeAsync(1000);
    expect(callback).toHaveBeenCalledTimes(2);
    cancel();
    await vi.advanceTimersByTimeAsync(1000);
    expect(callback).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(1000);
    expect(callback).toHaveBeenCalledTimes(2);
  });

  test('polling in onSuccess', async () => {
    let count = 0;
    const { loading, cancel } = useRequest(getData, {
      defaultParams: [1],
      pollingInterval: 1000,
      onBefore() {
        count++;
      },
      onSuccess() {
        if (count === 2) {
          cancel();
        }
      },
    });
    expect(loading.value).toBe(true);
    expect(count).toBe(1);
    await vi.advanceTimersByTimeAsync(1500);
    expect(loading.value).toBe(false);
    expect(count).toBe(1);
    await vi.advanceTimersByTimeAsync(1000);
    expect(count).toBe(2);
    expect(loading.value).toBe(true);
    await vi.advanceTimersByTimeAsync(1500);
    expect(loading.value).toBe(false);
    expect(count).toBe(2);
  });

  test('polling in onFinally', async () => {
    let count = 0;
    const { loading, cancel } = useRequest(getData, {
      pollingInterval: 1000,
      onBefore() {
        count++;
      },
      onFinally() {
        if (count === 2) {
          cancel();
        }
      },
    });
    expect(loading.value).toBe(true);
    expect(count).toBe(1);
    await vi.advanceTimersByTimeAsync(1500);
    expect(loading.value).toBe(false);
    expect(count).toBe(1);
    await vi.advanceTimersByTimeAsync(1000);
    expect(count).toBe(2);
    expect(loading.value).toBe(true);
    await vi.advanceTimersByTimeAsync(1500);
    expect(loading.value).toBe(false);
    expect(count).toBe(2);
  });

  test('polling in onError', async () => {
    let count = 0;
    const { loading, cancel } = useRequest(getError, {
      pollingInterval: 1000,
      onBefore() {
        count++;
      },
      onError() {
        if (count === 2) {
          cancel();
        }
      },
    });
    expect(loading.value).toBe(true);
    expect(count).toBe(1);
    await vi.advanceTimersByTimeAsync(1500);
    expect(loading.value).toBe(false);
    expect(count).toBe(1);
    await vi.advanceTimersByTimeAsync(1000);
    expect(count).toBe(2);
    expect(loading.value).toBe(true);
    await vi.advanceTimersByTimeAsync(1500);
    expect(loading.value).toBe(false);
    expect(count).toBe(2);
  });

  test('error retry', async () => {
    const callback = vi.fn();
    useRequest(getError, {
      pollingInterval: 1000,
      pollingErrorRetryCount: 3,
      onFinally: callback,
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
    const { cancel, pollingCount } = useRequest(getData, {
      pollingInterval: 100,
      onSuccess() {
        if (pollingCount.value === 3) {
          cancel();
        }
      },
    });
    expect(pollingCount.value).toBe(0);
    await vi.advanceTimersByTimeAsync(1100);
    expect(pollingCount.value).toBe(1);
    await vi.advanceTimersByTimeAsync(1100);
    expect(pollingCount.value).toBe(2);
    await vi.advanceTimersByTimeAsync(1100);
    expect(pollingCount.value).toBe(3);
    await vi.advanceTimersByTimeAsync(100);
    expect(pollingCount.value).toBe(3);
  });
});
