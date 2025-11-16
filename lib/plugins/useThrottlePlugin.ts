import { ref, unref } from '../utils/reactive';
import type { Plugin } from '../type';
import debounce from '../utils/debounce';
import throttle from '../utils/throttle';

const useThrottlePlugin: Plugin<unknown, unknown[]> = (instance, { throttleWait, throttleOptions }) => {
  const throttleRef = ref<ReturnType<typeof throttle> | undefined>(undefined);
  // 保存最原始的 runAsync，避免在重新设置时丢失
  const originalRunAsync = instance.functionContext.runAsync;
  let lastThrottleWait: number | undefined;
  let lastThrottleOptions: any;

  // 初始化节流函数
  const setupThrottle = () => {
    if (!throttleWait) return;
    const throttleWaitUnref = unref(throttleWait);
    const throttleOptionsUnref = unref(throttleOptions);

    // 检查是否变化
    if (throttleWaitUnref === lastThrottleWait && throttleOptionsUnref === lastThrottleOptions) {
      return;
    }

    lastThrottleWait = throttleWaitUnref;
    lastThrottleOptions = throttleOptionsUnref;

    // 清理旧的节流函数
    throttleRef.value?.cancel();
    
    throttleRef.value = throttle((callback) => callback(), throttleWaitUnref, throttleOptionsUnref);

    // 问题：应该将 runAsync 用 throttle 包裹，但是 throttle 包裹后返回的不是我们要的 promise 导致只能迂回的在内部使用 Promise 包裹 throttle
    // https://github.com/lodash/lodash/issues/4400#issuecomment-834800398
    instance.functionContext.runAsync = (...args) => {
      return new Promise((resolve, reject) => {
        throttleRef.value!(() => {
          originalRunAsync(...args)
            .then(resolve)
            .catch(reject);
        });
      });
    };
  };

  setupThrottle();

  return {
    onBefore() {
      // 检查 throttleWait 是否变化，如果变化则重新设置
      if (throttleWait) {
        setupThrottle();
      }
    },
    onCancel() {
      throttleRef.value?.cancel();
      instance.functionContext.runAsync = originalRunAsync;
    },
  };
};

export default useThrottlePlugin;
