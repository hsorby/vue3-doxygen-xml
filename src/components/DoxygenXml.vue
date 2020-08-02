<template>
  <div class="doxygen-xml">
    <doxygen-component :component-data="data"></doxygen-component>
  </div>
</template>

<script>
import store from '@/store'

import { getPageStem } from '@/router/modules/doxygen'
import DoxygenComponent from '@/components/DoxygenComponent'

export default {
  name: 'DoxygenXml',
  components: {
    DoxygenComponent
  },
  props: {
    baseURL: {
      type: String,
      default: ''
    },
    scrollDelay: {
      type: Number,
      default: 500
    }
  },
  data() {
    return {
      page: {}
    }
  },
  computed: {
    data() {
      return this.page
    }
  },
  watch: {
    $route: {
      handler: function(to, from) {
        if (from === undefined || to.path !== from.path) {
          this.page = {}
          this.fetchPageData(to)
          if (to.hash) {
            setTimeout(() => {
              const elem = document.querySelector(to.hash)
              window.scrollTo({
                top: elem.offsetTop,
                behavior: 'smooth'
              })
            }, this.scrollDelay)
          }
        } else if (to.path === from.path && to.hash) {
          const elem = document.querySelector(to.hash)
          window.scrollTo({
            top: elem.offsetTop,
            behavior: 'smooth'
          })
        }
      },
      immediate: true
    }
  },
  updated() {
    this.$emit('updated')
  },
  methods: {
    fetchPageData(routeTo) {
      const mainPage = routeTo.params.pageName === undefined
      const pageName = mainPage ? 'index' : routeTo.params.pageName
      const pageStem = getPageStem(routeTo)
      let _this = this
      store
        .dispatch('doxygen/fetchPage', {
          page_name: pageName,
          page_stem: pageStem,
          page_url: _this.baseURL
        })
        .then(page => {
          if (mainPage) {
            _this.page = page
          } else {
            store
              .dispatch('doxygen/fetchDependeePages', {
                page_name: pageName,
                page_stem: pageStem,
                page_url: _this.baseURL
              })
              .then(() => {
                _this.page = page
              })
          }
        })
    }
  }
}
</script>
