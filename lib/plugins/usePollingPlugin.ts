import type { Plugin } from '../type';
import { computed, ref, unref, watch } from 'vue-demi';
import { useDelay, isNonZeroFalsy } from '../utils';

const usePollingPlugin: Plugin<unknown, unknown[]> = (instance, { pollingInterval, pollingErrorRetryCount = -1 }) => {
  const timerRef = ref();
  const countRef = ref(0);
  const pollingIntervalRef = computed(() => unref(pollingInterval));

  const polling = (callback: () => void) => {
    let timerId: NodeJS.Timeout;
    const canPolling = !isNonZeroFalsy(pollingIntervalRef.value) && pollingIntervalRef.value >= 0;
    if (!canPolling) {
      return;
    }
    if (pollingErrorRetryCount === -1 || (pollingErrorRetryCount !== -1 && countRef.value <= pollingErrorRetryCount)) {
      instance.pollingCount.value++;
      timerId = useDelay(callback, pollingIntervalRef.value);
    } else {
      countRef.value = 0;
    }
    return () => timerId && clearTimeout(timerId);
  };

  watch(pollingIntervalRef, () => {
    if (timerRef.value) {
      timerRef.value();
      timerRef.value = polling(() => instance.functionContext.refresh());
    }
  });

  return {
    onBefore() {
      timerRef.value?.();
    },
    onCancel() {
      timerRef.value?.();
      instance.pollingCount.value = 0;
    },
    onSuccess() {
      countRef.value = 0;
    },
    onError() {
      countRef.value++;
    },
    onFinally() {
      timerRef.value = polling(() => instance.functionContext.refresh());
    },
  };
};

export default usePollingPlugin;
