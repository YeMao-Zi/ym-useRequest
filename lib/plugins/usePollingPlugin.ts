import type { Plugin } from '../type';
import { computed, ref, unref, watchEffect } from 'vue';
import { useDelay, isNonZeroFalsy } from '../utils';

const usePollingPlugin: Plugin<any, any[]> = (instance, { pollingInterval, pollingErrorRetryCount = -1 }) => {
  const timerRef = ref<NodeJS.Timeout>();
  const countRef = ref(0);
  const stopPollingRef = ref(false);
  const pollingIntervalRef = computed(() => unref(pollingInterval));

  const stopPolling = () => {
    if (timerRef.value) {
      clearTimeout(timerRef.value);
    }
  };

  watchEffect(() => {
    if (isNonZeroFalsy(pollingIntervalRef.value)) {
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
      if (!isNonZeroFalsy(pollingIntervalRef.value)) {
        instance.pollingCount.value++;
      } else {
        return;
      }
      // Avoid memory overflow in a node environment
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
        }, pollingIntervalRef.value);
      } else {
        countRef.value = 0;
      }
    },
  };
};

export default usePollingPlugin;
