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

describe('useDebouncePlugin', () => {
  test('debounce with debounceInterval', async () => {
    const callback = vi.fn();
    // 默认执行防抖 ({leading: false, trailing: true})
    // 只执行最后一次
    const demo = componentVue(() => {
      return useRequest(
        (...args) => {
          callback();
          return getData(...args);
        },
        {
          manual: true,
          debounceWait: 100,
        },
      );
    });
    let count = 0;
    setTimeout(() => {
      expect(count).toBe(10);
    }, 500);
    for (let index = 0; index <= 100; index++) {
      count++;
      demo.run(index, 0);
      await vi.advanceTimersByTimeAsync(51);
    }
    expect(demo.data.value).toBe(undefined);
    expect(callback).toHaveBeenCalledTimes(0);
    await vi.advanceTimersByTimeAsync(51);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(demo.data.value).toBe(100);
    for (let index = 0; index <= 100; index++) {
      demo.run(index, 0);
      await vi.advanceTimersByTimeAsync(51);
    }
    demo.cancel();
    expect(callback).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(51);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  test('debounce with debounceOptions', async () => {
    const callback = vi.fn();
    // 立即执行防抖 ({leading: true, trailing: false})
    // 只执行第一次，后续连续触发无效，直到停止一段(debounceWait)时间后的下一次触发才再执行第一次。
    const demo = componentVue(() => {
      return useRequest(
        (...args) => {
          callback();
          return getData(...args);
        },
        {
          manual: true,
          debounceWait: 100,
          debounceOptions: {
            leading: true,
            trailing: false,
          },
        },
      );
    });

    for (let index = 0; index <= 100; index++) {
      demo.run(index, 0);
      await vi.advanceTimersByTimeAsync(51);
    }
    expect(demo.data.value).toBe(0);
    expect(callback).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(51);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(demo.data.value).toBe(0);
    demo.run(222, 0);
    expect(callback).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(1);
    expect(demo.data.value).toBe(222);
  });

  test('debounce with debounceInterval change', async () => {
    const callback = vi.fn();
    const debounceWaitRef = ref(100);

    const demo = componentVue(() => {
      return useRequest(
        (...args) => {
          callback();
          return getData(...args);
        },
        {
          manual: true,
          debounceWait: debounceWaitRef,
        },
      );
    });

    demo.run(22,0);
    expect(callback).toHaveBeenCalledTimes(0);
    expect(demo.data.value).toBe(undefined);
    await vi.advanceTimersByTimeAsync(51);
    expect(callback).toHaveBeenCalledTimes(0);
    expect(demo.data.value).toBe(undefined);
    // 等待防抖时间过去，确保之前的请求完成
    await vi.advanceTimersByTimeAsync(100);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(demo.data.value).toBe(22);
    
    debounceWaitRef.value = 50;
    //  debounceWaitRef 变更，需要在下次请求时检测到变化并重新设置
    // 先触发一次请求来检测变化
    demo.run(33,0);
    await vi.advanceTimersByTimeAsync(51);
    expect(callback).toHaveBeenCalledTimes(2);
    expect(demo.data.value).toBe(33);
  });
});
