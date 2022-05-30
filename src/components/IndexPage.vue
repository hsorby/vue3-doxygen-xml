<template>
  <h1>API Documentation</h1>
  <template
    v-for="(namespace, namespaceIndex) in data.namespaces"
    :key="'namespace_' + namespaceIndex"
    :id="'namespace_' + namespaceIndex"
  >
    <section v-if="haveNamespace(namespace)">
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
</template>

<script setup>
import { useRoute } from 'vue-router'

const props = defineProps({
  data: Object,
  name: String,
})

const route = useRoute()

const basePath = route.fullPath

function haveNamespace(namespace) {
  return namespace && namespace.classes.length
}
</script>

<style scoped></style>
