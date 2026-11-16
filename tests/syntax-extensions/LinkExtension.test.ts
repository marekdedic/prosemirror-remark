import type { Node as ProseMirrorNode } from "prosemirror-model";

import { EditorState, TextSelection } from "prosemirror-state";
import { describe, expect, test, vi } from "vitest";

import { BoldExtension } from "../../src/syntax-extensions/BoldExtension";
import { CodeBlockExtension } from "../../src/syntax-extensions/CodeBlockExtension";
import { ImageExtension } from "../../src/syntax-extensions/ImageExtension";
import {
  LinkExtension,
  openLinkEditor,
  removeLink,
  setLink,
} from "../../src/syntax-extensions/LinkExtension";
import { createExtensionFixture } from "../utils/fixture";
import "../utils/matchers";

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

  test("provides the link editor plugin", () => {
    expect(fx.extension.proseMirrorPlugins(fx.schema)).toHaveLength(2);
  });

  test("provides no keymap with the link editor turned off", () => {
    expect(
      new LinkExtension({ editor: false }).proseMirrorKeymap(),
    ).toStrictEqual({});
  });

  test("provides only the URL syncing plugin with the link editor turned off", () => {
    expect(
      new LinkExtension({ editor: false }).proseMirrorPlugins(),
    ).toHaveLength(1);
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
