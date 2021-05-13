<template>
  <el-container>
    <el-result icon="error" title="404" subTitle="页面不存在">
      <template #extra>
        <el-button type="primary" size="medium" @click="goback">返回</el-button>
      </template>
    </el-result>
  </el-container>
</template>

<script>
export default {
  methods: {
    goback() {
      this.$router.go(-1);
    },
  },
};
</script>

<style lang="scss" scoped>
.el-result {
  margin: 0 auto;
}
</style>