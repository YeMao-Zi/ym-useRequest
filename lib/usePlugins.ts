import { onUnmounted } from 'vue';
import type { Service, Options, Request, Plugin } from './type';
import { useUnrefParmsWithArray } from './utils';
import createInstance from './createInstance';

function usePlugins<R, P extends unknown[]>(
  service: Service<R, P>,
  options: Options<R, P> = {},
  plugins: Plugin<R, P>[],
): Request<R, P> {
  const { manual = false, defaultParams = [] as unknown as P, ...rest } = options;
  const _defaultParams = useUnrefParmsWithArray<P>(defaultParams);
  const fetchOptions = {
    manual,
    defaultParams: _defaultParams,
    ...rest,
  };

  const instance = createInstance(service, fetchOptions);

  instance.plugins.value = plugins.map((p) => p(instance, fetchOptions));

  if (!manual) {
    instance.functionContext.run(..._defaultParams);
  }

  onUnmounted(() => {
    instance.functionContext.cancel();
  });

  return {
    loading: instance.loading,
    data: instance.data,
    error: instance.error,
    params: instance.params,
    pollingCount: instance.pollingCount,
    ...instance.functionContext,
  };
}

export default usePlugins;
