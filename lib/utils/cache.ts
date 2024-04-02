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

const cache = new Map<CachedKey, CacheMapValue>();

const setCache = (key: CachedKey, value: CacheData, cacheTime: number) => {
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
  return cache.get(key);
};

const clearCache = (key: CachedKey | CachedKey[]) => {
  if (key) {
    const cachedKeys = Array.isArray(key) ? key : [key];
    cachedKeys.forEach((cachedKey) => cache.delete(cachedKey));
  } else {
    cache.clear();
  }
};

export { setCache, getCache, clearCache };
