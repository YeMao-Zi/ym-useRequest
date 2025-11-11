type Timer = ReturnType<typeof setTimeout> | undefined;
export interface CacheData<D = any, p = any> {
  data: D;
  params: p;
  time: number;
}

interface CacheMapValue extends CacheData {
  timer: Timer;
}

type CachedKey = string;

// 使用全局对象存储 Map，确保打包后所有模块共享同一个实例
const GLOBAL_CACHE_KEY = '__YM_USE_REQUEST_CACHE__';

// 扩展 globalThis 类型
declare global {
  // eslint-disable-next-line no-var
  var __YM_USE_REQUEST_CACHE__: Map<CachedKey, CacheMapValue> | undefined;
}

function getCacheMap(): Map<CachedKey, CacheMapValue> {
  if (!globalThis[GLOBAL_CACHE_KEY]) {
    globalThis[GLOBAL_CACHE_KEY] = new Map<CachedKey, CacheMapValue>();
  }
  return globalThis[GLOBAL_CACHE_KEY]!;
}

const setCache = (key: CachedKey, value: CacheData, cacheTime: number) => {
  const cache = getCacheMap();
  const currentCache = cache.get(key);
  if (currentCache?.timer) {
    clearTimeout(currentCache.time);
  }
  let timer: Timer;
  if (cacheTime > -1) {
    timer = setTimeout(() => {
      cache.delete(key);
    }, cacheTime);
  }
  cache.set(key, {
    ...value,
    timer,
  });
};

const getCache = (key: CachedKey) => {
  return getCacheMap().get(key);
};

const clearCache = (key?: CachedKey | CachedKey[]) => {
  const cache = getCacheMap();
  if (key) {
    const cachedKeys = Array.isArray(key) ? key : [key];
    cachedKeys.forEach((cachedKey) => cache.delete(cachedKey));
  } else {
    cache.clear();
  }
};

export { setCache, getCache, clearCache };
