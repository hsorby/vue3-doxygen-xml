<template>
  <doxygen-xml baseURL="/doxygen/v0.1.0"></doxygen-xml>
</template>

<script>
import DoxygenXml from '../components/DoxygenXml.vue'

export default {
  name: 'Home',
  components: {
    DoxygenXml
  },
  // beforeRouteEnter(routeTo, routeFrom, next) {
  //   updateRoute(routeTo, routeFrom, next)
  // },
  // beforeRouteUpdate(to, from, next) {
  //   if (to.path === from.path) {
  //     if (to.hash) {
  //       const toElem = document.querySelector(to.hash)
  //       if (toElem && !isInViewport(toElem)) {
  //         window.location.hash = to.hash
  //         window.scrollTo({
  //           top: toElem.offsetTop,
  //           behavior: 'smooth'
  //         })
  //       }
  //     }
  //   } else {
  //     updateRoute(to, from, next)
  //   }
  // },
  props: ['data']
}
</script>
