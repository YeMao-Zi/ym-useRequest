import { onUnmounted } from 'vue';
import type { Service, Options, UseRequestResult, Plugin } from './type';
import { unrefParams, getMayFunctionResult } from './utils';
import createInstance from './createInstance';
import { removeRequest } from './requestMap';

function usePlugins<R, P extends unknown[]>(
  service: Service<R, P>,
  options: Options<R, P> = {},
  plugins: Plugin<R, P>[],
): UseRequestResult<R, P> {
  const { id, manual = false, defaultParams = [] as P, ...rest } = options;

  const fetchOptions = {
    manual,
    defaultParams,
    ...rest,
  };

  const instance = createInstance(service, fetchOptions);

  instance.plugins.value = plugins.map((p) => p(instance, fetchOptions));

  if (!manual) {
    instance.functionContext.run(...unrefParams(getMayFunctionResult(defaultParams)));
  }

  onUnmounted(() => {
    instance.functionContext.cancel();
    id && removeRequest(id);
  });

  return {
    status: instance.status,
    loading: instance.loading,
    data: instance.data,
    error: instance.error,
    params: instance.params,
    pollingCount: instance.pollingCount,
    requestTick: instance.requestTick,
    ...instance.functionContext,
  };
}

export default usePlugins;
