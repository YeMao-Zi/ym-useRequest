import type { ComputedRef, WatchSource, Ref } from 'vue';
export interface Options<T, P extends any[]> {
  // 是否手动发起请求
  manual?: boolean;

  // 当 manual 为false时，自动执行的默认参数
  defaultParams?: P;

  // 依赖项更新
  refreshDeps?: WatchSource<any>[];
  refreshDepsParams?: ComputedRef<P>;

  // 请求延时
  loadingDelay?: number;
  // 同步请求
  queryKey?: (...args: P) => string;

  // 成功后的数据处理
  onSuccessBefore?: (response: T) => T;

  // 成功回调
  onSuccess?: (response: T, params: P) => void;

  // 失败回调
  onError?: (err: any, params: P) => void;

  // 接口完成回调
  onComplete?: () => void;
}

export interface IRequestResult<T> {
  data: Ref<T>;
  loading: boolean;
  error?: any;
}
