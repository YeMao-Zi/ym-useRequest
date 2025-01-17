import { expect, test, describe, vi, beforeAll } from 'vitest';
import { useRequest } from '../lib';

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
  test('refresh', async () => {
    const callback = vi.fn();
    useRequest(() => getData(1, 1000), {
      refreshOnWindowFocus: true,
      focusTimespan: 500,
      onSuccess: callback,
    });
    window.dispatchEvent(new Event('visibilitychange'));
    await vi.advanceTimersByTimeAsync(1000);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  test('cancel', async () => {
    const callback = vi.fn();
    const { pollingCount, cancel } = useRequest(() => getData(1, 1000), {
      cancelOnWindowBlur: true,
      pollingInterval: 1000,
      onSuccess: callback,
      onFinally() {
        if (pollingCount.value === 5) {
          cancel();
        }
      },
    });
    await vi.advanceTimersByTimeAsync(1000);
    expect(callback).toHaveBeenCalledTimes(1);
    window.open();
    await vi.advanceTimersByTimeAsync(1000);
    expect(callback).toHaveBeenCalledTimes(1);
    window.dispatchEvent(new Event('visibilitychange'));
    await vi.advanceTimersByTimeAsync(1000);
    expect(callback).toHaveBeenCalledTimes(2);
  });
});
