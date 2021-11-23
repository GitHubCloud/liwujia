<template>
  <el-card>
    <template #header>
      <div class="card-header">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
          <el-breadcrumb-item>用户反馈</el-breadcrumb-item>
        </el-breadcrumb>
      </div>
    </template>
    <el-table :data="list" stripe>
      <el-table-column prop="content" label="内容" />
      <el-table-column prop="creator.nickname" label="用户" />
      <el-table-column
        prop="createTime"
        label="创建时间"
        sortable
        :formatter="dateFormatter"
      />
      <template #empty>
        <el-empty v-if="!isLoading" description="暂无数据"></el-empty>
        <el-skeleton v-if="isLoading" animated />
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
    dateFormatter(row, column) {
      return moment(row[column.property]).format('YYYY-MM-DD HH:mm:ss');
    },
    changePage() {
      this.loadList();
    },
    async loadList() {
      this.isLoading = true;

      const { data } = await this.$api(this.$store.state, 'feedback', {
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