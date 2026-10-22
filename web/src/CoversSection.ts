import { defineComponent } from "vue/dist/vue.esm-bundler.js";

// a class's cover requests; the class-wide board comes in a later step, and until then requests
// are handled on each published week's page
export const CoversSection = defineComponent({
    props: {
        name: { type: String, required: true },
    },
    template: `
        <div class="section-head">
            <div>
                <p class="eyebrow">{{ name }}</p>
                <h1>Cover requests</h1>
            </div>
        </div>
        <section class="card">
            <p class="muted">For now, cover requests are on each published week's page under Schedule.</p>
        </section>
    `,
});
