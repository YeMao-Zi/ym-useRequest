import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { ref } from '../lib/utils/reactive';
import { getGlobalConfig } from '../lib/utils/useRequestConfig';
import { useRequest, useRequestConfig } from '../lib';
import { componentVue } from './utils';

const getData = (value = 1, time = 1000): Promise<number> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(value);
    }, time);
  });
};

function mountWithChild(childSetup: any, parentSetup?: any) {
  // 无 Vue 版本：直接调用 setup 函数
  parentSetup?.();
  const childResult = componentVue(childSetup);
  
  return {
    childRef: childResult,
    unmount: () => {
      if (childResult?.unmount) {
        childResult.unmount();
      }
    },
  };
}

describe('useRequestConfig', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('inherits manual=true from parent config when child not set', async () => {
    // 在无 Vue 版本中，配置是全局的
    useRequestConfig({ manual: true });

    const comp = mountWithChild(() => {
      const result = useRequest(getData, { defaultParams: [5] });
      return result as any;
    });

    // Will not execute automatically
    await vi.advanceTimersByTimeAsync(1000);
    expect(comp.childRef.data).toBeUndefined();

    comp.childRef.run();
    await vi.advanceTimersByTimeAsync(1000);
    expect(comp.childRef.data).toBe(5);

    comp.unmount();
    // 清理全局配置
    useRequestConfig({});
  });

  test('child options override parent defaults (defaultParams)', async () => {
    // 在无 Vue 版本中，配置是全局的
    useRequestConfig({ defaultParams: [2] });

    const comp = mountWithChild(() => {
      const result = useRequest(getData, { defaultParams: [3] });
      return result as any;
    });

    await vi.advanceTimersByTimeAsync(1000);
    // 局部配置会覆盖全局配置
    expect(comp.childRef.data).toBe(3);
    comp.unmount();
    // 清理全局配置
    useRequestConfig({});
  });

  test('merge use middlewares: parent first, child next; service call reverses', async () => {
    const logs: string[] = [];
    const loggerParent = (useRequestNext: any) => {
      return (service: any, options: any, plugins: any) => {
        logs.push('parent enter');
        const extendedService = (...args: any[]) => {
          logs.push('parent service');
          return service(...args);
        };
        const next = useRequestNext(extendedService, options, plugins);
        logs.push('parent exit');
        return next;
      };
    };
    const loggerChild = (useRequestNext: any) => {
      return (service: any, options: any, plugins: any) => {
        logs.push('child enter');
        const extendedService = (...args: any[]) => {
          logs.push('child service');
          return service(...args);
        };
        const next = useRequestNext(extendedService, options, plugins);
        logs.push('child exit');
        return next;
      };
    };

    // 在无 Vue 版本中，配置是全局的
    useRequestConfig({ use: [loggerParent] });

    const comp = mountWithChild(() => {
      const result = useRequest(getData, { manual: true, use: [loggerChild] });
      return result as any;
    });

    // Initialize in parent->child enter order, child->parent exit order
    expect(logs).toEqual(['parent enter', 'child enter', 'child exit', 'parent exit']);

    comp.childRef.run(7);
    await vi.advanceTimersByTimeAsync(1000);
    expect(comp.childRef.data).toBe(7);
    // When executing, child service executes first, then parent service
    expect(logs).toEqual([
      'parent enter',
      'child enter',
      'child exit',
      'parent exit',
      'child service',
      'parent service',
    ]);

    comp.unmount();
    // 清理全局配置
    useRequestConfig({});
  });

  describe('Global configuration in non-component environment', () => {
    beforeEach(() => {
      // Clean up global configuration
      useRequestConfig({});
    });

    test('Set global configuration in non-component environment', () => {
      // 无 Vue 版本：直接设置全局配置
      const config = { manual: true, defaultParams: [10] };
      useRequestConfig(config);

      const globalConfig = getGlobalConfig();
      expect(globalConfig).toEqual(config);
    });

    test('Global configuration affects useRequest in non-component environment', async () => {
      // 无 Vue 版本：直接设置全局配置
      useRequestConfig({ manual: true, defaultParams: [20] });

      // Use useRequest in non-component environment
      const result = useRequest(getData);

      // Should not execute automatically (manual: true)
      await vi.advanceTimersByTimeAsync(1000);
      expect(result.data.value).toBeUndefined();

      // Should use default parameters when manually executed
      result.run();
      await vi.advanceTimersByTimeAsync(1000);
      expect(result.data.value).toBe(20);
    });

    test('Merging global and component configurations', async () => {
      // Set global configuration first
      useRequestConfig({ manual: true, defaultParams: [30] });

      // Set different configuration (will merge with global)
      const parentSetup = () => {
        useRequestConfig({ defaultParams: [40] }); // This will merge with global configuration
      };

      const comp = mountWithChild(() => {
        // 在调用 useRequest 时，会合并全局配置和局部配置
        const result = useRequest(getData);
        return result as any;
      }, parentSetup);

      // 由于全局配置设置了 manual: true，parentSetup 中设置了 defaultParams
      // useRequestConfig 会合并配置，所以最终全局配置是 { manual: true, defaultParams: [40] }
      // 但 useRequest 调用时没有传入 options，所以使用全局配置
      await vi.advanceTimersByTimeAsync(1000);
      expect(comp.childRef.data.value).toBeUndefined(); // manual: true，不会自动执行
      
      comp.childRef.run();
      await vi.advanceTimersByTimeAsync(1000);
      expect(comp.childRef.data.value).toBe(40); // 使用合并后的 defaultParams

      comp.unmount();
      // 清理全局配置
      useRequestConfig({});
    });

    test('Global configuration middleware merging', async () => {
      const logs: string[] = [];
      const globalMiddleware = (useRequestNext: any) => {
        return (service: any, options: any, plugins: any) => {
          logs.push('global middleware');
          const extendedService = (...args: any[]) => {
            logs.push('global service');
            return service(...args);
          };
          return useRequestNext(extendedService, options, plugins);
        };
      };

      const componentMiddleware = (useRequestNext: any) => {
        return (service: any, options: any, plugins: any) => {
          logs.push('component middleware');
          const extendedService = (...args: any[]) => {
            logs.push('component service');
            return service(...args);
          };
          return useRequestNext(extendedService, options, plugins);
        };
      };

      // Set global middleware
      useRequestConfig({ use: [globalMiddleware] });

      // Set component middleware (will merge with global)
      const parentSetup = () => {
        useRequestConfig({ use: [componentMiddleware] });
      };

      const comp = mountWithChild(() => {
        const result = useRequest(getData, { manual: true });
        return result as any;
      }, parentSetup);

      // In non-Vue version, middleware should be merged: global first, then component
      expect(logs).toEqual(['global middleware', 'component middleware']);

      comp.childRef.run(50);
      await vi.advanceTimersByTimeAsync(1000);
      expect(comp.childRef.data.value).toBe(50);

      // When executing: component service -> global service
      expect(logs).toEqual([
        'global middleware',
        'component middleware',
        'component service',
        'global service',
      ]);

      comp.unmount();
      // 清理全局配置
      useRequestConfig({});
    });

    test('Behavior of getGlobalConfig in component environment', () => {
      const parentSetup = () => {
        useRequestConfig({ manual: true, defaultParams: [60] });
      };

      const comp = mountWithChild(() => {
        const globalConfig = getGlobalConfig();
        return { globalConfig };
      }, parentSetup);

      // In component environment, should return injected configuration instead of global configuration
      expect(comp.childRef.globalConfig).toEqual({ manual: true, defaultParams: [60] });

      comp.unmount();
    });

    test('Global configuration updates', async () => {
      // Set initial global configuration
      useRequestConfig({ manual: true, defaultParams: [70] });
      let globalConfig = getGlobalConfig();
      expect(globalConfig).toEqual({ manual: true, defaultParams: [70] });

      // Update global configuration
      useRequestConfig({ manual: false, defaultParams: [80] });
      globalConfig = getGlobalConfig();
      expect(globalConfig).toEqual({ manual: false, defaultParams: [80] });

      // Verify new configuration takes effect
      const result = useRequest(getData);
      await vi.advanceTimersByTimeAsync(1000);
      expect(result.data.value).toBe(80); // Automatically execute, use new parameters
    });

    test('Merging global configuration with directly passed options in non-component environment', async () => {
      const logs: string[] = [];
      const globalMiddleware = (useRequestNext: any) => {
        return (service: any, options: any, plugins: any) => {
          logs.push('global middleware');
          const extendedService = (...args: any[]) => {
            logs.push('global service');
            return service(...args);
          };
          return useRequestNext(extendedService, options, plugins);
        };
      };

      const directMiddleware = (useRequestNext: any) => {
        return (service: any, options: any, plugins: any) => {
          logs.push('direct middleware');
          const extendedService = (...args: any[]) => {
            logs.push('direct service');
            return service(...args);
          };
          return useRequestNext(extendedService, options, plugins);
        };
      };

      // Set global configuration
      useRequestConfig({ manual: true, defaultParams: [90], use: [globalMiddleware] });

      // Use useRequest in non-component environment, pass additional options
      const result = useRequest(getData, { use: [directMiddleware] });

      // Should merge global and directly passed middleware
      expect(logs).toEqual(['global middleware', 'direct middleware']);

      // Should not execute automatically (manual: true)
      await vi.advanceTimersByTimeAsync(1000);
      expect(result.data.value).toBeUndefined();

      // Should use global default parameters when manually executed
      result.run();
      await vi.advanceTimersByTimeAsync(1000);
      expect(result.data.value).toBe(90);

      // When executing: direct service -> global service
      expect(logs).toEqual([
        'global middleware',
        'direct middleware',
        'direct service',
        'global service',
      ]);
    });
  });
});