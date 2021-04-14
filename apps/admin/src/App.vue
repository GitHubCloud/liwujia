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

<style lang="scss">
@import './assets/scss/app.scss';
</style>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import sidemenu from "@/components/sidemenu.vue";

@Options({
  components: {
    sidemenu,
  },
})
export default class extends Vue { }
</script>
