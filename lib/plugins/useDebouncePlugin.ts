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

    // 问题：应该将 runAsync 用 debounce 包裹，但是 debounce 包裹后返回的不是我们要的 promise 导致只能迂回的在内部使用 Promise 包裹 debounce
    // 结果：runAsync 其实被执行多次，但 debouncedRef 只执行了 runAsync 的最后一次（虽然防抖了但参数不是第一次的触发参数而是最后一次触发的参数）
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
