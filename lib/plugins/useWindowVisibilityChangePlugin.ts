import { unref, ref } from '../utils/reactive';
import type { Plugin } from '../type';
import { limit } from '../utils/index';
import { refreshSubscribe, cancelSubscribe } from '../utils/subscribeVisivilityChange';

const useWindowVisibilityChangePlugin: Plugin<unknown, unknown[]> = (
  instance,
  { refreshOnWindowFocus, cancelOnWindowBlur, focusTimespan = 5000 },
) => {
  const unRefreshSubscribeRef = ref<(() => void) | undefined>(undefined);
  const unCancelSubscribeRef = ref<(() => void) | undefined>(undefined);
  const stopSubscribe = () => {
    unRefreshSubscribeRef.value?.();
    unCancelSubscribeRef.value?.();
  };

  const setupSubscriptions = () => {
    stopSubscribe(); // 先清理旧的订阅

    if (unref(refreshOnWindowFocus)) {
      const limitRefresh = limit(instance.functionContext.refresh.bind(instance.functionContext), unref(focusTimespan));
      unRefreshSubscribeRef.value = refreshSubscribe(() => {
        limitRefresh();
      });
    }
    if (unref(cancelOnWindowBlur)) {
      unCancelSubscribeRef.value = cancelSubscribe(instance.functionContext.cancel.bind(instance.functionContext));
    }
  };

  // 初始化订阅
  setupSubscriptions();

  return {
    onBefore() {
      // 检查配置是否变化，如果变化则重新设置订阅
      setupSubscriptions();
    },
    onCancel() {
      stopSubscribe();
    },
  };
};

export default useWindowVisibilityChangePlugin;
