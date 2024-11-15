## 介绍

接口的手动管理，包括请求状态，请求数据，手动更新，自动更新，回调，监听数据并更新

## 安装

npm install ym-userequest

## 使用

### 1.手动执行

```ts
import { useRequest } from 'ym-userequest';
const { data, loading, run, runAsync, refresh, refreshAsync, cancel } = useRequest(somePromise, { manual: true });
const somePromise = () => {
  return new Promise((resolve, reject) => {
    resolve('请求成功');
  });
};
run(); // 手动触发一次
// runAsync(); // 同 run , 但返回的是一个 promise
// refresh(); // 使用上次的参数重新请求
// refreshAsync(); // 同 refresh , 但返回的是一个 promise
// cancel(); // 取消请求
```

### 2.自动执行一次并带默认参数

```ts
const somePromise = (params1, params2) => {
  return new Promise((resolve, reject) => {
    resolve({ params1, params2 });
  });
};
const { data, loading } = useRequest(somePromise, {
  defaultParams: ['参数1', '参数2'],
});
```

### 3.监听响应式数据并自动执行更新数据

```ts
const pages = reactive({
  page: 1,
  loadingEnd: null,
});
const somePromise = (pages: { page: number }): Promise<any[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(new Array(pages.page).fill(1));
    }, 1000);
  });
};

const refreshDepsParams = computed(() => [
  {
    page: pages.page,
  },
]);
const { data, loading } = useRequest(somePromise, {
  defaultParams: [{ page: 1 }], // 默认数据
  refreshDeps: [() => pages.page], // 监听的依赖
  refreshDepsParams: refreshDepsParams, // 可选，依赖变更后执行的参数,不传则在依赖变更后执行 refresh
  onSuccess(data, params) {
    if (data.length > 5) {
      pages.loadingEnd = '已达最大数量5';
    }
  },
});
mutate(() => []); // 手动设置 data 值
const onClick = () => {
  !pages.loadingEnd && pages.page++;
};
```

### 4.延时 loading

使用 loadingDelay 定义一个 loading 的延时时间，避免请求时间较短时出现 loading 闪烁

```ts
const somePromise = (params) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(params);
    }, 300);
  });
};
const { data, loading } = useRequest(somePromise, {
  defaultParams: ['参数1'],
  loadingDelay: 1000, // 1s 内loading状态都不会改变
});
```

### 5.修改 data 数据

```ts
const somePromise = () => {
  return new Promise((resolve, reject) => {
    resolve(1);
  });
};

const { data, loading, mutate } = useRequest(somePromise);

mutate(5555);

const onChange = () => {
  mutate((res) => {
    return res + 1;
  });
};

// 最终 data 结果为 2
```

### 6.轮询

```ts
const somePromise = () => {
  return new Promise((resolve, reject) => {
    resolve(1);
  });
};
// 每 3000 ms 进行一次请求
const { data, run, cancel } = useRequest(somePromise, {
  pollingInterval: 3000,
});

const onRun = () => {
  run(); // 继续轮询
};

const onCancel = () => {
  cancel(); // 停止轮询
};
```

错误重试

```ts
const errPromise = () => {
  return new Promise((resolve, reject) => {
    reject('请求出错了');
  });
};
const { data, run, cancel } = useRequest(errPromise, {
  pollingInterval: 3000,
  pollingErrorRetryCount: 3, // 请求错误重试，将在三次轮询后不再轮询
});
```

轮询次数

在进行一次 cancel 后，轮询次数会被清空

```ts
const somePromise = () => {
  return new Promise((resolve, reject) => {
    resolve(1);
  });
};
const { cancel, pollingCount } = useRequest(somePromise, {
  pollingInterval: 100,
  onFinally() {
    if (pollingCount.value === 3) {
      cancel();
    }
  },
});
```

### 7.允许请求

ready 参数控制本次请求是否被允许，若 ready 为 false ，该请求始终不会被允许

```ts
const somePromise = () => {
  return new Promise((resolve, reject) => {
    resolve(1);
  });
};

const ready = ref(false);
const { data } = useRequest(somePromise, {
  ready,
});
console.log(data.value); // null
ready.value = true;
console.log(data.value); // 1
```

### 8.函数防抖

有一个问题：防抖内部使用的是 lodash 的 debounce 方法，但由于 debounce 不是 promise,只能在内部的 promise 中包裹 debounce，导致了防抖后的参数不是第一次的触发参数而是最后一次触发的参数

```ts
const somePromise = () => {
  return new Promise((resolve, reject) => {
    resolve(1);
  });
};

const { data, run } = useRequest(somePromise, {
  manual: true,
  debounceWait: 2000,
  debounceOptions: {
    // 参数同 loadsh 的 debounce
    leading: true,
    trailing: false,
  },
});

const onRun = () => {
  run();
};
```

### 9.函数节流

```ts
const somePromise = () => {
  return new Promise((resolve, reject) => {
    resolve(1);
  });
};

const { data, run } = useRequest(somePromise, {
  manual: true,
  throttleWait: 2000,
  throttleOptions: {
    // 参数同 loadsh 的 debounce
    leading: true,
    trailing: false,
  },
});

const onRun = () => {
  run();
};
```

### 10.缓存

```ts
import { useRequest, clearCache } from 'ym-userequest';
const somePromise = (value) => {
  return new Promise((resolve, reject) => {
    resolve(value);
  });
};

const { data, run } = useRequest(somePromise, {
  manual: true,
  cacheKey: 'test',
  cacheTime: 5000,
  // 自定义设置缓存
  // setCache(cacheKey, data) {
  //   localStorage.setItem(cacheKey, JSON.stringify(data));
  // },
  // 自定义获取缓存
  // getCache(cacheKey) {
  //   return JSON.parse(localStorage.getItem(cacheKey) || 'null');
  // },
});

run(1); // 1
run(2); // 1

// 手动清除缓存 clearCache(params?:string[]|string)
// clearCache()

setTimeOut(() => {
  run(2);
}, 5000); // 2
```

## 所有配置项

```ts
{
  // 是否手动发起请求
  manual?: boolean;

  // 当 manual 为 false 时，自动执行的默认参数
  defaultParams?: Params<P>;

  // 监听依赖
  refreshDeps?: WatchSource<any>[] | WatchSource<any>;
  // 依赖变更后的执行参数
  refreshDepsParams?:  Params<P>;

  // 请求延时
  loadingDelay?: number;

  // 轮询
  pollingInterval?: number;
  // 轮询错误重试
  pollingErrorRetryCount?: number;

  // 是否允许请求
  ready?: Ref<boolean>;

  // 防抖等待时间
  debounceWait?: number;
  // 防抖函数属性
  debounceOptions?: {
    // 是否在延迟开始前执行
    leading?: boolean;
    // 是否在延迟开始后执行
    trailing?: boolean;
    // 允许被延迟的最大值
    maxWait?: number;
  };

  // 节流等待时间
  throttleWait?: number;
  // 节流函数属性
  throttleOptions?: {
    // 是否在延迟开始前执行
    leading?: boolean;
    // 是否在延迟开始后执行
    trailing?: boolean;
  };

  // 请求的唯一标识
  cacheKey?: string | ((params?: P) => string);
  // 缓存时间,默认: 5 * 60 * 1000
  // 超出缓存时间会清除对应缓存
  // 另外需要注意的是，当缓存失效时，无论 staleTime 是否存在都会重新请求
  cacheTime?: number;
  // 缓存数据保持新鲜时间(什么时候会重新发送请求更新缓存),默认 0,若为-1表示始终不再发送请求
  // 即在新鲜时间内都直接获取缓存中的数据
  staleTime?: number;
  // 自定义获取缓存
  getCache?: (cacheKey: string) => CacheData;
  // 自定义设置缓存
  setCache?: (cacheKey: string, cacheData: CacheData) => void;

  // 请求前回调
  onBefore?: (params: P) => void;
  // 成功回调
  onSuccess?: (response: R, params: P) => void;
  // 失败回调
  onError?: (err: any, params: P) => void;
  // 接口完成回调
  onFinally?: () => void;
   // 取消接口回调
  onCancel?:()=>void;
}
```

## 所有返回项

```ts
{
  // 返回请求执行成功后的返回的数据
  data: Ref<R>;
  // 返回请求的执行状态
  loading: Ref<boolean>;
  // 返回请求失败的错误信息
  error?: Ref<any>;
  // 返回本次请求的参数
  params?: Ref<P>;
  // 进行轮询时累计轮询次数
  pollingCount:Ref<number>
  // 手动执行请求（返回promise）
  runAsync: (...arg: P) => Promise<R>;
  // 手动执行请求
  run: (...arg: P) => void;
  // 手动取消请求
  cancel: () => void;
  // 手动刷新请求
  refresh: () => void;
  // 手动刷新请求（返回promise）
  refreshAsync: () => Promise<R>;
  // 修改返回的data数据
  mutate: (newData: R) => void | (arg: (oldData: R) => R) => void;;
}
```
