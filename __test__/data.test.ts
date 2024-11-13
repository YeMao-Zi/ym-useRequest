import { ref, reactive, computed, defineComponent } from 'vue';
import type { ComputedRef } from 'vue';
import { expect, test, describe, vi, beforeAll } from 'vitest';
import { useRequest, clearCache } from '../lib';
import { mount } from './utils';

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

const pages = reactive({
  page: 1,
});

const paramsArray: ComputedRef = computed(() => [
  {
    page: pages.page + 1,
  },
]);
const params: ComputedRef = computed(() => ({
  page: pages.page + 1,
}));

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
  expect(demo.test).toBe(0);
  expect(demo.data).toBeUndefined();
  await vi.runAllTimersAsync();
  expect(demo.data).toBe(1);
});

test('when unMount request cancel', async () => {
  const demo = mount(
    defineComponent({
      template: '<div/>',
      setup() {
        const { data, run } = useRequest(getData);
        const test = ref(0);
        return {
          data,
          test,
          run,
        };
      },
    }),
  );
  setTimeout(() => {
    demo.unmount();
  }, 3000);

  await vi.advanceTimersByTimeAsync(2500);
  demo.run(4);
  await vi.advanceTimersByTimeAsync(2000);
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
  });

  test('defaultParams', async () => {
    const { data } = useRequest(getData, { defaultParams: 5 });
    await vi.runAllTimersAsync();
    expect(data.value).toBe(5);
  });

  test('defaultParamsWithArray', async () => {
    const { data } = useRequest(getData, { defaultParams: [5] });
    await vi.runAllTimersAsync();
    expect(data.value).toBe(5);
  });

  test('cancel', async () => {
    const { data, run, cancel } = useRequest(getData, { manual: true, defaultParams: [5] });
    await vi.runAllTimersAsync();
    expect(data.value).toBe(undefined);
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
    mutate(5);
    expect(data.value).toBe(5);
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

  test('onCancel', async () => {
    let data: any;
    const callback = vi.fn(() => {
      data = 1;
    });
    const { cancel } = useRequest(getData, {
      onCancel: callback,
      defaultParams: [2],
    });
    await vi.advanceTimersByTimeAsync(100);
    cancel();
    expect(callback).toHaveBeenCalledTimes(1);
    expect(data).toBe(1);
  });
});

describe.concurrent('loadingDelay', () => {
  test('loadingDelay normal', async () => {
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
    await vi.runAllTimersAsync();
    expect(data.value.length).toBe(1);
    pages.page = 0;
    await vi.runAllTimersAsync();
    expect(data.value.length).toBe(1);
    refresh();
    await vi.runAllTimersAsync();
    expect(data.value.length).toBe(1);
  });

  test('depend paramsWithArray and refresh', async () => {
    pages.page = 1;
    const { data, refresh } = useRequest(getDataParams, {
      defaultParams: pages,
      refreshDeps: [() => pages.page],
      refreshDepsParams: paramsArray,
    });
    await vi.runAllTimersAsync();
    expect(data.value.length).toBe(1);
    pages.page = 0;
    await vi.runAllTimersAsync();
    expect(data.value.length).toBe(1);
    refresh();
    await vi.runAllTimersAsync();
    expect(data.value.length).toBe(1);
  });

  test('depend params without refreshDepsParams', async () => {
    const { data, run } = useRequest(getDataParams, {
      refreshDeps: [() => pages.page],
    });
    run({ page: 2 });
    await vi.runAllTimersAsync();
    expect(data.value.length).toBe(2);
    pages.page = 1;
    await vi.runAllTimersAsync();
    expect(data.value.length).toBe(2);
  });
});

describe('polling and error retry', () => {
  test('polling in onSuccess', async () => {
    let count = 0;
    const { loading, cancel } = useRequest(getData, {
      pollingInterval: 1000,
      onBefore() {
        count++;
      },
      onSuccess() {
        if (count === 2) {
          cancel();
        }
      },
    });
    expect(loading.value).toBe(true);
    expect(count).toBe(1);
    await vi.advanceTimersByTimeAsync(1500);
    expect(loading.value).toBe(false);
    expect(count).toBe(1);
    await vi.advanceTimersByTimeAsync(1000);
    expect(count).toBe(2);
    expect(loading.value).toBe(true);
    await vi.advanceTimersByTimeAsync(1500);
    expect(loading.value).toBe(false);
    expect(count).toBe(2);
  });

  test('polling in onFinally', async () => {
    let count = 0;
    const { loading, cancel } = useRequest(getData, {
      pollingInterval: 1000,
      onBefore() {
        count++;
      },
      onFinally() {
        if (count === 2) {
          cancel();
        }
      },
    });
    expect(loading.value).toBe(true);
    expect(count).toBe(1);
    await vi.advanceTimersByTimeAsync(1500);
    expect(loading.value).toBe(false);
    expect(count).toBe(1);
    await vi.advanceTimersByTimeAsync(1000);
    expect(count).toBe(2);
    expect(loading.value).toBe(true);
    await vi.advanceTimersByTimeAsync(1500);
    expect(loading.value).toBe(false);
    expect(count).toBe(2);
  });

  test('polling in onError', async () => {
    let count = 0;
    const { loading, cancel } = useRequest(getError, {
      pollingInterval: 1000,
      onBefore() {
        count++;
      },
      onError() {
        if (count === 2) {
          cancel();
        }
      },
    });
    expect(loading.value).toBe(true);
    expect(count).toBe(1);
    await vi.advanceTimersByTimeAsync(1500);
    expect(loading.value).toBe(false);
    expect(count).toBe(1);
    await vi.advanceTimersByTimeAsync(1000);
    expect(count).toBe(2);
    expect(loading.value).toBe(true);
    await vi.advanceTimersByTimeAsync(1500);
    expect(loading.value).toBe(false);
    expect(count).toBe(2);
  });

  test('error retry', async () => {
    const callback = vi.fn();
    useRequest(getError, {
      pollingInterval: 1000,
      pollingErrorRetryCount: 3,
      onFinally: callback,
    });
    expect(callback).toHaveBeenCalledTimes(0);
    await vi.advanceTimersByTimeAsync(2000);
    expect(callback).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(2000);
    expect(callback).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(2000);
    expect(callback).toHaveBeenCalledTimes(3);
    await vi.advanceTimersByTimeAsync(2000);
    expect(callback).toHaveBeenCalledTimes(3);
  });

  test('pollingCount', async () => {
    const { cancel, pollingCount } = useRequest(getData, {
      pollingInterval: 100,
      onSuccess() {
        if (pollingCount.value === 3) {
          cancel();
        }
      },
    });
    expect(pollingCount.value).toBe(0);
    await vi.advanceTimersByTimeAsync(1100);
    expect(pollingCount.value).toBe(1);
    await vi.advanceTimersByTimeAsync(1100);
    expect(pollingCount.value).toBe(2);
    await vi.advanceTimersByTimeAsync(1100);
    expect(pollingCount.value).toBe(3);
    await vi.advanceTimersByTimeAsync(100);
    expect(pollingCount.value).toBe(3);
  });
});

describe.concurrent('ready', () => {
  test('ready with manual=false', async () => {
    const ready = ref(false);
    const { data } = useRequest(getData, {
      defaultParams: [1],
      ready,
    });
    expect(data.value).toBeUndefined();
    await vi.runAllTimersAsync();
    expect(data.value).toBeUndefined();
    ready.value = true;
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

describe('debounce', () => {
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

describe('throttle', () => {
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

describe('cache', () => {
  test('cacheTime', async () => {
    const { data, run } = useRequest(getData, {
      manual: true,
      cacheTime: 10000,
      staleTime: -1,
      cacheKey: () => 'test',
    });
    run(1);
    await vi.advanceTimersByTimeAsync(1000);
    expect(data.value).toBe(1);
    run(2);
    await vi.advanceTimersByTimeAsync(1000);
    expect(data.value).toBe(1);
    run(2);
    await vi.advanceTimersByTimeAsync(3000);
    expect(data.value).toBe(1);
    await vi.advanceTimersByTimeAsync(6000);
    run(2);
    await vi.advanceTimersByTimeAsync(1000);
    expect(data.value).toBe(2);
  });

  test('staleTime', async () => {
    const { data, run } = useRequest(getData, {
      manual: true,
      cacheTime: 10000,
      staleTime: 5000,
      cacheKey: 'test2',
    });
    run(1, 0);
    await vi.advanceTimersByTimeAsync(10);
    expect(data.value).toBe(1);
    run(2, 0);
    await vi.advanceTimersByTimeAsync(10);
    expect(data.value).toBe(1);
    await vi.advanceTimersByTimeAsync(5000);
    run(2, 0);
    await vi.advanceTimersByTimeAsync(10);
    expect(data.value).toBe(2);
  });

  test('clearCache with all', async () => {
    const { data, run } = useRequest(getData, {
      manual: true,
      cacheTime: 10000,
      staleTime: -1,
      cacheKey: 'test3',
    });
    run(1, 0);
    await vi.advanceTimersByTimeAsync(10);
    expect(data.value).toBe(1);
    run(2, 0);
    await vi.advanceTimersByTimeAsync(10);
    expect(data.value).toBe(1);
    clearCache();
    run(2, 0);
    await vi.advanceTimersByTimeAsync(10);
    expect(data.value).toBe(2);
  });

  test('clearCache with key', async () => {
    const { data, run } = useRequest(getData, {
      manual: true,
      cacheTime: 10000,
      staleTime: -1,
      cacheKey: 'test4',
    });
    run(1, 0);
    await vi.advanceTimersByTimeAsync(10);
    expect(data.value).toBe(1);
    run(2, 0);
    await vi.advanceTimersByTimeAsync(10);
    expect(data.value).toBe(1);
    clearCache(['test4']);
    run(2, 0);
    await vi.advanceTimersByTimeAsync(10);
    expect(data.value).toBe(2);
  });

  test('setCache and getCache', async () => {
    const { data, run } = useRequest(getData, {
      manual: true,
      cacheTime: 10000,
      staleTime: -1,
      cacheKey: 'test5',
      setCache(cacheKey, data) {
        localStorage.setItem(cacheKey, JSON.stringify(data));
      },
      getCache(cacheKey) {
        return JSON.parse(localStorage.getItem(cacheKey) || 'null');
      },
    });
    run(1, 0);
    await vi.advanceTimersByTimeAsync(10);
    expect(data.value).toBe(1);
    run(2, 0);
    await vi.advanceTimersByTimeAsync(10);
    expect(data.value).toBe(1);
    localStorage.clear();
    run(2, 0);
    await vi.advanceTimersByTimeAsync(10);
    expect(data.value).toBe(2);
  });

  test('cache with mutate', async () => {
    const { data, run, mutate } = useRequest(getData, {
      manual: true,
      cacheTime: 10000,
      staleTime: -1,
      cacheKey: 'test4',
    });
    run(1, 0);
    await vi.advanceTimersByTimeAsync(10);
    expect(data.value).toBe(2);
    await vi.advanceTimersByTimeAsync(10000);
    run(1, 0);
    await vi.advanceTimersByTimeAsync(10);
    expect(data.value).toBe(1);
    mutate(3);
    expect(data.value).toBe(3);
  });
});
