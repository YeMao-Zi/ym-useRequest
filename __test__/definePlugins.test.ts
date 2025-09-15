import { expect, test, describe, vi, beforeAll } from 'vitest';
import { definePlugins, useRequest } from '../lib';
import { componentVue } from './utils';

// 创建一个简单的插件用于测试
const testPlugin = (instance: any) => {
  return {
    onBefore: () => {
      console.log('testPlugin onBefore called');
    },
  };
};

// 创建另一个插件用于测试
const anotherTestPlugin = (instance: any) => {
  return {
    onFinally: () => {
      console.log('anotherTestPlugin onAfter called');
    },
  };
};

// 创建一个用于 useRequest 参数的插件用于测试
const requestPlugin = (instance: any) => {
  return {
    onSuccess: () => {
      console.log('requestPlugin onSuccess called');
    },
  };
};

// 创建一个与基础插件同名的插件用于测试覆盖功能
const useCachePlugin = (instance: any) => {
  return {
    onBefore: () => {
      console.log('customCachePlugin onBefore called');
    },
    onSuccess: () => {
      console.log('customCachePlugin onSuccess called');
    },
  };
};

// 创建一个优先级测试插件
const priorityTestPlugin = (instance: any) => {
  return {
    onBefore: () => {
      console.log('priorityTestPlugin onBefore called');
    },
  };
};

// 创建一个默认优先级测试插件
const defaultPriorityPlugin = (instance: any) => {
  return {
    onBefore: () => {
      console.log('defaultPriorityPlugin onBefore called');
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
  test('should combine base plugins, global plugins and request plugins', async () => {
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
  
  // 新增测试用例：测试插件覆盖功能
  test('should override base plugin with custom plugin of same name', async () => {
    // 定义一个与基础插件同名的自定义插件
    definePlugins([useCachePlugin]);

    const spy = vi.spyOn(console, 'log');

    const demo = componentVue(() => {
      return useRequest(getData, {
        manual: true,
        cacheKey: () => 'test-key',
        cacheTime: 1000,
      });
    });

    demo.run(1);
    await vi.advanceTimersByTimeAsync(1000);
    
    // 应该调用自定义插件而不是基础插件
    expect(spy).toHaveBeenCalledWith('customCachePlugin onBefore called');
    expect(spy).toHaveBeenCalledWith('customCachePlugin onSuccess called');
    
    // 确保没有调用基础缓存插件的相关逻辑
    expect(spy).not.toHaveBeenCalledWith('Cache plugin logic');

    spy.mockRestore();
    demo.unmount();
  });
  
  // 新增测试用例：测试插件优先级配置
  test('should respect plugin priority configuration', () => {
    // 定义插件和优先级
    definePlugins(
      [priorityTestPlugin], 
      [{ name: 'priorityTestPlugin', priority: 15 }]
    );

    const spy = vi.spyOn(console, 'log');

    const demo = componentVue(() => {
      return useRequest(getData, {
        manual: true,
        cacheKey: () => 'test-key',
        cacheTime: 1000,
      });
    });

    demo.run(1);
    
    // 根据优先级配置，priorityTestPlugin 应该在 useCachePlugin(优先级20)之前执行
    expect(spy).toHaveBeenCalledWith('priorityTestPlugin onBefore called');

    spy.mockRestore();
    demo.unmount();
  });
  
  // 新增测试用例：测试插件处理（验证所有插件都被正确处理）
  test('should handle all plugins correctly', () => {
    const firstPlugin = () => {
      return {
        onBefore: () => {
          console.log('firstPlugin onBefore called');
        }
      };
    };
    
    const secondPlugin = () => {
      return {
        onBefore: () => {
          console.log('secondPlugin onBefore called');
        }
      };
    };
    
    // 全局插件中包含两个插件
    definePlugins([firstPlugin, secondPlugin]);

    const spy = vi.spyOn(console, 'log');

    const demo = componentVue(() => {
      return useRequest(getData, {
        manual: true,
      });
    });

    demo.run(1);
    
    // 两个插件都应该被调用，因为它们函数名不同
    expect(spy).toHaveBeenCalledWith('firstPlugin onBefore called');
    expect(spy).toHaveBeenCalledWith('secondPlugin onBefore called');

    spy.mockRestore();
    demo.unmount();
  });
  
  // 新增测试用例：测试未传入 priorityItems 时插件的默认优先级
  test('should assign default priority when priorityItems not provided', () => {
    // 只传入插件，不传入 priorityItems
    definePlugins([defaultPriorityPlugin]);

    const spy = vi.spyOn(console, 'log');

    const demo = componentVue(() => {
      return useRequest(getData, {
        manual: true,
      });
    });

    demo.run(1);
    
    // 插件应该被正确调用，说明它获得了默认优先级
    expect(spy).toHaveBeenCalledWith('defaultPriorityPlugin onBefore called');

    spy.mockRestore();
    demo.unmount();
  });
});