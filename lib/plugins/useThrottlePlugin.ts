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
