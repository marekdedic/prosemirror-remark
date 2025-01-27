import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  build: {
    emptyOutDir: false,
    lib: {
      entry: "src/index",
      formats: ["es", "cjs"],
      name: "prosemirror-remark",
    },
    minify: false,
    rollupOptions: {
      external: [
        "prosemirror-commands",
        "prosemirror-inputrules",
        "prosemirror-model",
        "prosemirror-schema-list",
        "prosemirror-state",
        "prosemirror-unified",
        "remark-parse",
        "remark-stringify",
        "unified",
      ],
    },
    sourcemap: true,
  },
  plugins: [dts({ rollupTypes: true })],
});
