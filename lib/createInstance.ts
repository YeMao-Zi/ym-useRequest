import { ref, shallowRef, isRef } from 'vue';
import type { Ref } from 'vue';
import type { Service, Options, FunctionContext, Instance, PluginHooks, CallPlugin } from './type';
import { composeMiddleware } from './utils';

function createInstance<R, P extends unknown[]>(service: Service<R, P>, options: Options<R, P>): Instance<R, P> {
  const { defaultData, defaultParams, onBefore, onRequest, onSuccess, onError, onFinally, onCancel, onCache } = options;

  const data = isRef(defaultData) ? defaultData : (ref(defaultData) as Ref<R>);
  const loading = ref(false);
  const params = ref(defaultParams) as Ref<P>;
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

  let resolveTick: (value?: unknown) => void;
  const tickPromise = new Promise((resolve) => {
    resolveTick = resolve;
  });

  functionContext.runAsync = async (...args: P) => {
    loading.value = true;
    if (args?.length) {
      params.value = args;
    }
    status.value = 'pending';
    count.value++;
    const currentCount = count.value;
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

    return servicePromise
      .then(async (res) => {
        onRequest?.({
          params: args,
          response: res,
          error: undefined,
          abort: currentCount !== count.value,
        });
        // if currentCount < count.value with race cancelled
        // if currentCount > count.value with cancel function
        if (currentCount !== count.value) {
          return;
        }
        error.value = undefined;
        const result = await onSuccess?.(res, args);
        if (result !== undefined) {
          data.value = result as R;
        } else {
          data.value = res;
        }
        callPlugin('onSuccess', data.value, args);
        return data.value;
      })
      .catch((err: any) => {
        onRequest?.({
          params: args,
          response: undefined,
          error: err,
          abort: currentCount !== count.value,
        });
        if (currentCount !== count.value) {
          return;
        }
        error.value = err;
        callPlugin('onError', err, args);
        onError?.(err, args);
        throw err;
      })
      .finally(() => {
        loading.value = false;
        status.value = 'settled';
        resolveTick();
        if (currentCount !== count.value) {
          return;
        }
        callPlugin('onFinally', args);
        onFinally?.();
      });
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

  const requestTick = async (callback?: () => void) => {
    if (status.value === 'pending') {
      await tickPromise;
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
