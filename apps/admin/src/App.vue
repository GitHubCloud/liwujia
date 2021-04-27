<template>
  <el-container>
    <sidemenu />

    <el-container class="is-vertical">
      <el-header>
        <h1 class="title">理物+</h1>
      </el-header>

      <el-main>
        <transition name="el-fade-in-linear">
          <router-view />
        </transition>
      </el-main>
    </el-container>
  </el-container>
</template>

<script>
import * as moment from 'moment';
import './assets/sass/app.scss';

import sidemenu from './components/sidemenu.vue';
export default {
  components: {
    sidemenu,
  },
  async created() {
    if (this.$store.state.token && moment().isBefore(this.$store.state.tokenExpire)) return;
    const res = await this.$api(this.$store.state, 'auth/login', {
      body: {
        loginName: 'Cloud',
        loginPasswd: 'kelaode520',
      },
    });

    this.$store.dispatch('setToken', res.data.token);
  },
};
</script>