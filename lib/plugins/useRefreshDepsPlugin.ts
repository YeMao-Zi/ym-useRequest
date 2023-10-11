import { watch } from 'vue';
import type { Plugin } from '../type';

const useRefreshDepsPlugin: Plugin<any, any[]> = (
  instance,
  { manual, refreshDeps = null, refreshDepsParams = null },
) => {
  // 依赖更新
  if (refreshDeps) {
    watch(
      refreshDeps,
      () => {
        if (refreshDepsParams) {
          instance.functionContext.run(...refreshDepsParams.value);
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
