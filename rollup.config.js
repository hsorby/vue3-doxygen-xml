import vue from '@vitejs/plugin-vue'
// import commonjs from '@rollup/plugin-commonjs'
// import buble from '@rollup/plugin-buble'
import { terser } from 'rollup-plugin-terser'
import scss from 'rollup-plugin-scss'

export default {
  input: 'src/index.js',
  external: ['vue', 'axios', 'vuex', 'vue-router'],
  output: [
    {
      dir: 'dist',
      entryFileNames: 'vue3-doxygen-xml.cjs.js',
      // file: 'dist/vue3-doxygen-xml.cjs.js',
      format: 'cjs',
    },
    {
      dir: 'dist',
      entryFileNames: 'vue3-doxygen-xml.es.js',
      // file: 'dist/vue3-doxygen-xml.es.js',
      format: 'esm',
    },
    // Cannot do this format with split builds.
    // {
    //   name: 'Vue3DoxygenXML',
    //   dir: 'dist',
    //   entryFileNames: 'vue3-doxygen-xml.umd.js',
    //   // file: 'dist/vue3-doxygen-xml.umd.js',
    //   format: 'umd',
    //   globals: {
    //     axios: 'Axios',
    //     vue: 'Vue',
    //     vuex: 'Vuex',
    //     'vue-router': 'vue-router',
    //   },
    // },
  ],
  plugins: [
    // css(),
    // scss(),
    vue({
      preprocessStyles: true,
    }),
    // commonjs(),
    // buble({
    //   transforms: {
    //     forOf: false,
    //     asyncAwait: false,
    //   },
    // }),
    terser(),
    // nodeResolve(),
    // replace({
    // preventAssignment: true,
    // 'process.env.NODE_ENV': JSON.stringify('production'), // or 'development'
    // }),
  ],
}
