import { ref, shallowRef, isRef } from 'vue';
import type { Ref } from 'vue';
import type { Service, Options, FunctionContext, Instance, PluginHooks, CallPlugin } from './type';
import { isFunction, unrefParams, getMayFunctionResult } from './utils';

function createInstance<R, P extends unknown[]>(service: Service<R, P>, options: Options<R, P>): Instance<R, P> {
  const { defaultData, defaultParams, onBefore, onRequest, onSuccess, onError, onFinally, onCancel, onCache } = options;

  const data = isRef(defaultData) ? defaultData : (ref(defaultData) as Ref<R>);
  const loading = ref(false);
  const params = ref(unrefParams(getMayFunctionResult(defaultParams))) as Ref<P>;
  const pollingCount = ref(0);
  const error = shallowRef();
  const status = ref() as Instance<R, P>['status'];
  const plugins = ref([]) as Instance<R, P>['plugins'];

  const count = ref(0);

  const callPlugin = (type: keyof PluginHooks<R, P>, ...args: any[]): CallPlugin<R> => {
    // @ts-ignore
    const res = plugins.value.map((i) => i[type]?.(...args));
    return Object.assign({}, ...res);
  };

  const functionContext = {} as FunctionContext<R, P>;

  let resolveTick: (context: { params: P; data: R }) => void;
  let tickPromise = new Promise<{ params: P; data: R }>((resolve) => {
    resolveTick = resolve;
  });

  // 提取重复的计数检查逻辑
  // if currentCount < count.value with race cancelled
  // if currentCount > count.value with cancel function
  const isCurrentRequest = (requestCount: number) => requestCount === count.value;

  // 重置 tickPromise 的方法
  const resetTickPromise = () => {
    tickPromise = new Promise((resolve) => {
      resolveTick = resolve;
    });
  };

  // 处理请求结果的函数
  const handleRequestSuccess = async (currentCount: number, res: R, args: P) => {
    if (!isCurrentRequest(currentCount)) {
      return;
    }

    error.value = undefined;
    const result = await onSuccess?.(res, args);
    data.value = result !== undefined ? (result as R) : res;
    callPlugin('onSuccess', data.value, args);
    return data.value;
  };

  // 处理请求错误的函数
  const handleRequestError = (currentCount: number, err: any, args: P) => {
    if (!isCurrentRequest(currentCount)) {
      return;
    }

    error.value = err;
    callPlugin('onError', err, args);
    onError?.(err, args);
    throw err;
  };

  // 处理请求完成的函数
  const handleRequestFinally = (currentCount: number, args: P) => {
    loading.value = false;
    status.value = 'settled';
    resolveTick({ params: params.value, data: data.value });

    // 检查是否是当前请求
    if (!isCurrentRequest(currentCount)) {
      return;
    }

    callPlugin('onFinally', args);
    onFinally?.();
  };

  // 发起请求的函数
  const makeRequest = async (currentCount: number, args: P) => {
    const { returnNow = false, returnData, returnType } = callPlugin('onBefore', args);
    if (returnData !== undefined) {
      data.value = returnData;
      if (returnType === 'cache') {
        onCache?.(returnData);
      }
    }
    if (returnNow) {
      loading.value = false;
      status.value = 'settled';
      return Promise.resolve(returnData);
    }
    onBefore?.(args);
    let { servicePromise } = callPlugin('onInit', service);
    if (!servicePromise) {
      servicePromise = service(...params.value);
    }

    try {
      const res = await servicePromise;

      onRequest?.({
        params: args,
        response: res,
        error: undefined,
        abort: !isCurrentRequest(currentCount),
      });

      return await handleRequestSuccess(currentCount, res, args);
    } catch (err: any) {
      onRequest?.({
        params: args,
        response: undefined,
        error: err,
        abort: !isCurrentRequest(currentCount),
      });

      return handleRequestError(currentCount, err, args);
    } finally {
      handleRequestFinally(currentCount, args);
    }
  };

  functionContext.runAsync = async (...args: P) => {
    loading.value = true;

    if (args?.length) {
      params.value = args;
    } else {
      if (isFunction(defaultParams)) {
        params.value = unrefParams(getMayFunctionResult(defaultParams));
      }
    }
    status.value = 'pending';
    count.value++;
    const currentCount = count.value;

    // 重置 tickPromise，避免状态复用
    resetTickPromise();

    return makeRequest(currentCount, args);
  };

  functionContext.run = (...args: P) => {
    functionContext.runAsync(...args).catch((err) => {
      !onError && console.error(err);
    });
  };

  functionContext.cancel = () => {
    count.value--;
    loading.value = false;
    callPlugin('onCancel');
    onCancel?.();
  };

  functionContext.refresh = () => functionContext.run(...params.value);

  functionContext.refreshAsync = () => functionContext.runAsync(...params.value);

  functionContext.mutate = (v: any) => {
    data.value = v?.constructor === Function ? v(data.value) : v;
    callPlugin('onMutate', data.value);
  };

  const requestTick = async (callback?: (res?: { params: P; data: R }) => void) => {
    if (status.value === 'pending') {
      const res = await tickPromise;
      callback?.(res as { params: P; data: R });
      return res;
    }
    callback?.();
  };

  return {
    status,
    data,
    params,
    pollingCount,
    loading,
    error,
    plugins,
    requestTick,
    functionContext,
  };
}

export default createInstance;
