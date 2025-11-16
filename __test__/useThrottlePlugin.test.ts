import { expect, test, describe, vi, beforeAll } from 'vitest';
import { ref } from '../lib/utils/reactive';
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

describe('useThrottlePlugin', () => {
  test('throttle with throttleInterval', async () => {
    const callback = vi.fn();
    // 默认: {leading: true, trailing: true}
    // 前后都执行，保证周期性输出,首次执行一次，节流时间结束后再执行一次最后一次
    const demo = componentVue(() => {
      return useRequest(
        (...args) => {
          callback();
          return getData(...args);
        },
        {
          manual: true,
          throttleWait: 100,
        },
      );
    });

    demo.run(0, 0);
    await vi.advanceTimersByTimeAsync(51);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(demo.data).toBe(0);
    demo.run(1, 0);
    demo.run(2, 0);
    demo.run(3, 0);
    await vi.advanceTimersByTimeAsync(51);
    expect(callback).toHaveBeenCalledTimes(2);
    expect(demo.data).toBe(3);
  });

  test('throttle with throttleOptions', async () => {
    const callback = vi.fn();
    // 执行: {leading: true, trailing: false}
    // 只在一开始时执行，忽略时段内的所有调用
    const demo = componentVue(() => {
      return useRequest(
        (...args) => {
          callback();
          return getData(...args);
        },
        {
          manual: true,
          throttleWait: 100,
          throttleOptions: {
            leading: true,
            trailing: false,
          },
        },
      );
    });

    demo.run(0, 0);
    await vi.advanceTimersByTimeAsync(51);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(demo.data).toBe(0);
    demo.run(1, 0);
    demo.run(2, 0);
    demo.run(3, 0);
    await vi.advanceTimersByTimeAsync(51);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(demo.data).toBe(0);
    demo.run(4, 0);
    await vi.advanceTimersByTimeAsync(51);
    expect(callback).toHaveBeenCalledTimes(2);
    expect(demo.data).toBe(4);
  });

  test('throttle with throttleInterval change', async () => {
    const callback = vi.fn();
    const throttleWaitRef = ref(100);

    const demo = componentVue(() => {
      return useRequest(
        (...args) => {
          callback();
          return getData(...args);
        },
        {
          manual: true,
          throttleWait: throttleWaitRef,
        },
      );
    });

    demo.run(0, 0);
    demo.run(1, 0);
    await vi.advanceTimersByTimeAsync(51);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(demo.data).toBe(0);
    
    // 等待节流时间过去，确保之前的请求完成
    await vi.advanceTimersByTimeAsync(100);
    expect(callback).toHaveBeenCalledTimes(2);
    expect(demo.data).toBe(1);
    
    throttleWaitRef.value = 150;
    // throttleWaitRef 变更，需要在下次请求时检测到变化并重新设置
    // 先触发一次请求来检测变化
    demo.run(2, 0);
    expect(callback).toHaveBeenCalledTimes(3);
    demo.run(3, 0);
    demo.run(4, 0);
    await vi.advanceTimersByTimeAsync(101);
    expect(callback).toHaveBeenCalledTimes(3);
    demo.run(5, 0);
    await vi.advanceTimersByTimeAsync(151);
    expect(callback).toHaveBeenCalledTimes(4);
    expect(demo.data).toBe(5);
  });

  test('throttle with cancel', async () => {
    const callback = vi.fn();

    const demo = componentVue(() => {
      return useRequest(
        (...args) => {
          callback();
          return getData(...args);
        },
        {
          manual: true,
          throttleWait: 200,
        },
      );
    });

    demo.run();
    await vi.advanceTimersByTimeAsync(50);
    expect(callback).toHaveBeenCalledTimes(1);
    demo.run();
    await vi.advanceTimersByTimeAsync(50);
    expect(callback).toHaveBeenCalledTimes(1);
    demo.cancel();
    demo.run();
    await vi.advanceTimersByTimeAsync(50);
    expect(callback).toHaveBeenCalledTimes(2);
  });
});
