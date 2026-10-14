// vue's full build (which can compile string templates in the browser)
// has the same types as plain "vue", but doesn't ship its own .d.ts
declare module "vue/dist/vue.esm-bundler.js" {
    export * from "vue";
}
