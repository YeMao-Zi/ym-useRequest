import { reactive, computed } from 'vue';
import type { ComputedRef } from 'vue';
import { expect, test, it, describe, vi } from 'vitest';
import useRequest from '../../lib';

const getData = (): Promise<number> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(1);
    }, 1000);
  });
};

describe.concurrent('noParamsTest', () => {
  test('loadingAndRun', async () => {
    const { loading, run } = useRequest(getData, { manual: true });
    expect(loading.value).toBe(false);
    run();
    expect(loading.value).toBe(true);
    await getData();
    expect(loading.value).toBe(false);
  });

  test('data', async () => {
    const { data } = useRequest(getData);
    await getData();
    expect(data.value).toBe(1);
  });

  it('success', async () => {
    let _data;
    useRequest(getData, {
      onSuccess(res) {
        _data = res;
      },
    });
    await getData();
    expect(_data).toBe(1);
  });
});

const getDataParams = (pages: { page: number }): Promise<any[]> => {
  return new Promise((resolve) => {
    if (pages.page >= 3) {
      resolve([]);
    } else {
      resolve(new Array(pages.page).fill(1));
    }
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

describe('paramsTest', () => {
  test('defaultParams', async () => {
    const { data } = useRequest(getDataParams, {
      defaultParams: [pages],
    });
    vi.useFakeTimers();
    await vi.runAllTimersAsync();
    expect(data.value.length).toBe(1);
  });

  test('paramsChange', async () => {
    const { data } = useRequest(getDataParams, {
      defaultParams: [pages],
      refreshDeps: [() => pages.page],
      refreshDepsParams: params,
    });
    vi.useFakeTimers();
    pages.page = 2;
    await vi.runAllTimersAsync();
    expect(data.value.length).toBe(2);
  });
});
