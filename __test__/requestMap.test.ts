import { expect, test, describe, vi, beforeAll, beforeEach } from 'vitest';
import { useRequest, getRequest } from '../lib';
import { removeRequest } from '../lib/requestMap';
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

describe('getRequest', () => {
  test('should get the request instance by id', async () => {
    const demo = componentVue(() => {
      return useRequest(getData, {
        id: 'test-request',
        manual: true,
      });
    });

    const retrievedInstance = getRequest('test-request');
    expect(retrievedInstance).toBeDefined();
    expect(retrievedInstance.data.value).toBe(undefined);

    demo.run(42);
    await vi.advanceTimersByTimeAsync(1000);

    expect(demo.data).toBe(42);
    expect(retrievedInstance.data.value).toBe(42);
  });

  test('should return undefined for non-existent id', () => {
    const retrievedInstance = getRequest('non-existent-id');
    expect(retrievedInstance).toBeUndefined();
  });

  test('should be able to execute methods on retrieved instance', async () => {
    componentVue(() => {
      return useRequest(getData, {
        id: 'executable-request',
        manual: true,
      });
    });

    const retrievedInstance = getRequest('executable-request');
    expect(retrievedInstance).toBeDefined();

    retrievedInstance?.run(100);
    await vi.advanceTimersByTimeAsync(1000);

    expect(retrievedInstance.data.value).toBe(100);
  });

  test('should share the same data between original and retrieved instances', async () => {
    const demo = componentVue(() => {
      return useRequest(getData, {
        id: 'shared-instance',
        manual: true,
      });
    });

    const retrievedInstance = getRequest('shared-instance');

    expect(demo.data).toBe(retrievedInstance.data.value);

    demo.run(200);
    await vi.advanceTimersByTimeAsync(1000);

    expect(demo.data).toBe(200);
    expect(retrievedInstance.data.value).toBe(200);

    // 修改数据，两个实例应该都能看到变化
    retrievedInstance?.mutate(300);
    expect(demo.data).toBe(300);
    expect(retrievedInstance.data.value).toBe(300);
  });

  // 新增测试用例：测试没有id的实例无法通过getRequest获取
  test('should not retrieve instance without id', async () => {
    componentVue(() => {
      return useRequest(getData, {
        manual: true,
      });
    });

    // 由于没有设置id，所以无法通过getRequest获取
    const retrievedInstance = getRequest('undefined-instance');
    expect(retrievedInstance).toBeUndefined();
  });

  // 新增测试用例：测试removeRequest功能
  test('should remove request instance', async () => {
    componentVue(() => {
      return useRequest(getData, {
        id: 'removable-instance',
        manual: true,
      });
    });

    // 确保实例存在
    const instanceBeforeRemoval = getRequest('removable-instance');
    expect(instanceBeforeRemoval).toBeDefined();

    // 从requestMap中移除实例
    const removalResult = removeRequest('removable-instance');
    expect(removalResult).toBe(true);

    // 确认实例已被移除
    const instanceAfterRemoval = getRequest('removable-instance');
    expect(instanceAfterRemoval).toBeUndefined();

    // 再次尝试移除应该返回false
    const secondRemovalResult = removeRequest('removable-instance');
    expect(secondRemovalResult).toBe(false);
  });

  // 新增测试用例：测试多个实例可以正确区分
  test('should distinguish between different instances by id', async () => {
    componentVue(() => {
      return useRequest(getData, {
        id: 'instance-1',
        manual: true,
      });
    });

    componentVue(() => {
      return useRequest(getData, {
        id: 'instance-2',
        manual: true,
      });
    });

    const instance1 = getRequest('instance-1');
    const instance2 = getRequest('instance-2');

    expect(instance1).toBeDefined();
    expect(instance2).toBeDefined();
    expect(instance1).not.toBe(instance2);

    // 分别操作两个实例
    instance1?.run(10);
    instance2?.run(20);
    await vi.advanceTimersByTimeAsync(1000);

    expect(instance1?.data.value).toBe(10);
    expect(instance2?.data.value).toBe(20);
  });

  // 新增测试用例：测试实例属性同步
  test('should sync all properties between instances', async () => {
    const demo = componentVue(() => {
      return useRequest(getData, {
        id: 'sync-test',
        manual: true,
      });
    });

    const retrievedInstance = getRequest('sync-test');
    expect(retrievedInstance).toBeDefined();

    // 检查所有属性是否存在
    expect(retrievedInstance?.data).toBeDefined();
    expect(retrievedInstance?.loading).toBeDefined();
    expect(retrievedInstance?.run).toBeDefined();
    expect(retrievedInstance?.runAsync).toBeDefined();
    expect(retrievedInstance?.cancel).toBeDefined();
    expect(retrievedInstance?.refresh).toBeDefined();
    expect(retrievedInstance?.refreshAsync).toBeDefined();
    expect(retrievedInstance?.mutate).toBeDefined();
    expect(retrievedInstance?.status).toBeDefined();

    // 测试loading状态同步
    expect(demo.loading).toBe(false);
    expect(retrievedInstance?.loading.value).toBe(false);

    demo.run(99);
    expect(demo.loading).toBe(true);
    expect(retrievedInstance?.loading.value).toBe(true);

    await vi.advanceTimersByTimeAsync(1000);
    expect(demo.loading).toBe(false);
    expect(retrievedInstance?.loading.value).toBe(false);
    expect(demo.data).toBe(99);
    expect(retrievedInstance?.data.value).toBe(99);
  });

  // 新增测试用例：测试组件卸载时自动清理 requestMap 中的实例
  test('should automatically remove request instance when component is unmounted', async () => {
    const { unmount } = componentVue(() => {
      return useRequest(getData, {
        id: 'auto-cleanup-instance',
        manual: true,
      });
    });

    // 确保实例存在
    const instanceBeforeUnmount = getRequest('auto-cleanup-instance');
    expect(instanceBeforeUnmount).toBeDefined();

    // 卸载组件
    unmount();

    // 确认实例已被自动移除
    const instanceAfterUnmount = getRequest('auto-cleanup-instance');
    expect(instanceAfterUnmount).toBeUndefined();
  });
});
