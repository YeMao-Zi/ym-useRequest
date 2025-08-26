import { type Plugin } from 'ym-userequest';

export const useFetchCancelPlugin: Plugin<any, any[]> = (instance, { controller }) => {
  // 如果没有提供 controller，则不处理
  if (!controller) {
    return {};
  }

  let currentController = new AbortController();

  return {
    onBefore() {
      // 检查当前 controller 是否已被终止
      if (currentController.signal.aborted) {
        // 创建新的 AbortController
        currentController = new AbortController();
      }
      return {};
    },

    onInit(service) {
      // 返回使用当前有效 controller 的服务包装器
      return {
        servicePromise: service(...instance.params.value, currentController.signal),
      };
    },

    onCancel() {
      // 终止当前请求
      currentController.abort();
    },
  };
};
