<template>
  <quill-editor
    v-model="curContent"
    ref="myQuillEditor"
    :options="editerOption"
  ></quill-editor>
</template>

<script>
import 'quill/dist/quill.core.css';
import 'quill/dist/quill.snow.css';
import quillEditor from 'vue-quill-editor';

export default {
  data() {
    return {
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
            [{ font: [] }],
            [{ color: [] }, { background: [] }],
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
  computed: {
    curContent: {
      get: function () {
        return this.content;
      },
      set: function (newValue) {
        this.$emit('input', newValue);
      }
    }
  },
  props: {
    content: String
  },
  components: {
    quillEditor,
  },
};
</script>