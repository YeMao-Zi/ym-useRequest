## 介绍

接口的手动管理，包括请求状态，请求数据，手动更新，自动更新，回调，监听数据并更新

## 安装

npm install ym-userequest

## 使用

### 手动执行

```ts
import { useRequest } from 'ym-userequest';
const { data, loading, run, runAsync, refresh, refreshAsync, cancel } = useRequest(somePromise, { manual: true });
const somePromise = () => {
  return new Promise((resolve, reject) => {
    resolve('success');
  });
};
run(); // 手动触发一次
// runAsync(); // 同 run , 但返回的是一个 promise
// refresh(); // 使用上次的参数重新请求
// refreshAsync(); // 同 refresh , 但返回的是一个 promise
// cancel(); // 取消请求
```

### 自动执行一次并带默认参数

```ts
// 多参数请求
const somePromise1 = (params1, params2) => {
  return new Promise((resolve, reject) => {
    resolve({ params1, params2 });
  });
};
const { data, loading } = useRequest(somePromise1, {
  defaultParams: ['params1', 'params2'],
});

// 单参数请求
const somePromise2 = (params1) => {
  return new Promise((resolve, reject) => {
    resolve({ params1 });
  });
};
const { data, loading } = useRequest(somePromise2, {
  defaultParams: 'params1', // or ['参数1']
});
```

> defaultParams 传入为数组时表示函数的多个参数，所以如果想要传入单个参数且参数本身为数组，应该使用 [array] 这样传参

### 监听响应式数据并自动执行更新数据

```ts
const pages = reactive({
  size: 1,
});
const somePromise = (number: number): Promise<any[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(new Array(number).fill(1));
    }, 1000);
  });
};

const refreshDepsParams = computed(() => pages.size);

const { data, loading } = useRequest(somePromise, {
  defaultParams: pages.size,
  refreshDeps: [() => pages.size], // 监听的依赖
  // 可选，依赖变更后执行的参数,不传则在依赖变更后执行 refresh,
  // 如果为函数会执行该函数并将返回值作为参数，不想监听后立即请求,可以传递一个没有返回值的函数 ()=>void
  refreshDepsParams: refreshDepsParams,
});
const onClick = () => {
  pages.size++;
};
```

### 延时 loading

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

### 修改 data 数据

1. defaultData

```ts
const somePromise = () => {
  return new Promise((resolve, reject) => {
    resolve(1);
  });
};

const { data, loading, mutate } = useRequest(somePromise, {
  defaultData: 3, // return data:Ref<3>
  // defaultData: shallowRef<3>, // return data:ShallowRef<3>
});
```

2. mutate

```ts
const somePromise = () => {
  return new Promise((resolve, reject) => {
    resolve(1);
  });
};

const { data, loading, mutate } = useRequest(somePromise);

mutate(5555);
console.log(data.value); // 5555

const onChange = () => {
  mutate((res) => {
    return res + 1;
  });
};

onChange();
console.log(data.value); // 2
```

### 轮询

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
    reject('error');
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

### 允许请求

ready 参数控制本次请求是否被允许，若 ready 为 false ，该请求始终不会被允许

```ts
const somePromise = () => {
  return new Promise((resolve, reject) => {
    resolve(1);
  });
};

const ready = ref(false);
const { data, run } = useRequest(somePromise, {
  ready,
});
console.log(data.value); // null
ready.value = true;
run();
console.log(data.value); // 1
```

### 函数防抖

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

### 函数节流

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

### 缓存

> 设置了 cacheKey，组件在第二次加载时，会优先返回缓存的内容，然后在背后重新发起请求

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
  staleTime: -1,
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
  console.log(data.value); // 2
}, 5000);
```

### 错误重试

当请求失败后重新请求次数

```ts
const errorPromise = () => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      reject('error');
    }, 1000);
  });
};
let count = 0;
const { data } = useRequest(errorPromise, {
  retryCount: 3,
  // retryInterval:1000,
  onError() {
    count += 1;
    console.log(count);
  },
});

// count：1
// count：2
// count：3
// count：4
```

### requestTick

等待请求完成后的操作回调

```ts
const getData = (value = 1, time = 1000): Promise<number> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(value);
    }, time);
  });
};

const { data, run: run1, requestTick } = useRequest(() => getData(3), { manual: true });
const { run: run2 } = useRequest(getData, { manual: true });
const runAll = async () => {
  run1();
  run2();
  console.log(data.value); // undefined
  await requestTick(() => {
    console.log(data.value); // 3
  });
  console.log(data.value); // 3
};
runAll();
```

### 监听浏览器页面切换

```ts
useRequest(getData, {
  // 在浏览器页面重新显示时，重新发起请求
  refreshOnWindowFocus: true,
  // 间隔1000ms内不重新请求
  focusTimespan: 1000,
  // 离开浏览器页面时，取消请求
  cancelOnWindowBlur: true,
});
```

## 所有配置项

```ts
{
  // 是否手动发起请求
  manual?: boolean;

  // 设置默认 data，也可用于指定 data 为 ShallowRef 或 Ref
  // 如果传入值为非响应式，将被转化为 ref
  defaultData?: R | Ref<R>;

  // 当 manual 为 false 时，自动执行的默认参数
  defaultParams?: Params<P>;

  // 监听依赖
  refreshDeps?: WatchSource<any>[] | WatchSource<any>;
  // 依赖变更后的执行参数，若为函数会执行该函数，有返回值则会将返回值作为参数发起一次请求
  refreshDepsParams?: Params<P> | (() => void | Params<P>);

  // 请求延时
  loadingDelay?: number;

  // 轮询
  pollingInterval?: Ref<number> | number;
  // 轮询错误重试
  pollingErrorRetryCount?: number;

  // 错误重试次数
  retryCount?:number;
  // 重试时间间隔
  // 如果不设置，默认采用简易的指数退避算法，取 1000 * 2 ** retryCount，
  // 也就是第一次重试等待 2s，第二次重试等待 4s，以此类推，如果大于 30s，则取 30s
  retryInterval?:number;

  // 是否允许请求（不会自动请求）
  ready?: Ref<boolean> | boolean;

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
  // 在浏览器页面重新显示时，重新发起请求
  refreshOnWindowFocus?: Ref<boolean> | boolean;
  // 重新请求间隔，单位为毫秒,默认5000
  focusTimespan?: Ref<number> | number;
  // 离开浏览器页面时，取消请求
  cancelOnWindowBlur?: Ref<boolean> | boolean;
  // 获取缓存时回调
  onCache?: (response: R) => void;
  // 请求前回调
  onBefore?: (params: P) => void;
  // 每次请求被执行时回调，可以在该回调中获取每次请求的响应
  onRequest?: ({ params, response, error, abort }: { params: P; response: R; error: any; abort: boolean }) => void;
  // 成功回调
  onSuccess?: (response: R, params: P) => MaybePromise<void | R>;
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
  mutate: (newData: R) => void | (arg: (oldData: R) => R) => void;
  // data 处理进程
  status: Ref<'pending' | 'settled'>;
  // 等待接口完成
  requestTick: (callback?: () => void) => Promise<unknown>;
}
```
