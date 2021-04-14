import { createApp } from 'vue'
import router from './router'
import store from './store'
import ElementPlus from "element-plus";
import 'element-plus/lib/theme-chalk/index.css';
import App from './App.vue'

createApp(App)
  .use(router)
  .use(store)
  .use(ElementPlus)
  .mount('#app');
