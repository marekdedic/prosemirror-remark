# AGENTS.md

This file provides guidance to coding agents when working with code in this repository.

## Commands

- `npm run build` — Vite library build (ESM + CJS) plus bundled `.d.ts` via `unplugin-dts`; the `.d.cts` is a copy of the `.d.ts`. `npm start` is the same in watch mode.
- `npm run lint` — runs `lint:eslint` and the `lint:ts` group in parallel: `lint:ts:typecheck` (`tsc --noEmit`) and `lint:ts:attw` (`attw --pack`, validates the published type entry points). Run individually when debugging one of them.
- `npm run check` — runs `check:js-compat` (`es-check` ES2018 over the built `dist/`, so build first).
- `npm test` — single Vitest run with v8 coverage (what CI runs). `npm run test-watch` — Vitest in watch mode for the dev loop.
- `npm run docs:dev` — VitePress dev server for the docs site in `docs/` (`docs:build` / `docs:preview` for the production build). The site is deployed to GitHub Pages on release.
- Single test file: `npx vitest run tests/syntax-extensions/BoldExtension.test.ts`. Filter by test name with `-t "<pattern>"`.

## Architecture

The package plugs [remark](https://github.com/remarkjs/remark) into ProseMirror on top of [`prosemirror-unified`](https://github.com/marekdedic/prosemirror-unified), which owns the conversion machinery. This repo only supplies *extensions*; `prosemirror-unified` builds the schema, input rules, keymaps and the mdast⇄ProseMirror converters from them.

Three layers:

1. **Syntax extensions** (`src/syntax-extensions/`) — one file per Markdown construct, each subclassing `NodeExtension<MdastNode>` or `MarkExtension<MdastNode>` from `prosemirror-unified`. Every extension declares, for a single mdast node type:
   - `unistNodeName()` — the mdast type it handles; `unistToProseMirrorTest()` is overridden only when one mdast type maps to several ProseMirror nodes (e.g. `list` splits into `OrderedListExtension`/`UnorderedListExtension` on `ordered`).
   - `proseMirrorNodeName()`/`proseMirrorNodeSpec()` (or `proseMirrorMarkName()`/`proseMirrorMarkSpec()`) — returning `null` from both means the node contributes no schema entry (see `DefinitionExtension`).
   - `unistNodeToProseMirrorNodes()` and `proseMirrorNodeToUnistNodes()` — the two conversion directions. Marks additionally implement `processConvertedUnistNodes()` to wrap a run of already-converted nodes sharing the mark in a single unist node; marks whose unist node cannot have children (`inlineCode`) override `unistNodeIsLeaf()` to return `true`.
   - Optional `proseMirrorInputRules()`, `proseMirrorKeymap()`, `dependencies()` (extensions that require other extensions, e.g. list extensions pull in `ListItemExtension`).
2. **Bundle extensions** — `MarkdownExtension` (CommonMark) lists all base extensions in `dependencies()` and is the only place `remark-parse`/`remark-stringify` are registered, with the canonical stringify options (`fences`, `listItemIndent: "one"`, `rule: "-"`). `GFMExtension` depends on `MarkdownExtension` plus the three GFM extensions. Ordering matters: `ParagraphExtension` must come first so it is the schema's default block, and `LinkExtension` must precede the other mark extensions so that, when marks cover the same text, the link wraps them; `ItalicExtension` must precede `BoldExtension` so that bold italic text serializes as `***text***` rather than `**_text_**`.
3. **GFM micromark wiring** — GFM extensions register micromark/mdast plugins through `unifiedInitializationHook()` and the `buildUnifiedExtension()` helper in `src/utils/`, which appends to the processor's `micromarkExtensions`/`fromMarkdownExtensions`/`toMarkdownExtensions` data arrays.

Cross-node state (reference-style links/images needing `definition` nodes) flows through the `context` object threaded by `prosemirror-unified`'s converters; extensions namespace their slice by class name (`context.DefinitionExtension`) and expose a `…ExtensionContext` interface. `postUnistToProseMirrorHook()` runs after the whole tree is converted, once definitions are known.

Everything public must be re-exported from `src/index.ts` — `unplugin-dts` rolls up the declarations reachable from that entry point. `vite.config.ts` externalizes all prosemirror/remark/unified deps; add new peer-style deps to that `external` list.

How extensions render to the DOM and how users customise it (classes, `data-*` state, the opt-in default stylesheet, node views, DOM attribute hooks) is specified in `design/custom-ui.md`. Follow it when changing `toDOM` or a node view.

## Tests

Tests are Vitest `test()` blocks that assert through custom matchers rather than by hand. `createExtensionFixture(extension, otherExtensions)` in `tests/utils/fixture.ts` builds a minimal `ProseMirrorUnified` for the extension under test, with `ParserProviderExtension` (a test-only stand-in supplying remark parse/stringify without the full `MarkdownExtension`), local `Root`/`Paragraph`/`Text` extensions and `otherExtensions`, which come before the extension under test. It also exposes `prosemirror-test-builder` helpers as `fx.b`. Assert with `expect(fx)` and the matchers registered in `tests/utils/matchers.ts`:

- conversion: `toHandleUnistNode`, `toMatchUnistNode`, `toConvertUnistNode`, `toProvideNode`/`toProvideMark`, `toMatchProseMirrorNode`/`toMatchProseMirrorMark`, `toConvertProseMirrorNode`;
- editing: `toTransformInput` (input typed at a given selection, often a `<cursor>` tag in the builder content), `toTransformBlockInput` and `toTransformInlineInput` (input typed in several surrounding contexts), `toTransformCommand`, `toReportKeymapApplicability`;
- DOM: `toParseDOM`, `toRenderDOM`.

The `toTransform…` matchers also check the serialized Markdown and that nothing was logged to `console.warn`, so a warning during conversion fails the test. Prefer adding a matcher over repeating assertion logic in tests.

Node views are tested with `renderNodeView` from `tests/utils/node-view.ts`, which mounts the editor with the extension's node views, input rules and keymap, and drives its DOM directly. The bundles have their own tests (`tests/MarkdownExtension.test.ts`, `tests/GFMExtension.test.ts`), and `tests/CommonMarkSpec.test.ts`/`tests/GFMSpec.test.ts` round-trip every spec example, listing the known failures with their cause.
