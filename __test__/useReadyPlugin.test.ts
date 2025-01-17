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

describe.concurrent('useReadyPlugin', () => {
  test('ready with manual=false', async () => {
    const ready = ref(false);
    const { data, run } = useRequest(getData, {
      defaultParams: [1],
      ready,
    });
    expect(data.value).toBeUndefined();
    await vi.runAllTimersAsync();
    expect(data.value).toBeUndefined();
    ready.value = true;
    run();
    await vi.runAllTimersAsync();
    expect(data.value).toBe(1);
  });

  test('ready with manual=true', async () => {
    const ready = ref(false);
    const { data, run } = useRequest(getData, {
      manual: true,
      defaultParams: [1],
      ready,
    });
    run();
    await vi.runAllTimersAsync();
    expect(data.value).toBeUndefined();
    ready.value = true;
    run();
    await vi.runAllTimersAsync();
    expect(data.value).toBe(1);
  });
});
