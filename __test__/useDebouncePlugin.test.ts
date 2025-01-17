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

describe('useDebouncePlugin', () => {
  test('debounce with debounceInterval', async () => {
    const callback = vi.fn();
    const { run, cancel } = useRequest(
      () => {
        callback();
        return getData();
      },
      {
        manual: true,
        debounceWait: 100,
      },
    );
    for (let index = 0; index < 100; index++) {
      run();
      await vi.advanceTimersByTimeAsync(50);
    }
    expect(callback).toHaveBeenCalledTimes(0);
    await vi.advanceTimersByTimeAsync(50);
    expect(callback).toHaveBeenCalledTimes(1);

    for (let index = 0; index < 100; index++) {
      run();
      await vi.advanceTimersByTimeAsync(50);
    }
    cancel();
    expect(callback).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(50);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  test('debounce with debounceOptions', async () => {
    const callback = vi.fn();
    const { run } = useRequest(
      () => {
        callback();
        return getData();
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

    for (let index = 0; index < 100; index++) {
      run();
      await vi.advanceTimersByTimeAsync(50);
    }
    expect(callback).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(100);
    expect(callback).toHaveBeenCalledTimes(1);

    for (let index = 0; index < 100; index++) {
      run();
      await vi.advanceTimersByTimeAsync(50);
    }
    expect(callback).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(100);
    expect(callback).toHaveBeenCalledTimes(2);
  });

  test('debounce with debounceInterval change', async () => {
    const callback = vi.fn();
    const debounceWaitRef = ref(100);
    const { run } = useRequest(
      () => {
        callback();
        return getData();
      },
      {
        manual: true,
        debounceWait: debounceWaitRef,
      },
    );
    run();
    expect(callback).toHaveBeenCalledTimes(0);
    await vi.advanceTimersByTimeAsync(50);
    expect(callback).toHaveBeenCalledTimes(0);
    debounceWaitRef.value = 150;
    await vi.advanceTimersByTimeAsync(50);
    expect(callback).toHaveBeenCalledTimes(0);
    run();
    await vi.advanceTimersByTimeAsync(150);
    expect(callback).toHaveBeenCalledTimes(1);
  });
});
