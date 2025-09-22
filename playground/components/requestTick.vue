<template>
  <div @click="requestTickRun">requestTick</div>
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

const { run, requestTick } = useRequest(getData, {
  manual: true,
});

async function requestTickRun() {
  run(1);

  const res1 = await requestTick((res) => {
    console.log(res, 'requestTick1');
  });
  
  console.log(res1, 'res1');
  run(2);
  requestTick((res) => {
    console.log(res, 'requestTick2');
  });
  //   run(1);
}
</script>

<style></style>
