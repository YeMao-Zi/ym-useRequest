import type { Plugin } from '../type';
import { ref, unref } from '../utils/reactive';
import { useDelay, isNonZeroFalsy } from '../utils';

const usePollingPlugin: Plugin<unknown, unknown[]> = (instance, { pollingInterval, pollingErrorRetryCount = -1 }) => {
  const timerRef = ref<(() => void) | undefined>(undefined);
  const countRef = ref(0);

  const getPollingInterval = () => unref(pollingInterval);

  const polling = (callback: () => void) => {
    let timerId: NodeJS.Timeout | undefined;
    const interval = getPollingInterval();
    const canPolling = !isNonZeroFalsy(interval) && interval >= 0;
    if (!canPolling) {
      return;
    }
    if (pollingErrorRetryCount === -1 || (pollingErrorRetryCount !== -1 && countRef.value <= pollingErrorRetryCount)) {
      instance.pollingCount.value++;
      timerId = useDelay(callback, interval);
    } else {
      countRef.value = 0;
    }
    return () => timerId && clearTimeout(timerId);
  };

  // 存储上一次的 pollingInterval 值，用于检测变化
  let lastPollingInterval = getPollingInterval();

  return {
    onBefore() {
      timerRef.value?.();
      // 检查 pollingInterval 是否变化
      const currentInterval = getPollingInterval();
      if (currentInterval !== lastPollingInterval) {
        lastPollingInterval = currentInterval;
        if (timerRef.value) {
          timerRef.value();
          timerRef.value = polling(() => instance.functionContext.refresh());
        }
      }
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
