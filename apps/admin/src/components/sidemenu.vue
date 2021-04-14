<template>
  <el-aside>
    <el-menu default-active="home" router="true" :collapse="isCollapse">
      <el-menu-item index="home" route="/">
        <i class="el-icon-menu"></i>
        <template #title>Home</template>
      </el-menu-item>
      <el-menu-item index="about" route="/about">
        <i class="el-icon-document"></i>
        <template #title>About</template>
      </el-menu-item>
      <el-submenu>
        <template #title>
          <i class="el-icon-location"></i>
          <span>Article</span>
        </template>
        <el-menu-item index="/article/create">create</el-menu-item>
      </el-submenu>
    </el-menu>
  </el-aside>
</template>

<script>
export default {
  data() {
    return {
      isCollapse: false
    }
  }
}
</script>