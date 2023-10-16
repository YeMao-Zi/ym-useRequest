import { ref, watchEffect, unref } from 'vue';
import type { Plugin } from '../type';
import debounce from '../utils/debounce';

const useDebouncePlugin: Plugin<any, any[]> = (instance, { debounceWait, debounceOptions }) => {
  const debouncedRef = ref<ReturnType<typeof debounce>>();

  watchEffect((onCleanup) => {
    if (!debounceWait) return;
    const debounceWaitUnref = unref(debounceWait);
    const debounceOptionsUnref = unref(debounceOptions);

    const originRunAsync = instance.functionContext.runAsync;
    debouncedRef.value = debounce((callback) => callback(), debounceWaitUnref, debounceOptionsUnref);

    instance.functionContext.runAsync = (...args) => {
      return new Promise((resolve, reject) => {
        debouncedRef.value(() => {
          originRunAsync(...args)
            .then(resolve)
            .catch(reject);
        });
      });
    };

    onCleanup(() => {
      debouncedRef.value?.cancel();
      instance.functionContext.runAsync = originRunAsync;
    });
  });

  return {
    onCancel() {
      debouncedRef.value?.cancel();
    },
  };
};

export default useDebouncePlugin;
