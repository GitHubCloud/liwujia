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
    <el-table :data="list" stripe>
      <el-table-column prop="title" label="标题" />
      <el-table-column prop="type" label="类型" :formatter="typeFormatter" />
      <el-table-column prop="author.nickname" label="作者" />
      <el-table-column
        prop="createTime"
        label="创建时间"
        sortable
        :formatter="dateFormatter"
      />
      <el-table-column
              fixed="right"
              label="操作"
              width="100">
        <template #default="scope">
          <el-button @click="editHandler(scope.row.id)" type="text" size="small">编辑</el-button>
          <el-button @click="deleteHandler(scope.row.id)" type="text" size="small">删除</el-button>
        </template>
      </el-table-column>
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
      async delBanner(id) {
          this.isLoading = true;

          const res = await this.$api(this.$store.state, `article/${id}`, {
              method: 'delete',
          });
          if (res.statusCode == 200) {
              this.$message({
                  type: 'success',
                  message: '删除成功!'
              });
              this.loadList();
          }

          this.isLoading = false;
      },
      deleteHandler(id) {
          this.$confirm('是否确认删除文章?', '提示', {
              confirmButtonText: '确定',
              cancelButtonText: '取消',
              type: 'warning'
          }).then(() => {
              this.delBanner(id);
          }).catch(() => {
              this.$message({
                  type: 'info',
                  message: '已取消删除'
              });
          });
      },
      editHandler(id) {
          this.$router.push('/article/create?id=' + id);
      },
  },
  mounted() {
    this.loadList();
  },
};
</script>