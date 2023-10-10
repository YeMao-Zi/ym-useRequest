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
const somePromise=(params1,params2)=>{
    return new Promise((resolve, reject)=>{
        resolve({params1,params2})
    })
}
const {data,loading}=useRequest(somePromise,{
  defaultParams: [
      params1: '参数1',
      params2: '参数2',
]})
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
  refreshDepsParams: refreshDepsParams, // 可选，依赖变更后执行的参数
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
