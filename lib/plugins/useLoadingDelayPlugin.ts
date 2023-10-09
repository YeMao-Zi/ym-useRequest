import type { Plugin } from '../type';
import { useDelay } from '../utils';
const useLoadingDelayPlugins: Plugin<any, any> = (instance, { loadingDelay }) => {
  let timer: NodeJS.Timeout;
  return {
    onBefore() {
      if (loadingDelay) {
        instance.loading.value = false;
        timer = useDelay(() => {
          instance.loading.value = true;
        }, loadingDelay);
      }
    },
    onCancel() {
      clearTimeout(timer);
    },
    onFinally() {
      clearTimeout(timer);
    },
  };
};

export default useLoadingDelayPlugins;
