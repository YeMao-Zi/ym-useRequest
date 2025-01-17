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

describe('useThrottlePlugin', () => {
  test('throttle with throttleInterval', async () => {
    const callback = vi.fn();
    const { run } = useRequest(
      () => {
        callback();
        return getData();
      },
      {
        manual: true,
        throttleWait: 100,
      },
    );
    run();
    await vi.advanceTimersByTimeAsync(50);
    run();
    run();
    run();
    await vi.advanceTimersByTimeAsync(50);
    expect(callback).toHaveBeenCalledTimes(2);
  });

  test('throttle with throttleOptions', async () => {
    const callback = vi.fn();
    const { run } = useRequest(
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

    run();
    expect(callback).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(50);
    run();
    run();
    run();
    await vi.advanceTimersByTimeAsync(50);
    expect(callback).toHaveBeenCalledTimes(1);
    run();
    expect(callback).toHaveBeenCalledTimes(2);
  });

  test('throttle with throttleInterval change', async () => {
    const callback = vi.fn();
    const throttleWaitRef = ref(100);
    const { run } = useRequest(
      () => {
        callback();
        return getData();
      },
      {
        manual: true,
        throttleWait: throttleWaitRef,
      },
    );
    run();
    run();
    expect(callback).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(50);
    throttleWaitRef.value = 150;
    run();
    run();
    expect(callback).toHaveBeenCalledTimes(1);
    run();
    await vi.advanceTimersByTimeAsync(100);
    run();
    expect(callback).toHaveBeenCalledTimes(2);
  });

  test('throttle with cancel', async () => {
    const callback = vi.fn();
    const { run, cancel } = useRequest(
      () => {
        callback();
        return getData();
      },
      {
        manual: true,
        throttleWait: 200,
      },
    );
    run();
    await vi.advanceTimersByTimeAsync(50);
    expect(callback).toHaveBeenCalledTimes(1);
    run();
    await vi.advanceTimersByTimeAsync(50);
    expect(callback).toHaveBeenCalledTimes(1);
    cancel();
    run();
    await vi.advanceTimersByTimeAsync(50);
    expect(callback).toHaveBeenCalledTimes(2);
  });
});
