import type { Plugin } from '../type';
import { isFunction } from '../utils';
import { setCache, getCache, type CacheData } from '../utils/cache';

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
  const cacheKey = (isFunction(customCacheKey) ? customCacheKey : () => customCacheKey) as (params?: any) => string;
  if (!cacheKey) {
    return {};
  }

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

  return {
    onBefore(params) {
      const _cacheKey = cacheKey(params);
      const cache = _getCache(_cacheKey);

      if (!cache || !Reflect.has(cache, 'data')) {
        return {};
      }

      if (staleTime === -1 || new Date().getTime() - cache.time <= staleTime) {
        return {
          returnNow: true,
          data: cache.data,
        };
      } else {
        return {};
      }
    },
    // onInit(service) {
    //   const params = instance.params.value;
    //   const _cacheKey = cacheKey(params);
    //   const servicePromise = service();
    // },

    onSuccess(data, params) {
      const _cacheKey = cacheKey(params);
      if (_cacheKey) {
        _setCache(_cacheKey, { data, params, time: new Date().getTime() }, cacheTime);
      }
    },
    onMutate(data) {
      const params = instance.params.value;
      const _cacheKey = cacheKey(params);
      if (_cacheKey) {
        _setCache(_cacheKey, { data, params, time: new Date().getTime() }, cacheTime);
      }
    },
  };
};

export default useCachePlugin;
