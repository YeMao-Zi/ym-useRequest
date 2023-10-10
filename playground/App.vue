<template>
  <div>{{ data.length }} {{ loading }}{{ pages.loadingEnd }}</div>
  <div @click="onRun">run</div>
  <div @click="onCancel">cancel</div>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue';
import useRequest from 'ym-userequest';
// import useRequest from '../dist';
const pages = reactive({
  page: 1,
  loadingEnd: null,
  count: 0,
});
const somePromise = (pages: { page: number }): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      reject(new Array(pages.page).fill(1));
    }, 0);
  });
};

const refreshDepsParams = computed(() => [
  {
    page: pages.page,
  },
]);
const { data, loading, mutate, cancel, run } = useRequest(somePromise, {
  defaultParams: [{ page: 1 }],
  refreshDeps: [() => pages.page],
  refreshDepsParams: refreshDepsParams,
  pollingInterval: 1000,
  pollingErrorRetryCount:3,
  onError(data, params) {
    // pages.page++;
    // if (data.length > 5) {
    //   pages.loadingEnd = '已达最大数量5';
    // }
    // cancel();
  },
});
mutate(() => []);
const onRun = () => {
  !pages.loadingEnd && pages.page++;
};

const onCancel = () => {
  cancel();
};
</script>

<style></style>
