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

describe.concurrent('useReadyPlugin', () => {
  test('ready with manual=false', async () => {
    const ready = ref(false);

    const demo = componentVue(() => {
      return useRequest(getData, {
        defaultParams: [1],
        ready,
      });
    });

    expect(demo.data).toBeUndefined();
    await vi.runAllTimersAsync();
    expect(demo.data).toBeUndefined();
    ready.value = true;
    demo.run();
    await vi.runAllTimersAsync();
    expect(demo.data).toBe(1);
  });

  test('ready with manual=true', async () => {
    const ready = ref(false);

    const demo = componentVue(() => {
      return useRequest(getData, {
        manual: true,
        defaultParams: [1],
        ready,
      });
    });

    demo.run();
    await vi.runAllTimersAsync();
    expect(demo.data).toBeUndefined();
    ready.value = true;
    demo.run();
    await vi.runAllTimersAsync();
    expect(demo.data).toBe(1);
  });

  // 测试 ready 参数为函数的情况
  test('ready as function returning boolean', async () => {
    let flag = false;
    const readyFn = () => flag;

    const demo = componentVue(() => {
      return useRequest(getData, {
        defaultParams: [1],
        ready: readyFn,
      });
    });

    expect(demo.data).toBeUndefined();
    await vi.runAllTimersAsync();
    expect(demo.data).toBeUndefined();
    flag = true;
    demo.run();
    await vi.runAllTimersAsync();
    expect(demo.data).toBe(1);
  });
});
