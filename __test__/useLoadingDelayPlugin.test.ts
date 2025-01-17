import { expect, test, describe, vi, beforeAll } from 'vitest';
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

describe.concurrent('useLoadingDelayPlugin', () => {
  test('loadingDelay normal', async () => {
    const { loading } = useRequest(getData, {
      loadingDelay: 600,
    });
    expect(loading.value).toBe(false);
    await vi.advanceTimersByTimeAsync(500);
    expect(loading.value).toBe(false);
    await vi.advanceTimersByTimeAsync(200);
    expect(loading.value).toBe(true);
    await vi.advanceTimersByTimeAsync(400);
    expect(loading.value).toBe(false);
  });

  test('loadingDelay and delay out request time', async () => {
    const { loading } = useRequest(getData, {
      loadingDelay: 1200,
    });
    await vi.advanceTimersByTimeAsync(1100);
    expect(loading.value).toBe(false);
    await vi.advanceTimersByTimeAsync(200);
    expect(loading.value).toBe(false);
  });
});
