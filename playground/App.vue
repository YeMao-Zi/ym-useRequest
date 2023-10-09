<template>
  <div>{{ data }} {{ loading }}</div>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import useRequest from 'ym-userequest';
// import useRequest from '../dist';
const pages = reactive({
  page: 1,
});
const somePromise = (pages: { page: number }): Promise<any[]> => {
  console.log(pages,'pages')
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (pages.page >= 3) {
        resolve([]);
      } else {
        resolve(new Array(pages.page).fill(1));
      }
    }, 4000);
  });
};
const { data, loading, run, cancel } = useRequest(somePromise, {
  manual: true,
  loadingDelay: 5000,
  defaultParams: [pages],
});

run();

setTimeout(() => {
  cancel();
}, 2000);
</script>

<style></style>
