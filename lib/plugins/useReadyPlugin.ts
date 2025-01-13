import { unref } from 'vue';
import type { Plugin } from '../type';

const useReadyPlugin: Plugin<any, any[]> = (instance, { ready = true }) => {
  return {
    onBefore() {
      if (!unref(ready)) {
        instance.loading.value = false;
        return {
          returnNow: true,
          returnData: undefined,
        };
      }
    },
  };
};

export default useReadyPlugin;
