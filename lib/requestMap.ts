import type { UseRequestResult } from './type';
// 存储所有带 id 的 useRequest 实例
const requestInstances = new Map<string, UseRequestResult<any, any>>();

// 将实例存储起来
export function setRequest(id: string, requestInstance: UseRequestResult<any, any>) {
  requestInstances.set(id, requestInstance);
}

// 通过 id 获取 useRequest 实例
export function getRequest<R, P extends unknown[] = any>(id: string): UseRequestResult<R, P> | undefined {
  return requestInstances.get(id);
}

// 清除指定 id 的实例
export function removeRequest(id: string): boolean {
  return requestInstances.delete(id);
}
