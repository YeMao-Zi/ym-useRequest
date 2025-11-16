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
  // 直接合并，保持顺序：middlewares1 在前，middlewares2 在后
  // 不使用 Map 去重，因为同一个中间件可能需要被多次应用
  return [...(middlewares1 || []), ...(middlewares2 || [])];
}

/**
 * 合并配置项，确保正确的优先级顺序
 * @param globalConfig 全局配置
 * @param localOptions 局部配置
 * @returns 合并后的配置
 */
export function mergeOptions<R, P extends unknown[] = any>(
  globalConfig: Options<R, P> | undefined = {},
  localOptions: Options<R, P> | undefined = {},
): Options<R, P> | undefined {
  if (!globalConfig && !localOptions) return undefined;

  // 使用空对象作为默认值，避免重复的 if 判断
  const mergedUse = mergeMiddlewares(
    globalConfig?.use as UseRequestMiddleware<R, P>[] | undefined,
    localOptions?.use as UseRequestMiddleware<R, P>[] | undefined,
  );

  // 合并配置，局部配置优先
  const mergedOptions: Options<R, P> = {
    ...globalConfig,
    ...localOptions,
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
