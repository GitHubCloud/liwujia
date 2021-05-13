<template>
  <el-card>
    <template #header>
      <div class="card-header">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
          <el-breadcrumb-item>Banner</el-breadcrumb-item>
        </el-breadcrumb>
      </div>
    </template>

    <div style="margin-bottom: 20px">
      <el-button type="primary" @click="modalVisible = true">新增</el-button>
    </div>

    <draggable
      class="list-group"
      tag="el-row"
      :component-data="{
        type: 'flex',
        gutter: 20,
      }"
      v-model="list"
      v-bind="dragOptions"
      @start="drag = true"
      @end="drag = false"
      @change="handleSort"
      item-key="order"
    >
      <template #item="{ element }">
        <el-col class="list-group-item" :span="6">
          <el-card
            @click="element.fixed = !element.fixed"
            :body-style="{ padding: '0px' }"
          >
            <el-image
              fit="scale-down"
              :src="element.image.cdnPath"
              :lazy="true"
            ></el-image>
            <div style="padding: 14px">
              <el-switch
                v-model="element.enable"
                active-text="启用"
                inactive-text="禁用"
                @change="toggleEnable(element.id, element.enable)"
              ></el-switch>
              <el-popconfirm
                title="确定删除该项吗？"
                @confirm="delBanner(element.id)"
                confirmButtonText="是"
                cancelButtonText="否"
              >
                <template #reference>
                  <el-button
                    type="danger"
                    icon="el-icon-delete"
                    circle
                    style="margin-left: 15px"
                  ></el-button>
                </template>
              </el-popconfirm>
            </div>
          </el-card>
        </el-col>
      </template>
    </draggable>

    <!-- banner create -->
    <el-dialog title="新增Banner" v-model="modalVisible">
      <el-form>
        <el-form-item label="指向链接">
          <el-input v-model="bannerLink" autocomplete="off"></el-input>
        </el-form-item>
        <el-form-item label="">
          <el-upload
            ref="uploader"
            limit="1"
            action="http://localhost:3000/resource/upload"
            :headers="{ Authorization: `Bearer ${this.$store.state.token}` }"
            :data="{ dest: 'banner' }"
            list-type="picture-card"
            :on-success="handleUploadSuccess"
            :on-remove="handleUploadRemove"
            :on-preview="handleUploadPreview"
            :on-exceed="handleUploadExceed"
          >
            <template #tip>
              <div class="el-upload__tip">只能上传一张图片，且不超过 500kb</div>
            </template>
            <el-image v-if="imageUrl" :src="imageUrl"></el-image>
            <i v-else class="el-icon-plus"></i>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="modalVisible = false">取消</el-button>
          <el-button type="primary" @click="createBanner">确定</el-button>
        </span>
      </template>
    </el-dialog>
    <!-- banner create -->

    <!-- upload preview -->
    <el-dialog v-model="previewVisible">
      <el-image :fit="fit" :src="previewImageUrl"></el-image>
    </el-dialog>
    <!-- upload preview -->
  </el-card>
</template>

<script>
import draggable from 'vuedraggable';

export default {
  data() {
    return {
      isLoading: true,
      list: [],
      drag: false,
      modalVisible: false,
      bannerLink: '',
      imageUrl: '',
      uploadPayload: {},
      previewImageUrl: '',
      previewVisible: false,
    };
  },
  computed: {
    dragOptions() {
      return {
        animation: 200,
        group: 'banner',
        disabled: false,
        ghostClass: 'ghost',
      };
    },
  },
  methods: {
    async loadList() {
      this.isLoading = true;

      const { data } = await this.$api(this.$store.state, 'banner', {
        method: 'get',
      });
      this.list = data;

      this.isLoading = false;
    },
    async delBanner(id) {
      this.isLoading = true;

      const res = await this.$api(this.$store.state, `banner/${id}`, {
        method: 'delete',
      });
      if (res.statusCode == 200) {
        this.loadList();
      }

      this.isLoading = false;
    },
    async toggleEnable(id, enable) {
      this.isLoading = true;

      await this.$api(this.$store.state, `banner/${id}`, {
        body: { enable },
        method: 'patch',
      });

      this.isLoading = false;
    },
    async createBanner() {
      if (!this.uploadPayload.id) return this.$message.error('图片不能为空');

      const data = { image: this.uploadPayload.id };
      if (this.bannerLink) data['link'] = this.bannerLink;

      const res = await this.$api(this.$store.state, `banner`, {
        body: data,
        method: 'post',
      });

      if (res.statusCode != 200) return this.$message.error(res.message[0]);
      this.modalVisible = false;
      this.$refs['uploader'].clearFiles();
      this.loadList();
    },
    // sort banners
    handleSort() {
      const list = [];
      this.list.map((i, k) => {
        i.order = this.list.length - k - 1;
        list.push({
          id: i.id,
          order: i.order,
        });
      });

      this.$api(this.$store.state, `banner/sort`, {
        body: { list },
        method: 'patch',
      });
    },
    // banner upload
    handleUploadSuccess(res) {
      if (res.statusCode == 200) {
        this.uploadPayload = res.data;
      }
    },
    handleUploadRemove() {
      this.imageUrl = '';
      this.uploadPayload = {};
    },
    handleUploadPreview(file) {
      this.previewImageUrl = file.url;
      this.previewVisible = true;
    },
    handleUploadExceed(){
      this.$message.error('超过最大文件数量');
    }
  },
  mounted() {
    this.loadList();
  },
  components: {
    draggable,
  },
};
</script>