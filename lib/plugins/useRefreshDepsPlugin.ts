import { watch } from 'vue';
import type { Plugin } from '../type';
import { unrefParms, isFunction } from '../utils';

const useRefreshDepsPlugin: Plugin<any, any[]> = (instance, { refreshDeps = null, refreshDepsParams = null }) => {
  if (refreshDeps) {
    watch(
      refreshDeps,
      async () => {
        if (refreshDepsParams) {
          if (isFunction(refreshDepsParams)) {
            const res = await refreshDepsParams();
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
