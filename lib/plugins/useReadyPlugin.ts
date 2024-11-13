import { watch, ref } from 'vue';
import type { Plugin } from '../type';

const useReadyPlugin: Plugin<any, any[]> = (instance, { ready = ref(true), manual }) => {
  watch(
    ready,
    (v) => {
      if (v && !manual) {
        instance.functionContext.run(...instance.params.value);
      }
    },
    { flush: 'sync' },
  );

  return {
    onBefore() {
      if (!ready.value) {
        instance.loading.value = false;
        return {
          returnNow: true,
          returnData: undefined,
        };
      }
    },
  };
};

export default useReadyPlugin;
