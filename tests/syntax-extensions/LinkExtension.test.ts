import type { Node as ProseMirrorNode } from "prosemirror-model";
import type { Mappable } from "prosemirror-transform";

import {
  EditorState,
  Selection,
  SelectionRange,
  TextSelection,
  type Transaction,
} from "prosemirror-state";
import { describe, expect, test, vi } from "vitest";

import { BoldExtension } from "../../src/syntax-extensions/BoldExtension";
import { BreakExtension } from "../../src/syntax-extensions/BreakExtension";
import { CodeBlockExtension } from "../../src/syntax-extensions/CodeBlockExtension";
import { ExtendedAutolinkExtension } from "../../src/syntax-extensions/ExtendedAutolinkExtension";
import { ImageExtension } from "../../src/syntax-extensions/ImageExtension";
import { InlineCodeExtension } from "../../src/syntax-extensions/InlineCodeExtension";
import {
  LinkExtension,
  openLinkEditor,
  removeLink,
  setLink,
} from "../../src/syntax-extensions/LinkExtension";
import { createExtensionFixture } from "../utils/fixture";
import "../utils/matchers";

class RangesSelection extends Selection {
  public constructor(ranges: Array<SelectionRange>) {
    super(ranges[0].$from, ranges[0].$to, ranges);
  }

  public override eq(other: Selection): boolean {
    return other === this;
  }

  public override map(doc: ProseMirrorNode, mapping: Mappable): Selection {
    return new RangesSelection(
      this.ranges.map(
        (range) =>
          new SelectionRange(
            doc.resolve(mapping.map(range.$from.pos)),
            doc.resolve(mapping.map(range.$to.pos)),
          ),
      ),
    );
  }

  public override toJSON(): unknown {
    return { type: "ranges" };
  }
}

describe("LinkExtension", () => {
  const fx = createExtensionFixture(new LinkExtension(), []);
  const fxInContext = createExtensionFixture(new LinkExtension(), [
    new BoldExtension(),
    new CodeBlockExtension(),
    new ImageExtension(),
  ]);

  test("handles the `link` unist node", () => {
    expect(fx).toHandleUnistNode("link");
  });

  test("provides the `link` ProseMirror mark", () => {
    expect(fx).toProvideMark("link");
  });

  describe("matches unist nodes", () => {
    test("matches `link` with only a url", () => {
      expect(fx).toMatchUnistNode({
        children: [],
        type: "link",
        url: "https://example.test",
      });
    });

    test("matches `link` with children", () => {
      expect(fx).toMatchUnistNode({
        children: [{ type: "text", value: "Click me!" }],
        type: "link",
        url: "https://example.test",
      });
    });

    test("matches `link` with a title", () => {
      expect(fx).toMatchUnistNode({
        children: [{ type: "text", value: "Click me!" }],
        title: "This link has a title",
        type: "link",
        url: "https://example.test",
      });
    });

    test("does not match other nodes", () => {
      expect(fx).not.toMatchUnistNode({ type: "other" });
    });
  });

  describe("converts unist -> ProseMirror", () => {
    test("plain", () => {
      expect(fx).toConvertUnistNode(
        {
          children: [{ type: "text", value: "Click me!" }],
          type: "link",
          url: "https://example.test",
        },
        (b) => [b.link({ href: "https://example.test" }, "Click me!")],
      );
    });

    test("with a title", () => {
      expect(fx).toConvertUnistNode(
        {
          children: [{ type: "text", value: "Click me!" }],
          title: "This link has a title",
          type: "link",
          url: "https://example.test",
        },
        (b) => [
          b.link(
            {
              href: "https://example.test",
              title: "This link has a title",
            },
            "Click me!",
          ),
        ],
      );
    });
  });

  test("matches the `link` mark", () => {
    expect(fx).toMatchProseMirrorMark((b) =>
      b.schema.mark("link", { href: "https://example.test" }),
    );
  });

  describe("converts ProseMirror -> unist", () => {
    test("plain", () => {
      expect(fx).toConvertProseMirrorNode(
        (b) => b.link({ href: "https://example.test" }, "Click me!"),
        [
          {
            children: [{ type: "text", value: "Click me!" }],
            type: "link",
            url: "https://example.test",
          },
        ],
      );
    });

    test("with a title", () => {
      expect(fx).toConvertProseMirrorNode(
        (b) =>
          b.link(
            {
              href: "https://example.test",
              title: "This link has a title",
            },
            "Click me!",
          ),
        [
          {
            children: [{ type: "text", value: "Click me!" }],
            title: "This link has a title",
            type: "link",
            url: "https://example.test",
          },
        ],
      );
    });
  });

  describe("parses DOM", () => {
    test("with an href", () => {
      expect(fx).toParseDOM(
        '<p><a href="https://example.test">Click me!</a></p>',
        (b) => [b.p(b.link({ href: "https://example.test" }, "Click me!"))],
      );
    });

    test("with an href and a title", () => {
      expect(fx).toParseDOM(
        '<p><a href="https://example.test" title="A title">Click me!</a></p>',
        (b) => [
          b.p(
            b.link(
              {
                href: "https://example.test",
                title: "A title",
              },
              "Click me!",
            ),
          ),
        ],
      );
    });

    test("without an href", () => {
      expect(fx).toParseDOM("<p><a>Click me!</a></p>", (b) => [
        b.p("Click me!"),
      ]);
    });
  });

  test("renders DOM", () => {
    expect(fx).toRenderDOM(
      (b) => [b.p(b.link({ href: "https://example.test" }, "Click me!"))],
      '<p><a href="https://example.test">Click me!</a></p>',
    );
  });

  test("provides the `Mod-k` keymap", () => {
    expect(
      Object.keys(fx.extension.proseMirrorKeymap(fx.schema)),
    ).toStrictEqual(["Mod-k"]);
  });

  test("provides the URL syncing, link editor and paste plugins", () => {
    expect(fx.extension.proseMirrorPlugins(fx.schema)).toHaveLength(3);
  });

  test("provides no keymap with the link editor turned off", () => {
    expect(
      new LinkExtension({ editor: false }).proseMirrorKeymap(),
    ).toStrictEqual({});
  });

  test("provides no link editor plugin with the link editor turned off", () => {
    expect(
      new LinkExtension({ editor: false }).proseMirrorPlugins(),
    ).toHaveLength(2);
  });

  test("provides no paste plugin with linkOnPaste turned off", () => {
    expect(
      new LinkExtension({ linkOnPaste: false }).proseMirrorPlugins(),
    ).toHaveLength(2);
  });

  describe("setLink", () => {
    test("changes the URL of the link at the caret", () => {
      expect(fx).toTransformCommand(
        (b) => [b.p("a ", b.link({ href: "https://a.test" }, "li<cursor>nk"))],
        "cursor",
        setLink({ href: "https://b.test" }),
        (b) => [b.p("a ", b.link({ href: "https://b.test" }, "link"))],
        "a [link](https://b.test)",
      );
    });

    test("keeps the title when it's left out", () => {
      expect(fx).toTransformCommand(
        (b) => [
          b.p(b.link({ href: "https://a.test", title: "T" }, "li<cursor>nk")),
        ],
        "cursor",
        setLink({ href: "https://b.test" }),
        (b) => [b.p(b.link({ href: "https://b.test", title: "T" }, "link"))],
        '[link](https://b.test "T")',
      );
    });

    test("sets the title", () => {
      expect(fx).toTransformCommand(
        (b) => [b.p(b.link({ href: "https://a.test" }, "li<cursor>nk"))],
        "cursor",
        setLink({ href: "https://a.test", title: "T" }),
        (b) => [b.p(b.link({ href: "https://a.test", title: "T" }, "link"))],
        '[link](https://a.test "T")',
      );
    });

    test("removes an empty title", () => {
      expect(fx).toTransformCommand(
        (b) => [
          b.p(b.link({ href: "https://a.test", title: "T" }, "li<cursor>nk")),
        ],
        "cursor",
        setLink({ href: "https://a.test", title: "" }),
        (b) => [b.p(b.link({ href: "https://a.test" }, "link"))],
        "[link](https://a.test)",
      );
    });

    test("changes the whole link, across other marks", () => {
      expect(fxInContext).toTransformCommand(
        (b) => [
          b.p(
            b.link(
              { href: "https://a.test" },
              "a ",
              b.strong("b<cursor>old"),
              " link",
            ),
          ),
        ],
        "cursor",
        setLink({ href: "https://b.test" }),
        (b) => [
          b.p(
            b.link({ href: "https://b.test" }, "a ", b.strong("bold"), " link"),
          ),
        ],
        "[a **bold** link](https://b.test)",
      );
    });

    test("changes only the link at the caret, not an adjacent one", () => {
      expect(fx).toTransformCommand(
        (b) => [
          b.p(
            b.link({ href: "https://a.test" }, "o<cursor>ne"),
            b.link({ href: "https://c.test" }, "two"),
          ),
        ],
        "cursor",
        setLink({ href: "https://b.test" }),
        (b) => [
          b.p(
            b.link({ href: "https://b.test" }, "one"),
            b.link({ href: "https://c.test" }, "two"),
          ),
        ],
        "[one](https://b.test)[two](https://c.test)",
      );
    });

    test("adds a link over the selection", () => {
      expect(fx).toTransformCommand(
        (b) => [b.p("a <a>link<b> here")],
        { anchor: "a", head: "b" },
        setLink({ href: "https://a.test" }),
        (b) => [b.p("a ", b.link({ href: "https://a.test" }, "link"), " here")],
        "a [link](https://a.test) here",
      );
    });

    test("replaces links within the selection", () => {
      expect(fx).toTransformCommand(
        (b) => [
          b.p("<a>a ", b.link({ href: "https://a.test" }, "link"), " here<b>"),
        ],
        { anchor: "a", head: "b" },
        setLink({ href: "https://b.test" }),
        (b) => [b.p(b.link({ href: "https://b.test" }, "a link here"))],
        "[a link here](https://b.test)",
      );
    });

    test("inserts the URL as a link at an empty caret", () => {
      expect(fx).toTransformCommand(
        (b) => [b.p("a <cursor> b")],
        "cursor",
        setLink({ href: "https://a.test" }),
        (b) => [
          b.p("a ", b.link({ href: "https://a.test" }, "https://a.test"), " b"),
        ],
        "a <https://a.test> b",
      );
    });

    test("keeps the marks at the caret when inserting", () => {
      expect(fxInContext).toTransformCommand(
        (b) => [b.p(b.strong("a<cursor>b"))],
        "cursor",
        setLink({ href: "https://a.test" }),
        (b) => [
          b.p(
            b.strong(
              "a",
              b.link({ href: "https://a.test" }, "https://a.test"),
              "b",
            ),
          ),
        ],
        "**a<https://a.test>b**",
      );
    });

    test("keeps the text of a link whose text is its URL", () => {
      expect(fx).toTransformCommand(
        (b) => [
          b.p(b.link({ href: "https://a.test" }, "https://a.<cursor>test")),
        ],
        "cursor",
        setLink({ href: "https://b.test" }),
        (b) => [b.p(b.link({ href: "https://b.test" }, "https://a.test"))],
        "[https://a.test](https://b.test)",
      );
    });

    test("changes only the title of a link whose text is its URL", () => {
      expect(fx).toTransformCommand(
        (b) => [
          b.p(b.link({ href: "https://a.test" }, "https://a.<cursor>test")),
        ],
        "cursor",
        setLink({ href: "https://a.test", title: "T" }),
        (b) => [
          b.p(b.link({ href: "https://a.test", title: "T" }, "https://a.test")),
        ],
        '[https://a.test](https://a.test "T")',
      );
    });

    test("keeps the text of an email autolink", () => {
      expect(fx).toTransformCommand(
        (b) => [b.p(b.link({ href: "mailto:a@b.test" }, "a@b.<cursor>test"))],
        "cursor",
        setLink({ href: "mailto:c@d.test" }),
        (b) => [b.p(b.link({ href: "mailto:c@d.test" }, "a@b.test"))],
        "[a@b.test](mailto:c@d.test)",
      );
    });

    test("inserts an email URL as its address", () => {
      expect(fx).toTransformCommand(
        (b) => [b.p("a <cursor> b")],
        "cursor",
        setLink({ href: "mailto:c@d.test" }),
        (b) => [
          b.p("a ", b.link({ href: "mailto:c@d.test" }, "c@d.test"), " b"),
        ],
        "a <c@d.test> b",
      );
    });

    test("keeps a link with an empty URL", () => {
      expect(fx).toTransformCommand(
        (b) => [b.p(b.link({ href: "https://a.test" }, "li<cursor>nk"))],
        "cursor",
        setLink({ href: "" }),
        (b) => [b.p(b.link({ href: "" }, "link"))],
        "[link]()",
      );
    });

    test("trims whitespace and removes line endings from the URL", () => {
      expect(fx).toTransformCommand(
        (b) => [b.p(b.link({ href: "https://a.test" }, "li<cursor>nk"))],
        "cursor",
        setLink({ href: " https://b.\ntest\n " }),
        (b) => [b.p(b.link({ href: "https://b.test" }, "link"))],
        "[link](https://b.test)",
      );
    });

    test.each([
      ["a space", "a b", "[link](<a b>)"],
      ["angle brackets", "a<b>c", "[link](a<b>c)"],
      ["parentheses", "a(b)", "[link](a\\(b\\))"],
      ["a backslash", "a\\b", "[link](a\\b)"],
      ["an ampersand", "a&amp;b", "[link](a\\&amp;b)"],
      ["non-ASCII", "https://příklad.test/ü", "[link](https://příklad.test/ü)"],
    ])("round-trips a URL with %s", (_name, href, markdown) => {
      expect(fx).toTransformCommand(
        (b) => [b.p(b.link({ href: "https://a.test" }, "li<cursor>nk"))],
        "cursor",
        setLink({ href }),
        (b) => [b.p(b.link({ href }, "link"))],
        markdown,
      );
      expect(fx.pmu.parse(`${markdown}\n`)).toEqualProseMirrorNode(
        fx.b.doc(
          fx.b.p(fx.b.link({ href }, "link")),
        ) as unknown as ProseMirrorNode,
      );
    });

    test.each([
      ["quotes", 'a "b"', '[link](https://a.test "a \\"b\\"")'],
      ["a line ending", "a\nb", '[link](https://a.test "a\nb")'],
      ["an ampersand", "a&amp;b", '[link](https://a.test "a\\&amp;b")'],
    ])("round-trips a title with %s", (_name, title, markdown) => {
      expect(fx).toTransformCommand(
        (b) => [b.p(b.link({ href: "https://a.test" }, "li<cursor>nk"))],
        "cursor",
        setLink({ href: "https://a.test", title }),
        (b) => [b.p(b.link({ href: "https://a.test", title }, "link"))],
        markdown,
      );
      expect(fx.pmu.parse(`${markdown}\n`)).toEqualProseMirrorNode(
        fx.b.doc(
          fx.b.p(fx.b.link({ href: "https://a.test", title }, "link")),
        ) as unknown as ProseMirrorNode,
      );
    });

    test("does not dispatch when nothing changes", () => {
      const doc = fx.b.doc(
        fx.b.p(fx.b.link({ href: "https://a.test" }, "link")),
      ) as unknown as ProseMirrorNode;
      const state = EditorState.create({
        doc,
        selection: TextSelection.create(doc, 3),
      });
      const dispatch = vi.fn();

      expect(setLink({ href: " https://a.test" })(state, dispatch)).toBe(true);
      expect(dispatch).not.toHaveBeenCalled();
    });

    test("does not insert an empty URL", () => {
      const doc = fx.b.doc(fx.b.p("text")) as unknown as ProseMirrorNode;
      const state = EditorState.create({
        doc,
        selection: TextSelection.create(doc, 3),
      });
      const dispatch = vi.fn();

      expect(setLink({ href: "" })(state, dispatch)).toBe(false);
      expect(dispatch).not.toHaveBeenCalled();
    });

    test("does not add a link with an empty URL over the selection", () => {
      const doc = fx.b.doc(fx.b.p("text")) as unknown as ProseMirrorNode;
      const state = EditorState.create({
        doc,
        selection: TextSelection.create(doc, 1, 5),
      });
      const dispatch = vi.fn();

      expect(setLink({ href: "" })(state, dispatch)).toBe(false);
      expect(dispatch).not.toHaveBeenCalled();
    });

    test("does not apply in a code block", () => {
      expect(fxInContext).not.toTransformCommand(
        (b) => [b.code_block("co<cursor>de")],
        "cursor",
        setLink({ href: "https://a.test" }),
        (b) => [b.code_block("code")],
        "```\ncode\n```",
      );
    });

    test("does not apply to a selection in a code block", () => {
      expect(fxInContext).not.toTransformCommand(
        (b) => [b.code_block("c<a>od<b>e")],
        { anchor: "a", head: "b" },
        setLink({ href: "https://a.test" }),
        (b) => [b.code_block("code")],
        "```\ncode\n```",
      );
    });

    test("replaces the link in each range of a selection of several ranges", () => {
      const doc = fx.b.doc(
        fx.b.p(fx.b.link({ href: "https://b.test" }, "one"), " two"),
        fx.b.p("three four"),
      ) as unknown as ProseMirrorNode;
      const state = EditorState.create({
        doc,
        selection: new RangesSelection([
          new SelectionRange(doc.resolve(1), doc.resolve(4)),
          new SelectionRange(doc.resolve(10), doc.resolve(15)),
        ]),
      });
      const dispatch = vi.fn<(tr: Transaction) => void>();

      expect(setLink({ href: "https://a.test" })(state, dispatch)).toBe(true);
      expect(
        dispatch.mock.calls[0][0].doc.eq(
          fx.b.doc(
            fx.b.p(fx.b.link({ href: "https://a.test" }, "one"), " two"),
            fx.b.p(fx.b.link({ href: "https://a.test" }, "three"), " four"),
          ) as unknown as ProseMirrorNode,
        ),
      ).toBe(true);
    });

    test("links only the ranges of a selection of several ranges", () => {
      const doc = fx.b.doc(
        fx.b.p("one two"),
        fx.b.p("three four"),
      ) as unknown as ProseMirrorNode;
      const state = EditorState.create({
        doc,
        selection: new RangesSelection([
          new SelectionRange(doc.resolve(1), doc.resolve(4)),
          new SelectionRange(doc.resolve(10), doc.resolve(15)),
        ]),
      });
      const dispatch = vi.fn<(tr: Transaction) => void>();

      expect(setLink({ href: "https://a.test" })(state, dispatch)).toBe(true);
      expect(
        dispatch.mock.calls[0][0].doc.eq(
          fx.b.doc(
            fx.b.p(fx.b.link({ href: "https://a.test" }, "one"), " two"),
            fx.b.p(fx.b.link({ href: "https://a.test" }, "three"), " four"),
          ) as unknown as ProseMirrorNode,
        ),
      ).toBe(true);
    });
  });

  describe("editing the text of a link whose text is its URL", () => {
    test("changes the URL along with it", () => {
      expect(fx).toTransformInput(
        (b) => [
          b.p(b.link({ href: "https://a.test" }, "https://a.te<cursor>st")),
        ],
        "cursor",
        "x",
        (b) => [b.p(b.link({ href: "https://a.texst" }, "https://a.texst"))],
        "<https://a.texst>",
      );
    });

    test("changes the URL when text is deleted", () => {
      expect(fx).toTransformCommand(
        (b) => [
          b.p(b.link({ href: "https://a.test" }, "https://a.<a>te<b>st")),
        ],
        { anchor: "a", head: "b" },
        (state, dispatch) => {
          dispatch?.(state.tr.deleteSelection());
          return true;
        },
        (b) => [b.p(b.link({ href: "https://a.st" }, "https://a.st"))],
        "<https://a.st>",
      );
    });

    test("changes the URL of an email autolink", () => {
      expect(fx).toTransformInput(
        (b) => [b.p(b.link({ href: "mailto:a@b.test" }, "a@b.te<cursor>st"))],
        "cursor",
        "x",
        (b) => [b.p(b.link({ href: "mailto:a@b.texst" }, "a@b.texst"))],
        "<a@b.texst>",
      );
    });

    test("keeps the URL of an email autolink whose text is no longer an address", () => {
      expect(fx).toTransformInput(
        (b) => [b.p(b.link({ href: "mailto:a@b.test" }, "a@b.te<cursor>st"))],
        "cursor",
        "?",
        (b) => [b.p(b.link({ href: "mailto:a@b.test" }, "a@b.te?st"))],
        "[a@b.te?st](mailto:a@b.test)",
      );
    });

    test("changes the URL of a GFM www link", () => {
      expect(fx).toTransformInput(
        (b) => [
          b.p(b.link({ href: "http://www.a.test" }, "www.a.te<cursor>st")),
        ],
        "cursor",
        "x",
        (b) => [b.p(b.link({ href: "http://www.a.texst" }, "www.a.texst"))],
        "[www.a.texst](http://www.a.texst)",
      );
    });

    test("keeps the URL once the text has whitespace", () => {
      expect(fx).toTransformInput(
        (b) => [
          b.p(b.link({ href: "https://a.test" }, "https://a.te<cursor>st")),
        ],
        "cursor",
        " ",
        (b) => [b.p(b.link({ href: "https://a.test" }, "https://a.te st"))],
        "[https://a.te st](https://a.test)",
      );
    });

    test("doesn't change the URL of identical links joined into one", () => {
      expect(fx).toTransformCommand(
        (b) => [
          b.p(
            b.link({ href: "https://a.test" }, "https://a.test"),
            "<a> and <b>",
            b.link({ href: "https://a.test" }, "https://a.test"),
          ),
        ],
        { anchor: "a", head: "b" },
        (state, dispatch) => {
          dispatch?.(state.tr.deleteSelection());
          return true;
        },
        (b) => [
          b.p(
            b.link({ href: "https://a.test" }, "https://a.testhttps://a.test"),
          ),
        ],
        "[https://a.testhttps://a.test](https://a.test)",
      );
    });

    test("doesn't change the URL of a link pasted next to an identical one", () => {
      expect(fx).toTransformCommand(
        (b) => [
          b.p(
            b.link({ href: "https://a.test" }, "https://a.test"),
            "<cursor> b",
          ),
        ],
        "cursor",
        (state, dispatch) => {
          dispatch?.(
            state.tr.insert(
              state.selection.from,
              state.schema.text("https://a.test", [
                state.schema.marks["link"].create({ href: "https://a.test" }),
              ]),
            ),
          );
          return true;
        },
        (b) => [
          b.p(
            b.link({ href: "https://a.test" }, "https://a.testhttps://a.test"),
            " b",
          ),
        ],
        "[https://a.testhttps://a.test](https://a.test) b",
      );
    });

    test("keeps the URL of an email autolink whose text has a non-ASCII letter", () => {
      expect(fx).toTransformInput(
        (b) => [b.p(b.link({ href: "mailto:a@b.test" }, "a<cursor>@b.test"))],
        "cursor",
        "\u017f",
        (b) => [b.p(b.link({ href: "mailto:a@b.test" }, "a\u017f@b.test"))],
        "[a\u017f@b.test](mailto:a@b.test)",
      );
    });

    test("doesn't change the URLs of a link split by unlinked text", () => {
      expect(fx).toTransformCommand(
        (b) => [
          b.p(b.link({ href: "https://a.test" }, "https://a.<cursor>test")),
        ],
        "cursor",
        (state, dispatch) => {
          dispatch?.(
            state.tr.insert(state.selection.from, state.schema.text("x")),
          );
          return true;
        },
        (b) => [
          b.p(
            b.link({ href: "https://a.test" }, "https://a."),
            "x",
            b.link({ href: "https://a.test" }, "test"),
          ),
        ],
        "[https://a.](https://a.test)x[test](https://a.test)",
      );
    });

    test("doesn't change the URL of a link to a relative URL", () => {
      expect(fx).toTransformInput(
        (b) => [b.p(b.link({ href: "README.md" }, "README<cursor>.md"))],
        "cursor",
        "s",
        (b) => [b.p(b.link({ href: "README.md" }, "READMEs.md"))],
        "[READMEs.md](README.md)",
      );
    });

    test("keeps the URL once the text has an angle bracket", () => {
      expect(fx).toTransformInput(
        (b) => [
          b.p(b.link({ href: "https://a.test" }, "https://a<cursor>.test")),
        ],
        "cursor",
        "<",
        (b) => [b.p(b.link({ href: "https://a.test" }, "https://a<.test"))],
        "[https://a<.test](https://a.test)",
      );
    });

    test("keeps the URL once the text has no scheme", () => {
      expect(fx).toTransformCommand(
        (b) => [
          b.p(b.link({ href: "https://a.test" }, "<a>https://<b>a.test")),
        ],
        { anchor: "a", head: "b" },
        (state, dispatch) => {
          dispatch?.(state.tr.deleteSelection());
          return true;
        },
        (b) => [b.p(b.link({ href: "https://a.test" }, "a.test"))],
        "[a.test](https://a.test)",
      );
    });

    test("doesn't change the URL of a link whose text isn't its URL", () => {
      expect(fx).toTransformInput(
        (b) => [b.p(b.link({ href: "https://a.test" }, "li<cursor>nk"))],
        "cursor",
        "x",
        (b) => [b.p(b.link({ href: "https://a.test" }, "lixnk"))],
        "[lixnk](https://a.test)",
      );
    });
  });

  describe("the link at the selection", () => {
    test("is not at a caret right after the link", () => {
      expect(fx).toTransformCommand(
        (b) => [b.p(b.link({ href: "https://a.test" }, "link"), "<cursor> b")],
        "cursor",
        setLink({ href: "https://b.test" }),
        (b) => [
          b.p(
            b.link({ href: "https://a.test" }, "link"),
            b.link({ href: "https://b.test" }, "https://b.test"),
            " b",
          ),
        ],
        "[link](https://a.test)<https://b.test> b",
      );
    });

    test("is not at a caret right before the link", () => {
      expect(fx).toTransformCommand(
        (b) => [b.p("a <cursor>", b.link({ href: "https://a.test" }, "link"))],
        "cursor",
        setLink({ href: "https://b.test" }),
        (b) => [
          b.p(
            "a ",
            b.link({ href: "https://b.test" }, "https://b.test"),
            b.link({ href: "https://a.test" }, "link"),
          ),
        ],
        "a <https://b.test>[link](https://a.test)",
      );
    });

    test("is at a selection within the link", () => {
      expect(fx).toTransformCommand(
        (b) => [b.p(b.link({ href: "https://a.test" }, "l<a>in<b>k"))],
        { anchor: "a", head: "b" },
        setLink({ href: "https://b.test" }),
        (b) => [b.p(b.link({ href: "https://b.test" }, "link"))],
        "[link](https://b.test)",
      );
    });

    test("spans paragraphs", () => {
      expect(fx).toTransformCommand(
        (b) => [
          b.p(b.link({ href: "https://a.test" }, "a<a>b")),
          b.p(b.link({ href: "https://a.test" }, "c<b>d")),
        ],
        { anchor: "a", head: "b" },
        setLink({ href: "https://b.test" }),
        (b) => [
          b.p(b.link({ href: "https://b.test" }, "ab")),
          b.p(b.link({ href: "https://b.test" }, "cd")),
        ],
        "[ab](https://b.test)\n\n[cd](https://b.test)",
      );
    });

    test("does not include a link before a selection starting at the end of a paragraph", () => {
      expect(fx).toTransformCommand(
        (b) => [
          b.p(b.link({ href: "https://a.test" }, "ab"), "<a>"),
          b.p(b.link({ href: "https://a.test" }, "c<b>d")),
        ],
        { anchor: "a", head: "b" },
        setLink({ href: "https://b.test" }),
        (b) => [
          b.p(b.link({ href: "https://a.test" }, "ab")),
          b.p(b.link({ href: "https://b.test" }, "cd")),
        ],
        "[ab](https://a.test)\n\n[cd](https://b.test)",
      );
    });

    test("is found from the linkable content in the selection", () => {
      expect(fxInContext).toTransformCommand(
        (b) => [
          b.code_block("c<a>ode"),
          b.p(b.link({ href: "https://a.test" }, "li<b>nk")),
        ],
        { anchor: "a", head: "b" },
        setLink({ href: "https://b.test" }),
        (b) => [
          b.code_block("code"),
          b.p(b.link({ href: "https://b.test" }, "link")),
        ],
        "```\ncode\n```\n\n[link](https://b.test)",
      );
    });

    test("includes an image in the link", () => {
      expect(
        createExtensionFixture(new LinkExtension(), [new ImageExtension()]),
      ).toTransformCommand(
        (b) => [
          b.p(
            b.link(
              { href: "https://a.test" },
              "a<cursor>",
              b.img({ src: "i.png" }),
              "b",
            ),
          ),
        ],
        "cursor",
        setLink({ href: "https://b.test" }),
        (b) => [
          b.p(
            b.link(
              { href: "https://b.test" },
              "a",
              b.img({ src: "i.png" }),
              "b",
            ),
          ),
        ],
        "[a![](i.png)b](https://b.test)",
      );
    });
  });

  describe("removeLink", () => {
    test("removes only the links in the ranges of a selection of several ranges", () => {
      const doc = fx.b.doc(
        fx.b.p(
          fx.b.link({ href: "https://a.test" }, "one"),
          " ",
          fx.b.link({ href: "https://a.test" }, "two"),
        ),
        fx.b.p(fx.b.link({ href: "https://a.test" }, "three")),
      ) as unknown as ProseMirrorNode;
      const state = EditorState.create({
        doc,
        selection: new RangesSelection([
          new SelectionRange(doc.resolve(1), doc.resolve(4)),
          new SelectionRange(doc.resolve(10), doc.resolve(15)),
        ]),
      });
      const dispatch = vi.fn<(tr: Transaction) => void>();

      expect(removeLink()(state, dispatch)).toBe(true);
      expect(
        dispatch.mock.calls[0][0].doc.eq(
          fx.b.doc(
            fx.b.p("one ", fx.b.link({ href: "https://a.test" }, "two")),
            fx.b.p("three"),
          ) as unknown as ProseMirrorNode,
        ),
      ).toBe(true);
    });

    test("removes the link at the caret", () => {
      expect(fx).toTransformCommand(
        (b) => [b.p("a ", b.link({ href: "https://a.test" }, "li<cursor>nk"))],
        "cursor",
        removeLink(),
        (b) => [b.p("a link")],
        "a link",
      );
    });

    test("removes every link in the selection", () => {
      expect(fx).toTransformCommand(
        (b) => [
          b.p(
            b.link({ href: "https://a.test" }, "o<a>ne"),
            " and ",
            b.link({ href: "https://b.test" }, "tw<b>o"),
          ),
        ],
        { anchor: "a", head: "b" },
        removeLink(),
        (b) => [
          b.p(
            b.link({ href: "https://a.test" }, "o"),
            "ne and tw",
            b.link({ href: "https://b.test" }, "o"),
          ),
        ],
        "[o](https://a.test)ne and tw[o](https://b.test)",
      );
    });

    test("does not apply without a link", () => {
      expect(fx).not.toTransformCommand(
        (b) => [b.p("te<cursor>xt")],
        "cursor",
        removeLink(),
        (b) => [b.p("text")],
        "text",
      );
    });
  });

  describe("pasting a URL", () => {
    const fxAutolink = createExtensionFixture(new LinkExtension(), [
      new ExtendedAutolinkExtension(),
    ]);
    const fxInlineCode = createExtensionFixture(new LinkExtension(), [
      new InlineCodeExtension(),
    ]);

    test.each([
      ["https://a.test", "https://a.test"],
      ["www.a.test", "http://www.a.test"],
      ["a@b.test", "mailto:a@b.test"],
      [" https://a.test\n", "https://a.test"],
      ["mailto:a@b.test", "mailto:a@b.test"],
      ["<https://a.test>", "https://a.test"],
      ["<a@b.test>", "mailto:a@b.test"],
      ["https://a.test/a_b_", "https://a.test/a_b_"],
      ["https://a.test/a?", "https://a.test/a?"],
      ["https://a.test/a~b~", "https://a.test/a~b~"],
      ["https://a.test.", "https://a.test."],
    ])("pasting %j over a selection links it", (text, href) => {
      expect(fx).toTransformPaste(
        (b) => [b.p("a <a>link<b> here")],
        { anchor: "a", head: "b" },
        text,
        (b) => [b.p("a ", b.link({ href }, "link"), " here")],
        `a [link](${href}) here`,
      );
    });

    test("links the selection with a URL ending in an unmatched parenthesis", () => {
      expect(fx).toTransformPaste(
        (b) => [b.p("a <a>link<b> here")],
        { anchor: "a", head: "b" },
        "https://a.test/a)",
        (b) => [
          b.p("a ", b.link({ href: "https://a.test/a)" }, "link"), " here"),
        ],
        "a [link](https://a.test/a\\)) here",
      );
    });

    test("links the selection with GFM autolinks", () => {
      expect(fxAutolink).toTransformPaste(
        (b) => [b.p("a <a>link<b> here")],
        { anchor: "a", head: "b" },
        "https://a.test",
        (b) => [b.p("a ", b.link({ href: "https://a.test" }, "link"), " here")],
        "a [link](https://a.test) here",
      );
    });

    test("links a selection copied from a page as a link", () => {
      expect(fx).toTransformPaste(
        (b) => [b.p("a <a>link<b> here")],
        { anchor: "a", head: "b" },
        {
          html: '<a href="https://a.test">https://a.test</a>',
          text: "https://a.test",
        },
        (b) => [b.p("a ", b.link({ href: "https://a.test" }, "link"), " here")],
        "a [link](https://a.test) here",
      );
    });

    test("links a selection with the target of a link copied from a page", () => {
      expect(fx).toTransformPaste(
        (b) => [b.p("a <a>link<b> here")],
        { anchor: "a", head: "b" },
        {
          html: '<a href="https://r.test/x">https://a.test</a>',
          text: "https://a.test",
        },
        (b) => [
          b.p("a ", b.link({ href: "https://r.test/x" }, "link"), " here"),
        ],
        "a [link](https://r.test/x) here",
      );
    });

    test.each([
      ['<a href=" https://r.test/x\n">https://a.test</a>', "https://r.test/x"],
      ['<a href="">https://a.test</a>', "https://a.test"],
      ['<a href=" ">https://a.test</a>', "https://a.test"],
    ])(
      "links a selection copied as %j with a cleaned-up target",
      (html, href) => {
        expect(fx).toTransformPaste(
          (b) => [b.p("a <a>link<b> here")],
          { anchor: "a", head: "b" },
          { html, text: "https://a.test" },
          (b) => [b.p("a ", b.link({ href }, "link"), " here")],
          `a [link](${href}) here`,
        );
      },
    );

    test("keeps the other marks of the selection", () => {
      expect(fxInContext).toTransformPaste(
        (b) => [b.p("a <a>", b.strong("bold"), " text<b> here")],
        { anchor: "a", head: "b" },
        "https://a.test",
        (b) => [
          b.p(
            "a ",
            b.link({ href: "https://a.test" }, b.strong("bold"), " text"),
            " here",
          ),
        ],
        "a [**bold** text](https://a.test) here",
      );
    });

    test("links a selection across paragraphs", () => {
      expect(fx).toTransformPaste(
        (b) => [b.p("a <a>one"), b.p("two<b> b")],
        { anchor: "a", head: "b" },
        "https://a.test",
        (b) => [
          b.p("a ", b.link({ href: "https://a.test" }, "one")),
          b.p(b.link({ href: "https://a.test" }, "two"), " b"),
        ],
        "a [one](https://a.test)\n\n[two](https://a.test) b",
      );
    });

    test("links the part of a selection outside a code block", () => {
      expect(fxInContext).toTransformPaste(
        (b) => [b.p("a <a>text"), b.code_block("co<b>de")],
        { anchor: "a", head: "b" },
        "https://a.test",
        (b) => [
          b.p("a ", b.link({ href: "https://a.test" }, "text")),
          b.code_block("code"),
        ],
        "a [text](https://a.test)\n\n```\ncode\n```",
      );
    });

    test.each([
      ["text", "a text here"],
      ["https://a.test b", "a https://a.test b here"],
      ["https://a.test https://b.test", "a https://a.test https://b.test here"],
      ["ftp://a.test", "a ftp://a.test here"],
      ["javascript:alert(1)", "a javascript:alert(1) here"],
      ["TODO:fix", "a TODO:fix here"],
    ])("pasting %j over a selection replaces it", (text, markdown) => {
      expect(fx).toTransformPaste(
        (b) => [b.p("a <a>link<b> here")],
        { anchor: "a", head: "b" },
        text,
        (b) => [b.p(`a ${text} here`)],
        markdown,
      );
    });

    test("pastes a URL as text at an empty selection", () => {
      expect(fx).toTransformPaste(
        (b) => [b.p("a <cursor>here")],
        "cursor",
        "https://a.test",
        (b) => [b.p("a https://a.testhere")],
        "a https://a.testhere",
      );
    });

    test("pastes a URL over a selection as text in a plain-text paste", () => {
      expect(fx).toTransformPaste(
        (b) => [b.p("a <a>link<b> here")],
        { anchor: "a", head: "b" },
        { plainText: true, text: "https://a.test" },
        (b) => [b.p("a https://a.test here")],
        "a https://a.test here",
      );
    });

    test("pastes a URL as text in a plain-text paste starting in a code block", () => {
      expect(fxInContext).toTransformPaste(
        (b) => [b.code_block("c<a>ode"), b.p("te<b>xt")],
        { anchor: "a", head: "b" },
        { plainText: true, text: "https://a.test" },
        (b) => [b.code_block("chttps://a.testxt")],
        "```\nchttps://a.testxt\n```",
      );
    });

    test("pastes a URL over a selection as text in a plain-text paste with GFM autolinks", () => {
      expect(fxAutolink).toTransformPaste(
        (b) => [b.p("a <a>link<b> here")],
        { anchor: "a", head: "b" },
        { plainText: true, text: "https://a.test" },
        (b) => [b.p("a https://a.test here")],
        "a https\\://a.test here",
      );
    });

    test("pastes a URL as usual over a selection with a link", () => {
      expect(fx).toTransformPaste(
        (b) => [
          b.p("a <a>b ", b.link({ href: "https://b.test" }, "link"), " c<b> d"),
        ],
        { anchor: "a", head: "b" },
        "https://a.test",
        (b) => [b.p("a https://a.test d")],
        "a https://a.test d",
      );
    });

    test("pastes a URL as usual over a selection partly covering a link", () => {
      expect(fx).toTransformPaste(
        (b) => [b.p("a <a>b ", b.link({ href: "https://b.test" }, "li<b>nk"))],
        { anchor: "a", head: "b" },
        "https://a.test",
        (b) => [
          b.p("a https://a.test", b.link({ href: "https://b.test" }, "nk")),
        ],
        "a https://a.test[nk](https://b.test)",
      );
    });

    test("pastes a URL as usual over a selection in a link", () => {
      expect(fx).toTransformPaste(
        (b) => [b.p(b.link({ href: "https://b.test" }, "a <a>li<b>nk"))],
        { anchor: "a", head: "b" },
        "https://a.test",
        (b) => [b.p(b.link({ href: "https://b.test" }, "a https://a.testnk"))],
        "[a https://a.testnk](https://b.test)",
      );
    });

    test("pastes an image whose text is its URL over a selection as usual", () => {
      expect(fxInContext).toTransformPaste(
        (b) => [b.p("a <a>link<b> here")],
        { anchor: "a", head: "b" },
        {
          html: '<img src="https://a.test/i.png">',
          text: "https://a.test/i.png",
        },
        (b) => [b.p("a ", b.img({ src: "https://a.test/i.png" }), " here")],
        "a ![](https://a.test/i.png) here",
      );
    });

    test("pastes rich content whose text is a URL over a selection as usual", () => {
      expect(fx).toTransformPaste(
        (b) => [b.p("a <a>link<b> here")],
        { anchor: "a", head: "b" },
        { html: "<p>Some text</p>", text: "https://a.test" },
        (b) => [b.p("a Some text here")],
        "a Some text here",
      );
    });

    test("links a selection with a line break that reads as a URL without it", () => {
      expect(
        createExtensionFixture(new LinkExtension(), [new BreakExtension()]),
      ).toTransformPaste(
        (b) => [b.p("a <a>https://b.test", b.br(), "/x<b> here")],
        { anchor: "a", head: "b" },
        "https://a.test",
        (b) => [
          b.p(
            "a ",
            b.link({ href: "https://a.test" }, "https://b.test", b.br(), "/x"),
            " here",
          ),
        ],
        "a [https://b.test\\\n/x](https://a.test) here",
      );
    });

    test("pastes a URL as usual over a selection that is a URL", () => {
      expect(fx).toTransformPaste(
        (b) => [b.p("a <a>https://b.test<b> here")],
        { anchor: "a", head: "b" },
        "https://a.test",
        (b) => [b.p("a https://a.test here")],
        "a https://a.test here",
      );
    });

    test("pastes a URL as usual over a selection that is a mailto: URL", () => {
      expect(fx).toTransformPaste(
        (b) => [b.p("a <a>mailto:b@c.test<b> here")],
        { anchor: "a", head: "b" },
        "https://a.test",
        (b) => [b.p("a https://a.test here")],
        "a https://a.test here",
      );
    });

    test("pastes a URL as usual over a selection with inline code", () => {
      expect(fxInlineCode).toTransformPaste(
        (b) => [b.p("a <a>", b.code("code"), " text<b> here")],
        { anchor: "a", head: "b" },
        "https://a.test",
        (b) => [b.p("a https://a.test here")],
        "a https://a.test here",
      );
    });

    test("pastes a URL as text in a code block", () => {
      expect(fxInContext).toTransformPaste(
        (b) => [b.code_block("c<a>od<b>e")],
        { anchor: "a", head: "b" },
        "https://a.test",
        (b) => [b.code_block("chttps://a.teste")],
        "```\nchttps://a.teste\n```",
      );
    });

    test("pastes a URL as usual with linkOnPaste turned off", () => {
      expect(
        createExtensionFixture(new LinkExtension({ linkOnPaste: false }), []),
      ).toTransformPaste(
        (b) => [b.p("a <a>link<b> here")],
        { anchor: "a", head: "b" },
        "https://a.test",
        (b) => [b.p("a https://a.test here")],
        "a https://a.test here",
      );
    });

    test("undo leaves the URL pasted as text", () => {
      expect(fx).toUndoPaste(
        (b) => [b.p("a <a>link<b> here")],
        { anchor: "a", head: "b" },
        "https://a.test",
        (b) => [b.p("a https://a.test here")],
        "a https://a.test here",
      );
    });

    test("undo leaves the URL pasted as an autolink with GFM autolinks", () => {
      expect(fxAutolink).toUndoPaste(
        (b) => [b.p("a <a>link<b> here")],
        { anchor: "a", head: "b" },
        "https://a.test",
        (b) => [
          b.p(
            "a ",
            b.link({ href: "https://a.test" }, "https://a.test"),
            " here",
          ),
        ],
        "a <https://a.test> here",
      );
    });
  });

  describe("openLinkEditor", () => {
    test("applies without a view where a link can be set", () => {
      const doc = fx.b.doc(fx.b.p("text")) as unknown as ProseMirrorNode;
      const state = EditorState.create({
        doc,
        plugins: new LinkExtension().proseMirrorPlugins(),
        selection: TextSelection.create(doc, 3),
      });

      expect(openLinkEditor()(state)).toBe(true);
      expect(openLinkEditor()(state, vi.fn())).toBe(false);
    });

    test("does not apply without a view with the link editor turned off", () => {
      const doc = fx.b.doc(fx.b.p("text")) as unknown as ProseMirrorNode;
      const state = EditorState.create({
        doc,
        plugins: new LinkExtension({ editor: false }).proseMirrorPlugins(),
        selection: TextSelection.create(doc, 3),
      });

      expect(openLinkEditor()(state)).toBe(false);
    });

    test("does not apply in a code block", () => {
      const doc = fxInContext.b.doc(
        fxInContext.b.code_block("code"),
      ) as unknown as ProseMirrorNode;
      const state = EditorState.create({
        doc,
        selection: TextSelection.create(doc, 3),
      });

      expect(openLinkEditor()(state)).toBe(false);
    });
  });
});
