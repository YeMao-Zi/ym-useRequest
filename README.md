## 介绍

接口的手动管理，包括请求状态，请求数据，手动更新，自动更新，并发请求，失败/成功回调，监听数据并更新

ps:不一定是接口，只要是 promise 就都可以管理

## 使用

1.手动执行

```ts
const { data, loading, run } = useRequest(somePromise, { manual: true });
const somePromise = () => {
  return new Promise((resolve, reject) => {
    resolve("请求成功");
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

4.按顺序执行同步任务

使用 queryKey 标识为同步任务

```ts
const somePromise=(params1,params2)=>{
    return new Promise((resolve, reject)=>{
        resolve(params1,params2)
    })
}
const req1 = useRequest(somePromise, queryKey:(args)=>1);

const req2 = useRequest(somePromise, queryKey:(args)=>2);

const req3 = useRequest(somePromise, queryKey:(args)=>3);

req3.runQueryList()

```
