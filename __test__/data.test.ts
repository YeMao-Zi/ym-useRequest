import { ref } from 'vue';
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

const getError = () => {
  return new Promise((_resolve, reject) => {
    setTimeout(() => {
      reject('Err');
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
  const demo = componentVue(() => {
    const { data } = useRequest(getData);
    const test = ref(0);
    return {
      data,
      test,
    };
  });
  expect(demo.test).toBe(0);
  expect(demo.data).toBeUndefined();
  await vi.runAllTimersAsync();
  expect(demo.data).toBe(1);
});

test('when unMount request cancel', async () => {
  const demo = componentVue(() => {
    const { data, run } = useRequest(getData);
    return {
      data,
      run,
    };
  });

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
    const demo = componentVue(() => {
      return useRequest(getData, { manual: true });
    });

    expect(demo.loading).toBe(false);
    expect(demo.status).toBe(undefined);
    demo.run();
    expect(demo.loading).toBe(true);
    expect(demo.status).toBe('pending');
    await vi.advanceTimersByTimeAsync(1000);
    expect(demo.status).toBe('settled');
    expect(demo.loading).toBe(false);
    const res = await demo.runAsync(5);
    expect(res).toBe(5);
  });

  test('race cancelled', async () => {
    const demo = componentVue(() => {
      return useRequest(getData);
    });
    const result1 = await demo.runAsync(1, 1000);
    const result2 = await demo.runAsync(2, 500);
    const result3 = await demo.runAsync(3, 800);

    await vi.advanceTimersByTimeAsync(1000);
    expect(demo.data).toBe(3);
    expect(result1).toBe(1);
    expect(result2).toBe(2);
    expect(result3).toBe(3);
  });

  test('data', async () => {
    const demo = componentVue(() => {
      return useRequest(getData);
    });

    await vi.runAllTimersAsync();
    expect(demo.data).toBe(1);
  });

  test('defaultDataWithRef', async () => {
    const demo = componentVue(() => {
      return useRequest(getData, { defaultData: ref(5), manual: true });
    });
    expect(demo.data).toBe(5);
  });

  test('data with race cancel', async () => {
    const demo = componentVue(() => {
      return useRequest(getData, {
        manual: true,
      });
    });
    demo.run(2, 3000);
    demo.run(3, 1000);
    await vi.runAllTimersAsync();
    expect(demo.data).toBe(3);
  });

  test('onError', async () => {
    const callback = vi.fn();
    const demo = componentVue(() => {
      return useRequest(getError, {
        onError: callback,
      });
    });
    await vi.runAllTimersAsync();
    expect(callback).toHaveBeenCalledWith('Err', []);
    // 确保错误状态被正确设置
    expect(demo.error).toBe('Err');
  });

  test('defaultParams', async () => {
    const demo = componentVue(() => {
      return useRequest(getData, { defaultParams: 5 });
    });
    await vi.runAllTimersAsync();
    expect(demo.data).toBe(5);
  });

  test('defaultParamsWithArray', async () => {
    const demo = componentVue(() => {
      return useRequest(getData, { defaultParams: [5] });
    });
    await vi.runAllTimersAsync();
    expect(demo.data).toBe(5);
  });

  test('defaultParams with function', async () => {
    const demo = componentVue(() => {
      return useRequest(getData, {
        defaultParams: () => [10],
      });
    });
    await vi.runAllTimersAsync();
    expect(demo.data).toBe(10);
  });

  test('runAsync with defaultParams function and no args', async () => {
    const demo = componentVue(() => {
      return useRequest(getData, {
        manual: true,
        defaultParams: () => [20],
      });
    });
    expect(demo.data).toBeUndefined();

    const result = await demo.runAsync();
    expect(result).toBe(20);
    expect(demo.data).toBe(20);
  });

  test('runAsync with defaultParams function and args', async () => {
    const demo = componentVue(() => {
      return useRequest(getData, {
        manual: true,
        defaultParams: () => [30],
      });
    });

    const result = await demo.runAsync(40);
    expect(result).toBe(40);
    expect(demo.data).toBe(40);
  });

  test('cancel', async () => {
    let count = 0;
    const demo = componentVue(() => {
      return useRequest(
        (...args) => {
          count += 1;
          return getData(...args);
        },
        { manual: true, defaultParams: [5] },
      );
    });
    await vi.runAllTimersAsync();
    expect(demo.data).toBe(undefined);
    expect(count).toBe(0);
    demo.run();
    await vi.runAllTimersAsync();
    expect(count).toBe(1);
    expect(demo.data).toBe(5);
    demo.run(1);
    demo.cancel();
    await vi.runAllTimersAsync();
    expect(count).toBe(2);
    expect(demo.data).toBe(5);
  });

  test('mutate', async () => {
    const demo = componentVue(() => {
      return useRequest(getData, { defaultParams: [5] });
    });
    await vi.runAllTimersAsync();
    demo.mutate(5);
    expect(demo.data).toBe(5);
    demo.mutate((v: number) => v + 1);
    expect(demo.data).toBe(6);
  });

  test('refresh', async () => {
    const demo = componentVue(() => {
      return useRequest(getData, { manual: true });
    });
    demo.run(2);
    await vi.runAllTimersAsync();
    expect(demo.data).toBe(2);
    demo.refresh();
    await vi.runAllTimersAsync();
    expect(demo.data).toBe(2);
  });

  test('requestTick', async () => {
    const demo = componentVue(() => {
      const { data: data1, run: run1, requestTick } = useRequest(() => getData(3, 1000), { manual: true });
      const { data: data2, run: run2 } = useRequest(() => getData(1, 2000), { manual: true });
      return {
        data1,
        data2,
        run1,
        requestTick,
        run2,
      };
    });

    const runAll = async () => {
      demo.run1();
      demo.run2();
      expect(demo.data1).toBe(undefined);
      await demo.requestTick(() => {
        expect(demo.data1).toBe(3);
        expect(demo.data2).toBe(undefined);
      });
      expect(demo.data1).toBe(3);
    };

    const runEmpty = async () => {
      let value = 1;
      await demo.requestTick();
      value = 2;
      expect(value).toBe(2);
    };
    runAll();
    runEmpty();
  });

  // 添加测试 requestTick 在非 pending 状态下的调用
  test('requestTick when not pending', async () => {
    const demo = componentVue(() => {
      const { requestTick } = useRequest(getData, { manual: true });
      return { requestTick };
    });

    // 在没有运行任何请求的情况下调用 requestTick
    let callbackCalled = false;
    await demo.requestTick(() => {
      callbackCalled = true;
    });

    expect(callbackCalled).toBe(true);
  });

  test('requestTick with call context', async () => {
    const demo = componentVue(() => {
      const { run, requestTick } = useRequest(getData, {
        manual: true,
      });

      return {
        run,
        requestTick,
      };
    });
    demo.run(1);

    const res1 = await demo.requestTick((res) => {
      expect(res).toStrictEqual({ params: [1], data: 1 });
    });

    expect(res1).toStrictEqual({ params: [1], data: 1 });
    demo.run(2);
    demo.requestTick((res) => {
      expect(res).toStrictEqual({ params: [2], data: 2 });
    });
  });
});

describe.concurrent('life cycle', () => {
  test('onBefore', async () => {
    const callback = vi.fn();
    componentVue(() => {
      useRequest(getData, {
        onBefore: callback,
        defaultParams: [2],
      });
      return {};
    });
    await vi.runAllTimersAsync();
    expect(callback).toHaveBeenCalledWith([2]);
  });

  test('onRequest', async () => {
    const callbackRequest = vi.fn();
    const callbackSuccess = vi.fn();

    const { run } = componentVue(() => {
      return useRequest(getData, {
        manual: true,
        onRequest: () => {
          callbackRequest();
        },
        onSuccess: callbackSuccess,
      });
    });

    run(1);
    run(2);
    await vi.runAllTimersAsync();
    expect(callbackRequest).toHaveBeenCalledTimes(2);
    expect(callbackSuccess).toHaveBeenCalledTimes(1);
  });

  // 添加测试用例：验证 abort 参数
  test('onRequest with error', async () => {
    const callbackError = vi.fn();

    const { run } = componentVue(() => {
      return useRequest(getError, {
        manual: true,
        onRequest: ({ abort }) => {
          callbackError(abort);
        },
      });
    });

    run(2, 1000);
    await vi.runAllTimersAsync();
    // 验证回调被调用两次
    expect(callbackError).toHaveBeenCalledTimes(1);
  });

  test('onSuccess', async () => {
    let data: any;
    const callback = vi.fn((v, p) => {
      data = v + 1;
    });
    componentVue(() => {
      return useRequest(getData, {
        onSuccess: callback,
        defaultParams: [2],
      });
    });
    await vi.runAllTimersAsync();
    expect(callback).toHaveBeenCalledWith(2, [2]);
    expect(data).toBe(3);
  });

  test('onSuccessReturn', async () => {
    const demo = componentVue(() => {
      return useRequest(getData, {
        onSuccess(data) {
          return data;
        },
        defaultParams: [1],
      });
    });
    await vi.runAllTimersAsync();
    expect(demo.data).toBe(1);
  });

  test('onError', async () => {
    const callback = vi.fn();
    componentVue(() => {
      return useRequest(getError, {
        onError: callback,
      });
    });
    await vi.runAllTimersAsync();
    expect(callback).toHaveBeenCalledWith('Err', []);
  });

  test('onFinally', async () => {
    const callback = vi.fn();

    componentVue(() => {
      return useRequest(getError, {
        onFinally: callback,
        onError() {},
      });
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
    const { cancel } = componentVue(() => {
      return useRequest(getData, {
        onCancel: callback,
        defaultParams: [2],
      });
    });
    await vi.advanceTimersByTimeAsync(100);
    cancel();
    expect(callback).toHaveBeenCalledTimes(1);
    expect(data).toBe(1);
  });
});
