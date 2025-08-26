<template>
  <div>data:{{ data }}</div>
  <div>loading:{{ loading }}</div>
  <div>status:{{ status }}</div>
  <button @click="run({})">run</button>
  <button @click="cancel">cancel</button>
</template>

<script setup lang="ts">
import { useRequest } from 'ym-userequest';
const request = (params: any, signal?: AbortSignal) =>
  fetch('https://httpbin.org/delay/3', {
    method: 'POST',
    body: JSON.stringify(params),
    signal,
  });

const { data, loading, status, cancel, run } = useRequest(request, {
  manual: true,
  controller: true,
  onCancel() {
    console.log('onCancel');
  },
});
</script>

<style></style>
