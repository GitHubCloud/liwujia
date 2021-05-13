<template>
  <el-aside>
    <el-menu default-active="home" router="true" :collapse="isCollapse">
      <el-menu-item index="home" :route="{ name: 'home' }">
        <i class="el-icon-menu"></i>
        <template #title>Home</template>
      </el-menu-item>
      <el-menu-item index="banner" :route="{ name: 'banner' }">
        <i class="el-icon-document"></i>
        <template #title>Banner</template>
      </el-menu-item>
      <el-submenu>
        <template #title>
          <i class="el-icon-location"></i>
          <span>Article</span>
        </template>
        <el-menu-item index="article-create" :route="{ name: 'article-create' }">create</el-menu-item>
        <el-menu-item index="article-list" :route="{ name: 'article-list' }">list</el-menu-item>
      </el-submenu>
    </el-menu>
  </el-aside>
</template>

<script>
export default {
  data() {
    return {
      isCollapse: false,
    };
  },
};
</script>