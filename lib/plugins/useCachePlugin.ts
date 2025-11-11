import { onBeforeUnmount } from 'vue';
import type { Plugin } from '../type';
import { isFunction } from '../utils';
import { setCache, getCache, type CacheData } from '../utils/cache';
import { subscribe, trigger } from '../utils/cacheSubscribe';
import { getCachePromise, setCachePromise } from '../utils/cachePromise';

const useCachePlugin: Plugin<unknown, unknown[]> = (
  instance,
  {
    cacheKey: customCacheKey,
    cacheTime = 5 * 60 * 1000,
    staleTime = 0,
    getCache: customGetCache,
    setCache: customSetCache,
    onCache,
  },
) => {
  if (!customCacheKey) {
    return {};
  }

  let unSubscribe = () => {};
  let currentPromise: Promise<any>;
  let currentCacheKey: string;

  const cacheKey = (isFunction(customCacheKey) ? customCacheKey : () => customCacheKey) as (params?: any) => string;

  const _setCache = (key: string, cacheData: CacheData, time: number) => {
    if (customSetCache) {
      customSetCache(key, cacheData);
    } else {
      setCache(key, cacheData, time);
    }
    trigger(key, cacheData.data);
  };

  const _getCache = (key: string) => {
    if (customGetCache) {
      return customGetCache(key);
    } else {
      return getCache(key);
    }
  };

  // get data from cache when init
  const initialCacheKey = cacheKey();
  const cache = _getCache(initialCacheKey);
  if (cache && Reflect.has(cache, 'data')) {
    instance.data.value = cache.data;
    instance.params.value = cache.params;
  }

  // subscribe same cachekey update, trigger update
  const setUnSubscribe = (params?: any) => {
    const newCacheKey = cacheKey(params);
    // 只有当 cacheKey 改变时才重新订阅
    if (newCacheKey !== currentCacheKey) {
      unSubscribe();
      currentCacheKey = newCacheKey;
      unSubscribe = subscribe(currentCacheKey, (data) => {
        instance.data.value = data;
        onCache?.(data);
      });
    }
  };
  setUnSubscribe();

  onBeforeUnmount(() => {
    unSubscribe();
  });

  // 提取公共的缓存更新逻辑
  const updateCache = (data: any, params: any[]) => {
    const _cacheKey = cacheKey(params);
    if (_cacheKey) {
      // cancel subscribe, avoid trigger self
      unSubscribe();
      _setCache(_cacheKey, { data, params, time: new Date().getTime() }, cacheTime);
      setUnSubscribe(params);
    }
  };

  return {
    onBefore(params) {
      const _cacheKey = cacheKey(params);
      const cache = _getCache(_cacheKey);
      if (!cache || !Reflect.has(cache, 'data')) {
        return {};
      }
      // If the data is fresh, stop request
      if (staleTime === -1 || new Date().getTime() - cache.time <= staleTime) {
        return {
          returnNow: true,
          returnData: cache.data,
          returnType: 'cache',
        };
      } else {
        // If the data is stale, return data, and request continue
        return { returnData: cache.data, returnType: 'cache' };
      }
    },
    onInit(service) {
      const params = instance.params.value;
      const _cacheKey = cacheKey(params);
      let servicePromise = getCachePromise(_cacheKey);
      // If has servicePromise, and is not trigger by self, then use it
      if (servicePromise && servicePromise !== currentPromise) {
        return { servicePromise };
      }
      servicePromise = service(...params);
      currentPromise = servicePromise;
      setCachePromise(_cacheKey, servicePromise);
      return { servicePromise };
    },

    onSuccess(data, params) {
      updateCache(data, params);
    },
    onMutate(data) {
      const params = instance.params.value;
      updateCache(data, params);
    },
  };
};

export default useCachePlugin;