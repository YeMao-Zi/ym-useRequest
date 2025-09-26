import type { Service, Options, Plugin, UseRequest } from './type';
import { getCurrentInstance } from 'vue';
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
import { useRequestConfig, getGlobalConfig } from './utils/useRequestConfig';
// 引入新的配置管理模块
import { mergeOptions, composeMiddlewares } from './utils/useRequestMiddleware';
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

function useRequest<R, P extends unknown[] = any>(
  service: Service<R, P>,
  options?: Options<R, P>,
  plugins?: Plugin<R, P>[],
) {
  // 获取全局配置，无论在组件内外
  const globalConfig = getGlobalConfig<R, P>();

  // 使用改进的合并逻辑
  const mergedOptions = mergeOptions(globalConfig, options);

  const runUseRequest = composeMiddlewares<R, P>(
    (mergedOptions?.use as any[] | undefined) || undefined,
    baseUseRequest,
  );
  return runUseRequest(service, mergedOptions, plugins);
}

// 初始化
setBasePlugins(BASE_PLUGINS);
initializePluginPriorityMap();
updateBasePluginsSort();

export {
  useRequest,
  useRequestConfig,
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
