import { expect, test, describe, vi, beforeAll } from 'vitest';
import { useRequest } from '../lib';
import { reactive, computed } from 'vue';
import type { ComputedRef } from 'vue';

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

describe('data with params', () => {
  test('default params', async () => {
    const { data } = useRequest(getDataParams, {
      defaultData: [1, 1],
      defaultParams: [pages],
    });
    expect(data.value.length).toBe(2);
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

  test('depend params with function return', async () => {
    pages.page = 1;
    const { data, refresh } = useRequest(getDataParams, {
      defaultParams: pages,
      refreshDeps: () => pages.page,
      refreshDepsParams: () => {
        return {
          page: 2,
        };
      },
    });
    await vi.runAllTimersAsync();
    expect(data.value.length).toBe(1);
    pages.page = 0;
    await vi.runAllTimersAsync();
    expect(data.value.length).toBe(2);
  });

  test('depend params with function void', async () => {
    pages.page = 1;
    const { data, refresh } = useRequest(getDataParams, {
      defaultParams: pages,
      refreshDeps: () => pages.page,
      refreshDepsParams: () => {},
    });
    await vi.runAllTimersAsync();
    expect(data.value.length).toBe(1);
    pages.page = 0;
    await vi.runAllTimersAsync();
    expect(data.value.length).toBe(1);
    refresh();
    await vi.runAllTimersAsync();
    expect(data.value.length).toBe(0);
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