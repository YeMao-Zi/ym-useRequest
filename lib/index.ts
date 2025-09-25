import type { Service, Options, Plugin, UseRequest, UseRequestMiddleware } from './type';
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
// 引入插件排序管理模块
import {
  initializePluginPriorityMap,
  updateBasePluginsSort,
  definePlugins,
  getSortedPlugins,
  setBasePlugins,
} from './registerPlugin';

// 基础插件列表
const BASE_PLUGINS = [
  useReadyPlugin,
  useCachePlugin,
  useLoadingDelayPlugins,
  useDebouncePlugin,
  useThrottlePlugin,
  usePollingPlugin,
  useRetryPlugin,
  useRefreshDepsPlugin,
  useWindowVisibilityChangePlugin,
];

function baseUseRequest<R, P extends unknown[] = any>(
  service: Service<R, P>,
  options?: Options<R, P>,
  plugins?: Plugin<R, P>[],
) {
  const sortedPlugins = getSortedPlugins(plugins);

  const requestInstance = usePlugins<R, P>(service, options, sortedPlugins);

  if (options?.id) {
    setRequest(options.id, requestInstance);
  }

  return requestInstance;
}

function composeMiddlewares<R, P extends unknown[] = any>(
  middlewares: UseRequestMiddleware<R, P>[] = [],
  core: UseRequest<R, P>,
): UseRequest<R, P> {
  if (!middlewares.length) return core;
  return middlewares.reduceRight<UseRequest<R, P>>((next, middleware) => {
    const wrapped = middleware(next);
    return (service, options, plugins) => wrapped(service, options, plugins);
  }, core);
}

function useRequest<R, P extends unknown[] = any>(
  service: Service<R, P>,
  options?: Options<R, P>,
  plugins?: Plugin<R, P>[],
) {
  const runUseRequest = composeMiddlewares<R, P>(options?.use as UseRequestMiddleware<R, P>[] | undefined, baseUseRequest);
  return runUseRequest(service, options, plugins);
}

// 初始化
setBasePlugins(BASE_PLUGINS);
initializePluginPriorityMap();
updateBasePluginsSort();

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
