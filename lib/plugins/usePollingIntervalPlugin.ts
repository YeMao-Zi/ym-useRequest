import type { Plugin } from '../type';
import { ref } from 'vue';
import { useDelay } from '../utils';

const usePollingIntervalPlugin: Plugin<any, any[]> = (instance, { pollingInterval, pollingErrorRetryCount = 0 }) => {
  const timerRef = ref<NodeJS.Timeout>();
  const countRef = ref(0);
  const stopPollingRef = ref(false);

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
      stopPollingRef.value = true;
      instance.pollingCount.value = 0;
    },
    onSuccess() {
      countRef.value = 0;
    },
    onError() {
      countRef.value++;
    },
    onFinally() {
      instance.pollingCount.value++;
      if (stopPollingRef.value) {
        stopPollingRef.value = false;
        return;
      }
      if (pollingErrorRetryCount === 0 || (pollingErrorRetryCount !== 0 && countRef.value < pollingErrorRetryCount)) {
        timerRef.value = useDelay(() => {
          instance.functionContext.refresh();
        }, pollingInterval);
      } else {
        countRef.value = 0;
      }
    },
  };
};

export default usePollingIntervalPlugin;
