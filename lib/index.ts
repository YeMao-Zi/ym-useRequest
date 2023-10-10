import type { Service, Options, Request } from './type';
import usePlugins from './usePlugins';
import useLoadingDelayPlugins from './plugins/useLoadingDelayPlugin';
import usePollingInterval from './plugins/usePollingInterval';

function useRequest<R, P extends unknown[] = any>(service: Service<R, P>, options?: Options<R, P>): Request<R, P> {
  return usePlugins<R, P>(service, options, [useLoadingDelayPlugins, usePollingInterval]);
}

export default useRequest;
