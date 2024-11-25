<template>
  <div>{{ data?.length }} {{ loading }}{{ pages.loadingEnd }}{{ pollingCount }}</div>
  <div @click="gorun">run</div>
  <div @click="onRun1">run1</div>
  <div @click="onRun2">run2</div>
  <div @click="onCancel">cancel</div>
  <div @click="onRefresh">refresh</div>
  <div @click="testFn">testFun</div>
  <div @click="mutate([1, 2, 3])">mutate</div>
  <!-- <div v-for="item in 10" :key="item">
    <Item />
  </div> -->
</template>

<script setup lang="ts">
import Item from './item.vue';
import { computed, reactive, ref } from 'vue';
import { useRequest } from 'ym-userequest';
// import { useRequest } from '../dist';
import debounce from '../lib/utils/debounce';
const pages = reactive({
  page: 0,
  loadingEnd: null,
  count: 0,
});
const somePromise = (pages: { page: number }): Promise<any[]> => {
  console.log(pages.page, 'pages.page');
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(new Array(pages.page).fill(1));
    }, 1000);
  });
};

const errorPromise = () => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      reject('error');
    }, 1000);
  });
};

const refreshDepsParams = computed(() => [
  {
    page: pages.page,
  },
]);

// useRequest(errorPromise, {
//   retryCount: 3,
//   retryInterval: 1000,
//   onError() {
//     console.log('error');
//   },
// });
let pollingInterval = ref(null);
const ready = ref(false);
const { data, loading, mutate, cancel, refresh, run, runAsync, pollingCount } = useRequest(somePromise, {
  // manual: true,
  defaultParams: { page: 1 },
  // ready,
  // refreshDeps: () => pages.page,
  // refreshDepsParams: () => refreshDepsParams,
  pollingInterval: pollingInterval,
  // pollingErrorRetryCount: 3,
  // debounceWait: 2000,
  // debounceOptions: {
  //   leading: true,
  //   trailing: false,
  // },
  // throttleWait: 2000,
  // throttleOptions: {
  //   leading: true,
  //   trailing: false,
  // },
  // cacheKey: 'test',
  // cacheTime: 10000,
  // staleTime: -1,
  // setCache(cacheKey, data) {
  //   localStorage.setItem(cacheKey, JSON.stringify(data));
  // },
  // getCache(cacheKey) {
  //   return JSON.parse(localStorage.getItem(cacheKey) || '[]');
  // },

  onFinally() {
    // console.log(pollingInterval, 'onFinally');
    if (data.value.length > 5) {
      pages.loadingEnd = '已达最大数量5;';
      cancel();
    } else {
      // pages.page++;
    }
    if (pollingCount.value === 5) {
      cancel();
    }
    // cancel();
  },
});

const gorun = () => {
  pollingInterval.value=1000
  pages.page++;
  runAsync({
    page: pages.page,
  });
};
const onRun1 = () => {
  // ready.value = true;
  run({
    page: 10,
  });
};
const onRun2 = () => {
  // ready.value = true;
  run({
    page: 20,
  });
};

const onRefresh = () => {
  refresh();
};

const onCancel = () => {
  pollingInterval.value = null;
  cancel();
};

const testFn = debounce(
  () => {
    pages.page++;
    somePromise({
      page: pages.page,
    });
  },
  1000,
  {
    leading: true,
  },
);
</script>

<style></style>
