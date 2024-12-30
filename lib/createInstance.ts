import { ref, shallowRef, isRef, watch } from 'vue';
import type { Ref } from 'vue';
import type { Service, Options, FunctionContext, Instance, PluginHooks, CallPlugin } from './type';
import { composeMiddleware } from './utils';

function createInstance<R, P extends unknown[]>(service: Service<R, P>, options: Options<R, P>): Instance<R, P> {
  const { defaultData, defaultParams, onBefore, onSuccess, onError, onFinally, onCancel, onCache } = options;

  const data = isRef(defaultData) ? defaultData : shallowRef(defaultData);
  const loading = ref(false);
  const params = ref(defaultParams) as Ref<P>;
  const pollingCount = ref(0);
  const error = shallowRef();
  const status = ref('pending') as Instance<R, P>['status'];
  const plugins = ref([]) as Instance<R, P>['plugins'];

  const count = ref(0);

  // 执行所有插件勾子
  const callPlugin = (type: keyof PluginHooks<R, P>, ...args: any[]): CallPlugin<R> => {
    if (type == 'onInit') {
      const InstanceFn = plugins.value.map((i) => i.onInit).filter(Boolean);
      // 为所有 plugins 执行一次 onInit，并层层传递 service 最终重新将 处理包装后的 service 返回
      return { servicePromise: composeMiddleware(InstanceFn, args[0])() };
    } else {
      // @ts-ignore
      const res = plugins.value.map((i) => i[type]?.(...args));
      return Object.assign({}, ...res);
    }
  };

  const functionContext = {} as FunctionContext<R, P>;

  functionContext.runAsync = async (...args: P) => {
    loading.value = true;
    if (args?.length) {
      params.value = args;
    }
    status.value = 'pending';
    count.value++;
    const currentCount = count.value;

    const { returnNow = false, returnData, returnType } = callPlugin('onBefore', args);

    if (returnNow) {
      loading.value = false;
      status.value = 'settled';
      if (returnType === 'cache') {
        const res = await onCache(returnData);
        if (res) {
          data.value = res;
          return Promise.resolve(returnData);
        }
      }
      data.value = returnData;
      return Promise.resolve(returnData);
    }

    if (returnData) {
      data.value = returnData;
    }
    onBefore?.(args);
    let serverWrapper = () => new Promise<R>((resolve) => resolve(service(...params.value)));
    let { servicePromise } = callPlugin('onInit', serverWrapper);
    if (servicePromise) {
      serverWrapper = () => servicePromise;
    }
    return await serverWrapper()
      .then(async (res) => {
        if (currentCount !== count.value) {
          return new Promise(() => {});
        }
        error.value = undefined;
        callPlugin('onSuccess', res, args);
        const result = await onSuccess?.(res, args);
        if (result) {
          data.value = result;
        } else {
          data.value = res;
        }
        return data.value;
      })
      .catch((err: any) => {
        if (currentCount !== count.value) {
          return new Promise(() => {});
        }
        error.value = err;
        callPlugin('onError', err, args);
        onError?.(err, args);
        throw err;
      })
      .finally(() => {
        loading.value = false;
        status.value = 'settled';
        if (currentCount !== count.value) {
          return new Promise(() => {});
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
    data.value = v.constructor === Function ? v(data.value) : v;
    callPlugin('onMutate', data.value);
  };

  return {
    status,
    data,
    params,
    pollingCount,
    loading,
    error,
    plugins,
    functionContext,
  };
}

export default createInstance;
