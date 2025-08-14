import type { Service, Options, Request, Plugin } from './type';
import { setRequest, getRequest } from './requestMap';
import debounce from './utils/debounce';
import throttle from './utils/throttle';
import { TypeChecker } from './utils/index';
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

function definePlugins(plugins: Plugin<any, any[]>[]) {
  Plugins = [...BasePlugins, ...(plugins || [])];
}

function useRequest<R, P extends unknown[] = any>(
  service: Service<R, P>,
  options?: Options<R, P>,
  plugins?: Plugin<R, P>[],
): Request<R, P> {
  definePlugins(plugins);
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
  TypeChecker,
};
