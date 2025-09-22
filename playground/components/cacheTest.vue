<template>
  <div>
    <div>data1：{{ data1 }}</div>
    <div>data2：{{ data2 }}</div>
    <div @click="mutate2(2)">changeData2</div>
  </div>
</template>

<script setup lang="ts">
import { useRequest } from 'ym-userequest';

const getData = (value = 1) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(value);
    }, 1000);
  });
};
const { data: data1 } = useRequest(getData, {
  cacheKey: 'getDataKey1',
  staleTime: -1,
});

const { data: data2, mutate: mutate2 } = useRequest(getData, {
  cacheKey: 'getDataKey1',
  staleTime: -1,
});
</script>

<style></style>
