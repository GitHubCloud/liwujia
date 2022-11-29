<template>
  <el-row :gutter="10">
    <el-col :sm="{ span: 20, offset: 2 }" :md="{ span: 8, offset: 8 }">
      <el-form :model="loginForm" ref="loginForm" label-width="100px" class="demo-dynamic">
        <el-form-item prop="loginName" label="用户名">
          <el-input v-model="loginForm.loginName"></el-input>
        </el-form-item>
        <el-form-item label="密码" prop="loginPasswd">
          <el-input type="loginPasswd" v-model="loginForm.loginPasswd" autocomplete="off" show-password></el-input>
        </el-form-item>
        <el-form-item>
          <el-button :loading="loading" type="primary" @click="doLogin">登录</el-button>
        </el-form-item>
      </el-form>
    </el-col>
  </el-row>
</template>

<script>
export default {
  data() {
    return {
      loading: false,
      loginForm: {
        loginName: '',
        loginPasswd: '',
      }
    }
  },
  methods: {
    async doLogin() {
      this.loading = true;
      const res = await this.$api(this.$store.state, 'auth/login', {
        body: {
          loginName: this.loginForm.loginName,
          loginPasswd: this.loginForm.loginPasswd,
        },
      });
      this.loading = false;

      if (res.statusCode != 200) {
        this.$message.error(res.message);
        return false;
      }

      this.$store.dispatch('setToken', res.data.token);
      this.$router.push('/');
    }
  },
};
</script>

<style lang="scss" scoped>
.el-button {
  width: 100%;
}
</style>