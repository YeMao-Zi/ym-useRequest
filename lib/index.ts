import { reactive, toRefs, watch } from 'vue';
import type { Options, IRequestResult } from './type';
import { useDelay } from './utils';

export function useRequest<T, P extends any[]>(service: (...args: P) => Promise<T>, options: Options<T, P> = {}) {
  const {
    manual = false,
    defaultParams = [] as unknown as P,
    refreshDeps = null,
    refreshDepsParams = null,
    loadingDelay,
    onSuccessBefore,
    onSuccess,
    onError,
    onComplete,
  } = options;

  const QUERY = reactive<IRequestResult<T>>({
    data: null,
    loading: false,
    error: undefined,
  });

  const serviceFn = async (...args: P) => {
    // 延时 loading
    useDelay(() => {
      !QUERY.data && (QUERY.loading = true);
    }, loadingDelay);

    service(...args)
      .then((res) => {
        if (onSuccessBefore) {
          QUERY.data = onSuccessBefore(res) || res;
        } else {
          QUERY.data = res;
        }
        QUERY.error = undefined;
        onSuccess && onSuccess(res, args);
      })
      .catch((err: any) => {
        QUERY.error = err;
        onError && onError(err, args);
      })
      .finally(() => {
        QUERY.loading = false;
        onComplete && onComplete();
      });
  };

  const run = serviceFn;
  // 依赖更新
  if (refreshDeps) {
    watch(
      refreshDeps,
      () => {
        run(...(refreshDepsParams?.value || ([] as unknown as P)));
      },
      { deep: true },
    );
  }

  if (!manual) {
    run(...defaultParams);
  }

  return { run, ...toRefs(QUERY) };
}

export default useRequest;
