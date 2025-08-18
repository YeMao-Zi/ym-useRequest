import { expect, test, beforeEach, afterEach, describe, vi, beforeAll } from 'vitest';
import { useRequest } from '../lib';
import { componentVue } from './utils';

const getData = (value = 1, time = 1000): Promise<number> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(value);
    }, time);
  });
};

beforeAll(() => {
  vi.useFakeTimers();
});

describe('useWindowVisibilityChangePlugin', () => {
  let originalVisibilityState: string;
  beforeEach(() => {
    // 保存原始的 document.visibilityState
    originalVisibilityState = document.visibilityState;
    // 模拟 document.visibilityState
    Object.defineProperty(document, 'visibilityState', {
      writable: true,
      value: 'visible',
    });
  });

  afterEach(() => {
    // 恢复原始的 document.visibilityState
    Object.defineProperty(document, 'visibilityState', {
      writable: true,
      value: originalVisibilityState,
    });
    // 清除所有事件监听器
    window.removeEventListener('visibilitychange', vi.fn());
  });

  test('should return "visible" when the document is visible', async () => {
    const state = document.visibilityState;
    expect(state).toBe('visible');
    const callback = vi.fn();
    const demo = componentVue(() => {
      return useRequest(() => getData(1, 1000), {
        manual: true,
        refreshOnWindowFocus: true,
        focusTimespan: 500,
        onSuccess: callback,
      });
    });
    await vi.advanceTimersByTimeAsync(1000);
    expect(callback).toHaveBeenCalledTimes(0);
    window.dispatchEvent(new Event('visibilitychange'));
    await vi.advanceTimersByTimeAsync(1000);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  test('should return "hidden" when the document is hidden', async () => {
    const callback = vi.fn();
    const demo = componentVue(() => {
      const instance = useRequest(() => getData(1, 0), {
        cancelOnWindowBlur: true,
        refreshOnWindowFocus: true,
        pollingInterval: 1000,
        onSuccess: callback,
        onFinally() {
          if (instance.pollingCount.value === 5) {
            instance.cancel();
          }
        },
      });
      return instance;
    });
    await vi.advanceTimersByTimeAsync(1000);
    expect(callback).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1000);
    expect(callback).toHaveBeenCalledTimes(2);
    // 模拟 visibilitychange 事件
    Object.defineProperty(document, 'visibilityState', {
      writable: true,
      value: 'hidden',
    });
    const visibilitychangeEvent = new Event('visibilitychange');
    window.dispatchEvent(visibilitychangeEvent);
    expect(document.visibilityState).toBe('hidden');
    await vi.advanceTimersByTimeAsync(1000);
    expect(callback).toHaveBeenCalledTimes(2);
    // 卸载组件
    demo.unmount();
  });
});
