<template>
  <!-- The :key forces a fresh render whenever the theme flips. -->
  <!--
    v-html is required to inject the SVG string returned by mermaid.render().
    The source is doc-authored diagram markup (not user input), and mermaid
    sanitises its own output, so this is not an XSS vector.
  -->
  <div v-if="svg" :key="String(isDark)" class="mermaid" v-html="svg" />
  <div v-else class="mermaid mermaid--loading" />
</template>

<script setup lang="ts">
  import { useData } from "vitepress";
  import { onMounted, ref, watch } from "vue";

  const props = defineProps<{ graph: string }>();
  const { isDark } = useData();

  const svg = ref("");
  const source = decodeURIComponent(props.graph);

  const render = async (): Promise<void> => {
    // Import mermaid lazily so it never runs during SSR / the server build.
    const { default: mermaid } = await import("mermaid");

    mermaid.initialize({
      startOnLoad: false,
      theme: isDark.value ? "dark" : "default",
    });

    // A unique id per render avoids a duplicate-id race.
    const id = `mermaid-${Math.random().toString(36).slice(2)}`;
    try {
      const { svg: rendered } = await mermaid.render(id, source);
      svg.value = rendered;
    } catch (error) {
      console.error("Mermaid render error:", error);
      svg.value = `<pre class="mermaid-error">${String(error)}</pre>`;
    }
  };

  onMounted(render);
  watch(isDark, render);
</script>

<style scoped>
  .mermaid {
    display: flex;
    justify-content: center;
    margin: 1rem 0;
  }
  .mermaid :deep(svg) {
    max-width: 100%;
    height: auto;
  }
  .mermaid--loading {
    min-height: 2rem;
  }
</style>
