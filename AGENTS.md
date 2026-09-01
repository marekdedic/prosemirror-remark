# AGENTS.md

This file provides guidance to coding agents when working with code in this repository.

## Commands

- `npm run build` — Vite library build (ESM + CJS) plus bundled `.d.ts` via `unplugin-dts`; the `.d.cts` is a copy of the `.d.ts`.
- `npm run lint` — runs `lint:eslint` and the `lint:ts` group in parallel: `lint:ts:typecheck` (`tsc --noEmit`) and `lint:ts:attw` (`attw --pack`, validates the published type entry points). Run individually when debugging one of them.
- `npm test` — Vitest in watch mode. `npm run test-coverage` — single run with v8 coverage (what CI runs).
- Single test file: `npx vitest run tests/syntax-extensions/BoldExtension.test.ts`. Filter by test name with `-t "<pattern>"`.

## Architecture

The package plugs [remark](https://github.com/remarkjs/remark) into ProseMirror on top of [`prosemirror-unified`](https://github.com/marekdedic/prosemirror-unified), which owns the conversion machinery. This repo only supplies *extensions*; `prosemirror-unified` builds the schema, input rules, keymaps and the mdast⇄ProseMirror converters from them.

Three layers:

1. **Syntax extensions** (`src/syntax-extensions/`) — one file per Markdown construct, each subclassing `NodeExtension<MdastNode>` or `MarkExtension<MdastNode>` from `prosemirror-unified`. Every extension declares, for a single mdast node type:
   - `unistNodeName()` — the mdast type it handles; `unistToProseMirrorTest()` is overridden only when one mdast type maps to several ProseMirror nodes (e.g. `list` splits into `OrderedListExtension`/`UnorderedListExtension` on `ordered`).
   - `proseMirrorNodeName()`/`proseMirrorNodeSpec()` (or `proseMirrorMarkName()`/`proseMirrorMarkSpec()`) — returning `null` from both means the node contributes no schema entry (see `DefinitionExtension`).
   - `unistNodeToProseMirrorNodes()` and `proseMirrorNodeToUnistNodes()` — the two conversion directions. Marks additionally implement `processConvertedUnistNode()` to wrap already-converted children.
   - Optional `proseMirrorInputRules()`, `proseMirrorKeymap()`, `dependencies()` (extensions that require other extensions, e.g. list extensions pull in `ListItemExtension`).
2. **Bundle extensions** — `MarkdownExtension` (CommonMark) lists all base extensions in `dependencies()` and is the only place `remark-parse`/`remark-stringify` are registered, with the canonical stringify options (`fences`, `listItemIndent: "one"`, `resourceLink`, `rule: "-"`). `GFMExtension` depends on `MarkdownExtension` plus the three GFM extensions. Ordering matters: `ParagraphExtension` must come first so it is the schema's default block.
3. **GFM micromark wiring** — GFM extensions register micromark/mdast plugins through `unifiedInitializationHook()` and the `buildUnifiedExtension()` helper in `src/utils/`, which appends to the processor's `micromarkExtensions`/`fromMarkdownExtensions`/`toMarkdownExtensions` data arrays.

Cross-node state (reference-style links/images needing `definition` nodes) flows through the `context` object threaded by `prosemirror-unified`'s converters; extensions namespace their slice by class name (`context.DefinitionExtension`) and expose a `…ExtensionContext` interface. `postUnistToProseMirrorHook()` runs after the whole tree is converted, once definitions are known.

Everything public must be re-exported from `src/index.ts` — `unplugin-dts` rolls up the declarations reachable from that entry point. `vite.config.ts` externalizes all prosemirror/remark/unified deps; add new peer-style deps to that `external` list.

## Tests

Tests are declarative, built from the fluent testers in `tests/utils/`: `NodeExtensionTester` and `MarkExtensionTester` (both extending `SyntaxExtensionTester`). A test file constructs a tester with the extension under test, chains `shouldMatchUnistNode` / `shouldConvertUnistNode` / `shouldConvertProseMirrorNode` / `shouldMatchInputRule` / `shouldNotMatchInputRule` / `shouldSupportKeymap` assertions, and ends with `.test()`, which registers the actual Vitest cases. Prefer extending a tester over hand-writing `test()` blocks.

Testers instantiate a minimal `ProseMirrorUnified` containing `ParserProviderExtension` (a test-only stand-in supplying remark parse/stringify without the full `MarkdownExtension`) plus local `Root`/`Paragraph`/`Text` extensions; pass anything else the extension needs via `otherExtensionsInTest`. Keymap and input-rule tests assert that nothing was logged to `console.warn`, so a warning during conversion fails the test.
