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

  // 返回清理函数，用户可以在需要时手动调用
  const cleanup = () => {
    // 调用所有插件的 onCancel
    instance.plugins.value.forEach((plugin) => {
      plugin.onCancel?.();
    });
    instance.functionContext.cancel();
    id && removeRequest(id);
  };

  // 将 cleanup 函数附加到返回对象上，方便用户调用
  const result = {
    status: instance.status,
    loading: instance.loading,
    data: instance.data,
    error: instance.error,
    params: instance.params,
    pollingCount: instance.pollingCount,
    requestTick: instance.requestTick,
    cleanup, // 添加清理函数
    ...instance.functionContext,
  };

  return result;
}

export default usePlugins;
