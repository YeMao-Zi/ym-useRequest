import { ref, shallowRef } from 'vue';
import type { Ref } from 'vue';
import type { Service, Options, FunctionContext, Instance, PluginHooks, CallPlugin } from './type';
import { composeMiddleware } from './utils';

function createInstance<R, P extends unknown[]>(service: Service<R, P>, options: Options<R, P>): Instance<R, P> {
  const { defaultParams, onBefore, onSuccess, onError, onFinally, onCancel } = options;

  const data = shallowRef() as Ref<R>;
  const loading = ref(false);
  const params = ref(defaultParams) as Ref<P>;
  const pollingCount = ref(0);
  const error = shallowRef();
  const status = shallowRef('pending') as Instance<R, P>['status'];
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

    const { returnNow = false, returnData } = callPlugin('onBefore', args);

    if (returnNow) {
      status.value = 'settled';
      data.value = returnData;
      loading.value = false;
      return returnData;
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
    await serverWrapper()
      .then((res) => {
        if (currentCount !== count.value) {
          return;
        }
        data.value = res;
        error.value = undefined;
        callPlugin('onSuccess', data.value, args);
        onSuccess?.(res, args);
      })
      .catch((err: any) => {
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
