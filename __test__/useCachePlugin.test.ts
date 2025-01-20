import { expect, test, describe, vi, beforeAll } from 'vitest';
import { useRequest, clearCache } from '../lib';
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

describe('useCachePlugin', () => {
  test('cacheTime', async () => {
    const demo = componentVue(() => {
      return useRequest(getData, {
        manual: true,
        cacheTime: 10000,
        staleTime: -1,
        cacheKey: () => 'test',
      });
    });

    demo.run(1);
    await vi.advanceTimersByTimeAsync(1000);
    expect(demo.data).toBe(1);
    demo.run(2);
    await vi.advanceTimersByTimeAsync(1000);
    expect(demo.data).toBe(1);
    demo.run(2);
    await vi.advanceTimersByTimeAsync(3000);
    expect(demo.data).toBe(1);
    await vi.advanceTimersByTimeAsync(6000);
    demo.run(2);
    await vi.advanceTimersByTimeAsync(1000);
    expect(demo.data).toBe(2);
  });

  test('staleTime', async () => {
    const demo = componentVue(() => {
      return useRequest(getData, {
        manual: true,
        cacheTime: 10000,
        staleTime: 5000,
        cacheKey: 'test2',
      });
    });

    demo.run(1, 0);
    await vi.advanceTimersByTimeAsync(10);
    expect(demo.data).toBe(1);
    demo.run(2, 0);
    await vi.advanceTimersByTimeAsync(10);
    expect(demo.data).toBe(1);
    await vi.advanceTimersByTimeAsync(5000);
    demo.run(2, 0);
    await vi.advanceTimersByTimeAsync(10);
    expect(demo.data).toBe(2);
  });

  test('clearCache with all', async () => {
    const demo = componentVue(() => {
      return useRequest(getData, {
        manual: true,
        cacheTime: 10000,
        staleTime: -1,
        cacheKey: 'test3',
      });
    });

    demo.run(1, 0);
    await vi.advanceTimersByTimeAsync(10);
    expect(demo.data).toBe(1);
    demo.run(2, 0);
    await vi.advanceTimersByTimeAsync(10);
    expect(demo.data).toBe(1);
    clearCache();
    demo.run(2, 0);
    await vi.advanceTimersByTimeAsync(10);
    expect(demo.data).toBe(2);
  });

  test('clearCache with key', async () => {
    const demo = componentVue(() => {
      return useRequest(getData, {
        manual: true,
        cacheTime: 10000,
        staleTime: -1,
        cacheKey: 'test4',
      });
    });

    demo.run(1, 0);
    await vi.advanceTimersByTimeAsync(10);
    expect(demo.data).toBe(1);
    demo.run(2, 0);
    await vi.advanceTimersByTimeAsync(10);
    expect(demo.data).toBe(1);
    clearCache(['test4']);
    demo.run(2, 0);
    await vi.advanceTimersByTimeAsync(10);
    expect(demo.data).toBe(2);
  });

  test('setCache and getCache', async () => {
    const demo = componentVue(() => {
      return useRequest(getData, {
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
    });

    demo.run(1, 0);
    await vi.advanceTimersByTimeAsync(10);
    expect(demo.data).toBe(1);
    demo.run(2, 0);
    await vi.advanceTimersByTimeAsync(10);
    expect(demo.data).toBe(1);
    localStorage.clear();
    demo.run(2, 0);
    await vi.advanceTimersByTimeAsync(10);
    expect(demo.data).toBe(2);
  });

  test('cache with mutate', async () => {
    const demo = componentVue(() => {
      return useRequest(getData, {
        manual: true,
        cacheTime: 10000,
        staleTime: -1,
        cacheKey: 'test4',
      });
    });

    demo.run(1, 0);
    await vi.advanceTimersByTimeAsync(10);
    expect(demo.data).toBe(2);
    await vi.advanceTimersByTimeAsync(10000);
    demo.run(1, 0);
    await vi.advanceTimersByTimeAsync(10);
    expect(demo.data).toBe(1);
    demo.mutate(3);
    expect(demo.data).toBe(3);
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

    const demo = componentVue(() => {
      const { data: data1, run: run1 } = useRequest(getData1, {
        manual: true,
        cacheTime: 10000,
        staleTime: -1,
        cacheKey: 'test6',
      });

      const { data: data2, run: run2 } = useRequest(getData2, {
        manual: true,
        cacheTime: 10000,
        staleTime: -1,
        cacheKey: 'test6',
      });

      return {
        data1,
        data2,
        run1,
        run2,
      };
    });

    demo.run1();
    await vi.advanceTimersByTimeAsync(10);
    expect(demo.data1).toBe(1);

    demo.run2();
    await vi.advanceTimersByTimeAsync(1000);
    expect(demo.data2).toBe(1);
    demo.run2();
    await vi.advanceTimersByTimeAsync(1000);
    expect(demo.data2).toBe(1);
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
    let key = 'test8';
    const demo = componentVue(() => {
      const { data: data1, run: run1 } = useRequest(getData1, {
        manual: true,
        cacheTime: 10000,
        staleTime: -1,
        cacheKey: 'test7',
      });

      const { data: data2, run: run2 } = useRequest(getData2, {
        manual: true,
        cacheTime: 10000,
        staleTime: -1,
        cacheKey: key,
      });

      return {
        data1,
        data2,
        run1,
        run2,
      };
    });

    demo.run2();
    await vi.advanceTimersByTimeAsync(10);
    expect(demo.data2).toBe(4);
    demo.run1();
    await vi.advanceTimersByTimeAsync(10);
    expect(demo.data1).toBe(1);
    key = 'test7';
    demo.run1();
    await vi.advanceTimersByTimeAsync(1000);
    expect(demo.data2).toBe(4);
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

    const demo = componentVue(() => {
      const { data, run } = useRequest(getData1, {
        manual: true,
        onCache: callback,
      });
      const { data: data1, run: run1 } = useRequest(getData1, {
        manual: true,
        cacheTime: 10000,
        staleTime: -1,
        cacheKey: 'test7',
        onCache: callback,
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

      return {
        data,
        data2,
        run2,
        run,
        data1,
        run1,
      };
    });

    demo.run();
    await vi.advanceTimersByTimeAsync(10);
    expect(callback).toHaveBeenCalledTimes(0);
    demo.run1();
    await vi.advanceTimersByTimeAsync(10);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(demo.data1).toBe(1);
    demo.run2();
    await vi.advanceTimersByTimeAsync(10);
    expect(callback).toHaveBeenCalledTimes(3);
    expect(demo.data2).toBe(5);
    expect(demo.data1).toBe(5);
  });
});
