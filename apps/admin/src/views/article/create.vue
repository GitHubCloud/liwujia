<template>
  <el-card>
    <template #header>
      <div class="card-header">
        <span>Create Article</span>
        <!-- <el-button class="button" type="text">操作按钮</el-button> -->
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
          <el-radio-button label="3">种树</el-radio-button>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="内容">
        <quill-editor
          v-model:value="form.content"
          ref="myQuillEditor"
          :options="editerOption"
        ></quill-editor>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="onSubmit">立即创建</el-button>
        <el-button>取消</el-button>
      </el-form-item>
    </el-form>
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
      form: {
        title: '',
        type: '',
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
            ['link', 'image', 'video'],
          ],
        },
        placeholder: '',
        theme: 'snow',
      },
    };
  },
  methods: {
    async onSubmit() {
      const res = await this.$api(this.$store.state, 'article', {
        body: {
          title: this.form.title,
          type: this.form.type,
          content: this.form.content,
        },
      });

      if (res.statusCode == 200) {
        this.$message.success(String(res.message));
        this.$router.push('/article/list');
      } else {
        this.$message.error(String(res.message));
      }
    },
  },
  components: {
    quillEditor,
  },
};
</script>