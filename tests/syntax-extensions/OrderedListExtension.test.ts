import { describe, expect, test } from "vitest";

import { OrderedListExtension } from "../../src/syntax-extensions/OrderedListExtension";
import { UnorderedListExtension } from "../../src/syntax-extensions/UnorderedListExtension";
import { createExtensionFixture } from "../utils/fixture";
import "../utils/matchers";

describe("OrderedListExtension", () => {
  const fx = createExtensionFixture(new OrderedListExtension());

  test("handles the `list` unist node", () => {
    expect(fx).toHandleUnistNode("list");
  });

  test("provides the `ordered_list` ProseMirror node", () => {
    expect(fx).toProvideNode("ordered_list");
  });

  describe("matches unist nodes", () => {
    test("matches an ordered `list`", () => {
      expect(fx).toMatchUnistNode({
        children: [],
        ordered: true,
        type: "list",
      });
    });

    test("matches a spread ordered `list`", () => {
      expect(fx).toMatchUnistNode({
        children: [],
        ordered: true,
        spread: true,
        type: "list",
      });
    });

    test("matches an ordered `list` starting at 1", () => {
      expect(fx).toMatchUnistNode({
        children: [],
        ordered: true,
        spread: true,
        start: 1,
        type: "list",
      });
    });

    test("matches an ordered `list` starting at 42", () => {
      expect(fx).toMatchUnistNode({
        children: [],
        ordered: true,
        spread: true,
        start: 42,
        type: "list",
      });
    });

    test("does not match an unordered `list`", () => {
      expect(fx).not.toMatchUnistNode({
        children: [],
        ordered: false,
        type: "list",
      });
    });

    test("does not match other nodes", () => {
      expect(fx).not.toMatchUnistNode({ type: "other" });
    });
  });

  describe("converts unist -> ProseMirror", () => {
    test("empty ordered `list`", () => {
      expect(fx).toConvertUnistNode(
        {
          children: [],
          ordered: true,
          type: "list",
        },
        (b) => [b.ol(b.li(b.p()))],
      );
    });

    test("spread ordered `list`", () => {
      expect(fx).toConvertUnistNode(
        {
          children: [],
          ordered: true,
          spread: true,
          type: "list",
        },
        (b) => [b.ol({ spread: true }, b.li(b.p()))],
      );
    });

    test("spread ordered `list` starting at 42", () => {
      expect(fx).toConvertUnistNode(
        {
          children: [],
          ordered: true,
          spread: true,
          start: 42,
          type: "list",
        },
        (b) => [b.ol({ spread: true, start: 42 }, b.li(b.p()))],
      );
    });

    test("with an empty list item", () => {
      expect(fx).toConvertUnistNode(
        {
          children: [{ children: [], type: "listItem" }],
          ordered: true,
          type: "list",
        },
        (b) => [b.ol(b.li(b.p()))],
      );
    });

    test("with a spread list item", () => {
      expect(fx).toConvertUnistNode(
        {
          children: [{ children: [], spread: true, type: "listItem" }],
          ordered: true,
          type: "list",
        },
        (b) => [b.ol(b.li({ spread: true }, b.p()))],
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
          ordered: true,
          type: "list",
        },
        (b) => [b.ol(b.li(b.p("Hello World!")))],
      );
    });
  });

  describe("matches ProseMirror nodes", () => {
    test("matches an empty `ol`", () => {
      expect(fx).toMatchProseMirrorNode((b) => b.ol());
    });

    test("matches a spread `ol`", () => {
      expect(fx).toMatchProseMirrorNode((b) => b.ol({ spread: true }));
    });

    test("matches a spread `ol` starting at 42", () => {
      expect(fx).toMatchProseMirrorNode((b) =>
        b.ol({ spread: true, start: 42 }),
      );
    });

    test("matches an `ol` with a list item", () => {
      expect(fx).toMatchProseMirrorNode((b) => b.ol(b.li()));
    });

    test("matches an `ol` with a spread list item", () => {
      expect(fx).toMatchProseMirrorNode((b) => b.ol(b.li({ spread: true })));
    });

    test("matches an `ol` with content", () => {
      expect(fx).toMatchProseMirrorNode((b) => b.ol(b.li(b.p("Hello World!"))));
    });
  });

  describe("converts ProseMirror -> unist", () => {
    test("empty ordered list", () => {
      expect(fx).toConvertProseMirrorNode(
        (b) => b.ol(b.li(b.p())),
        [
          {
            children: [
              {
                children: [{ children: [], type: "paragraph" }],
                spread: false,
                type: "listItem",
              },
            ],
            ordered: true,
            spread: false,
            start: 1,
            type: "list",
          },
        ],
      );
    });

    test("spread ordered list", () => {
      expect(fx).toConvertProseMirrorNode(
        (b) => b.ol({ spread: true }, b.li(b.p())),
        [
          {
            children: [
              {
                children: [{ children: [], type: "paragraph" }],
                spread: true,
                type: "listItem",
              },
            ],
            ordered: true,
            spread: true,
            start: 1,
            type: "list",
          },
        ],
      );
    });

    test("spread ordered list starting at 42", () => {
      expect(fx).toConvertProseMirrorNode(
        (b) => b.ol({ spread: true, start: 42 }, b.li(b.p())),
        [
          {
            children: [
              {
                children: [{ children: [], type: "paragraph" }],
                spread: true,
                type: "listItem",
              },
            ],
            ordered: true,
            spread: true,
            start: 42,
            type: "list",
          },
        ],
      );
    });

    test("empty ordered list (again)", () => {
      expect(fx).toConvertProseMirrorNode(
        (b) => b.ol(b.li(b.p())),
        [
          {
            children: [
              {
                children: [{ children: [], type: "paragraph" }],
                spread: false,
                type: "listItem",
              },
            ],
            ordered: true,
            spread: false,
            start: 1,
            type: "list",
          },
        ],
      );
    });

    test("spread list with spread item", () => {
      expect(fx).toConvertProseMirrorNode(
        (b) => b.ol({ spread: true }, b.li({ spread: true }, b.p())),
        [
          {
            children: [
              {
                children: [{ children: [], type: "paragraph" }],
                spread: true,
                type: "listItem",
              },
            ],
            ordered: true,
            spread: true,
            start: 1,
            type: "list",
          },
        ],
      );
    });

    test("with content", () => {
      expect(fx).toConvertProseMirrorNode(
        (b) => b.ol(b.li(b.p("Hello World!"))),
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
            ordered: true,
            spread: false,
            start: 1,
            type: "list",
          },
        ],
      );
    });
  });

  describe("input rules", () => {
    test("`1. ` starts an empty ordered list", () => {
      expect(fx).toTransformBlockInput("1. ", (b) => [b.ol(b.li(b.p()))], "1.");
    });

    test("`1. ` with content", () => {
      expect(fx).toTransformBlockInput(
        "1. Hello World!",
        (b) => [b.ol(b.li(b.p("Hello World!")))],
        "1. Hello World!",
      );
    });

    test("tolerates one leading space", () => {
      expect(fx).toTransformBlockInput(
        " 1. Hello World!",
        (b) => [b.ol(b.li(b.p("Hello World!")))],
        "1. Hello World!",
      );
    });

    test("tolerates two leading spaces", () => {
      expect(fx).toTransformBlockInput(
        "  1. Hello World!",
        (b) => [b.ol(b.li(b.p("Hello World!")))],
        "1. Hello World!",
      );
    });

    test("tolerates three leading spaces", () => {
      expect(fx).toTransformBlockInput(
        "   1. Hello World!",
        (b) => [b.ol(b.li(b.p("Hello World!")))],
        "1. Hello World!",
      );
    });

    test("starts at 42", () => {
      expect(fx).toTransformBlockInput(
        "42. Hello World!",
        (b) => [b.ol({ start: 42 }, b.li(b.p("Hello World!")))],
        "42. Hello World!",
      );
    });

    test("continues onto a second item", () => {
      expect(fx).toTransformBlockInput(
        "1. Hello World!{Enter}Second item",
        (b) => [b.ol(b.li(b.p("Hello World!")), b.li(b.p("Second item")))],
        "1. Hello World!\n2. Second item",
      );
    });

    // A number continuing the preceding list joins it; any other number starts a
    // New list.
    test("a continuing number joins the list", () => {
      expect(fx).toTransformBlockInput(
        "1. a{Enter}{Enter}2. b",
        (b) => [b.ol(b.li(b.p("a")), b.li(b.p("b")))],
        "1. a\n2. b",
      );
    });

    test("a non-continuing number starts a new list", () => {
      expect(fx).toTransformBlockInput(
        "1. a{Enter}{Enter}7. b",
        (b) => [b.ol(b.li(b.p("a"))), b.ol({ start: 7 }, b.li(b.p("b")))],
        "1. a\n\n7) b",
      );
    });

    test("a continuing number joins a list started at 5", () => {
      expect(fx).toTransformBlockInput(
        "5. a{Enter}{Enter}6. b",
        (b) => [b.ol({ start: 5 }, b.li(b.p("a")), b.li(b.p("b")))],
        "5. a\n6. b",
      );
    });

    test("renumbers when continuing across items", () => {
      expect(fx).toTransformBlockInput(
        "1. a{Enter}b{Enter}{Enter}3. c",
        (b) => [b.ol(b.li(b.p("a")), b.li(b.p("b")), b.li(b.p("c")))],
        "1. a\n2. b\n3. c",
      );
    });
  });

  describe("keymap", () => {
    test("`Mod-Shift-9` wraps in an ordered list", () => {
      expect(fx).toTransformInput(
        (b) => [b.p("He<cursor>llo")],
        "cursor",
        "{Mod-Shift-9}",
        (b) => [b.ol(b.li(b.p("Hello")))],
        "1. Hello",
      );
    });

    test("`Enter` splits a list item", () => {
      expect(fx).toTransformInput(
        (b) => [b.ol(b.li(b.p("Hel<cursor>lo")))],
        "cursor",
        "{Enter}",
        (b) => [b.ol(b.li(b.p("Hel")), b.li(b.p("lo")))],
        "1. Hel\n2. lo",
      );
    });

    test("`Tab` sinks a list item", () => {
      expect(fx).toTransformInput(
        (b) => [b.ol(b.li(b.p("Hello")), b.li(b.p("<cursor>World")))],
        "cursor",
        "{Tab}",
        (b) => [b.ol(b.li(b.p("Hello"), b.ol(b.li(b.p("World")))))],
        "1. Hello\n   1. World",
      );
    });

    test("`Shift-Tab` lifts a list item", () => {
      expect(fx).toTransformInput(
        (b) => [b.ol(b.li(b.p("Hello"), b.ol(b.li(b.p("<cursor>World")))))],
        "cursor",
        "{Shift-Tab}",
        (b) => [b.ol(b.li(b.p("Hello")), b.li(b.p("World")))],
        "1. Hello\n2. World",
      );
    });

    test("`Backspace` joins a list with the preceding list", () => {
      expect(fx).toTransformInput(
        (b) => [b.ol(b.li(b.p("a"))), b.ol(b.li(b.p("<cursor>b")))],
        "cursor",
        "{Backspace}",
        (b) => [b.ol(b.li(b.p("a")), b.li(b.p("b")))],
        "1. a\n2. b",
      );
    });

    test("`Backspace` keeps the start of the preceding list", () => {
      expect(fx).toTransformInput(
        (b) => [
          b.ol({ start: 5 }, b.li(b.p("a"))),
          b.ol({ start: 9 }, b.li(b.p("<cursor>b"))),
        ],
        "cursor",
        "{Backspace}",
        (b) => [b.ol({ start: 5 }, b.li(b.p("a")), b.li(b.p("b")))],
        "5. a\n6. b",
      );
    });

    test("`Delete` joins a list with the following list", () => {
      expect(fx).toTransformInput(
        (b) => [b.ol(b.li(b.p("a<cursor>"))), b.ol(b.li(b.p("b")))],
        "cursor",
        "{Delete}",
        (b) => [b.ol(b.li(b.p("a")), b.li(b.p("b")))],
        "1. a\n2. b",
      );
    });
  });

  describe("DOM", () => {
    test("parses a plain `<ol>`", () => {
      expect(fx).toParseDOM("<ol><li><p>Hello</p></li></ol>", (b) => [
        b.ol({ start: 1 }, b.li(b.p("Hello"))),
      ]);
    });

    test("parses an `<ol start>`", () => {
      expect(fx).toParseDOM('<ol start="5"><li><p>Hello</p></li></ol>', (b) => [
        b.ol({ start: 5 }, b.li(b.p("Hello"))),
      ]);
    });

    test("parses a spread `<ol>`", () => {
      expect(fx).toParseDOM(
        '<ol data-spread="true"><li><p>Hello</p></li></ol>',
        (b) => [b.ol({ spread: true, start: 1 }, b.li(b.p("Hello")))],
      );
    });

    test("renders an `<ol>`", () => {
      expect(fx).toRenderDOM(
        (b) => [b.ol({ start: 5 }, b.li(b.p("Hello")))],
        '<ol data-spread="false" start="5"><li><p>Hello</p></li></ol>',
      );
    });
  });
});

describe("OrderedListExtension next to an unordered list", () => {
  const fx = createExtensionFixture(new OrderedListExtension(), [
    new UnorderedListExtension(),
  ]);

  test("a number after an unordered list starts a new list", () => {
    expect(fx).toTransformBlockInput(
      "* a{Enter}{Enter}1. b",
      (b) => [b.ul(b.li(b.p("a"))), b.ol(b.li(b.p("b")))],
      "* a\n\n1. b",
    );
  });

  test("`Backspace` moves the items into a preceding unordered list", () => {
    expect(fx).toTransformInput(
      (b) => [b.ul(b.li(b.p("a"))), b.ol(b.li(b.p("<cursor>b")))],
      "cursor",
      "{Backspace}",
      (b) => [b.ul(b.li(b.p("a")), b.li(b.p("b")))],
      "* a\n* b",
    );
  });
});
