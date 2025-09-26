import { unref, ref, watchEffect, onUnmounted } from 'vue';
import type { Plugin } from '../type';
import { limit } from '../utils/index';
import { refreshSubscribe, cancelSubscribe } from '../utils/subscribeVisivilityChange';

const useWindowVisibilityChangePlugin: Plugin<unknown, unknown[]> = (
  instance,
  { refreshOnWindowFocus, cancelOnWindowBlur, focusTimespan = 5000 },
) => {
  const unRefreshSubscribeRef = ref();
  const unCancelSubscribeRef = ref();
  const stopSubscribe = () => {
    unRefreshSubscribeRef.value?.();
    unCancelSubscribeRef.value?.();
  };

  watchEffect((onCleanup) => {
    if (unref(refreshOnWindowFocus)) {
      const limitRefresh = limit(instance.functionContext.refresh.bind(instance.functionContext), unref(focusTimespan));
      unRefreshSubscribeRef.value = refreshSubscribe(() => {
        limitRefresh();
      });
    }
    if (unref(cancelOnWindowBlur)) {
      unCancelSubscribeRef.value = cancelSubscribe(instance.functionContext.cancel.bind(instance.functionContext));
    }
    onCleanup(stopSubscribe);
  });

  onUnmounted(() => {
    stopSubscribe();
  });

  return {};
};

export default useWindowVisibilityChangePlugin;
