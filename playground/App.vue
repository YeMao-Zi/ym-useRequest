<template>
  <div>{{ data }} {{ loading }}</div>
</template>

<script setup lang="ts">
import useRequest from 'ym-userequest';
const somePromise = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve('请求成功');
    }, 2000);
  });
};
const { data, loading, run } = useRequest(somePromise, {
  manual: true,
  loadingDelay: 1000,
});

run();
</script>

<style></style>
