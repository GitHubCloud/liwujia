<template>
  <el-card>
    <template #header>
      <div class="card-header">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
          <el-breadcrumb-item>文章列表</el-breadcrumb-item>
        </el-breadcrumb>
        <!-- <span>Create Article</span> -->
        <!-- <el-button class="button" type="text">操作按钮</el-button> -->
      </div>
    </template>
    <el-table :data="list" stripe v-loading="isLoading">
      <el-table-column prop="title" label="标题" />
      <el-table-column prop="type" label="类型" :formatter="typeFormatter" />
      <el-table-column prop="author.nickname" label="作者" />
      <el-table-column
        prop="createTime"
        label="创建时间"
        sortable
        :formatter="dateFormatter"
      />
      <template #empty>
        <el-empty description="暂无数据"></el-empty>
      </template>
    </el-table>

    <el-pagination
      v-loading="isLoading"
      layout="prev, pager, next"
      :total="total"
      v-model:currentPage="page"
      @current-change="changePage"
    />
  </el-card>
</template>

<script>
import * as moment from 'moment';
export default {
  data() {
    return {
      total: 0,
      page: 1,
      isLoading: true,
      list: [],
    };
  },
  methods: {
    typeFormatter(row, column) {
      return ['', '交流', '种草', '种树'][row[column.property]];
    },
    dateFormatter(row, column) {
      return moment(row[column.property]).format('YYYY-MM-DD HH:mm:ss');
    },
    changePage() {
      this.loadList();
    },
    async loadList() {
      this.isLoading = true;

      const { data } = await this.$api(this.$store.state, 'article', {
        method: 'get',
        data: {
          page: this.page,
        },
      });
      this.total = data.meta.totalItems;
      this.list = data.items;

      this.isLoading = false;
    },
  },
  mounted() {
    this.loadList();
  },
};
</script>