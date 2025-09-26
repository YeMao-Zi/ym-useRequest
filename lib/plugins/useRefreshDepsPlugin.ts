import { watch } from 'vue';
import type { Plugin } from '../type';
import { unrefParms, isFunction } from '../utils';

const useRefreshDepsPlugin: Plugin<unknown, unknown[]> = (instance, { refreshDeps = null, refreshDepsParams = null }) => {
  if (refreshDeps) {
    watch(
      refreshDeps,
      async (oldValue, newValue) => {
        if (refreshDepsParams) {
          if (isFunction(refreshDepsParams)) {
            const res = await (refreshDepsParams as Function)(oldValue, newValue);
            if (res) {
              instance.functionContext.run(...unrefParms(res));
            }
          } else {
            instance.functionContext.run(...unrefParms(refreshDepsParams));
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
