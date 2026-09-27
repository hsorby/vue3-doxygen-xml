<template>
  <h1>API Documentation</h1>
  <template
    v-for="(namespace, namespaceIndex) in data.namespaces"
    :key="'namespace_' + namespaceIndex"
  >
    <section v-if="haveNamespace(namespace)" :id="'namespace_' + namespaceIndex">
      <h2>
        Namespace:
        <router-link :to="{ path: `${basePath}/${namespace.refId}` }">{{
          namespace.name
        }}</router-link>
      </h2>
      <ul class="namespace-group">
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
  </template>
  <section v-if="data.classes && data.classes.length" id="global_classes">
    <h2>Classes</h2>
    <ul class="class-list">
      <li
        v-for="globalClass in data.classes"
        :key="'global_' + globalClass.refId"
        class="class-list-item"
      >
        <router-link :to="{ path: `${basePath}/${globalClass.refId}` }">{{
          globalClass.name
        }}</router-link>
      </li>
    </ul>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const props = defineProps({
  data: Object,
  name: String,
})

const route = useRoute()

// The index is shown at the route's base, e.g. /help. Use the path only:
// fullPath would carry any ?query or #hash into every link.
const basePath = computed(() => route.path.replace(/\/+$/, ''))

function haveNamespace(namespace) {
  return namespace && namespace.classes.length
}
</script>

<style scoped></style>
