<template>
  <span>
    <template v-if="item.reference === null && item.text">
      {{ decodedText }}
    </template>
    <template v-else-if="item.reference !== null">
      {{ preDecodedText }}
      <router-link
        :to="{
          path: derivedLink.path,
          hash: derivedLink.hash,
          // params: item.link.params,
        }"
        >{{ decodedText }}</router-link
      >
      {{ postDecodedText }}
    </template>
  </span>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import { decodeHTML } from '../js/utilities'
import { getPageStem } from '../router/modules/doxygen'

export default {
  name: 'LinkedText',
  props: {
    item: {
      type: Object,
    },
    link: {
      type: Object,
    },
  },
  data: function () {
    return {
      derivedLink: { path: '', hash: '' },
    }
  },
  mounted: function () {
    if (this.link) {
      this.derivedLink = this.link
    }
    if (this.item.reference === null) {
      return
    }
    if (this.item.reference.refKind === 'member') {
      let hashRef = this.item.reference.refId
      if (!hashRef.startsWith('#')) {
        hashRef = '#' + hashRef
      }
      this.derivedLink.hash = hashRef
      this.derivedLink.path = this.getPageIdForReferenceId(
        getPageStem(this.$route),
        this.derivedLink.hash
      )
      if (this.derivedLink.path === undefined) {
        this.derivedLink.path = ''
        this.fetchPageBasedOnReferenceId(this.item.reference.refId, 1)
      }
    } else if (this.item.reference.refKind === 'compound') {
      this.derivedLink.path = this.item.reference.refId
      this.derivedLink.hash = ''
    } else {
      throw 'Found a doxygen ref that is not being handled! Eeek.'
    }
  },
  methods: {
    fetchPageBasedOnReferenceId(referenceId, attempt) {
      const splitReferenceId = referenceId.split('_')
      if (attempt < splitReferenceId.length) {
        // We are given a reference id so this won't match a page name which we need.
        // So we will split on '_' and then start to stitch a page name together.
        let potentialPageName = splitReferenceId.splice(0, attempt).join('_')
        const baseURL = this.getBaseUrl(getPageStem(this.$route))
        this.fetchPage({
          page_name: potentialPageName,
          page_stem: getPageStem(this.$route),
          page_url: baseURL,
        })
          .then((response) => {
            this.derivedLink.path = response.id
          })
          .catch(() => {
            this.fetchPageBasedOnReferenceId(referenceId, attempt + 1)
          })
      } else {
        throw `Could not determine the page that reference '${referenceId}' came from.`
      }
    },
    ...mapActions('doxygen', ['fetchPage']),
  },
  computed: {
    ...mapGetters({
      getPageIdForReferenceId: 'doxygen/getPageIdForReferenceId',
      getBaseUrl: 'doxygen/getBaseUrl',
    }),
    decodedText() {
      if (this.item.reference !== null) {
        return this.item.linkedText
      }
      return decodeHTML(this.item.text)
    },
    preDecodedText() {
      const preText = this.item.text.split(this.item.linkedText)[0]
      return decodeHTML(preText)
    },
    postDecodedText() {
      const postText = this.item.text.split(this.item.linkedText)[1]
      return decodeHTML(postText)
    },
  },
}
</script>

<style scoped></style>
