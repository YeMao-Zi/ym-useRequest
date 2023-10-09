import type { Service, Options, Request } from './type';
import usePlugins from './usePlugins';
import useLoadingDelayPlugins from './plugins/useLoadingDelayPlugin';

function useRequest<R, P extends unknown[] = any>(service: Service<R, P>, options?: Options<R, P>): Request<R, P> {
  return usePlugins<R, P>(service, options, [useLoadingDelayPlugins]);
}

export default useRequest;
