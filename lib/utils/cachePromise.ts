type CachedKey = string | number;

// 使用全局对象存储 Map，确保打包后所有模块共享同一个实例
const GLOBAL_CACHE_PROMISE_KEY = '__YM_USE_REQUEST_CACHE_PROMISE__';

// 扩展 globalThis 类型
declare global {
  // eslint-disable-next-line no-var
  var __YM_USE_REQUEST_CACHE_PROMISE__: Map<CachedKey, Promise<any>> | undefined;
}

function getCachePromiseMap(): Map<CachedKey, Promise<any>> {
  if (!globalThis[GLOBAL_CACHE_PROMISE_KEY]) {
    globalThis[GLOBAL_CACHE_PROMISE_KEY] = new Map<CachedKey, Promise<any>>();
  }
  return globalThis[GLOBAL_CACHE_PROMISE_KEY]!;
}

const getCachePromise = (cacheKey: CachedKey) => {
  return getCachePromiseMap().get(cacheKey);
};

const setCachePromise = (cacheKey: CachedKey, promise: Promise<any>) => {
  const cachePromise = getCachePromiseMap();
  // Should cache the same promise, cannot be promise.finally
  // Because the promise.finally will change the reference of the promise
  cachePromise.set(cacheKey, promise);

  // no use promise.finally for compatibility
  promise
    .then((res) => {
      cachePromise.delete(cacheKey);
      return res;
    })
    .catch(() => {
      cachePromise.delete(cacheKey);
    });
};

export { getCachePromise, setCachePromise };
