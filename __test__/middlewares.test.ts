import { expect, test, describe, vi, beforeEach, afterEach } from 'vitest';
import { useRequest } from '../lib';
import { componentVue } from './utils';

const getData = (value = 1, time = 1000): Promise<number> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(value);
    }, time);
  });
};

describe('middleware', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('should run middleware in correct order', async () => {
    const logs: string[] = [];

    const logger1 = (useRequestNext: any) => {
      return (service: any, options: any, plugins: any) => {
        logs.push('logger1 enter');
        const extendedService = (...args: any[]) => {
          logs.push('logger1 service');
          return service(...args);
        };
        const next = useRequestNext(extendedService, options, plugins);
        logs.push('logger1 exit');
        return next;
      };
    };

    const logger2 = (useRequestNext: any) => {
      return (service: any, options: any, plugins: any) => {
        logs.push('logger2 enter');
        const extendedService = (...args: any[]) => {
          logs.push('logger2 service');
          return service(...args);
        };
        const next = useRequestNext(extendedService, options, plugins);
        logs.push('logger2 exit');
        return next;
      };
    };

    const demo = componentVue(() => {
      return useRequest(getData, {
        manual: true,
        use: [logger1, logger2],
      });
    });

    // 初始化时，中间件按照顺序执行
    expect(logs).toEqual([
      'logger1 enter',
      'logger2 enter',
      'logger2 exit',
      'logger1 exit'
    ]);

    demo.run(5);
    await vi.advanceTimersByTimeAsync(1000);

    expect(demo.data.value).toBe(5);
    // 执行请求时，service按照相反的顺序执行（洋葱模型）
    expect(logs).toEqual([
      'logger1 enter',
      'logger2 enter',
      'logger2 exit',
      'logger1 exit',
      'logger2 service',
      'logger1 service',
    ]);

    demo.unmount();
  });

  test('should work without middleware', async () => {
    const demo = componentVue(() => {
      return useRequest(getData, {
        manual: true,
      });
    });

    demo.run(10);
    await vi.advanceTimersByTimeAsync(1000);

    expect(demo.data.value).toBe(10);
    demo.unmount();
  });

  test('should work with empty middleware array', async () => {
    const demo = componentVue(() => {
      return useRequest(getData, {
        manual: true,
        use: [],
      });
    });

    demo.run(15);
    await vi.advanceTimersByTimeAsync(1000);

    expect(demo.data.value).toBe(15);
    demo.unmount();
  });

  test('middleware can modify service behavior', async () => {
    const mockMiddleware = (useRequestNext: any) => {
      return (service: any, options: any, plugins: any) => {
        const extendedService = (...args: any[]) => {
          // 修改参数
          return service(42, ...args.slice(1));
        };
        return useRequestNext(extendedService, options, plugins);
      };
    };

    const demo = componentVue(() => {
      return useRequest(getData, {
        manual: true,
        use: [mockMiddleware],
      });
    });

    demo.run(1);
    await vi.advanceTimersByTimeAsync(1000);

    expect(demo.data.value).toBe(42); // 被中间件修改为42
    demo.unmount();
  });
});