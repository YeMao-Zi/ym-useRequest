import type { Options, UseRequestMiddleware } from '../type';

/**
 * 合并中间件数组，去重并保持顺序
 * @param middlewares1 第一个中间件数组
 * @param middlewares2 第二个中间件数组
 * @returns 合并后的中间件数组
 */
export function mergeMiddlewares<R, P extends unknown[] = any>(
  middlewares1: UseRequestMiddleware<R, P>[] = [],
  middlewares2: UseRequestMiddleware<R, P>[] = [],
): UseRequestMiddleware<R, P>[] {
  // 使用 Map 来去重，保持插入顺序
  const middlewareMap = new Map<string, UseRequestMiddleware<R, P>>();

  // 添加第一个数组中的中间件
  middlewares1.forEach((middleware) => {
    // 使用函数名或函数体作为唯一标识
    const key = middleware.name || middleware.toString();
    middlewareMap.set(key, middleware);
  });

  // 添加第二个数组中的中间件
  middlewares2.forEach((middleware) => {
    const key = middleware.name || middleware.toString();
    middlewareMap.set(key, middleware);
  });

  // 返回去重后的中间件数组
  return Array.from(middlewareMap.values());
}

/**
 * 合并配置项，确保正确的优先级顺序
 * @param globalConfig 全局配置
 * @param localOptions 局部配置
 * @returns 合并后的配置
 */
export function mergeOptions<R, P extends unknown[] = any>(
  globalConfig: Options<R, P> | undefined,
  localOptions: Options<R, P> | undefined,
): Options<R, P> | undefined {
  if (!globalConfig && !localOptions) return undefined;
  if (!globalConfig) return localOptions;
  if (!localOptions) return globalConfig;

  // 合并中间件
  const mergedUse = mergeMiddlewares(
    globalConfig.use as UseRequestMiddleware<R, P>[] | undefined,
    localOptions.use as UseRequestMiddleware<R, P>[] | undefined,
  );

  // 合并配置，局部配置优先
  const mergedOptions: Options<R, P> = {
    ...globalConfig,
    ...localOptions,
    // 特殊处理中间件
    ...(mergedUse.length ? { use: mergedUse } : {}),
  };

  return mergedOptions;
}

/**
 * 组合中间件函数
 * @param middlewares 中间件数组
 * @param core 核心函数
 * @returns 组合后的函数
 */
export function composeMiddlewares<R, P extends unknown[] = any>(
  middlewares: UseRequestMiddleware<R, P>[] = [],
  core: (service: any, options?: any, plugins?: any) => any,
) {
  if (!middlewares.length) return core;
  return middlewares.reduceRight((next, middleware) => {
    const wrapped = middleware(next);
    return (service: any, options?: any, plugins?: any) => wrapped(service, options, plugins);
  }, core);
}
