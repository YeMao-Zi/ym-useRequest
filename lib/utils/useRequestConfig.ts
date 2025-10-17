import { provide, InjectionKey, getCurrentInstance, inject } from 'vue';
import type { Options } from '../type';

// 提供一个全局的注入 key，供父组件向子组件传递默认 options
export const USE_REQUEST_CONFIG_KEY: InjectionKey<Options<any, any>> = Symbol('USE_REQUEST_CONFIG');

// 全局配置变量，用于非组件环境
let globalConfig: Options<any, any> | undefined;

// 将 options 提供给当前组件及其子组件，作为 useRequest 的默认配置
export function useRequestConfig<R, P extends any[]>(options: Options<R, P>) {
  // 如果在组件中使用，使用 provide/inject 机制
  if (getCurrentInstance()) {
    provide(USE_REQUEST_CONFIG_KEY, options as unknown as Options<any, any>);
  } else {
    globalConfig = options as unknown as Options<any, any>;
  }
}

export function getGlobalConfig<R, P extends any[]>(): Options<R, P> | undefined {
  const injected = getCurrentInstance()
    ? inject<Options<R, P> | undefined>(USE_REQUEST_CONFIG_KEY, undefined)
    : undefined;

  return injected || (globalConfig as Options<R, P> | undefined);
}
