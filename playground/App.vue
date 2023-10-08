<template>
  <div>{{ data.length }} {{ loading }}</div>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import useRequest from '../lib/index';
// import useRequest from '../dist';
const pages = reactive({
  page: 1,
});
const somePromise = (pages: { page: number }): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (pages.page >= 3) {
      resolve([]);
    } else {
      resolve(new Array(pages.page).fill(1));
    }
    }, 1000);
  });
};
const { data, loading } = useRequest(somePromise, {
  loadingDelay: 1000,
  defaultParams:[pages],
});
</script>

<style></style>
