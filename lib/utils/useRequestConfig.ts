import { provide, InjectionKey, getCurrentInstance, inject } from 'vue-demi';
import type { Options } from '../type';

// 提供一个全局的注入 key，供父组件向子组件传递默认 options
export const USE_REQUEST_CONFIG_KEY: InjectionKey<Options<any, any>> = Symbol('USE_REQUEST_CONFIG');

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

// 将 options 提供给当前组件及其子组件，作为 useRequest 的默认配置
export function useRequestConfig<R, P extends any[]>(options: Options<R, P>) {
  // 如果在组件中使用，使用 provide/inject 机制
  if (getCurrentInstance()) {
    provide(USE_REQUEST_CONFIG_KEY, options as unknown as Options<any, any>);
  } else {
    setGlobalConfigValue(options as unknown as Options<any, any>);
  }
}

export function getGlobalConfig<R, P extends any[]>(): Options<R, P> | undefined {
  const injected = getCurrentInstance()
    ? inject<Options<R, P> | undefined>(USE_REQUEST_CONFIG_KEY, undefined)
    : undefined;

  return injected || (getGlobalConfigValue() as Options<R, P> | undefined);
}
