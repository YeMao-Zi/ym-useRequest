import { ref, unref } from '../utils/reactive';
import type { Plugin } from '../type';
import debounce from '../utils/debounce';

const useDebouncePlugin: Plugin<unknown, unknown[]> = (instance, { debounceWait, debounceOptions }) => {
  const debouncedRef = ref<ReturnType<typeof debounce> | undefined>(undefined);
  // 保存最原始的 runAsync，避免在重新设置时丢失
  const originalRunAsync = instance.functionContext.runAsync;
  let lastDebounceWait: number | undefined;
  let lastDebounceOptions: any;

  // 初始化防抖函数
  const setupDebounce = () => {
    if (!debounceWait) return;
    const debounceWaitUnref = unref(debounceWait);
    const debounceOptionsUnref = unref(debounceOptions);

    // 检查是否变化
    if (debounceWaitUnref === lastDebounceWait && debounceOptionsUnref === lastDebounceOptions) {
      return;
    }

    lastDebounceWait = debounceWaitUnref;
    lastDebounceOptions = debounceOptionsUnref;

    // 清理旧的防抖函数
    debouncedRef.value?.cancel();
    
    debouncedRef.value = debounce((callback) => callback(), debounceWaitUnref, debounceOptionsUnref);

    // 问题：应该将 runAsync 用 debounce 包裹，但是 debounce 包裹后返回的不是我们要的 promise 导致只能迂回的在内部使用 Promise 包裹 debounce
    // https://github.com/lodash/lodash/issues/4400#issuecomment-834800398
    instance.functionContext.runAsync = (...args) => {
      return new Promise((resolve, reject) => {
        debouncedRef.value!(() => {
          originalRunAsync(...args)
            .then(resolve)
            .catch(reject);
        });
      });
    };
  };

  setupDebounce();

  return {
    onBefore() {
      // 检查 debounceWait 是否变化，如果变化则重新设置
      if (debounceWait) {
        setupDebounce();
      }
    },
    onCancel() {
      debouncedRef.value?.cancel();
      instance.functionContext.runAsync = originalRunAsync;
    },
  };
};

export default useDebouncePlugin;
