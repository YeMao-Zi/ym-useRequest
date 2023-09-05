import { reactive, toRefs, watch } from 'vue';
import { Options, IRequestResult } from './type';

const queryMap = new Map();

const defaultQuerise = Symbol('default'); // 默认为非 queryKey 维护的普通请求

export function useRequest<T, P extends any[]>(service: (...args: P) => Promise<T>, options: Options<T, P> = {}) {
  const {
    manual = false,
    defaultParams = [] as unknown as P,
    refreshDeps = null,
    refreshDepsParams = null,
    queryKey = null,
    onSuccessBefore,
    onSuccess,
    onError,
    onComplete,
  } = options;
  const querise = reactive<Record<string | symbol, IRequestResult<T>>>({
    [defaultQuerise]: {
      data: null,
      loading: false,
      err: undefined,
    },
  });

  const serviceFn = async (...args: P) => {
    const key = queryKey ? queryKey(...args) : defaultQuerise;
    if (!querise[key]) {
      querise[key] = {} as any;
    }
    querise[key].loading = true;
    service(...args)
      .then((res) => {
        if (onSuccessBefore) {
          querise[key].data = onSuccessBefore(res) || res;
        } else {
          querise[key].data = res;
        }
        querise[key].err = undefined;
        onSuccess && onSuccess(res, args);
      })
      .catch((err: any) => {
        querise[key].err = err;
        onError && onError(err, args);
      })
      .finally(() => {
        querise[key].loading = false;
        queryKey && queryMap.delete(queryKey);
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
    if (queryKey) {
      queryMap.set(queryKey, { fn: run, params: defaultParams });
    } else {
      run(...defaultParams);
    }
  }

  async function runQueryList() {
    for await (const value of queryMap.values()) {
      value.fn(...value.params);
    }
  }

  return {
    run,
    runQueryList,
    querise,
    ...toRefs(querise[defaultQuerise]),
  };
}

export default useRequest;
