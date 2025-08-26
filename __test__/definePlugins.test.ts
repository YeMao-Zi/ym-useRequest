import { expect, test, describe, vi, beforeAll } from 'vitest';
import { definePlugins, useRequest } from '../lib';
import { componentVue } from './utils';

// 创建一个简单的插件用于测试
const testPlugin = (instance: any) => {
  return {
    name: 'testPlugin',
    onBefore: () => {
      console.log('testPlugin onBefore called');
    },
  };
};

// 创建另一个插件用于测试
const anotherTestPlugin = (instance: any) => {
  return {
    name: 'anotherTestPlugin',
    onFinally: () => {
      console.log('anotherTestPlugin onAfter called');
    },
  };
};

// 创建一个用于 useRequest 参数的插件用于测试
const requestPlugin = (instance: any) => {
  return {
    name: 'requestPlugin',
    onSuccess: () => {
      console.log('requestPlugin onSuccess called');
    },
  };
};

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

describe('definePlugins', () => {
  test('should set global plugins correctly', () => {
    // 定义全局插件
    definePlugins([testPlugin]);

    const spy = vi.spyOn(console, 'log');

    const demo = componentVue(() => {
      return useRequest(getData, {
        manual: true,
      });
    });

    // 执行请求以触发插件
    demo.run(1);

    // 检查插件是否被正确应用
    expect(spy).toHaveBeenCalledWith('testPlugin onBefore called');

    spy.mockRestore();
    demo.unmount();
  });

  test('should combine base plugins with global plugins', () => {
    // 设置全局插件
    definePlugins([testPlugin, anotherTestPlugin]);

    const spy = vi.spyOn(console, 'log');

    const demo = componentVue(() => {
      return useRequest(getData, {
        manual: true,
        cacheKey: () => 'test-key',
        cacheTime: 1000,
      });
    });

    demo.run(1);

    // 应该调用所有插件，包括基础插件和全局插件
    expect(spy).toHaveBeenCalledWith('testPlugin onBefore called');

    spy.mockRestore();
    demo.unmount();
  });

  test('should handle empty plugins array', () => {
    definePlugins([]);

    const demo = componentVue(() => {
      return useRequest(getData, {
        manual: true,
      });
    });

    // 确保不会出错
    expect(() => demo.run(1)).not.toThrow();

    demo.unmount();
  });

  test('should handle null or undefined plugins', () => {
    // @ts-ignore - 测试非法输入
    definePlugins(null);

    const demo = componentVue(() => {
      return useRequest(getData, {
        manual: true,
      });
    });

    // 确保不会出错
    expect(() => demo.run(1)).not.toThrow();

    demo.unmount();

    // @ts-ignore - 测试非法输入
    definePlugins(undefined);

    const demo2 = componentVue(() => {
      return useRequest(getData, {
        manual: true,
      });
    });

    // 确保不会出错
    expect(() => demo2.run(1)).not.toThrow();

    demo2.unmount();
  });

  // 新增测试用例：测试 useRequest 传入 plugins 参数的情况
  test('should combine base plugins, global plugins and request plugins',async () => {
    // 设置全局插件
    definePlugins([testPlugin]);

    const spy = vi.spyOn(console, 'log');

    const demo = componentVue(() => {
      return useRequest(
        getData,
        {
          manual: true,
        },
        [requestPlugin],
      );
    });

    demo.run(1);
    await vi.advanceTimersByTimeAsync(1000);
    // 应该调用所有插件，包括基础插件、全局插件和请求级别的插件
    expect(spy).toHaveBeenCalledWith('testPlugin onBefore called');
    expect(spy).toHaveBeenCalledWith('requestPlugin onSuccess called');

    spy.mockRestore();
    demo.unmount();
  });
});
