import type { Options } from '../type';
import { mergeOptions } from './useRequestMiddleware';

// 使用全局对象存储配置，确保打包后所有模块共享同一个实例
const GLOBAL_CONFIG_KEY = '__YM_USE_REQUEST_GLOBAL_CONFIG__';

// 扩展 globalThis 类型
declare global {
  // eslint-disable-next-line no-var
  var __YM_USE_REQUEST_GLOBAL_CONFIG__: Options<any, any> | undefined;
}

function getGlobalConfigValue(): Options<any, any> | undefined {
  return globalThis[GLOBAL_CONFIG_KEY];
}

function setGlobalConfigValue(config: Options<any, any> | undefined): void {
  globalThis[GLOBAL_CONFIG_KEY] = config;
}

// 将 options 合并到全局默认配置（而不是覆盖）
export function useRequestConfig<R, P extends any[]>(options: Options<R, P>) {
  const currentConfig = getGlobalConfigValue();
  // 合并配置：新配置会覆盖旧配置的相同属性
  const mergedConfig = mergeOptions(currentConfig, options);
  setGlobalConfigValue(mergedConfig as unknown as Options<any, any>);
}

export function getGlobalConfig<R, P extends any[]>(): Options<R, P> | undefined {
  return getGlobalConfigValue() as Options<R, P> | undefined;
}
