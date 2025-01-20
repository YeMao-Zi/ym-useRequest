import { expect, test, describe, vi, beforeAll } from 'vitest';
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
  test('refresh', async () => {
    const callback = vi.fn();

    const demo = componentVue(() => {
      return useRequest(() => getData(1, 1000), {
        refreshOnWindowFocus: true,
        focusTimespan: 500,
        onSuccess: callback,
      });
    });

    window.dispatchEvent(new Event('visibilitychange'));
    await vi.advanceTimersByTimeAsync(1000);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  // test('cancel', async () => {
  //   const callback = vi.fn();
  //   const handleVisibilityChange = vi.spyOn(document, 'visibilityState', 'get');
  //   const demo = componentVue(() => {
  //     const instance = useRequest(() => getData(1, 1000), {
  //       cancelOnWindowBlur: true,
  //       pollingInterval: 1000,
  //       onSuccess: callback,
  //       onFinally() {
  //         if (instance.pollingCount.value === 5) {
  //           instance.cancel();
  //         }
  //       },
  //     });

  //     return instance;
  //   });

  //   await vi.advanceTimersByTimeAsync(1000);
  //   expect(callback).toHaveBeenCalledTimes(1);
  //   window.dispatchEvent(new Event('visibilitychange'));
  //   await vi.advanceTimersByTimeAsync(1000);
  //   expect(window.document.visibilityState).toBe('hidden');
  //   expect(callback).toHaveBeenCalledTimes(1);
  //   await vi.advanceTimersByTimeAsync(1000);
  //   expect(callback).toHaveBeenCalledTimes(1);
  //   window.dispatchEvent(new Event('visibilitychange'));
  //   await vi.advanceTimersByTimeAsync(1000);
  //   expect(callback).toHaveBeenCalledTimes(2);
  // });
});
