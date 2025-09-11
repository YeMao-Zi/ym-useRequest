import type { Service, Options, Request, Plugin } from './type';
import { setRequest, getRequest } from './requestMap';
import debounce from './utils/debounce';
import throttle from './utils/throttle';
import { TypeChecker, wrappedPromise } from './utils/index';
import { clearCache, setCache, getCache } from './utils/cache';
import { trigger } from './utils/cacheSubscribe';
import usePlugins from './usePlugins';
import useLoadingDelayPlugins from './plugins/useLoadingDelayPlugin';
import usePollingPlugin from './plugins/usePollingPlugin';
import useReadyPlugin from './plugins/useReadyPlugin';
import useRefreshDepsPlugin from './plugins/useRefreshDepsPlugin';
import useDebouncePlugin from './plugins/useDebouncePlugin';
import useThrottlePlugin from './plugins/useThrottlePlugin';
import useCachePlugin from './plugins/useCachePlugin';
import useRetryPlugin from './plugins/useRetryPlugin';
import useWindowVisibilityChangePlugin from './plugins/useWindowVisibilityChangePlugin';

const BasePlugins = [
  useLoadingDelayPlugins,
  usePollingPlugin,
  useRefreshDepsPlugin,
  useReadyPlugin,
  useDebouncePlugin,
  useThrottlePlugin,
  useCachePlugin,
  useRetryPlugin,
  useWindowVisibilityChangePlugin,
];

let Plugins = [...BasePlugins];
let GlobalPlugins: Plugin<any, any[]>[] = [];

function definePlugins(plugins: Plugin<any, any[]>[]) {
  GlobalPlugins = plugins || [];
  Plugins = [...BasePlugins, ...GlobalPlugins];
}

function useRequest<R, P extends unknown[] = any>(
  service: Service<R, P>,
  options?: Options<R, P>,
  plugins?: Plugin<R, P>[],
): Request<R, P> {
  // 只有当传入了插件参数时才重新定义插件列表
  // 否则使用当前已定义的插件（包括全局插件）
  if (plugins) {
    Plugins = [...BasePlugins, ...GlobalPlugins, ...plugins];
  }

  const requestInstance = usePlugins<R, P>(service, options, Plugins);
  // 如果提供了 id，则将实例存储起来
  if (options?.id) {
    setRequest(options.id, requestInstance);
  }
  return requestInstance;
}

export {
  useRequest,
  getRequest,
  clearCache,
  setCache,
  getCache,
  trigger,
  debounce,
  throttle,
  definePlugins,
  wrappedPromise,
  TypeChecker,
};

export type * from './type';
