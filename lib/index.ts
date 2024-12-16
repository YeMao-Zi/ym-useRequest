import type { Service, Options, Request } from './type';
import debounce from './utils/debounce';
import throttle from './utils/throttle';
import { TypeChecker } from './utils/index';
import { clearCache, setCache, getCache } from './utils/cache';
import usePlugins from './usePlugins';
import useLoadingDelayPlugins from './plugins/useLoadingDelayPlugin';
import usePollingPlugin from './plugins/usePollingPlugin';
import useReadyPlugin from './plugins/useReadyPlugin';
import useRefreshDepsPlugin from './plugins/useRefreshDepsPlugin';
import useDebouncePlugin from './plugins/useDebouncePlugin';
import useThrottlePlugin from './plugins/useThrottlePlugin';
import useCachePlugin from './plugins/useCachePlugin';
import useRetryPlugin from './plugins/useRetryPlugin';

function useRequest<R, P extends unknown[] = any>(service: Service<R, P>, options?: Options<R, P>): Request<R, P> {
  return usePlugins<R, P>(service, options, [
    useLoadingDelayPlugins,
    usePollingPlugin,
    useRefreshDepsPlugin,
    useReadyPlugin,
    useDebouncePlugin,
    useThrottlePlugin,
    useCachePlugin,
    useRetryPlugin,
  ]);
}
export { useRequest, clearCache, setCache, getCache, debounce, throttle, TypeChecker };
