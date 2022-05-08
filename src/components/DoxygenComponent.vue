<template>
  <component :is="component" :data="componentData" :name="componentType()" />
</template>

// <script setup>
// import LoadingComponent from './Loading.vue'
// import ErrorComponent from './Default.vue'

// import { defineAsyncComponent } from 'vue'

// function componentType() {
//   let _type = 'loading'
//   if (Object.prototype.hasOwnProperty.call(this.componentData, 'id')) {
//     const id = this.componentData.id
//     if (id === 'index') {
//       _type = 'index'
//     } else if (id.startsWith('class')) {
//       _type = 'class'
//     } else if (id.startsWith('namespace')) {
//       _type = 'namespace'
//     } else {
//       throw `We have come across a page with id '${id}' that is unknown to us, things are going to go poorly from here.`
//     }
//   } else if (
//     Object.prototype.hasOwnProperty.call(this.componentData, 'element')
//   ) {
//     _type = this.componentData.element.nodeName
//   }

//   return _type
// }

// const AsyncComp = defineAsyncComponent({
//   loader: () => import(`./templates/${componentType()}.vue`),
//   // A component to use while the async component is loading
//   loadingComponent: LoadingComponent,
//   // A component to use if the load fails
//   errorComponent: ErrorComponent,
// })
// </script>

<script>
export default {
  name: 'DoxygenComponent',
  props: {
    componentData: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      component: null,
      defaultComponent: false,
    }
  },
  watch: {
    componentData: function () {
      this.component = () => this.loader()
    },
  },
  computed: {
    loader() {
      return () =>
        import(
          /* webpackPrefetch: true */ `./templates/${this.componentType()}.vue`
        )
    },
  },
  mounted() {
    this.loader()
      .then(() => {
        this.component = () => this.loader()
      })
      .catch(() => {
        this.defaultComponent = true
        this.component = () =>
          import(/* webpackPrefetch: true */ './Default.vue')
      })
  },
  methods: {
    componentType() {
      let _type = 'loading'
      if (Object.prototype.hasOwnProperty.call(this.componentData, 'id')) {
        const id = this.componentData.id
        if (id === 'index') {
          _type = 'index'
        } else if (id.startsWith('class')) {
          _type = 'class'
        } else if (id.startsWith('namespace')) {
          _type = 'namespace'
        } else {
          throw `We have come across a page with id '${id}' that is unknown to us, things are going to go poorly from here.`
        }
      } else if (
        Object.prototype.hasOwnProperty.call(this.componentData, 'element')
      ) {
        _type = this.componentData.element.nodeName
      }

      return _type
    },
  },
}
</script>
