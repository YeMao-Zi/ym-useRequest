<template>
  <div></div>
</template>

<script setup lang="ts">
import { useRequest } from 'ym-userequest';
const somePromise = (value: any) => {
  console.log('item', value);
  return new Promise<void>((resolve, reject) => {
    resolve(value);
  });
};

useRequest(somePromise, {
  defaultParams: [1],
  cacheKey: 'item-request',
  staleTime: -1,
});
</script>

<style></style>
