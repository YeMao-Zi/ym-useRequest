import { ref, watchEffect, unref } from 'vue';
import type { Plugin } from '../type';
import debounce from '../utils/debounce';
import throttle from '../utils/throttle';

const useThrottlePlugin: Plugin<any, any[]> = (instance, { throttleWait, throttleOptions }) => {
  const throttleRef = ref<ReturnType<typeof debounce>>();

  watchEffect((onCleanup) => {
    if (!throttleWait) return;
    const throttleWaitUnref = unref(throttleWait);
    const throttleOptionsUnref = unref(throttleOptions);

    const originRunAsync = instance.functionContext.runAsync;
    throttleRef.value = throttle((callback) => callback(), throttleWaitUnref, throttleOptionsUnref);

    // 问题：应该将 runAsync 用 debounce 包裹，但是 debounce 包裹后返回的不是我们要的 promise 导致只能迂回的在内部使用 Promise 包裹 debounce
    // https://github.com/lodash/lodash/issues/4400#issuecomment-834800398
    instance.functionContext.runAsync = (...args) => {
      return new Promise((resolve, reject) => {
        throttleRef.value(() => {
          originRunAsync(...args)
            .then(resolve)
            .catch(reject);
        });
      });
    };

    onCleanup(() => {
      throttleRef.value?.cancel();
      instance.functionContext.runAsync = originRunAsync;
    });
  });

  return {
    onCancel() {
      throttleRef.value?.cancel();
    },
  };
};

export default useThrottlePlugin;
