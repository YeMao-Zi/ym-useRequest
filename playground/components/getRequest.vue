<template>
  <div>
    <div>getRequest:</div>
    <div>{{ instance.data }}</div>
    <div @click="runRequest">runRequest</div>
  </div>
</template>

<script setup lang="ts">
import { getRequest } from 'ym-userequest';

const instance = getRequest('somePromise');

function runRequest() {
  instance.run(4);
}
</script>

<style></style>
