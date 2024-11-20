import { watch } from 'vue';
import type { Plugin } from '../type';
import { useUnrefParmsWithArray, isFunction } from '../utils';

const useRefreshDepsPlugin: Plugin<any, any[]> = (
  instance,
  { manual, refreshDeps = null, refreshDepsParams = null },
) => {
  // 依赖更新
  if (refreshDeps) {
    watch(
      refreshDeps,
      async () => {
        if (refreshDepsParams) {
          if (isFunction(refreshDepsParams)) {
            const res = await refreshDepsParams();
            if (res) {
              instance.functionContext.run(...useUnrefParmsWithArray(res));
            }
          } else {
            instance.functionContext.run(...useUnrefParmsWithArray(refreshDepsParams));
          }
        } else {
          !manual && instance.functionContext.refresh();
        }
      },
      { deep: true },
    );
  }
  return {};
};

export default useRefreshDepsPlugin;
