import { ref, reactive, computed, defineComponent } from 'vue';
import type { ComputedRef } from 'vue';
import { expect, test, describe, vi, beforeAll } from 'vitest';
import useRequest from '../../lib';
import { mount } from './utils';

const getData = (value = 1): Promise<number> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(value);
    }, 1000);
  });
};

const getError = () => {
  return new Promise((_resolve, reject) => {
    setTimeout(() => {
      reject(new Error('Err'));
    }, 1000);
  });
};

const pages = reactive({
  page: 1,
});

const params: ComputedRef = computed(() => [
  {
    page: pages.page,
  },
]);
const getDataParams = (pages: { page: number }): Promise<any[]> => {
  return new Promise((resolve) => {
    if (pages.page >= 3) {
      resolve([]);
    } else {
      resolve(new Array(pages.page).fill(1));
    }
  });
};

beforeAll(() => {
  vi.useFakeTimers();
});

test('should be defined', () => {
  expect(useRequest).toBeDefined();
});

test('shoud mount', async () => {
  const demo = mount(
    defineComponent({
      template: '<div/>',
      setup() {
        const { data } = useRequest(getData);
        const test = ref(0);
        return {
          data,
          test,
        };
      },
    }),
  );
  expect(demo.data).toBeNull();
  await vi.runAllTimersAsync();
  expect(demo.test).toBe(0);
  expect(demo.data).toBe(1);
});

describe.concurrent('simple example with result', () => {
  test('loading and run', async () => {
    const { loading, run } = useRequest(getData, { manual: true });
    expect(loading.value).toBe(false);
    run();
    expect(loading.value).toBe(true);
    await vi.runAllTimersAsync();
    expect(loading.value).toBe(false);
  });

  test('data', async () => {
    const { data, mutate } = useRequest(getData);
    await vi.runAllTimersAsync();
    expect(data.value).toBe(1);
    mutate((data) => data + 1);
    await vi.runAllTimersAsync();
    expect(data.value).toBe(2);
  });

  test('cancel', async () => {
    const { data, run, cancel } = useRequest(getData, { manual: true, defaultParams: [5] });
    await vi.runAllTimersAsync();
    expect(data.value).toBe(null);
    run();
    await vi.runAllTimersAsync();
    expect(data.value).toBe(5);
    run(1);
    cancel();
    await vi.runAllTimersAsync();
    expect(data.value).toBe(5);
  });

  test('mutate', async () => {
    const { data, mutate } = useRequest(getData, { defaultParams: [5] });
    await vi.runAllTimersAsync();
    mutate((v) => v + 1);
    expect(data.value).toBe(6);
  });

  test('refresh', async () => {
    const { data, run, refresh } = useRequest(getData, { manual: true });
    run(2);
    await vi.runAllTimersAsync();
    expect(data.value).toBe(2);
    refresh();
    await vi.runAllTimersAsync();
    expect(data.value).toBe(2);
  });
});

describe.concurrent('life cycle', () => {
  test('onBefore', async () => {
    const callback = vi.fn();
    useRequest(getData, {
      onBefore: callback,
      defaultParams: [2],
    });
    await vi.runAllTimersAsync();
    expect(callback).toHaveBeenCalledWith([2]);
  });
  test('onSuccess', async () => {
    let data: any;
    const callback = vi.fn((v, p) => {
      data = v + 1;
    });
    useRequest(getData, {
      onSuccess: callback,
      defaultParams: [2],
    });
    await vi.runAllTimersAsync();
    expect(callback).toHaveBeenCalledWith(2, [2]);
    expect(data).toBe(3);
  });

  test('onError', async () => {
    const callback = vi.fn();
    useRequest(getError, {
      onError: callback,
    });
    await vi.runAllTimersAsync();
    expect(callback).toHaveBeenCalledWith(new Error('Err'), []);
  });

  test('onFinally', async () => {
    const callback = vi.fn();
    useRequest(getError, {
      onFinally: callback,
    });
    expect(callback).toHaveBeenCalledTimes(0);
    await vi.runAllTimersAsync();
    expect(callback).toHaveBeenCalledTimes(1);
  });
});

test('loadingDelay', async () => {
  const { loading } = useRequest(getData, {
    loadingDelay: 600,
  });
  expect(loading.value).toBe(false);
  await vi.advanceTimersByTimeAsync(500);
  expect(loading.value).toBe(false);
  await vi.advanceTimersByTimeAsync(200);
  expect(loading.value).toBe(true);
  await vi.advanceTimersByTimeAsync(400);
  expect(loading.value).toBe(false);
});

test('loadingDelay and delay out request time', async () => {
  const { loading } = useRequest(getData, {
    loadingDelay: 1200,
  });
  await vi.advanceTimersByTimeAsync(1100);
  expect(loading.value).toBe(false);
  await vi.advanceTimersByTimeAsync(200);
  expect(loading.value).toBe(false);
});

describe('data with params', () => {
  test('default params', async () => {
    const { data } = useRequest(getDataParams, {
      defaultParams: [pages],
    });
    await vi.runAllTimersAsync();
    expect(data.value.length).toBe(1);
  });

  test('depend params and refresh', async () => {
    const { data, refresh } = useRequest(getDataParams, {
      defaultParams: [pages],
      refreshDeps: [() => pages.page],
      refreshDepsParams: params,
    });
    pages.page = 2;
    await vi.runAllTimersAsync();
    expect(data.value.length).toBe(2);
    refresh();
    await vi.runAllTimersAsync();
    expect(data.value.length).toBe(2);
  });
});
