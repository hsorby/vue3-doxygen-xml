<template>
  <div>
    <h1>API Documentation</h1>
    <section
      v-for="(namespace, namespaceIndex) in data.namespaces"
      :key="'namespace_' + namespaceIndex"
      :id="'namespace_' + namespaceIndex"
    >
      <h2 v-if="namespace.classes.length">
        Namespace:
        <router-link :to="{ path: `${basePath}/${namespace.refId}` }">{{
          namespace.name
        }}</router-link>
      </h2>
      <ul class="namespace-group" v-if="namespace.classes.length">
        <li class="namespace-group-item">Classes</li>
        <ul class="class-list">
          <li
            v-for="(namespaceClass, namespaceClassIndex) in namespace.classes"
            :key="namespace.name + '_' + namespaceClassIndex"
            class="class-list-item"
          >
            <router-link
              :to="{ path: `${basePath}/${namespaceClass.refId}` }"
              >{{ namespaceClass.name }}</router-link
            >
          </li>
        </ul>
      </ul>
    </section>
  </div>
</template>

<script>
export default {
  name: 'index',
  props: {
    data: {
      type: Object,
      required: true
    }
  },
  computed: {
    basePath() {
      return this.$route.fullPath
    }
  }
}
</script>

<style scoped></style>
