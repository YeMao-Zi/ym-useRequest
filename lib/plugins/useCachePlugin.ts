import { onBeforeUnmount } from 'vue';
import type { Plugin } from '../type';
import { isFunction } from '../utils';
import { setCache, getCache, type CacheData } from '../utils/cache';
import { subscribe } from '../utils/cacheSubscribe';
import { getCachePromise, setCachePromise } from '../utils/cachePromise';

const useCachePlugin: Plugin<any, any[]> = (
  instance,
  {
    cacheKey: customCacheKey,
    cacheTime = 5 * 60 * 1000,
    staleTime = 0,
    getCache: customSetCache,
    setCache: customGetCache,
  },
) => {
  if (!customCacheKey) {
    return {};
  }

  let unSubscribe = () => {};
  let currentPromise: Promise<any>;

  const cacheKey = (isFunction(customCacheKey) ? customCacheKey : () => customCacheKey) as (params?: any) => string;

  const _setCache = (key: string, cacheData: CacheData, time: number) => {
    if (customGetCache) {
      customGetCache(key, cacheData);
    } else {
      setCache(key, cacheData, time);
    }
  };

  const _getCache = (key: string) => {
    if (customSetCache) {
      return customSetCache(key);
    } else {
      return getCache(key);
    }
  };

  // get data from cache when init
  const cache = _getCache(cacheKey());
  if (cache && Reflect.has(cache, 'data')) {
    instance.data.value = cache.data;
    instance.params.value = cache.params;
  }

  // subscribe same cachekey update, trigger update
  const setUnSubscribe = (params?: any) => {
    unSubscribe = subscribe(cacheKey(params), (data) => {
      instance.data.value = data;
    });
  };
  setUnSubscribe();

  onBeforeUnmount(() => {
    unSubscribe();
  });

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
        };
      } else {
        // If the data is stale, return data, and request continue
        return { returnData: cache.data };
      }
    },
    onInit(service) {
      const params = instance.params.value;
      const _cacheKey = cacheKey(params);
      let servicePromise = getCachePromise(_cacheKey);
      // If has servicePromise, and is not trigger by self, then use it
      if (servicePromise && servicePromise !== currentPromise) {
        return () => servicePromise;
      }
      servicePromise = service();
      currentPromise = servicePromise;
      setCachePromise(_cacheKey, servicePromise);
      return () => servicePromise;
    },

    onSuccess(data, params) {
      const _cacheKey = cacheKey(params);
      if (_cacheKey) {
        // cancel subscribe, avoid trigger self
        unSubscribe();
        _setCache(_cacheKey, { data, params, time: new Date().getTime() }, cacheTime);
        setUnSubscribe(params);
      }
    },
    onMutate(data) {
      const params = instance.params.value;
      const _cacheKey = cacheKey(params);
      if (_cacheKey) {
        // cancel subscribe, avoid trigger self
        unSubscribe();
        _setCache(_cacheKey, { data, params, time: new Date().getTime() }, cacheTime);
        setUnSubscribe(params);
      }
    },
  };
};

export default useCachePlugin;
