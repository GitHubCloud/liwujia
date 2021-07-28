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
        <el-upload class="avatar-uploader" id="quill-img"
                   :action="`${$store.state.apiEndPoint}resource/upload`"
                   :headers="{ Authorization: `Bearer ${this.$store.state.token}` }"
                   :data="{ dest: 'article' }"
                   ref="upload" list-type="picture-card"
                   :on-success="imgSuccess1"
                   accept=".png, .jpg, .jpeg" style="display: none;">
          <i class="el-icon-plus"></i>
        </el-upload>
        <quill-editor
          v-model:value="form.content"
          ref="myQuillEditor"
          :options="editerOption"
        ></quill-editor>
      </el-form-item>
      <el-form-item label="图片">
        <div class="imgList">
          <div v-for="(item,index) in fileList" :key="index" class="item">
            <div @click="deleteImg(index)" class="btn">删除</div>
            <img :src="item.cdnPath"/>
          </div>
        </div>
        <el-upload
                class="avatar-uploader"
          ref="uploader"
          limit="9"
          :action="`${$store.state.apiEndPoint}resource/upload`"
          :headers="{ Authorization: `Bearer ${this.$store.state.token}` }"
          :data="{ dest: 'article' }"
          :on-success="uploadSuccess"
          :show-file-list="false">
          <i class="el-icon-plus"></i>
        </el-upload>

        <!--<el-upload-->
                <!--class="avatar-uploader"-->
                <!--:action="`${$store.state.apiEndPoint}resource/upload`"-->
                <!--:headers="{ Authorization: `Bearer ${this.$store.state.token}` }"-->
                <!--:data="{ dest: 'article' }"-->
                <!--name="upload"-->
                <!--accept="image/*"-->
                <!--:on-success="uploadSuccess"-->
                <!--:show-file-list="false">-->
        <!--</el-upload>-->
      </el-form-item>
      <el-form-item>
        <el-button v-if="!id" type="primary" @click="onSubmit">立即创建</el-button>
        <el-button v-else type="primary" @click="onEditSubmit">立即更新</el-button>
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
let quill;

export default {
  data() {
    return {
        id: '',
      previewVisible: false,
      previewImageUrl: '',
      form: {
        title: '',
        type: '2',
        content: '',
      },
      editerOption: {
          modules: {
              toolbar: {
                  container:  [
                      ['bold', 'italic', 'underline', 'strike'],
                      ['blockquote', 'code-block'],
                      [{ header: 1 }, { header: 2 }],
                      [{ list: 'ordered' }, { list: 'bullet' }],
                      [{ script: 'sub' }, { script: 'super' }],
                      [{ indent: '-1' }, { indent: '+1' }],
                      [{ direction: 'rtl' }],
                      [{ size: ['small', false, 'large', 'huge'] }],
//                      [{ header: [1, 2, 3, 4, 5, 6, false] }],
                      [{ color: [] }, { background: [] }],
                      [{ font: [] }],
                      [{ align: [] }],
                      ['clean'],
                      ['link','image'], // 'image', 'video'
                      ],
                  handlers: {
                      'image': function (value) {
                          if (value) {
                              //触发我们自己写的上传图片的功能
                              quill = this.quill;
                              document.querySelector('.avatar-uploader input').click()
                          } else {
                              this.quill.format('image', false);
                          }
                      }
                  },
              },
          },
        placeholder: '',
        theme: 'snow',
      },
        fileList: [],
    };
  },
  methods: {
      async onSubmit() {
      const data = {
        title: this.form.title,
        type: this.form.type,
        content: this.form.content,
      };
      if (this.fileList) {
        data.images = [];
        this.fileList.map((image) => {
          data.images.push(image.id);
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
      async onEditSubmit() {
          const { id } = this;
          const data = {
              title: this.form.title,
              type: this.form.type,
              content: this.form.content,
          };
          if (this.fileList) {
              data.images = [];
              this.fileList.map((image) => {
                  data.images.push(image.id);
              });
          }

          const res = await this.$api(this.$store.state, `article/${id}`, {
              method: 'put',
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
      imgSuccess1(res) {
        const { data } = res;
//          let arr = [];
//          fileList.forEach(item => {
//              if (item.response) {
//                  arr = `${store.getters.qiniuURL}/${item.response.key}`;
//              } else if (item.status) {
//                  arr = item.url;
//              }
//          });
          // 获取到当前页面的富文本框

              //let quill = this.$refs.myQuillEditor.quill;


          // 获取光标现在所在的位置上
          let length = quill.getSelection().index;

//          // quill插入我们刚刚上传成功之后的图片，arr是存在我们服务器上边的地址
          quill.insertEmbed(length, 'image', data.cdnPath);
//          // 调整光标到图片之后的位置上
          quill.setSelection(length + 1);
      },
      uploadSuccess(res) {
          this.fileList.push(res.data)
      },
      deleteImg(index) {
          this.fileList.splice(index,1)
      },
      async getData(id) {
          const res = await this.$api(this.$store.state, `article/${id}`, {
              method: 'get',
          });
          if (res.statusCode == 200) {
              const { title,type,content,images } = res.data;
              this.form = {
                  title,
                  type,
                  content,
              };
              this.fileList = images;
          }
      },
  },
    mounted() {
      const { id } = this.$route.query;
      if(id) {
          this.id = id;
          this.getData(id);
      }
    },
  components: {
    quillEditor,
  },
};
</script>
<style>
  .avatar-uploader {
    border:1px solid #DDD;
    width:100px;
    height:100px;
    text-align: center;
    line-height:100px;
  }
  .imgList {}
  .imgList .item {
    display: inline-block;
    vertical-align: middle;
    width:120px;
    height:120px;
    position: relative;
    margin:0 20px 0 0;
  }
  .imgList .item img {
    width:120px;
    height:120px;
  }
  .imgList .item .btn {
    width:100%;
    position: absolute;
    left:50%;
    top:50%;
    transform: translate(-50%,-50%);
    cursor: pointer;
    text-align: center;
  }
</style>