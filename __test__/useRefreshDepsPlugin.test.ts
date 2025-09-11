import { expect, test, describe, vi, beforeAll } from 'vitest';
import { useRequest } from '../lib';
import { reactive, computed } from 'vue';
import type { ComputedRef } from 'vue';
import { componentVue } from './utils';

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
    const demo = componentVue(() => {
      return useRequest(getDataParams, {
        defaultData: [1, 1],
        defaultParams: [pages],
      });
    });

    expect(demo.data.length).toBe(2);
    await vi.runAllTimersAsync();
    expect(demo.data.length).toBe(1);
  });

  test('depend params and refresh', async () => {
    const demo = componentVue(() => {
      return useRequest(getDataParams, {
        defaultParams: [pages],
        refreshDeps: [() => pages.page],
        refreshDepsParams: params,
      });
    });

    await vi.runAllTimersAsync();
    expect(demo.data.length).toBe(1);
    pages.page = 0;
    await vi.runAllTimersAsync();
    expect(demo.data.length).toBe(1);
    demo.refresh();
    await vi.runAllTimersAsync();
    expect(demo.data.length).toBe(1);
  });

  test('depend paramsWithArray and refresh', async () => {
    pages.page = 1;

    const demo = componentVue(() => {
      return useRequest(getDataParams, {
        defaultParams: pages,
        refreshDeps: [() => pages.page],
        refreshDepsParams: paramsArray,
      });
    });

    await vi.runAllTimersAsync();
    expect(demo.data.length).toBe(1);
    pages.page = 0;
    await vi.runAllTimersAsync();
    expect(demo.data.length).toBe(1);
    demo.refresh();
    await vi.runAllTimersAsync();
    expect(demo.data.length).toBe(1);
  });

  test('depend params with function return', async () => {
    pages.page = 1;
    let capturedNewValue: any;
    let capturedOldValue: any;
    const demo = componentVue(() => {
      return useRequest(getDataParams, {
        defaultParams: pages,
        refreshDeps: () => pages.page,
        refreshDepsParams: (newValue, oldValue) => {
          capturedNewValue = newValue;
          capturedOldValue = oldValue;
          return {
            page: 2,
          };
        },
      });
    });

    await vi.runAllTimersAsync();
    expect(demo.data.length).toBe(1);
    pages.page = 0;
    await vi.runAllTimersAsync();
    expect(demo.data.length).toBe(2);
    expect(capturedNewValue).toBe(0);
    expect(capturedOldValue).toBe(1);
  });

  test('depend params with function void', async () => {
    pages.page = 1;

    const demo = componentVue(() => {
      return useRequest(getDataParams, {
        defaultParams: pages,
        refreshDeps: () => pages.page,
        refreshDepsParams: () => {},
      });
    });

    await vi.runAllTimersAsync();
    expect(demo.data.length).toBe(1);
    pages.page = 0;
    await vi.runAllTimersAsync();
    expect(demo.data.length).toBe(1);
    demo.refresh();
    await vi.runAllTimersAsync();
    expect(demo.data.length).toBe(0);
  });

  test('depend params without refreshDepsParams', async () => {
    const demo = componentVue(() => {
      return useRequest(getDataParams, {
        refreshDeps: [() => pages.page],
      });
    });

    demo.run({ page: 2 });
    await vi.runAllTimersAsync();
    expect(demo.data.length).toBe(2);
    pages.page = 1;
    await vi.runAllTimersAsync();
    expect(demo.data.length).toBe(2);
  });
});
