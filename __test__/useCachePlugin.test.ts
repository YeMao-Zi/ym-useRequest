import { expect, test, describe, vi, beforeAll } from 'vitest';
import { useRequest, clearCache } from '../lib';

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

describe('useCachePlugin', () => {
  test('cacheTime', async () => {
    const { data, run } = useRequest(getData, {
      manual: true,
      cacheTime: 10000,
      staleTime: -1,
      cacheKey: () => 'test',
    });
    run(1);
    await vi.advanceTimersByTimeAsync(1000);
    expect(data.value).toBe(1);
    run(2);
    await vi.advanceTimersByTimeAsync(1000);
    expect(data.value).toBe(1);
    run(2);
    await vi.advanceTimersByTimeAsync(3000);
    expect(data.value).toBe(1);
    await vi.advanceTimersByTimeAsync(6000);
    run(2);
    await vi.advanceTimersByTimeAsync(1000);
    expect(data.value).toBe(2);
  });

  test('staleTime', async () => {
    const { data, run } = useRequest(getData, {
      manual: true,
      cacheTime: 10000,
      staleTime: 5000,
      cacheKey: 'test2',
    });
    run(1, 0);
    await vi.advanceTimersByTimeAsync(10);
    expect(data.value).toBe(1);
    run(2, 0);
    await vi.advanceTimersByTimeAsync(10);
    expect(data.value).toBe(1);
    await vi.advanceTimersByTimeAsync(5000);
    run(2, 0);
    await vi.advanceTimersByTimeAsync(10);
    expect(data.value).toBe(2);
  });

  test('clearCache with all', async () => {
    const { data, run } = useRequest(getData, {
      manual: true,
      cacheTime: 10000,
      staleTime: -1,
      cacheKey: 'test3',
    });
    run(1, 0);
    await vi.advanceTimersByTimeAsync(10);
    expect(data.value).toBe(1);
    run(2, 0);
    await vi.advanceTimersByTimeAsync(10);
    expect(data.value).toBe(1);
    clearCache();
    run(2, 0);
    await vi.advanceTimersByTimeAsync(10);
    expect(data.value).toBe(2);
  });

  test('clearCache with key', async () => {
    const { data, run } = useRequest(getData, {
      manual: true,
      cacheTime: 10000,
      staleTime: -1,
      cacheKey: 'test4',
    });
    run(1, 0);
    await vi.advanceTimersByTimeAsync(10);
    expect(data.value).toBe(1);
    run(2, 0);
    await vi.advanceTimersByTimeAsync(10);
    expect(data.value).toBe(1);
    clearCache(['test4']);
    run(2, 0);
    await vi.advanceTimersByTimeAsync(10);
    expect(data.value).toBe(2);
  });

  test('setCache and getCache', async () => {
    const { data, run } = useRequest(getData, {
      manual: true,
      cacheTime: 10000,
      staleTime: -1,
      cacheKey: 'test5',
      setCache(cacheKey, data) {
        localStorage.setItem(cacheKey, JSON.stringify(data));
      },
      getCache(cacheKey) {
        return JSON.parse(localStorage.getItem(cacheKey) || 'null');
      },
    });
    run(1, 0);
    await vi.advanceTimersByTimeAsync(10);
    expect(data.value).toBe(1);
    run(2, 0);
    await vi.advanceTimersByTimeAsync(10);
    expect(data.value).toBe(1);
    localStorage.clear();
    run(2, 0);
    await vi.advanceTimersByTimeAsync(10);
    expect(data.value).toBe(2);
  });

  test('cache with mutate', async () => {
    const { data, run, mutate } = useRequest(getData, {
      manual: true,
      cacheTime: 10000,
      staleTime: -1,
      cacheKey: 'test4',
    });
    run(1, 0);
    await vi.advanceTimersByTimeAsync(10);
    expect(data.value).toBe(2);
    await vi.advanceTimersByTimeAsync(10000);
    run(1, 0);
    await vi.advanceTimersByTimeAsync(10);
    expect(data.value).toBe(1);
    mutate(3);
    expect(data.value).toBe(3);
  });

  test('cache with sameKey', async () => {
    const getData1 = (): Promise<number> => {
      return new Promise<number>((resolve, reject) => {
        resolve(1);
      });
    };
    const getData2 = (): Promise<number> => {
      return new Promise<number>((resolve, reject) => {
        resolve(4);
      });
    };
    const { data: data1, run: run1 } = useRequest(getData1, {
      manual: true,
      cacheTime: 10000,
      staleTime: -1,
      cacheKey: 'test6',
    });

    run1();
    await vi.advanceTimersByTimeAsync(10);
    expect(data1.value).toBe(1);
    const { data: data2, run: run2 } = useRequest(getData2, {
      manual: true,
      cacheTime: 10000,
      staleTime: -1,
      cacheKey: 'test6',
    });
    run2();
    await vi.advanceTimersByTimeAsync(1000);
    expect(data2.value).toBe(1);
    run2();
    await vi.advanceTimersByTimeAsync(1000);
    expect(data2.value).toBe(1);
  });

  test('cache with changeKey', async () => {
    const getData1 = (): Promise<number> => {
      return new Promise<number>((resolve, reject) => {
        resolve(1);
      });
    };
    const getData2 = (): Promise<number> => {
      return new Promise<number>((resolve, reject) => {
        resolve(4);
      });
    };
    const { data: data1, run: run1 } = useRequest(getData1, {
      manual: true,
      cacheTime: 10000,
      staleTime: -1,
      cacheKey: 'test7',
    });
    let key = 'test8';
    const { data: data2, run: run2 } = useRequest(getData2, {
      manual: true,
      cacheTime: 10000,
      staleTime: -1,
      cacheKey: key,
    });
    run2();
    await vi.advanceTimersByTimeAsync(10);
    expect(data2.value).toBe(4);
    run1();
    await vi.advanceTimersByTimeAsync(10);
    expect(data1.value).toBe(1);
    key = 'test7';
    run1();
    await vi.advanceTimersByTimeAsync(1000);
    expect(data2.value).toBe(4);
  });

  test('cache with onCache', async () => {
    const getData1 = (): Promise<number> => {
      return new Promise<number>((resolve, reject) => {
        resolve(1);
      });
    };
    const getData2 = (): Promise<number> => {
      return new Promise<number>((resolve, reject) => {
        resolve(4);
      });
    };
    const callback = vi.fn();
    const { data, run } = useRequest(getData1, {
      manual: true,
      onCache(data) {
        callback();
      },
    });
    const { data: data1, run: run1 } = useRequest(getData1, {
      manual: true,
      cacheTime: 10000,
      staleTime: -1,
      cacheKey: 'test7',
      onCache(data) {
        callback();
      },
    });

    const {
      data: data2,
      run: run2,
      mutate,
    } = useRequest(getData2, {
      manual: true,
      cacheTime: 10000,
      staleTime: -1,
      cacheKey: 'test7',
      onCache(data) {
        callback();
        mutate(5);
      },
    });
    run();
    await vi.advanceTimersByTimeAsync(10);
    expect(callback).toHaveBeenCalledTimes(0);
    run1();
    await vi.advanceTimersByTimeAsync(10);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(data1.value).toBe(1);
    run2();
    await vi.advanceTimersByTimeAsync(10);
    expect(callback).toHaveBeenCalledTimes(3);
    expect(data2.value).toBe(5);
    expect(data1.value).toBe(5);
  });
});
