import type { Service, Options, Request } from './type';
import usePlugins from './usePlugins';
import useLoadingDelayPlugins from './plugins/useLoadingDelayPlugin';
import usePollingIntervalPlugin from './plugins/usePollingIntervalPlugin';
import useReadyPlugin from './plugins/useReadyPlugin';
import useRefreshDepsPlugin from './plugins/useRefreshDepsPlugin';
import useDebouncePlugin from './plugins/useDebouncePlugin';
import useThrottlePlugin from './plugins/useThrottlePlugin'

function useRequest<R, P extends unknown[] = any>(service: Service<R, P>, options?: Options<R, P>): Request<R, P> {
  return usePlugins<R, P>(service, options, [
    useLoadingDelayPlugins,
    usePollingIntervalPlugin,
    useRefreshDepsPlugin,
    useReadyPlugin,
    useDebouncePlugin,
    useThrottlePlugin
  ]);
}

export default useRequest;
