import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { createApp, defineComponent, ref } from 'vue';
import { getGlobalConfig } from '../lib/utils/useRequestConfig';
import { useRequest, useRequestConfig } from '../lib';

const getData = (value = 1, time = 1000): Promise<number> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(value);
    }, time);
  });
};

function mountWithChild(childSetup: any, parentSetup?: any) {
  const Child = defineComponent({
    name: 'ChildComp',
    setup: childSetup,
    template: '<div />',
  });

  const Parent = defineComponent({
    name: 'ParentComp',
    components: { Child },
    setup() {
      const childRef = ref<any>();
      parentSetup?.();
      return { childRef };
    },
    template: '<Child ref="childRef" />',
  });

  const el = document.createElement('div');
  const app = createApp(Parent);
  const unmount = () => app.unmount();
  const comp = app.mount(el) as any;
  (comp as any).unmount = unmount;
  return comp;
}

describe('useRequestConfig', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('inherits manual=true from parent config when child not set', async () => {
    const parentSetup = () => {
      useRequestConfig({ manual: true });
    };

    const comp = mountWithChild(() => {
      const result = useRequest(getData, { defaultParams: [5] });
      return result as any;
    }, parentSetup);

    // Will not execute automatically
    await vi.advanceTimersByTimeAsync(1000);
    expect(comp.childRef.data).toBeUndefined();

    comp.childRef.run();
    await vi.advanceTimersByTimeAsync(1000);
    expect(comp.childRef.data).toBe(5);

    comp.unmount();
  });

  test('child options override parent defaults (defaultParams)', async () => {
    const parentSetup = () => {
      useRequestConfig({ defaultParams: [2] });
    };

    const comp = mountWithChild(() => {
      const result = useRequest(getData, { defaultParams: [3] });
      return result as any;
    }, parentSetup);

    await vi.advanceTimersByTimeAsync(1000);
    expect(comp.childRef.data).toBe(3);
    comp.unmount();
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

    const parentSetup = () => {
      useRequestConfig({ use: [loggerParent] });
    };

    const comp = mountWithChild(() => {
      const result = useRequest(getData, { manual: true, use: [loggerChild] });
      return result as any;
    }, parentSetup);

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
  });

  describe('Global configuration in non-component environment', () => {
    beforeEach(() => {
      // Clean up global configuration
      useRequestConfig({});
    });

    test('Set global configuration in non-component environment', () => {
      // Simulate non-component environment (getCurrentInstance returns null)
      const originalGetCurrentInstance = vi.fn(() => null);
      vi.stubGlobal('getCurrentInstance', originalGetCurrentInstance);

      const config = { manual: true, defaultParams: [10] };
      useRequestConfig(config);

      const globalConfig = getGlobalConfig();
      expect(globalConfig).toEqual(config);

      vi.unstubAllGlobals();
    });

    test('Global configuration affects useRequest in non-component environment', async () => {
      // Simulate non-component environment
      const originalGetCurrentInstance = vi.fn(() => null);
      vi.stubGlobal('getCurrentInstance', originalGetCurrentInstance);

      // Set global configuration
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

      vi.unstubAllGlobals();
    });

    test('Merging global and component configurations', async () => {
      // Set global configuration first
      const originalGetCurrentInstance = vi.fn(() => null);
      vi.stubGlobal('getCurrentInstance', originalGetCurrentInstance);
      useRequestConfig({ manual: true, defaultParams: [30] });
      vi.unstubAllGlobals();

      // Set different configuration in component
      const parentSetup = () => {
        useRequestConfig({ defaultParams: [40] }); // Component configuration completely overrides global configuration
      };

      const comp = mountWithChild(() => {
        const result = useRequest(getData);
        return result as any;
      }, parentSetup);

      // Component configuration completely overrides global configuration, so manual will not be retained
      await vi.advanceTimersByTimeAsync(1000);
      expect(comp.childRef.data).toBe(40); // Automatically execute, use component's defaultParams

      comp.unmount();
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
      const originalGetCurrentInstance = vi.fn(() => null);
      vi.stubGlobal('getCurrentInstance', originalGetCurrentInstance);
      useRequestConfig({ use: [globalMiddleware] });
      vi.unstubAllGlobals();

      // Set component middleware in component
      const parentSetup = () => {
        useRequestConfig({ use: [componentMiddleware] });
      };

      const comp = mountWithChild(() => {
        const result = useRequest(getData, { manual: true });
        return result as any;
      }, parentSetup);

      // In component environment, getGlobalConfig only returns injected configuration, not global configuration
      // So only component middleware will be executed
      expect(logs).toEqual(['component middleware']);

      comp.childRef.run(50);
      await vi.advanceTimersByTimeAsync(1000);
      expect(comp.childRef.data).toBe(50);

      // When executing, only component service
      expect(logs).toEqual(['component middleware', 'component service']);

      comp.unmount();
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
      // Simulate non-component environment
      const originalGetCurrentInstance = vi.fn(() => null);
      vi.stubGlobal('getCurrentInstance', originalGetCurrentInstance);

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

      vi.unstubAllGlobals();
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

      // Simulate non-component environment
      const originalGetCurrentInstance = vi.fn(() => null);
      vi.stubGlobal('getCurrentInstance', originalGetCurrentInstance);

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

      vi.unstubAllGlobals();
    });
  });
});