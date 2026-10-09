# Markdown output and limitations

`parse` and `serialize` aren't exact inverses. The editor keeps what the Markdown means, not how it was written, so `serialize` writes everything in one consistent style. Round-tripping a document through the editor can change its formatting, but not what it renders to, apart from the [limitations](#limitations) below.

## Output style

| Construct                   | Input (any of)                              | Output                         |
| --------------------------- | ------------------------------------------- | ------------------------------ |
| Bold                        | `**bold**`, `__bold__`                      | `**bold**`                     |
| Italic                      | `*italic*`, `_italic_`                      | `*italic*`                     |
| Bold italic                 | `***text***`, `**_text_**`, …               | `***text***`                   |
| Strikethrough (GFM)         | `~text~`, `~~text~~`                        | `~~text~~`                     |
| Heading                     | `## Heading`, `Heading` underlined with `---` | `## Heading`                 |
| Bullet list                 | `- item`, `* item`, `+ item`                | `* item`                       |
| Ordered list                | `1. item`, `1) item`                        | `1. item`                      |
| Code block                  | fenced with ```` ``` ```` or `~~~`, indented | fenced with ```` ``` ````     |
| Horizontal rule             | `---`, `***`, `___`                         | `---`                          |
| Hard line break             | two trailing spaces, trailing `\`           | trailing `\`                   |
| Link whose text is its URL  | `<https://example.com>`, `[https://example.com](https://example.com)` | `<https://example.com>` |
| Extended autolink (GFM)     | `www.example.com`                           | `[www.example.com](http://www.example.com)` |
| Reference link              | `[text][id]` with `[id]: https://example.com` | `[text](https://example.com)` |
| Reference image             | `![alt][id]` with `[id]: image.png`         | `![alt](image.png)`            |

Reference-style links and images are resolved when parsing, so they come back out as inline links and images, and the definitions are dropped. A reference without a matching definition isn't a link in Markdown, so it stays plain text.

## Spec conformance

The test suite checks every example from the [CommonMark spec](https://spec.commonmark.org/) and every GFM extension example from the [GFM spec](https://github.github.com/gfm/): it parses the example, serializes it, and checks that the result renders to the same HTML as the original. All examples pass except the ones affected by the limitations below. The examples that don't pass are listed with their cause in [`tests/CommonMarkSpec.test.ts`](https://github.com/marekdedic/prosemirror-remark/blob/master/tests/CommonMarkSpec.test.ts) and [`tests/GFMSpec.test.ts`](https://github.com/marekdedic/prosemirror-remark/blob/master/tests/GFMSpec.test.ts).

## Limitations

### Not supported yet

- **Raw HTML** is dropped when parsing, both HTML blocks and inline HTML such as `<br>` ([#1117](https://github.com/marekdedic/prosemirror-remark/issues/1117)).
- **Code block info strings** are lost, so ```` ```js ```` comes back out as ```` ``` ```` ([#1119](https://github.com/marekdedic/prosemirror-remark/issues/1119)).
- **GFM tables** are kept as plain paragraph text ([#275](https://github.com/marekdedic/prosemirror-remark/issues/275)).

When parsing drops something, it logs a warning to the console.

### Copy and paste

Pasting HTML, for example from a web page or another editor, keeps the formatting that the editor supports. Pasting plain text inserts it as it is, so Markdown pasted as plain text isn't converted: `**bold**` stays as literal asterisks.

### By design

- **Links without any text**, such as `[](https://example.com)`, are dropped when parsing, because a ProseMirror mark needs content to attach to. As they're invisible in the editor anyway, this is an accepted limitation.
- **Emphasis nested inside emphasis of the same type**, such as `*(*foo*)*` or `__foo __bar__ baz__`, collapses into a single level when parsing, because a ProseMirror text node can carry each mark only once. As the nested and collapsed forms render identically, this is an accepted limitation.
- The GFM spec autolinks `ftp://` addresses, but github.com and micromark don't, so neither does this package.
