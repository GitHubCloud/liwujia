<template>
  <el-container>
    <sidemenu v-if="isLogin" />

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
  computed: {
    isLogin() {
      return this.$store.state.token && moment().isBefore(this.$store.state.tokenExpire);
    }
  },
  async created() {
    if (this.isLogin) return;
    this.$router.push('login');
  },
};
</script>