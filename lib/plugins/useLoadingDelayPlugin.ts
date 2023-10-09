import type { Plugin } from '../type';
import { useDelay } from '../utils';
const useLoadingDelayPlugins: Plugin<any, any> = (instance, { loadingDelay }) => {
  return {
    onBefore() {
      if (loadingDelay) {
        instance.loading.value = !loadingDelay;
        useDelay(() => {
          instance.loading.value = !instance.loading.value;
        }, loadingDelay);
      }
    },
  };
};

export default useLoadingDelayPlugins;
