import { ComputedRef, WatchSource, reactive, toRefs, watch } from "vue";

export interface Options<T, P extends any[]> {
  // 是否手动发起请求
  manual?: boolean;

  // 当 manual 为false时，自动执行的默认参数
  defaultParams?: P;

  // 依赖项更新
  refreshDeps?: WatchSource<any>[];
  refreshDepsParams?: ComputedRef<P>;

  // 同步请求
  queryKey?: (...args: P) => string;

  // 成功回调
  onSuccess?: (response: T, params: P) => void;

  // 失败回调
  onError?: (err: any, params: P) => void;

  // 接口完成回调
  onComplete?: () => void
}

export interface IRequestResult<T> {
  data: T | null;
  loading: boolean;
  err?: any;
}

const queryMap = new Map()

const defaultQuerise = Symbol("default"); // 默认为非 queryKey 维护的普通请求

export function useRequest<T, P extends any[]>(
  service: (...args: P) => Promise<T>,
  options: Options<T, P> = {},
) {
  const {
    manual = false,
    defaultParams = [] as unknown as P,
    refreshDeps = null,
    refreshDepsParams = null,
    queryKey = null,
    onSuccess,
    onError,
    onComplete
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
        querise[key].data = res;
        querise[key].err = undefined;
        onSuccess && onSuccess(res, args);
      })
      .catch((err: any) => {
        querise[key].err = err;
        onError && onError(err, args);
      })
      .finally(() => {
        querise[key].loading = false;
        queryKey && queryMap.delete(queryKey)
        onComplete && onComplete()
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
      queryMap.set(queryKey, run)
    } else {
      run(...defaultParams);
    }
  }

  async function runQueryList() {
    for await (let value of queryMap.values()) {
      value()
    }
  }

  return {
    run,
    runQueryList,
    querise,
    ...toRefs(querise[defaultQuerise]),
  };
}
