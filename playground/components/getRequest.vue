<template>
  <div>
    <div>getRequest:</div>
    <div>{{ instance?.data }}</div>
    <div @click="runRequest">runRequest</div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { getRequest } from 'ym-userequest';

let instance=getRequest('somePromise')
function runRequest() {
  instance.run(4);
}
setTimeout(() => {
 console.log(getRequest('somePromise'), 'somePromise--------------');
}, 3000);
</script>

<style></style>
