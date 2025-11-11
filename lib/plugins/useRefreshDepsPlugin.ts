import { watch } from 'vue';
import type { Plugin } from '../type';
import { unrefParams, isFunction } from '../utils';

const useRefreshDepsPlugin: Plugin<unknown, unknown[]> = (instance, { refreshDeps = null, refreshDepsParams = null }) => {
  if (refreshDeps) {
    watch(
      refreshDeps,
      async (oldValue, newValue) => {
        if (refreshDepsParams) {
          if (isFunction(refreshDepsParams)) {
            const res = await (refreshDepsParams as Function)(oldValue, newValue);
            if (res) {
              instance.functionContext.run(...unrefParams(res));
            }
          } else {
            instance.functionContext.run(...unrefParams(refreshDepsParams));
          }
        } else {
          instance.functionContext.refresh();
        }
      },
      { deep: true },
    );
  }
  return {};
};

export default useRefreshDepsPlugin;
