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

describe.concurrent('useLoadingDelayPlugin', () => {
  test('loadingDelay normal', async () => {
    const demo = componentVue(() => {
      return useRequest(getData, {
        loadingDelay: 600,
      });
    });
    expect(demo.loading).toBe(false);
    await vi.advanceTimersByTimeAsync(500);
    expect(demo.loading).toBe(false);
    await vi.advanceTimersByTimeAsync(200);
    expect(demo.loading).toBe(true);
    await vi.advanceTimersByTimeAsync(400);
    expect(demo.loading).toBe(false);
  });

  test('loadingDelay and delay out request time', async () => {
    const demo = componentVue(() => {
      return useRequest(getData, {
        loadingDelay: 1200,
      });
    });
    await vi.advanceTimersByTimeAsync(1100);
    expect(demo.loading).toBe(false);
    await vi.advanceTimersByTimeAsync(200);
    expect(demo.loading).toBe(false);
  });
});
