import type { Plugin } from '../type';
import { useDelay } from '../utils';
import { ref } from '../utils/reactive';

const useLoadingDelayPlugin: Plugin<unknown, unknown[]> = (instance, { loadingDelay }) => {
  const timerRef = ref<NodeJS.Timeout | undefined>(undefined);
  return {
    onBefore() {
      if (loadingDelay) {
        instance.loading.value = false;
        timerRef.value = useDelay(() => {
          instance.loading.value = true;
        }, loadingDelay);
      }
    },
    onCancel() {
      clearTimeout(timerRef.value);
    },
    onFinally() {
      clearTimeout(timerRef.value);
    },
  };
};

export default useLoadingDelayPlugin;
