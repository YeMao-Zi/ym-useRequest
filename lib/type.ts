import type { WatchSource, Ref, ShallowRef } from 'vue';
import type { CacheData } from './utils/cache';

interface DebounceOptionsBase {
  // 是否在延迟开始前执行
  leading?: boolean;
  // 是否在延迟开始后执行
  trailing?: boolean;
  // 允许被延迟的最大值
  maxWait?: number;
}

interface ThrottleOptionsBase {
  // 是否在延迟开始前执行
  leading?: boolean;
  // 是否在延迟开始后执行
  trailing?: boolean;
}

export type Params<P extends any[]> = Ref<P> | P | P[0] | Ref<P[0]>;

export type MaybePromise<T> = T | Promise<T>;

export type UseRequest<R, P extends unknown[] = any> = (
  service: Service<R, P>,
  options?: Options<R, P>,
  plugins?: Plugin<R, P>[],
) => UseRequestResult<R, P>;

export type UseRequestMiddleware<R, P extends unknown[]> = (
  next: UseRequest<R, P>,
) => (service: Service<R, P>, options?: Options<R, P>, plugins?: Plugin<R, P>[]) => UseRequestResult<R, P>;

export interface Options<R, P extends any[]> {
  // 请求标识
  id?: string;
  // 是否手动发起请求
  manual?: boolean;

  // 设置默认 data
  defaultData?: R | Ref<R>;

  // 当 manual 为 false 时，自动执行的默认参数
  defaultParams?: Params<P> | (() => Params<P>);

  // 监听依赖
  refreshDeps?: WatchSource<any>[] | WatchSource<any>;
  // 依赖变更后的执行参数，若为函数会执行该函数，有返回值则会将返回值作为参数发起一次请求
  refreshDepsParams?: Params<P> | ((value: P, oldValue: P) => void | Params<P>);

  // 错误重试次数
  retryCount?: number;
  // 重试时间间隔
  retryInterval?: number;

  // 请求延时
  loadingDelay?: number;

  // 轮询
  pollingInterval?: Ref<number> | number;
  // 轮询错误重试
  pollingErrorRetryCount?: number;

  // 是否允许请求
  ready?: (() => Ref<boolean> | boolean) | (Ref<boolean> | boolean);

  // 防抖等待时间
  debounceWait?: Ref<number> | number;
  // 防抖函数属性
  debounceOptions?: Ref<DebounceOptionsBase> | DebounceOptionsBase;
  // 节流等待时间
  throttleWait?: Ref<number> | number;
  // 节流函数属性
  throttleOptions?: Ref<ThrottleOptionsBase> | ThrottleOptionsBase;
  // 缓存的唯一标识
  cacheKey?: string | ((params?: P) => string);
  // 缓存时间
  cacheTime?: number;
  // 缓存数据保持新鲜时间(什么时候会重新发送请求更新缓存)
  staleTime?: number;
  // 自定义获取缓存
  getCache?: (cacheKey: string) => CacheData;
  // 自定义设置缓存
  setCache?: (cacheKey: string, cacheData: CacheData) => void;
  // 在浏览器页面重新显示时，重新发起请求
  refreshOnWindowFocus?: Ref<boolean> | boolean;
  // 离开浏览器页面时，取消请求
  cancelOnWindowBlur?: Ref<boolean> | boolean;
  // 重新请求间隔，单位为毫秒
  focusTimespan?: Ref<number> | number;
  // 获取缓存时
  onCache?: (response: R) => void;
  // 请求前回调
  onBefore?: (params: P) => void;
  // 每次请求被执行时回调
  onRequest?: ({ params, response, error, abort }: { params: P; response: R; error: any; abort: boolean }) => void;
  // 成功回调
  onSuccess?: (response: R, params: P) => MaybePromise<void | R>;
  // 失败回调
  onError?: (err: any, params: P) => void;
  // 执行完成回调
  onFinally?: () => void;
  // 取消响应回调
  onCancel?: () => void;
  // 中间件
  use?: UseRequestMiddleware<R, P>[];

  [key: string]: any;
}

export type PluginHooks<R, P extends unknown[]> = {
  onBefore: (params: P) => onBeforePlugin | void;
  onInit: (service: (...args: P) => Promise<R>) => { servicePromise: Promise<R> };
  onSuccess(data: R, params: P): void;
  onError(error: Error, params: P): void;
  onFinally(params: P, data: R, error: Error): void;
  onCancel(): void;
  onMutate(data: R): void;
};

export interface Instance<R, P extends unknown[]> extends State<R, P> {
  functionContext: FunctionContext<R, P>;
  plugins: Ref<Partial<PluginHooks<R, P>>[]>;
}

export type Plugin<R, P extends unknown[]> = (
  instance: Instance<R, P>,
  options: Options<R, P>,
) => Partial<PluginHooks<R, P>>;

export type State<R, P> = {
  status: Ref<'pending' | 'settled'>;
  data: Ref<R>;
  loading: Ref<boolean>;
  error: ShallowRef<any>;
  params: Ref<P>;
  pollingCount: Ref<number>;
  requestTick: (callback?: (context: { params: P; data: R }) => void) => Promise<{ params: P; data: R }>;
  [key: string]: any;
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

export interface UseRequestResult<R, P extends unknown[]> extends State<R, P>, FunctionContext<R, P> {}

export type Service<R, P extends unknown[]> = (...args: P) => Promise<R>;

export type onBeforePlugin = {
  returnNow?: boolean;
  returnData?: any;
  returnType?: 'cache';
};

export type CallPlugin<R> = {
  servicePromise?: Promise<R>;
} & onBeforePlugin;
