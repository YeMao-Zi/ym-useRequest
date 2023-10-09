import type { ComputedRef, WatchSource, Ref } from 'vue';
export interface Options<R, P extends any[]> {
  // 是否手动发起请求
  manual?: boolean;

  // 当 manual 为false时，自动执行的默认参数
  defaultParams?: P;

  // 依赖项更新
  refreshDeps?: WatchSource<any>[];
  refreshDepsParams?: ComputedRef<P>;

  // 请求延时
  loadingDelay?: number;
  // 轮询
  pollingInterval?: number;
  // 请求前回调
  onBefore?: (params: P) => void;
  // 成功回调
  onSuccess?: (response: R, params: P) => void;
  // 失败回调
  onError?: (err: any, params: P) => void;
  // 接口完成回调
  onFinally?: () => void;
}

export type PluginHooks<R, P extends unknown[]> = {
  onBefore: (params: P) => {
    isBreak?: Boolean;
    breakResult?: any;
  } | void;
  onInit: (service: () => Promise<R>) => () => Promise<R>;
  onSuccess(data: R, params: P): void;
  onError(error: Error, params: P): void;
  onFinally(params: P, data: R, error: Error): void;
  onCancel(): void;
  onMutate(data: R): void;
};

export interface Instance<R, P extends unknown[]> extends State<R, P> {
  status: Ref<'pending' | 'settled'>;
  functionContext: FunctionContext<R, P>;
  plugins: Ref<Partial<PluginHooks<R, P>>[]>;
}

export type Plugin<R, P extends unknown[]> = (
  instance: Instance<R, P>,
  options: Options<R, P>,
) => Partial<PluginHooks<R, P>>;


export type State<R, P> = {
  data: Ref<R>;
  loading: Ref<boolean>;
  error?: any;
  params?: Ref<P>;
};

type MutateData<R> = (newData: R) => void;
type MutateFunction<R> = (arg: (oldData: R) => R) => void;
export interface Mutate<R> extends MutateData<R>, MutateFunction<R> {}
export type FunctionContext<R, P extends unknown[]> = {
  runAsync: (...arg: P) => Promise<R>;
  run: (...arg: P) => void;
  cancel: () => void;
  refresh: () => void;
  refreshAsync: () => Promise<R>;
  mutate: Mutate<R>;
};

export interface Request<R, P extends unknown[]> extends State<R, P>, FunctionContext<R, P> {}

export type Service<R, P extends unknown[]> = (...args: P) => Promise<R>;

export type CallPlugin<R> = {
  isBreak?: Boolean;
  breakResult?: any;
  servicePromise: Promise<R>;
};
