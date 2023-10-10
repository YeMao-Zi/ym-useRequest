import type { Plugin } from '../type';
import { ref } from 'vue';
import { useDelay } from '../utils';

const usePollingInterval: Plugin<any, any[]> = (instance, { pollingInterval, pollingErrorRetryCount = 0 }) => {
  const timerRef = ref<NodeJS.Timeout>();
  const countRef = ref(0);

  const stopPolling = () => {
    if (timerRef.value) {
      clearTimeout(timerRef.value);
    }
  };

  if (!pollingInterval) return {};

  return {
    onBefore() {
      stopPolling();
    },
    onCancel() {
      stopPolling();
    },
    onSuccess() {
      countRef.value = 0;
    },
    onError() {
      countRef.value++;
    },
    onFinally() {
      if (pollingErrorRetryCount === 0 || (pollingErrorRetryCount !== 0 && countRef.value < pollingErrorRetryCount)) {
        timerRef.value = useDelay(() => {
          instance.functionContext.refresh();
        }, pollingInterval);
      }
    },
  };
};

export default usePollingInterval;
