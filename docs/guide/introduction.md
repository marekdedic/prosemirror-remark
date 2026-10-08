# Introduction

prosemirror-remark adds Markdown support to the [ProseMirror](https://prosemirror.net/) rich-text editor. Markdown goes in, users edit it as rich text, and Markdown comes back out. Parsing and serializing is done by [remark](https://github.com/remarkjs/remark).

## How it fits together

prosemirror-remark is a set of extensions for [prosemirror-unified](https://marekdedic.github.io/prosemirror-unified/), a framework that connects ProseMirror to the [unified](https://unifiedjs.com/) ecosystem. prosemirror-unified does the plumbing: it builds the ProseMirror schema, input rules and keymaps from the extensions you give it, and converts documents between remark's syntax tree and ProseMirror. prosemirror-remark supplies the extensions that know about Markdown.

In practice, you create a `ProseMirrorUnified` adapter from prosemirror-unified, pass it extensions from prosemirror-remark, and use the adapter to set up your editor.

## CommonMark or GitHub Flavored Markdown

There are two ready-made bundles:

- **`MarkdownExtension`** supports [CommonMark](https://commonmark.org/): paragraphs, headings, emphasis, links, images, lists, code, block quotes and so on.
- **`GFMExtension`** adds the [GitHub Flavored Markdown](https://github.github.com/gfm/) extensions on top: strikethrough, task lists and extended autolinks. See [GitHub Flavored Markdown](/guide/gfm).

If you only want some of the syntax, you can also [pick individual extensions](/guide/choosing-extensions).

## Where to go next

- **To add a Markdown editor to your app**, start with [Getting started](/guide/getting-started), then read [Markdown output and limitations](/guide/markdown-output) to know what to expect from the Markdown it produces.
- **To build menus or toolbars, or style the editor**, see [Extensions](/reference/extensions) for the names of the ProseMirror nodes and marks, the HTML they render, and the built-in input rules and keyboard shortcuts.
- **To change which syntax is supported or how it behaves**, see [Picking individual extensions](/guide/choosing-extensions) and [Customising an extension](/extending/customising).
- **To support syntax this package doesn't cover**, see [Adding new Markdown syntax](/extending/new-syntax).
