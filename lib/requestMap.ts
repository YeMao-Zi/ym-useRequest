import type { UseRequestResult } from './type';

// 使用全局对象存储 Map，确保打包后所有模块共享同一个实例
const GLOBAL_KEY = '__YM_USE_REQUEST_INSTANCES__';

// 扩展 globalThis 类型
declare global {
  // eslint-disable-next-line no-var
  var __YM_USE_REQUEST_INSTANCES__: Map<string, UseRequestResult<any, any>> | undefined;
}

function getRequestInstances(): Map<string, UseRequestResult<any, any>> {
  if (!globalThis[GLOBAL_KEY]) {
    globalThis[GLOBAL_KEY] = new Map<string, UseRequestResult<any, any>>();
  }
  return globalThis[GLOBAL_KEY]!;
}

export function setRequest(id: string, requestInstance: UseRequestResult<any, any>) {
  getRequestInstances().set(id, requestInstance);
}

// 通过 id 获取 useRequest 实例
export function getRequest<R, P extends unknown[] = any>(id: string): UseRequestResult<R, P> | undefined {
  return getRequestInstances().get(id);
}

// 清除指定 id 的实例
export function removeRequest(id: string): boolean {
  return getRequestInstances().delete(id);
}
