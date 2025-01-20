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

describe('useThrottlePlugin', () => {
  test('throttle with throttleInterval', async () => {
    const callback = vi.fn();

    const demo = componentVue(() => {
      return useRequest(
        () => {
          callback();
          return getData();
        },
        {
          manual: true,
          throttleWait: 100,
        },
      );
    });

    demo.run();
    await vi.advanceTimersByTimeAsync(50);
    demo.run();
    demo.run();
    demo.run();
    await vi.advanceTimersByTimeAsync(50);
    expect(callback).toHaveBeenCalledTimes(2);
  });

  test('throttle with throttleOptions', async () => {
    const callback = vi.fn();

    const demo = componentVue(() => {
      return useRequest(
        () => {
          callback();
          return getData();
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

    demo.run();
    expect(callback).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(50);
    demo.run();
    demo.run();
    demo.run();
    await vi.advanceTimersByTimeAsync(50);
    expect(callback).toHaveBeenCalledTimes(1);
    demo.run();
    expect(callback).toHaveBeenCalledTimes(2);
  });

  test('throttle with throttleInterval change', async () => {
    const callback = vi.fn();
    const throttleWaitRef = ref(100);

    const demo = componentVue(() => {
      return useRequest(
        () => {
          callback();
          return getData();
        },
        {
          manual: true,
          throttleWait: throttleWaitRef,
        },
      );
    });

    demo.run();
    demo.run();
    expect(callback).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(50);
    throttleWaitRef.value = 150;
    demo.run();
    demo.run();
    expect(callback).toHaveBeenCalledTimes(1);
    demo.run();
    await vi.advanceTimersByTimeAsync(100);
    demo.run();
    expect(callback).toHaveBeenCalledTimes(2);
  });

  test('throttle with cancel', async () => {
    const callback = vi.fn();

    const demo = componentVue(() => {
      return useRequest(
        () => {
          callback();
          return getData();
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
