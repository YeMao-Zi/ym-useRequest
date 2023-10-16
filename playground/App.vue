<template>
  <div>{{ data.length }} {{ loading }}{{ pages.loadingEnd }}</div>
  <div @click="onRun">run</div>
  <div @click="onCancel">cancel</div>
  <div @click="testFn">testFun</div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import useRequest from 'ym-userequest';
// import useRequest from '../dist';
import debounce from '../lib/utils/debounce';
const pages = reactive({
  page: 1,
  loadingEnd: null,
  count: 0,
});
const somePromise = (pages: { page: number }): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(new Array(pages.page).fill(1));
    }, 1000);
  });
};

const refreshDepsParams = computed(() => [
  {
    page: pages.page + 1,
  },
]);

const ready = ref(false);
const { data, loading, mutate, cancel, run, runAsync } = useRequest(somePromise, {
  manual: true,
  defaultParams: [{ page: 1 }],
  // ready,
  // refreshDeps: [() => pages.page],
  // refreshDepsParams: refreshDepsParams,
  // pollingInterval: 1000,
  // pollingErrorRetryCount: 3,
  debounceWait: 2000,
  debounceOptions: {
    leading: true,
    trailing: false,
  },
  onFinally() {
    // pages.page++;
    // if (data.length > 5) {
    //   pages.loadingEnd = '已达最大数量5';
    // }
    // cancel();
  },
});

setTimeout(() => {
  console.log(runAsync);
}, 1000);
mutate(() => []);
const onRun = () => {
  !pages.loadingEnd && pages.page++;
  // ready.value = true;
  run({
    page: pages.page,
  });
};

const onCancel = () => {
  cancel();
};

let testNum = 0;
const testFn = debounce(
  () => {
    testNum++;
    console.log(testNum);
  },
  2000,
  {
    leading: true,
    trailing: false,
  },
);
</script>

<style></style>
