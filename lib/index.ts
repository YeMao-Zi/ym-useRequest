import type { Service, Options, Request } from './type';
import usePlugins from './usePlugins';

function useRequest<R, P extends unknown[] = any>(service: Service<R, P>, options?: Options<R, P>): Request<R, P> {
  return usePlugins<R, P>(service, options, []);
}

export default useRequest;
