## 介绍

接口的手动管理，包括请求状态，请求数据，手动更新，自动更新，回调，监听数据并更新

## 使用

1.手动执行

```ts
const { data, loading, run } = useRequest(somePromise, { manual: true });
const somePromise = () => {
  return new Promise((resolve, reject) => {
    resolve('请求成功');
  });
};
run();
```

2.自动执行一次并带默认参数

```ts
const {data,loading}=useRequest(somePromise,{
  defaultParams: [
      params1: '参数1',
      params2: '参数2',
  ]})
const somePromise=(params1,params2)=>{
    return new Promise((resolve, reject)=>{
        resolve(params1,params2)
    })
}
```

3.监听响应式数据并自动执行更新数据

```ts
const pages = reactive({
  limit: 5,
  page: 1,
  loadingEnd: false,
});
const params: ComputedRef<[{ page: number; limit: number }]> = computed(() => [
  {
    page: pages.page,
    limit: pages.limit,
  },
]);

const { data, loading } = useRequest(searchReviews, {
  refreshDeps: [() => pages.page],
  refreshDepsParams: params,
  defaultParams: [
    {
      page: pages.page,
      limit: pages.limit,
    },
  ],
  onSuccess: (response, params) => {
    if (response.data.length == 0) {
      pages.loadingEnd = true;
    }
  },
  onError: (err) => {
    console.log(err);
  },
});

const handleClick = () => {
  if (!pages.loadingEnd) {
    pages.page++;
  }
};
```

4.延时loading

使用 loadingDelay 定义一个 loading 的延时时间，避免请求时间较短时出现 loading 闪烁

```ts
const somePromise = (params1, params2) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(params1, params2);
    }, 300);
  });
};
const { data, loading } = useRequest(somePromise, {
  defaultParams: ['参数1', '参数2'],
  loadingDelay: 1000, // 1s 内loading状态都不会改变
});
```

5.修改 data 数据

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
