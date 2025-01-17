import { ref, defineComponent } from 'vue';
import { expect, test, describe, vi, beforeAll } from 'vitest';
import { useRequest } from '../lib';
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

describe.concurrent('simple example with result', async () => {
  test('loading and run', async () => {
    const { loading, run, runAsync, status } = useRequest(getData, { manual: true });
    expect(loading.value).toBe(false);
    expect(status.value).toBe('pending');
    run();
    expect(loading.value).toBe(true);
    await vi.advanceTimersByTimeAsync(1000);
    expect(status.value).toBe('settled');
    expect(loading.value).toBe(false);
    const res = await runAsync(5);
    expect(res).toBe(5);
  });

  test('data', async () => {
    const { data, mutate } = useRequest(getData);
    await vi.runAllTimersAsync();
    expect(data.value).toBe(1);
  });

  test('data with race cancel', async () => {
    const { data, run } = useRequest(getData, {
      manual: true,
    });
    run(2, 3000);
    run(3, 1000);
    await vi.runAllTimersAsync();
    expect(data.value).toBe(3);
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

  test('requestTick', async () => {
    const { data, run: run1, requestTick } = useRequest(() => getData(3, 1000), { manual: true });
    const { run: run2 } = useRequest(getData, { manual: true });
    const runAll = async () => {
      run1();
      run2();
      expect(data.value).toBe(undefined);
      await requestTick(() => {
        expect(data.value).toBe(3);
      });
      expect(data.value).toBe(3);
    };

    const runEmpty = async () => {
      let value = 1;
      await requestTick();
      value = 2;
      expect(value).toBe(2);
    };
    runAll();
    runEmpty();
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
  test('onRequest', async () => {
    const callbackRequest = vi.fn();
    const callbackSuccess = vi.fn();
    const { run } = useRequest(getData, {
      manual: true,
      onRequest: callbackRequest,
      onSuccess: callbackSuccess,
    });
    run(1);
    run(2);
    await vi.runAllTimersAsync();
    expect(callbackRequest).toHaveBeenCalledTimes(2);
    expect(callbackSuccess).toHaveBeenCalledTimes(1);
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

  test('onSuccessReturn', async () => {
    const { data } = useRequest(getData, {
      onSuccess(data) {
        return data;
      },
      defaultParams: [1],
    });
    await vi.runAllTimersAsync();
    expect(data.value).toBe(1);
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
