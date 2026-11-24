import { type Node as ProseMirrorNode, Schema } from "prosemirror-model";
import { describe, expect, test } from "vitest";
import { renderProseMirror } from "vitest-prosemirror";

import { BreakExtension } from "../../src/syntax-extensions/BreakExtension";
import { ExtendedAutolinkExtension } from "../../src/syntax-extensions/ExtendedAutolinkExtension";
import { InlineCodeExtension } from "../../src/syntax-extensions/InlineCodeExtension";
import { LinkExtension } from "../../src/syntax-extensions/LinkExtension";
import { createExtensionFixture } from "../utils/fixture";
import "../utils/matchers";

describe("ExtendedAutolinkExtension", () => {
  const fx = createExtensionFixture(new LinkExtension(), [
    new ExtendedAutolinkExtension(),
    new InlineCodeExtension(),
  ]);

  test("provides no input rules without the link mark", () => {
    const schema = new Schema<string, string>({
      nodes: { doc: { content: "text*" }, text: {} },
    });

    expect(
      new ExtendedAutolinkExtension().proseMirrorInputRules(schema),
    ).toStrictEqual([]);
  });

  describe("input rule", () => {
    test.each([
      ["https://a.test", "https://a.test", "<https://a.test> x"],
      ["www.a.test", "http://www.a.test", "[www.a.test](http://www.a.test) x"],
      ["a@b.test", "mailto:a@b.test", "<a@b.test> x"],
    ])("matches %s followed by a space", (text, href, md) => {
      expect(fx).toTransformInput(
        (b) => [b.p("<cursor>")],
        "cursor",
        `${text} x`,
        (b) => [b.p(b.link({ href }, text), " x")],
        md,
      );
    });

    test("matches after text", () => {
      expect(fx).toTransformInput(
        (b) => [b.p("see <cursor>")],
        "cursor",
        "https://a.test x",
        (b) => [
          b.p(
            "see ",
            b.link({ href: "https://a.test" }, "https://a.test"),
            " x",
          ),
        ],
        "see <https://a.test> x",
      );
    });

    test("matches followed by Enter", () => {
      expect(fx).toTransformInput(
        (b) => [b.p("<cursor>")],
        "cursor",
        "https://a.test{Enter}",
        (b) => [
          b.p(b.link({ href: "https://a.test" }, "https://a.test")),
          b.p(),
        ],
        "<https://a.test>\n",
      );
    });

    test("leaves out trailing punctuation", () => {
      expect(fx).toTransformInput(
        (b) => [b.p("<cursor>")],
        "cursor",
        "(https://a.test/x). x",
        (b) => [
          b.p(
            "(",
            b.link({ href: "https://a.test/x" }, "https://a.test/x"),
            "). x",
          ),
        ],
        "(<https://a.test/x>). x",
      );
    });

    test.each([["a.test"], ["https:"], ["foo"]])(
      "does not match %s",
      (text) => {
        expect(fx).toTransformInput(
          (b) => [b.p("<cursor>")],
          "cursor",
          `${text} x`,
          (b) => [b.p(`${text} x`)],
          `${text} x`,
        );
      },
    );

    test("matches after a [ that isn't closed", () => {
      expect(fx).toTransformInput(
        (b) => [b.p("<cursor>")],
        "cursor",
        "[[see https://a.test x",
        (b) => [
          b.p(
            "[see ",
            b.link({ href: "https://a.test" }, "https://a.test"),
            " x",
          ),
        ],
        "\\[see <https://a.test> x",
      );
    });

    test("leaves the URL of an inline link being typed to the inline link", () => {
      expect(fx).toTransformInput(
        (b) => [b.p("<cursor>")],
        "cursor",
        '[[text](https://a.test "A title")',
        (b) => [
          b.p(b.link({ href: "https://a.test", title: "A title" }, "text")),
        ],
        '[text](https://a.test "A title")',
      );
    });

    test("matches after a line that starts like a block", () => {
      expect(fx).toTransformTextInput(
        (b) => [b.p("foo\n- https://a.test<cursor>")],
        "cursor",
        " ",
        (b) => [
          b.p(
            "foo\n- ",
            b.link({ href: "https://a.test" }, "https://a.test"),
            " ",
          ),
        ],
        "foo\n\\- <https://a.test>&#x20;",
      );
    });

    test("inserts the space after a selection that the literal before it reaches", () => {
      expect(fx).toTransformTextInput(
        (b) => [b.p("https://a.test/<a>xyz<b>")],
        { anchor: "a", head: "b" },
        " ",
        (b) => [
          b.p(
            b.link({ href: "https://a.test/xyz" }, "https://a.test/xyz"),
            " ",
          ),
        ],
        "<https://a.test/xyz>&#x20;",
      );
    });

    test("lets an inline link take over a literal in its text", () => {
      expect(fx).toTransformInput(
        (b) => [b.p("<cursor>")],
        "cursor",
        "[[see www.a.test now](https://b.test)",
        (b) => [b.p(b.link({ href: "https://b.test" }, "see www.a.test now"))],
        "[see www.a.test now](https://b.test)",
      );
    });

    test("lets an inline link take over a literal in its title", () => {
      expect(fx).toTransformInput(
        (b) => [b.p("<cursor>")],
        "cursor",
        '[[text](https://b.test "see www.a.test now")',
        (b) => [
          b.p(
            b.link(
              { href: "https://b.test", title: "see www.a.test now" },
              "text",
            ),
          ),
        ],
        '[text](https://b.test "see www.a.test now")',
      );
    });

    test("does not match when inline code is toggled for the space", () => {
      const editor = renderProseMirror(
        fx.b.doc(fx.b.p("https://a.test")) as unknown as ProseMirrorNode,
        { editorProps: { plugins: fx.pmu.plugins() } },
      );
      editor.setSelection("end");
      editor.command((state, dispatch) => {
        dispatch?.(state.tr.addStoredMark(state.schema.marks["code"].create()));
        return true;
      });
      editor.type(" ");

      expect(editor.doc).toEqualProseMirrorNode(
        fx.b.doc(
          fx.b.p("https://a.test", fx.b.code(" ")),
        ) as unknown as ProseMirrorNode,
      );
    });

    test("matches after a [ that isn't closed when a character reference follows", () => {
      expect(fx).toTransformInput(
        (b) => [b.p("<cursor>")],
        "cursor",
        "[[www.a.test&amp; x",
        (b) => [
          b.p(
            "[",
            b.link({ href: "http://www.a.test" }, "www.a.test"),
            "&amp; x",
          ),
        ],
        "\\[[www.a.test](http://www.a.test)\\&amp; x",
      );
    });

    test("leaves the URL of an inline link being typed after a space to the inline link", () => {
      expect(fx).toTransformInput(
        (b) => [b.p("<cursor>")],
        "cursor",
        "[[text]( www.a.test x",
        (b) => [b.p("[text]( www.a.test x")],
        "\\[text]\\( www\\.a.test x",
      );
    });

    test("matches right after inline code", () => {
      expect(fx).toTransformInput(
        (b) => [b.p(b.code("x"), "<cursor>")],
        "cursor",
        "https://a.test x",
        (b) => [
          b.p(
            b.code("x"),
            b.link({ href: "https://a.test" }, "https://a.test"),
            " x",
          ),
        ],
        "`x`<https://a.test> x",
      );
    });

    test("matches right after a hard break", () => {
      const fxWithBreak = createExtensionFixture(new LinkExtension(), [
        new ExtendedAutolinkExtension(),
        new BreakExtension(),
      ]);

      expect(fxWithBreak).toTransformInput(
        (b) => [b.p("a", b.br(), "<cursor>")],
        "cursor",
        "www.a.test x",
        (b) => [
          b.p(
            "a",
            b.br(),
            b.link({ href: "http://www.a.test" }, "www.a.test"),
            " x",
          ),
        ],
        "a\\\n[www.a.test](http://www.a.test) x",
      );
    });

    test("does not match inline code", () => {
      expect(fx).toTransformInput(
        (b) => [b.p(b.code("https://a.test"), "<cursor>")],
        "cursor",
        " x",
        (b) => [b.p(b.code("https://a.test"), " x")],
        "`https://a.test` x",
      );
    });

    test("does not match inside a link", () => {
      expect(fx).toTransformInput(
        (b) => [
          b.p(b.link({ href: "https://b.test" }, "https://a.test<cursor>")),
        ],
        "cursor",
        " x",
        (b) => [
          b.p(b.link({ href: "https://b.test" }, "https://a.test"), " x"),
        ],
        "[https://a.test](https://b.test) x",
      );
    });
  });
});
