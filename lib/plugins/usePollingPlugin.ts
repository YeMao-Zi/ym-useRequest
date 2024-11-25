import type { Plugin } from '../type';
import { ref, unref, watchEffect } from 'vue';
import { useDelay } from '../utils';

const usePollingPlugin: Plugin<any, any[]> = (instance, { pollingInterval, pollingErrorRetryCount = -1 }) => {
  const timerRef = ref<NodeJS.Timeout>();
  const countRef = ref(0);
  const stopPollingRef = ref(false);

  const stopPolling = () => {
    if (timerRef.value) {
      clearTimeout(timerRef.value);
    }
  };

  watchEffect(() => {
    if (!unref(pollingInterval)) {
      stopPolling();
    }
  });

  return {
    onBefore() {
      stopPollingRef.value = false;
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
      if (unref(pollingInterval)) {
        instance.pollingCount.value++;
      } else {
        return;
      }

      if (stopPollingRef.value) {
        stopPollingRef.value = false;
        return;
      }
      if (
        pollingErrorRetryCount === -1 ||
        (pollingErrorRetryCount !== -1 && countRef.value <= pollingErrorRetryCount)
      ) {
        timerRef.value = useDelay(() => {
          instance.functionContext.refresh();
        }, unref(pollingInterval));
      } else {
        countRef.value = 0;
      }
    },
  };
};

export default usePollingPlugin;
