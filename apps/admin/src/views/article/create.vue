<template>
  <el-card>
    <template #header>
      <div class="card-header">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
          <el-breadcrumb-item :to="{ name: 'article-list' }"
            >文章列表</el-breadcrumb-item
          >
          <el-breadcrumb-item>发布文章</el-breadcrumb-item>
        </el-breadcrumb>
      </div>
    </template>
    <el-form ref="form" :model="form" label-width="80px">
      <el-form-item label="标题">
        <el-input v-model="form.title"></el-input>
      </el-form-item>
      <el-form-item label="类型">
        <el-radio-group v-model="form.type">
          <el-radio-button label="1">交流</el-radio-button>
          <el-radio-button label="2">种草</el-radio-button>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="内容">
        <quill-editor
          v-model:value="form.content"
          ref="myQuillEditor"
          :options="editerOption"
        ></quill-editor>
      </el-form-item>
      <el-form-item label="图片">
        <el-upload
          ref="uploader"
          limit="9"
          :action="`${$store.state.apiEndPoint}resource/upload`"
          :headers="{ Authorization: `Bearer ${this.$store.state.token}` }"
          :data="{ dest: 'article' }"
          list-type="picture-card"
          :on-preview="handleUploadPreview"
          :on-exceed="handleUploadExceed"
        >
          <template #tip>
            <div class="el-upload__tip">最多上传 9 张图片，且不超过 500kb</div>
          </template>
          <el-image v-if="imageUrl" :src="imageUrl"></el-image>
          <i v-else class="el-icon-plus"></i>
        </el-upload>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="onSubmit">立即创建</el-button>
        <el-button>取消</el-button>
      </el-form-item>
    </el-form>

    <!-- upload preview -->
    <el-dialog v-model="previewVisible">
      <el-image :fit="fit" :src="previewImageUrl"></el-image>
    </el-dialog>
    <!-- upload preview -->
  </el-card>
</template>

<script>
import 'quill/dist/quill.core.css';
import 'quill/dist/quill.snow.css';
import 'quill/dist/quill.bubble.css';
import { quillEditor } from 'vue3-quill';

export default {
  data() {
    return {
      previewVisible: false,
      previewImageUrl: '',
      form: {
        title: '',
        type: '2',
        content: '',
      },
      editerOption: {
        modules: {
          toolbar: [
            ['bold', 'italic', 'underline', 'strike'],
            ['blockquote', 'code-block'],
            [{ header: 1 }, { header: 2 }],
            [{ list: 'ordered' }, { list: 'bullet' }],
            [{ script: 'sub' }, { script: 'super' }],
            [{ indent: '-1' }, { indent: '+1' }],
            [{ direction: 'rtl' }],
            [{ size: ['small', false, 'large', 'huge'] }],
            [{ header: [1, 2, 3, 4, 5, 6, false] }],
            [{ color: [] }, { background: [] }],
            [{ font: [] }],
            [{ align: [] }],
            ['clean'],
            ['link'], // 'image', 'video'
          ],
        },
        placeholder: '',
        theme: 'snow',
      },
    };
  },
  methods: {
    async onSubmit() {
      const data = {
        title: this.form.title,
        type: this.form.type,
        content: this.form.content,
      };
      if (this.$refs['uploader'].uploadFiles.length) {
        data.images = [];
        this.$refs['uploader'].uploadFiles.map((image) => {
          data.images.push(image.response.data.id);
        });
      }

      const res = await this.$api(this.$store.state, 'article', {
        body: data,
      });

      if (res.statusCode == 200) {
        this.$message.success(String(res.message));
        this.$router.push('/article/list');
      } else {
        this.$message.error(String(res.message));
      }
    },
    // banner upload
    handleUploadPreview(file) {
      this.previewImageUrl = file.url;
      this.previewVisible = true;
    },
    handleUploadExceed() {
      this.$message.error('超过最大文件数量');
    },
  },
  components: {
    quillEditor,
  },
};
</script>