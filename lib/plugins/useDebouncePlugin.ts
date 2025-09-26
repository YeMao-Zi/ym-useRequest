import { ref, watchEffect, unref } from 'vue';
import type { Plugin } from '../type';
import debounce from '../utils/debounce';

const useDebouncePlugin: Plugin<unknown, unknown[]> = (instance, { debounceWait, debounceOptions }) => {
  const debouncedRef = ref<ReturnType<typeof debounce>>();

  watchEffect((onCleanup) => {
    if (!debounceWait) return;
    const debounceWaitUnref = unref(debounceWait);
    const debounceOptionsUnref = unref(debounceOptions);

    const originRunAsync = instance.functionContext.runAsync;
    debouncedRef.value = debounce((callback) => callback(), debounceWaitUnref, debounceOptionsUnref);

    // 问题：应该将 runAsync 用 debounce 包裹，但是 debounce 包裹后返回的不是我们要的 promise 导致只能迂回的在内部使用 Promise 包裹 debounce
    // https://github.com/lodash/lodash/issues/4400#issuecomment-834800398
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
