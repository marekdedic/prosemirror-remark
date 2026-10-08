# Bundles

Bundles are extensions that include a whole set of other extensions, so that you don't have to list them one by one.

## `MarkdownExtension`

Supports [CommonMark](https://commonmark.org/). It includes every extension on the [Extensions](/reference/extensions) page except the [GFM extensions](/reference/extensions#gfm-extensions).

`MarkdownExtension` is also what sets up remark. It registers [`remark-parse`](https://github.com/remarkjs/remark/tree/main/packages/remark-parse), and [`remark-stringify`](https://github.com/remarkjs/remark/tree/main/packages/remark-stringify) with these options:

| Option           | Value                | Effect                                                                     |
| ---------------- | -------------------- | -------------------------------------------------------------------------- |
| `fences`         | `true`               | Code blocks are always fenced, never indented.                             |
| `listItemIndent` | `"one"`              | List item content is indented by one space after the marker.               |
| `resourceLink`   | `true`               | Autolinks are written as inline links, `[url](url)`.                       |
| `rule`           | `"-"`                | Horizontal rules are written as `---`.                                     |
| `join`           | (internal function)  | Keeps a blank line between list item children where Markdown needs one to preserve the structure. |

All other options keep remark-stringify's defaults. [Customising an extension](/extending/customising#changing-the-markdown-output) shows how to change them.

## `GFMExtension`

Supports [GitHub Flavored Markdown](https://github.github.com/gfm/). It includes:

1. `MarkdownExtension`, with everything above
2. `ExtendedAutolinkExtension`
3. `StrikethroughExtension`
4. `TaskListItemExtension`

See [GitHub Flavored Markdown](/guide/gfm).
