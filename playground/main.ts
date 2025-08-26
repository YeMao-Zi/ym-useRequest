import { createApp } from 'vue';
import App from './App.vue';
import { useFetchCancelPlugin } from './utils';
import { definePlugins } from 'ym-userequest';

definePlugins([useFetchCancelPlugin]);
const app = createApp(App);

app.mount('#app');
