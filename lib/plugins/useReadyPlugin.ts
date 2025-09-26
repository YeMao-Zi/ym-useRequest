import { Ref, unref } from 'vue';
import type { Plugin } from '../type';
import { TypeChecker } from '../utils/index';

const useReadyPlugin: Plugin<unknown, unknown[]> = (instance, { ready = true }) => {
  return {
    onBefore() {
      const _ready = TypeChecker.isFunction(ready) ? (ready as () => boolean | Ref<boolean>)() : ready;
      if (!unref(_ready)) {
        instance.loading.value = false;
        return {
          returnNow: true,
        };
      }
    },
  };
};

export default useReadyPlugin;
