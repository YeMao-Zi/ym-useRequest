## 介绍

接口的手动管理，包括请求状态，请求数据，手动更新，自动更新，回调，监听数据并更新

## 使用

### 1.手动执行

```ts
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
mutate(() => []); // 设置 data 默认值
const onClick = () => {
  !pages.loadingEnd && pages.page++;
};
```

### 4.延时loading

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

```ts
const somePromise = () => {
  console.log(1);
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

## 所有配置项

```ts
{
  // 是否手动发起请求
  manual?: boolean;

  // 当 manual 为 false 时，自动执行的默认参数
  defaultParams?: P;

  // 监听依赖
  refreshDeps?: WatchSource<any>[];
  // 依赖变更后的执行参数
  refreshDepsParams?: Ref<P>;

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

  // 请求前回调
  onBefore?: (params: P) => void;
  // 成功回调
  onSuccess?: (response: R, params: P) => void;
  // 失败回调
  onError?: (err: any, params: P) => void;
  // 接口完成回调
  onFinally?: () => void;
}
```
