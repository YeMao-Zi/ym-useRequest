import { onUnmounted } from 'vue';
import type { Service, Options, Request, Plugin } from './type';
import createInstance from './createInstance';

function usePlugins<R, P extends unknown[]>(
  service: Service<R, P>,
  options: Options<R, P> = {},
  plugins: Plugin<R, P>[],
): Request<R, P> {
  const { manual = false, defaultParams = [] as unknown as P, ...rest } = options;
  const fetchOptions = {
    manual,
    defaultParams,
    ...rest,
  };

  const Instance = createInstance(service, fetchOptions);

  Instance.plugins.value = plugins.map((p) => p(Instance, fetchOptions));

  if (!manual) {
    Instance.functionContext.run(...defaultParams);
  }

  onUnmounted(() => {
    Instance.functionContext.cancel();
  });

  return {
    loading: Instance.loading,
    data: Instance.data,
    error: Instance.error,
    params: Instance.params,
    ...Instance.functionContext,
  };
}

export default usePlugins;
