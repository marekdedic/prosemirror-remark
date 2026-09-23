import { describe, expect, test } from "vitest";

import { OrderedListExtension } from "../../src/syntax-extensions/OrderedListExtension";
import { UnorderedListExtension } from "../../src/syntax-extensions/UnorderedListExtension";
import { createExtensionFixture } from "../utils/fixture";
import "../utils/matchers";

describe("UnorderedListExtension", () => {
  const fx = createExtensionFixture(new UnorderedListExtension());

  test("handles the `list` unist node", () => {
    expect(fx).toHandleUnistNode("list");
  });

  test("provides the `bullet_list` ProseMirror node", () => {
    expect(fx).toProvideNode("bullet_list");
  });

  describe("matches unist nodes", () => {
    test("matches an unordered `list`", () => {
      expect(fx).toMatchUnistNode({
        children: [],
        ordered: false,
        type: "list",
      });
    });

    test("matches a spread unordered `list`", () => {
      expect(fx).toMatchUnistNode({
        children: [],
        ordered: false,
        spread: true,
        type: "list",
      });
    });

    test("matches a spread unordered `list` (again)", () => {
      expect(fx).toMatchUnistNode({
        children: [],
        ordered: false,
        spread: true,
        type: "list",
      });
    });

    test("does not match an ordered `list`", () => {
      expect(fx).not.toMatchUnistNode({
        children: [],
        ordered: true,
        type: "list",
      });
    });

    test("does not match other nodes", () => {
      expect(fx).not.toMatchUnistNode({ type: "other" });
    });
  });

  describe("converts unist -> ProseMirror", () => {
    test("empty unordered `list`", () => {
      expect(fx).toConvertUnistNode(
        {
          children: [],
          ordered: false,
          type: "list",
        },
        (b) => [b.ul(b.li(b.p()))],
      );
    });

    test("spread unordered `list`", () => {
      expect(fx).toConvertUnistNode(
        {
          children: [],
          ordered: false,
          spread: true,
          type: "list",
        },
        (b) => [b.ul({ spread: true }, b.li(b.p()))],
      );
    });

    test("with an empty list item", () => {
      expect(fx).toConvertUnistNode(
        {
          children: [{ children: [], type: "listItem" }],
          ordered: false,
          type: "list",
        },
        (b) => [b.ul(b.li(b.p()))],
      );
    });

    test("with a spread list item", () => {
      expect(fx).toConvertUnistNode(
        {
          children: [{ children: [], spread: true, type: "listItem" }],
          ordered: false,
          type: "list",
        },
        (b) => [b.ul(b.li({ spread: true }, b.p()))],
      );
    });

    test("with content", () => {
      expect(fx).toConvertUnistNode(
        {
          children: [
            {
              children: [
                {
                  children: [{ type: "text", value: "Hello World!" }],
                  type: "paragraph",
                },
              ],
              type: "listItem",
            },
          ],
          ordered: false,
          type: "list",
        },
        (b) => [b.ul(b.li(b.p("Hello World!")))],
      );
    });
  });

  describe("matches ProseMirror nodes", () => {
    test("matches an empty `ul`", () => {
      expect(fx).toMatchProseMirrorNode((b) => b.ul());
    });

    test("matches a spread `ul`", () => {
      expect(fx).toMatchProseMirrorNode((b) => b.ul({ spread: true }));
    });

    test("matches a `ul` with a list item", () => {
      expect(fx).toMatchProseMirrorNode((b) => b.ul(b.li()));
    });

    test("matches a `ul` with a spread list item", () => {
      expect(fx).toMatchProseMirrorNode((b) => b.ul(b.li({ spread: true })));
    });

    test("matches a `ul` with content", () => {
      expect(fx).toMatchProseMirrorNode((b) => b.ul(b.li(b.p("Hello World!"))));
    });
  });

  describe("converts ProseMirror -> unist", () => {
    test("empty unordered list", () => {
      expect(fx).toConvertProseMirrorNode(
        (b) => b.ul(b.li(b.p())),
        [
          {
            children: [
              {
                children: [{ children: [], type: "paragraph" }],
                spread: false,
                type: "listItem",
              },
            ],
            ordered: false,
            spread: false,
            type: "list",
          },
        ],
      );
    });

    test("spread unordered list", () => {
      expect(fx).toConvertProseMirrorNode(
        (b) => b.ul({ spread: true }, b.li(b.p())),
        [
          {
            children: [
              {
                children: [{ children: [], type: "paragraph" }],
                spread: true,
                type: "listItem",
              },
            ],
            ordered: false,
            spread: true,
            type: "list",
          },
        ],
      );
    });

    test("empty unordered list (again)", () => {
      expect(fx).toConvertProseMirrorNode(
        (b) => b.ul(b.li(b.p())),
        [
          {
            children: [
              {
                children: [{ children: [], type: "paragraph" }],
                spread: false,
                type: "listItem",
              },
            ],
            ordered: false,
            spread: false,
            type: "list",
          },
        ],
      );
    });

    test("spread list with spread item", () => {
      expect(fx).toConvertProseMirrorNode(
        (b) => b.ul({ spread: true }, b.li({ spread: true }, b.p())),
        [
          {
            children: [
              {
                children: [{ children: [], type: "paragraph" }],
                spread: true,
                type: "listItem",
              },
            ],
            ordered: false,
            spread: true,
            type: "list",
          },
        ],
      );
    });

    test("with content", () => {
      expect(fx).toConvertProseMirrorNode(
        (b) => b.ul(b.li(b.p("Hello World!"))),
        [
          {
            children: [
              {
                children: [
                  {
                    children: [{ type: "text", value: "Hello World!" }],
                    type: "paragraph",
                  },
                ],
                spread: false,
                type: "listItem",
              },
            ],
            ordered: false,
            spread: false,
            type: "list",
          },
        ],
      );
    });
  });

  describe("input rules", () => {
    test("`* ` starts an empty unordered list", () => {
      expect(fx).toApplyBlockInputRule("* ", "*", (b) => [b.ul(b.li(b.p()))]);
    });

    test("`* ` with content", () => {
      expect(fx).toApplyBlockInputRule(
        "* Hello World!",
        "* Hello World!",
        (b) => [b.ul(b.li(b.p("Hello World!")))],
      );
    });

    test("`- ` with content", () => {
      expect(fx).toApplyBlockInputRule(
        "- Hello World!",
        "* Hello World!",
        (b) => [b.ul(b.li(b.p("Hello World!")))],
      );
    });

    test("`+ ` with content", () => {
      expect(fx).toApplyBlockInputRule(
        "+ Hello World!",
        "* Hello World!",
        (b) => [b.ul(b.li(b.p("Hello World!")))],
      );
    });

    test("tolerates one leading space", () => {
      expect(fx).toApplyBlockInputRule(
        " * Hello World!",
        "* Hello World!",
        (b) => [b.ul(b.li(b.p("Hello World!")))],
      );
    });

    test("tolerates two leading spaces", () => {
      expect(fx).toApplyBlockInputRule(
        "  * Hello World!",
        "* Hello World!",
        (b) => [b.ul(b.li(b.p("Hello World!")))],
      );
    });

    test("tolerates one leading space (again)", () => {
      expect(fx).toApplyBlockInputRule(
        " * Hello World!",
        "* Hello World!",
        (b) => [b.ul(b.li(b.p("Hello World!")))],
      );
    });

    test("continues onto a second item", () => {
      expect(fx).toApplyBlockInputRule(
        "* Hello World!{Enter}Second item",
        "* Hello World!\n* Second item",
        (b) => [b.ul(b.li(b.p("Hello World!")), b.li(b.p("Second item")))],
      );
    });

    test("a bullet joins the preceding list", () => {
      expect(fx).toApplyBlockInputRule(
        "* a{Enter}{Enter}* b",
        "* a\n* b",
        (b) => [b.ul(b.li(b.p("a")), b.li(b.p("b")))],
      );
    });

    test("a different bullet joins the preceding list", () => {
      expect(fx).toApplyBlockInputRule(
        "* a{Enter}{Enter}- b",
        "* a\n* b",
        (b) => [b.ul(b.li(b.p("a")), b.li(b.p("b")))],
      );
    });
  });

  describe("keymap", () => {
    test("`Mod-Shift-8` wraps in an unordered list", () => {
      expect(fx).toSupportKeymap(
        (b) => [b.p("He<cursor>llo")],
        "cursor",
        "{Mod-Shift-8}",
        (b) => [b.ul(b.li(b.p("Hello")))],
        "* Hello",
      );
    });

    test("`Enter` splits a list item", () => {
      expect(fx).toSupportKeymap(
        (b) => [b.ul(b.li(b.p("Hel<cursor>lo")))],
        "cursor",
        "{Enter}",
        (b) => [b.ul(b.li(b.p("Hel")), b.li(b.p("lo")))],
        "* Hel\n* lo",
      );
    });

    test("`Tab` sinks a list item", () => {
      expect(fx).toSupportKeymap(
        (b) => [b.ul(b.li(b.p("Hello")), b.li(b.p("<cursor>World")))],
        "cursor",
        "{Tab}",
        (b) => [b.ul(b.li(b.p("Hello"), b.ul(b.li(b.p("World")))))],
        "* Hello\n  * World",
      );
    });

    test("`Shift-Tab` lifts a list item", () => {
      expect(fx).toSupportKeymap(
        (b) => [b.ul(b.li(b.p("Hello"), b.ul(b.li(b.p("<cursor>World")))))],
        "cursor",
        "{Shift-Tab}",
        (b) => [b.ul(b.li(b.p("Hello")), b.li(b.p("World")))],
        "* Hello\n* World",
      );
    });

    test("`Backspace` joins a list with the preceding list", () => {
      expect(fx).toSupportKeymap(
        (b) => [b.ul(b.li(b.p("a"))), b.ul(b.li(b.p("<cursor>b")))],
        "cursor",
        "{Backspace}",
        (b) => [b.ul(b.li(b.p("a")), b.li(b.p("b")))],
        "* a\n* b",
      );
    });

    test("`Delete` joins a list with the following list", () => {
      expect(fx).toSupportKeymap(
        (b) => [b.ul(b.li(b.p("a<cursor>"))), b.ul(b.li(b.p("b")))],
        "cursor",
        "{Delete}",
        (b) => [b.ul(b.li(b.p("a")), b.li(b.p("b")))],
        "* a\n* b",
      );
    });

    test("`Backspace` in an empty paragraph between lists joins them into one", () => {
      expect(fx).toSupportKeymap(
        (b) => [b.ul(b.li(b.p("a"))), b.p("<cursor>"), b.ul(b.li(b.p("b")))],
        "cursor",
        "{Backspace}",
        (b) => [b.ul(b.li(b.p("a")), b.li(b.p()), b.li(b.p("b")))],
        "* a\n*\n* b",
      );
    });
  });

  describe("DOM", () => {
    test("parses a plain `<ul>`", () => {
      expect(fx).toParseDOM("<ul><li><p>Hello</p></li></ul>", (b) => [
        b.ul(b.li(b.p("Hello"))),
      ]);
    });

    test("parses a spread `<ul>`", () => {
      expect(fx).toParseDOM(
        '<ul data-spread="true"><li><p>Hello</p></li></ul>',
        (b) => [b.ul({ spread: true }, b.li(b.p("Hello")))],
      );
    });

    test("renders a `<ul>`", () => {
      expect(fx).toRenderDOM(
        (b) => [b.ul(b.li(b.p("Hello")))],
        '<ul data-spread="false"><li><p>Hello</p></li></ul>',
      );
    });
  });
});

describe("UnorderedListExtension next to an ordered list", () => {
  const fx = createExtensionFixture(new UnorderedListExtension(), [
    new OrderedListExtension(),
  ]);

  test("a bullet after an ordered list starts a new list", () => {
    expect(fx).toApplyBlockInputRule(
      "1. a{Enter}{Enter}* b",
      "1. a\n\n* b",
      (b) => [b.ol(b.li(b.p("a"))), b.ul(b.li(b.p("b")))],
    );
  });

  test("`Backspace` moves the items into a preceding ordered list", () => {
    expect(fx).toSupportKeymap(
      (b) => [b.ol(b.li(b.p("a"))), b.ul(b.li(b.p("<cursor>b")))],
      "cursor",
      "{Backspace}",
      (b) => [b.ol(b.li(b.p("a")), b.li(b.p("b")))],
      "1. a\n2. b",
    );
  });
});
