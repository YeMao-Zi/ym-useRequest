<template>
  <div>{{ data.length }} {{ loading }}</div>
  <div @click="onClick">click</div>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue';
import useRequest from 'ym-userequest';
// import useRequest from '../dist';
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
const { data, loading, mutate } = useRequest(somePromise, {
  defaultParams: [{ page: 1 }],
  refreshDeps: [() => pages.page],
  refreshDepsParams: refreshDepsParams,
  onSuccess(data, params) {
    if (data.length > 5) {
      pages.loadingEnd = '已达最大数量5';
    }
  },
});
mutate(() => []);
const onClick = () => {
  !pages.loadingEnd && pages.page++;
};
</script>

<style></style>
