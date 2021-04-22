import * as Vue from 'vue';
import router from './router';
import store from './store';
import ElementPlus from "element-plus";
import 'element-plus/lib/theme-chalk/index.css';
import App from './App.vue';

const app = Vue.createApp(App);
app.use(router);
app.use(store);
app.use(ElementPlus);

app.config.globalProperties.$http = async (url, param) => {
  return await (await fetch(url, param)).json();
};

app.config.globalProperties.$api = async (state, path, param = {}) => {
  let url = `http://localhost:3000/${path}`;
  const headers = param.headers ? param.headers : {};
  headers['Content-Type'] = 'application/json';
  if (state.token) headers['Authorization'] = `Bearer ${state.token}`;

  const _param = {
    method: param.method || 'post',
    headers,
  };

  if (_param.method == 'get' || _param.method == 'GET') {
    const data = param.data ? param.data : {};
    url += '?' + Object.entries(data).join('&').replaceAll(',', '=');
  } else {
    const body = param.body ? param.body : {};
    _param.body = JSON.stringify(body);
  }

  return await app.config.globalProperties.$http(url, _param);
}

app.mount('#app');