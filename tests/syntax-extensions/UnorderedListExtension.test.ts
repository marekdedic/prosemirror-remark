import type { List } from "mdast";

import { history, undo } from "prosemirror-history";
import {
  type NodeSpec,
  type Node as ProseMirrorNode,
  Slice,
} from "prosemirror-model";
import { EditorState, NodeSelection, TextSelection } from "prosemirror-state";
import { ReplaceStep } from "prosemirror-transform";
import { NodeExtension } from "prosemirror-unified";
import { EditorView } from "prosemirror-view";
import { describe, expect, test, vi } from "vitest";
import { renderProseMirror } from "vitest-prosemirror";

import { BlockquoteExtension } from "../../src/syntax-extensions/BlockquoteExtension";
import { HorizontalRuleExtension } from "../../src/syntax-extensions/HorizontalRuleExtension";
import { InlineCodeExtension } from "../../src/syntax-extensions/InlineCodeExtension";
import {
  listSpreadAt,
  setListSpread,
} from "../../src/syntax-extensions/ListItemExtension";
import { OrderedListExtension } from "../../src/syntax-extensions/OrderedListExtension";
import { UnorderedListExtension } from "../../src/syntax-extensions/UnorderedListExtension";
import { createExtensionFixture } from "../utils/fixture";
import "../utils/matchers";

class PlainListExtension extends NodeExtension<List> {
  public override proseMirrorNodeName(): string {
    return "plain_list";
  }

  public override proseMirrorNodeSpec(): NodeSpec {
    return { content: "list_item+", group: "block" };
  }

  public override proseMirrorNodeToUnistNodes(): Array<List> {
    return [];
  }

  public override unistNodeName(): "list" {
    return "list";
  }

  public override unistNodeToProseMirrorNodes(): Array<ProseMirrorNode> {
    return [];
  }

  public override unistToProseMirrorTest(): boolean {
    return false;
  }
}

describe("UnorderedListExtension", () => {
  const fx = createExtensionFixture(new UnorderedListExtension());
  const fxWithInlineCode = createExtensionFixture(
    new UnorderedListExtension(),
    [new InlineCodeExtension()],
  );

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

    test("matches a tight unordered `list` with a spread item", () => {
      expect(fx).toMatchUnistNode({
        children: [{ children: [], spread: true, type: "listItem" }],
        ordered: false,
        spread: false,
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

    test("loose because of a spread list item", () => {
      expect(fx).toConvertUnistNode(
        {
          children: [
            { children: [], type: "listItem" },
            { children: [], spread: true, type: "listItem" },
          ],
          ordered: false,
          spread: false,
          type: "list",
        },
        (b) => [b.ul({ spread: true }, b.li(b.p()), b.li(b.p()))],
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

    test("with a list item starting with a nested list", () => {
      expect(fx).toConvertUnistNode(
        {
          children: [
            {
              children: [
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
              ],
              type: "listItem",
            },
          ],
          ordered: false,
          type: "list",
        },
        (b) => [b.ul(b.li(b.ul(b.li(b.p("Hello World!")))))],
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
                children: [],
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
                children: [],
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

    test("tight list with an item with several children", () => {
      expect(fx).toConvertProseMirrorNode(
        (b) => b.ul(b.li(b.p(), b.ul(b.li(b.p())))),
        [
          {
            children: [
              {
                children: [
                  { children: [], type: "paragraph" },
                  {
                    children: [
                      {
                        children: [],
                        spread: false,
                        type: "listItem",
                      },
                    ],
                    ordered: false,
                    spread: false,
                    type: "list",
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

    test("with a list item starting with a nested list", () => {
      expect(fx).toConvertProseMirrorNode(
        (b) => b.ul(b.li(b.ul(b.li(b.p("Hello World!"))))),
        [
          {
            children: [
              {
                children: [
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

    test("an empty nested item after a paragraph is kept in Markdown", () => {
      const doc = fx.b.doc(
        fx.b.ul(
          fx.b.li(fx.b.p("a"), fx.b.ul(fx.b.li(fx.b.p()))),
          fx.b.li(fx.b.p("z")),
        ),
      ) as unknown as ProseMirrorNode;

      expect(fx.pmu.serialize(doc)).toBe("* a\n\n  *\n* z\n");
      expect(fx.pmu.parse(fx.pmu.serialize(doc))).toEqualProseMirrorNode(
        fx.b.doc(
          fx.b.ul(
            { spread: true },
            fx.b.li(fx.b.p("a"), fx.b.ul(fx.b.li(fx.b.p()))),
            fx.b.li(fx.b.p("z")),
          ),
        ) as unknown as ProseMirrorNode,
      );
    });
  });

  describe("input rules", () => {
    test("`* ` starts an empty unordered list", () => {
      expect(fx).toTransformBlockInput("* ", (b) => [b.ul(b.li(b.p()))], "*");
    });

    test("`* ` with content", () => {
      expect(fx).toTransformBlockInput(
        "* Hello World!",
        (b) => [b.ul(b.li(b.p("Hello World!")))],
        "* Hello World!",
      );
    });

    test("`- ` with content", () => {
      expect(fx).toTransformBlockInput(
        "- Hello World!",
        (b) => [b.ul(b.li(b.p("Hello World!")))],
        "* Hello World!",
      );
    });

    test("`+ ` with content", () => {
      expect(fx).toTransformBlockInput(
        "+ Hello World!",
        (b) => [b.ul(b.li(b.p("Hello World!")))],
        "* Hello World!",
      );
    });

    test("tolerates one leading space", () => {
      expect(fx).toTransformBlockInput(
        " * Hello World!",
        (b) => [b.ul(b.li(b.p("Hello World!")))],
        "* Hello World!",
      );
    });

    test("tolerates two leading spaces", () => {
      expect(fx).toTransformBlockInput(
        "  * Hello World!",
        (b) => [b.ul(b.li(b.p("Hello World!")))],
        "* Hello World!",
      );
    });

    test("tolerates three leading spaces", () => {
      expect(fx).toTransformBlockInput(
        "   * Hello World!",
        (b) => [b.ul(b.li(b.p("Hello World!")))],
        "* Hello World!",
      );
    });

    test("continues onto a second item", () => {
      expect(fx).toTransformBlockInput(
        "* Hello World!{Enter}Second item",
        (b) => [b.ul(b.li(b.p("Hello World!")), b.li(b.p("Second item")))],
        "* Hello World!\n* Second item",
      );
    });

    test("a bullet joins the preceding list", () => {
      expect(fx).toTransformBlockInput(
        "* a{Enter}{Enter}* b",
        (b) => [b.ul(b.li(b.p("a")), b.li(b.p("b")))],
        "* a\n* b",
      );
    });

    test("a different bullet joins the preceding list", () => {
      expect(fx).toTransformBlockInput(
        "* a{Enter}{Enter}- b",
        (b) => [b.ul(b.li(b.p("a")), b.li(b.p("b")))],
        "* a\n* b",
      );
    });

    test("`-` followed by `Enter` stays text", () => {
      expect(fx).toTransformInput(
        (b) => [b.p("<cursor>")],
        "cursor",
        "-{Enter}",
        (b) => [b.p("-"), b.p()],
        "\\-\n",
      );
    });

    test("`- ` followed by `Enter` keeps the list", () => {
      expect(fx).toTransformInput(
        (b) => [b.p("<cursor>")],
        "cursor",
        "- {Enter}",
        (b) => [b.ul(b.li(b.p())), b.p()],
        "*\n",
      );
    });

    test.each([["-"], ["*"], ["+"]])(
      "inline code %j followed by a space stays inline code",
      (marker) => {
        expect(fxWithInlineCode).toTransformInput(
          (b) => [b.p(b.code(marker), "<cursor>")],
          "cursor",
          " ",
          (b) => [b.p(b.code(marker), " ")],
          `\`${marker}\`&#x20;`,
        );
      },
    );
  });

  describe("keymap", () => {
    test("`Mod-Shift-8` wraps in an unordered list", () => {
      expect(fx).toTransformInput(
        (b) => [b.p("He<cursor>llo")],
        "cursor",
        "{Mod-Shift-8}",
        (b) => [b.ul(b.li(b.p("Hello")))],
        "* Hello",
      );
    });

    test("`Enter` splits a list item", () => {
      expect(fx).toTransformInput(
        (b) => [b.ul(b.li(b.p("Hel<cursor>lo")))],
        "cursor",
        "{Enter}",
        (b) => [b.ul(b.li(b.p("Hel")), b.li(b.p("lo")))],
        "* Hel\n* lo",
      );
    });

    test("`Enter` in the only item of a list, which is empty, keeps the list", () => {
      expect(fx).toTransformInput(
        (b) => [b.ul(b.li(b.p("<cursor>")))],
        "cursor",
        "{Enter}",
        (b) => [b.ul(b.li(b.p())), b.p()],
        "*\n",
      );
    });

    test("`Enter` in the only item of a list, which is empty, moves to an empty paragraph after it", () => {
      expect(fx).toTransformInput(
        (b) => [b.ul(b.li(b.p("<cursor>"))), b.p(), b.p("a")],
        "cursor",
        "{Enter}b",
        (b) => [b.ul(b.li(b.p())), b.p("b"), b.p("a")],
        "*\n\nb\n\na",
      );
    });

    test("`Enter` in an empty last item of a longer list leaves the list", () => {
      expect(fx).toTransformInput(
        (b) => [b.ul(b.li(b.p("a")), b.li(b.p("<cursor>")))],
        "cursor",
        "{Enter}",
        (b) => [b.ul(b.li(b.p("a"))), b.p()],
        "* a\n",
      );
    });

    test("`Enter` in the only item of a nested list, which is empty, lifts it", () => {
      expect(fx).toTransformInput(
        (b) => [b.ul(b.li(b.p("a"), b.ul(b.li(b.p("<cursor>")))))],
        "cursor",
        "{Enter}",
        (b) => [b.ul(b.li(b.p("a")), b.li(b.p()))],
        "* a\n*",
      );
    });

    test("`Enter` in a spread list keeps it spread", () => {
      expect(fx).toTransformInput(
        (b) => [b.ul({ spread: true }, b.li(b.p("Hel<cursor>lo")))],
        "cursor",
        "{Enter}",
        (b) => [b.ul({ spread: true }, b.li(b.p("Hel")), b.li(b.p("lo")))],
        "* Hel\n\n* lo",
      );
    });

    test("`Tab` sinks a list item", () => {
      expect(fx).toTransformInput(
        (b) => [b.ul(b.li(b.p("Hello")), b.li(b.p("<cursor>World")))],
        "cursor",
        "{Tab}",
        (b) => [b.ul(b.li(b.p("Hello"), b.ul(b.li(b.p("World")))))],
        "* Hello\n  * World",
      );
    });

    test("`Shift-Tab` lifts a list item", () => {
      expect(fx).toTransformInput(
        (b) => [b.ul(b.li(b.p("Hello"), b.ul(b.li(b.p("<cursor>World")))))],
        "cursor",
        "{Shift-Tab}",
        (b) => [b.ul(b.li(b.p("Hello")), b.li(b.p("World")))],
        "* Hello\n* World",
      );
    });

    test("`Tab` sinks a list item from the middle of its text", () => {
      expect(fx).toTransformInput(
        (b) => [b.ul(b.li(b.p("Hello")), b.li(b.p("Wo<cursor>rld")))],
        "cursor",
        "{Tab}",
        (b) => [b.ul(b.li(b.p("Hello"), b.ul(b.li(b.p("World")))))],
        "* Hello\n  * World",
      );
    });

    test("`Shift-Tab` lifts a list item from the middle of its text", () => {
      expect(fx).toTransformInput(
        (b) => [b.ul(b.li(b.p("Hello"), b.ul(b.li(b.p("Wo<cursor>rld")))))],
        "cursor",
        "{Shift-Tab}",
        (b) => [b.ul(b.li(b.p("Hello")), b.li(b.p("World")))],
        "* Hello\n* World",
      );
    });

    test("`Backspace` joins a list with the preceding list", () => {
      expect(fx).toTransformInput(
        (b) => [b.ul(b.li(b.p("a"))), b.ul(b.li(b.p("<cursor>b")))],
        "cursor",
        "{Backspace}",
        (b) => [b.ul(b.li(b.p("a")), b.li(b.p("b")))],
        "* a\n* b",
      );
    });

    test("`Delete` joins a list with the following list", () => {
      expect(fx).toTransformInput(
        (b) => [b.ul(b.li(b.p("a<cursor>"))), b.ul(b.li(b.p("b")))],
        "cursor",
        "{Delete}",
        (b) => [b.ul(b.li(b.p("a")), b.li(b.p("b")))],
        "* a\n* b",
      );
    });

    test("`Backspace` in an empty paragraph between lists joins them into one", () => {
      expect(fx).toTransformInput(
        (b) => [b.ul(b.li(b.p("a"))), b.p("<cursor>"), b.ul(b.li(b.p("b")))],
        "cursor",
        "{Backspace}",
        (b) => [b.ul(b.li(b.p("a")), b.li(b.p()), b.li(b.p("b")))],
        "* a\n*\n* b",
      );
    });
  });

  describe("setListSpread", () => {
    test("makes a tight list loose", () => {
      expect(fx).toTransformCommand(
        (b) => [b.ul(b.li(b.p("a<cursor>")), b.li(b.p("b")))],
        "cursor",
        setListSpread(true),
        (b) => [b.ul({ spread: true }, b.li(b.p("a")), b.li(b.p("b")))],
        "* a\n\n* b",
      );
    });

    test("makes a loose list tight", () => {
      expect(fx).toTransformCommand(
        (b) => [b.ul({ spread: true }, b.li(b.p("a<cursor>")), b.li(b.p("b")))],
        "cursor",
        setListSpread(false),
        (b) => [b.ul(b.li(b.p("a")), b.li(b.p("b")))],
        "* a\n* b",
      );
    });

    test("applies to the innermost list", () => {
      expect(fx).toTransformCommand(
        (b) => [
          b.ul(
            b.li(b.p("a"), b.ul(b.li(b.p("b<cursor>")), b.li(b.p("c")))),
            b.li(b.p("d")),
          ),
        ],
        "cursor",
        setListSpread(true),
        (b) => [
          b.ul(
            b.li(
              b.p("a"),
              b.ul({ spread: true }, b.li(b.p("b")), b.li(b.p("c"))),
            ),
            b.li(b.p("d")),
          ),
        ],
        "* a\n  * b\n\n  * c\n* d",
      );
    });

    test("applies to the list containing the whole selection", () => {
      expect(fx).toTransformCommand(
        (b) => [
          b.ul(
            b.li(b.p("a"), b.ul(b.li(b.p("<start>b")), b.li(b.p("c")))),
            b.li(b.p("d<end>")),
          ),
        ],
        { anchor: "start", head: "end" },
        setListSpread(true),
        (b) => [
          b.ul(
            { spread: true },
            b.li(b.p("a"), b.ul(b.li(b.p("b")), b.li(b.p("c")))),
            b.li(b.p("d")),
          ),
        ],
        "* a\n\n  * b\n  * c\n\n* d",
      );
    });

    test("applies to a selected list", () => {
      expect(fx).toTransformCommand(
        (b) => [b.ul(b.li(b.p("a")), b.li(b.p("b"))), b.p("c")],
        "start",
        (state, dispatch) =>
          setListSpread(true)(
            state.apply(
              state.tr.setSelection(NodeSelection.create(state.doc, 0)),
            ),
            dispatch,
          ),
        (b) => [
          b.ul({ spread: true }, b.li(b.p("a")), b.li(b.p("b"))),
          b.p("c"),
        ],
        "* a\n\n* b\n\nc",
      );
    });

    test("applies to the list containing a selected item", () => {
      expect(fx).toTransformCommand(
        (b) => [b.ul(b.li(b.p("a"), b.ul(b.li(b.p("b")))), b.li(b.p("c")))],
        "start",
        (state, dispatch) =>
          setListSpread(true)(
            state.apply(
              state.tr.setSelection(NodeSelection.create(state.doc, 1)),
            ),
            dispatch,
          ),
        (b) => [
          b.ul(
            { spread: true },
            b.li(b.p("a"), b.ul(b.li(b.p("b")))),
            b.li(b.p("c")),
          ),
        ],
        "* a\n\n  * b\n\n* c",
      );
    });

    test("does not apply outside a list", () => {
      expect(fx).not.toTransformCommand(
        (b) => [b.p("a<cursor>"), b.ul(b.li(b.p("b")), b.li(b.p("c")))],
        "cursor",
        setListSpread(true),
        (b) => [b.p("a"), b.ul(b.li(b.p("b")), b.li(b.p("c")))],
        "a\n\n* b\n* c",
      );
    });

    test("does not apply to a selection across two lists", () => {
      expect(fx).not.toTransformCommand(
        (b) => [
          b.ul(b.li(b.p("<start>a")), b.li(b.p("b"))),
          b.p("c"),
          b.ul(b.li(b.p("d")), b.li(b.p("e<end>"))),
        ],
        { anchor: "start", head: "end" },
        setListSpread(true),
        (b) => [
          b.ul(b.li(b.p("a")), b.li(b.p("b"))),
          b.p("c"),
          b.ul(b.li(b.p("d")), b.li(b.p("e"))),
        ],
        "* a\n* b\n\nc\n\n* d\n* e",
      );
    });

    test("does not make a list tight when its content can't be tight", () => {
      expect(fx).not.toTransformCommand(
        (b) => [
          b.ul(
            { spread: true },
            b.li(b.p("a<cursor>"), b.p("b")),
            b.li(b.p("c")),
          ),
        ],
        "cursor",
        setListSpread(false),
        (b) => [
          b.ul({ spread: true }, b.li(b.p("a"), b.p("b")), b.li(b.p("c"))),
        ],
        "* a\n\n  b\n\n* c",
      );
    });

    test("makes a list with a single block loose, written tight", () => {
      expect(fx).toTransformCommand(
        (b) => [b.ul(b.li(b.p("a<cursor>")))],
        "cursor",
        setListSpread(true),
        (b) => [b.ul({ spread: true }, b.li(b.p("a")))],
        "* a",
      );
    });

    test("a loose list with a single block is written loose once it has a second item", () => {
      expect(fx).toTransformInput(
        (b) => [b.ul({ spread: true }, b.li(b.p("a<cursor>")))],
        "cursor",
        "{Enter}b",
        (b) => [b.ul({ spread: true }, b.li(b.p("a")), b.li(b.p("b")))],
        "* a\n\n* b",
      );
    });

    test("makes a list with a single item with several blocks loose", () => {
      expect(fx).toTransformCommand(
        (b) => [b.ul(b.li(b.p("a<cursor>"), b.ul(b.li(b.p("b")))))],
        "cursor",
        setListSpread(true),
        (b) => [b.ul({ spread: true }, b.li(b.p("a"), b.ul(b.li(b.p("b")))))],
        "* a\n\n  * b",
      );
    });

    test("does not dispatch when nothing changes", () => {
      const doc = fx.b.doc(
        fx.b.ul({ spread: true }, fx.b.li(fx.b.p("a")), fx.b.li(fx.b.p("b"))),
      ) as unknown as ProseMirrorNode;
      const state = EditorState.create({
        doc,
        selection: TextSelection.create(doc, 3),
      });
      const dispatch = vi.fn();

      expect(setListSpread(true)(state, dispatch)).toBe(true);
      expect(dispatch).not.toHaveBeenCalled();
    });
  });

  describe("listSpreadAt", () => {
    test.each([
      ["a tight list", false, false],
      ["a loose list", true, true],
    ])("reports %s", (_, spread, expected) => {
      const doc = fx.b.doc(
        fx.b.ul({ spread }, fx.b.li(fx.b.p("a")), fx.b.li(fx.b.p("b"))),
      ) as unknown as ProseMirrorNode;

      expect(
        listSpreadAt(
          EditorState.create({ doc, selection: TextSelection.create(doc, 3) }),
        ),
      ).toBe(expected);
    });

    test("reports the innermost list", () => {
      const doc = fx.b.doc(
        fx.b.ul(
          { spread: true },
          fx.b.li(fx.b.p("a"), fx.b.ul(fx.b.li(fx.b.p("b")))),
          fx.b.li(fx.b.p("c")),
        ),
      ) as unknown as ProseMirrorNode;

      expect(
        listSpreadAt(
          EditorState.create({ doc, selection: TextSelection.create(doc, 9) }),
        ),
      ).toBe(false);
    });

    test("reports a tight list whose content can't be tight as loose", () => {
      const doc = fx.b.doc(
        fx.b.ul(fx.b.li(fx.b.p("a"), fx.b.p("b")), fx.b.li(fx.b.p("c"))),
      ) as unknown as ProseMirrorNode;

      expect(
        listSpreadAt(
          EditorState.create({ doc, selection: TextSelection.create(doc, 3) }),
        ),
      ).toBe(true);
    });

    test("reports `null` outside a list", () => {
      const doc = fx.b.doc(
        fx.b.p("a"),
        fx.b.ul(fx.b.li(fx.b.p("b"))),
      ) as unknown as ProseMirrorNode;

      expect(
        listSpreadAt(
          EditorState.create({ doc, selection: TextSelection.create(doc, 1) }),
        ),
      ).toBeNull();
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

    test("parses a `<ul>` with a spread `<li>` as spread", () => {
      expect(fx).toParseDOM(
        '<ul><li><p>a</p></li><li data-spread="true"><p>b</p></li></ul>',
        (b) => [b.ul({ spread: true }, b.li(b.p("a")), b.li(b.p("b")))],
      );
    });

    test("parses an `<li>` starting with a nested list", () => {
      expect(fx).toParseDOM(
        "<ul><li><ul><li><p>Hello</p></li></ul></li></ul>",
        (b) => [b.ul(b.li(b.ul(b.li(b.p("Hello")))))],
      );
    });

    test("renders a `<ul>`", () => {
      expect(fx).toRenderDOM(
        (b) => [b.ul(b.li(b.p("Hello")))],
        '<ul class="prosemirror-remark-bullet-list" data-spread="false"><li><p>Hello</p></li></ul>',
      );
    });

    test("renders a spread `<ul>`", () => {
      expect(fx).toRenderDOM(
        (b) => [b.ul({ spread: true }, b.li(b.p("Hello")))],
        '<ul class="prosemirror-remark-bullet-list" data-spread="true"><li><p>Hello</p></li></ul>',
      );
    });
  });
});

describe("UnorderedListExtension normalising looseness", () => {
  const fx = createExtensionFixture(new UnorderedListExtension(), [
    new BlockquoteExtension(),
    new HorizontalRuleExtension(),
    new OrderedListExtension(),
  ]);

  test("`Backspace` at the start of an item makes the list loose", () => {
    expect(fx).toTransformInput(
      (b) => [b.ul(b.li(b.p("a")), b.li(b.p("<cursor>b")))],
      "cursor",
      "{Backspace}",
      (b) => [b.ul({ spread: true }, b.li(b.p("a"), b.p("b")))],
      "* a\n\n  b",
    );
  });

  test("a list type without `spread` is left alone", () => {
    const fxPlain = createExtensionFixture(new UnorderedListExtension(), [
      new PlainListExtension(),
    ]);
    const { nodes } = fxPlain.schema;
    const doc = nodes["doc"].create(
      null,
      nodes["plain_list"].create(
        null,
        nodes["regular_list_item"].create(
          null,
          nodes["paragraph"].create(null, fxPlain.schema.text("a")),
        ),
      ),
    );
    const state = EditorState.create({ doc, plugins: fxPlain.pmu.plugins() });
    const tr = state.tr.insert(
      4,
      nodes["paragraph"].create(null, fxPlain.schema.text("b")),
    );
    const appended = fxPlain.pmu
      .plugins()
      .map((plugin) =>
        plugin.spec.appendTransaction?.([tr], state, state.apply(tr)),
      )
      .filter((result) => result !== undefined && result !== null);

    expect(appended).toStrictEqual([]);
  });

  test("inserting a paragraph into an item makes the list loose", () => {
    expect(fx).toTransformCommand(
      (b) => [b.ul(b.li(b.p("a<cursor>")), b.li(b.p("c")))],
      "cursor",
      (state, dispatch) => {
        dispatch?.(
          state.tr.insert(
            state.selection.$from.after(),
            fx.b.p("b") as unknown as ProseMirrorNode,
          ),
        );
        return true;
      },
      (b) => [b.ul({ spread: true }, b.li(b.p("a"), b.p("b")), b.li(b.p("c")))],
      "* a\n\n  b\n\n* c",
    );
  });

  test("a horizontal rule after a paragraph in an item makes the list loose", () => {
    expect(fx).toTransformCommand(
      (b) => [b.ul(b.li(b.p("a<cursor>")), b.li(b.p("c")))],
      "cursor",
      (state, dispatch) => {
        dispatch?.(
          state.tr.insert(
            state.selection.$from.after(),
            fx.b.hr() as unknown as ProseMirrorNode,
          ),
        );
        return true;
      },
      (b) => [b.ul({ spread: true }, b.li(b.p("a"), b.hr()), b.li(b.p("c")))],
      "* a\n\n  ---\n\n* c",
    );
  });

  test("a second blockquote in an item makes the list loose", () => {
    expect(fx).toTransformCommand(
      (b) => [b.ul(b.li(b.blockquote(b.p("a<cursor>"))), b.li(b.p("c")))],
      "cursor",
      (state, dispatch) => {
        dispatch?.(
          state.tr.insert(
            state.selection.$from.after(-1),
            fx.b.blockquote(fx.b.p("b")) as unknown as ProseMirrorNode,
          ),
        );
        return true;
      },
      (b) => [
        b.ul(
          { spread: true },
          b.li(b.blockquote(b.p("a")), b.blockquote(b.p("b"))),
          b.li(b.p("c")),
        ),
      ],
      "* > a\n\n  > b\n\n* c",
    );
  });

  test("changing the start of a nested list makes the list loose", () => {
    expect(fx).toTransformCommand(
      (b) => [
        b.ul(b.li(b.p("a<cursor>"), b.ol(b.li(b.p("b")))), b.li(b.p("c"))),
      ],
      "cursor",
      (state, dispatch) => {
        dispatch?.(state.tr.setNodeAttribute(5, "start", 3));
        return true;
      },
      (b) => [
        b.ul(
          { spread: true },
          b.li(b.p("a"), b.ol({ start: 3 }, b.li(b.p("b")))),
          b.li(b.p("c")),
        ),
      ],
      "* a\n\n  3. b\n\n* c",
    );
  });

  test("a step with an out-of-range `pos` doesn't break the plugin", () => {
    expect(fx).toTransformCommand(
      (b) => [b.ul(b.li(b.p("a<cursor>")), b.li(b.p("b")))],
      "cursor",
      (state, dispatch) => {
        dispatch?.(
          state.tr.step(
            Object.assign(new ReplaceStep(1, 1, Slice.empty), { pos: 1000 }),
          ),
        );
        return true;
      },
      (b) => [b.ul(b.li(b.p("a")), b.li(b.p("b")))],
      "* a\n* b",
    );
  });

  test("a read-only editor isn't changed when it's created", async () => {
    expect.assertions(1);

    const doc = fx.b.doc(
      fx.b.ul(fx.b.li(fx.b.p("a"), fx.b.p("b")), fx.b.li(fx.b.p("c"))),
    ) as unknown as ProseMirrorNode;
    const editor = renderProseMirror(doc, {
      editorProps: { editable: () => false, plugins: fx.pmu.plugins() },
    });
    await Promise.resolve();

    expect(editor.doc).toEqualProseMirrorNode(doc);
  });

  test("a read-only editor is made loose when it becomes editable", async () => {
    expect.assertions(2);

    const doc = fx.b.doc(
      fx.b.ul(fx.b.li(fx.b.p("a"), fx.b.p("b")), fx.b.li(fx.b.p("c"))),
    ) as unknown as ProseMirrorNode;
    const view: EditorView = new EditorView(document.createElement("div"), {
      editable: () => false,
      state: EditorState.create({ doc, plugins: fx.pmu.plugins() }),
    });
    await Promise.resolve();

    expect(view.state.doc.firstChild?.attrs["spread"]).toBe(false);

    view.setProps({ editable: () => true });
    await Promise.resolve();

    expect(view.state.doc.firstChild?.attrs["spread"]).toBe(true);

    view.destroy();
  });

  test("starting a nested list leaves the list tight", () => {
    expect(fx).toTransformInput(
      (b) => [b.ul(b.li(b.p("a<cursor>")))],
      "cursor",
      "{Enter}{Tab}b",
      (b) => [b.ul(b.li(b.p("a"), b.ul(b.li(b.p("b")))))],
      "* a\n  * b",
    );
  });

  test("making a document loose when the editor is created works with a `dispatchTransaction` that uses the view", async () => {
    expect.assertions(1);

    const doc = fx.b.doc(
      fx.b.ul(fx.b.li(fx.b.p("a"), fx.b.p("b")), fx.b.li(fx.b.p("c"))),
    ) as unknown as ProseMirrorNode;
    const view: EditorView = new EditorView(document.createElement("div"), {
      dispatchTransaction: (tr): void => {
        view.updateState(view.state.apply(tr));
      },
      state: EditorState.create({ doc, plugins: fx.pmu.plugins() }),
    });
    await Promise.resolve();

    expect(view.state.doc.firstChild?.attrs["spread"]).toBe(true);

    view.destroy();
  });

  test("a document whose content can't be tight is made loose when the editor is created", async () => {
    expect.assertions(2);

    const editor = renderProseMirror(
      fx.b.doc(
        fx.b.ul(fx.b.li(fx.b.p("a"), fx.b.p("b")), fx.b.li(fx.b.p("c"))),
      ) as unknown as ProseMirrorNode,
      { editorProps: { plugins: [history(), ...fx.pmu.plugins()] } },
    );
    await Promise.resolve();

    expect(editor.doc).toEqualProseMirrorNode(
      fx.b.doc(
        fx.b.ul(
          { spread: true },
          fx.b.li(fx.b.p("a"), fx.b.p("b")),
          fx.b.li(fx.b.p("c")),
        ),
      ) as unknown as ProseMirrorNode,
    );
    expect(editor.command(undo)).toBe(false);
  });

  test("one undo reverts both the edit and the looseness", () => {
    const before = fx.b.doc(
      fx.b.ul(fx.b.li(fx.b.p("a")), fx.b.li(fx.b.p("<cursor>b"))),
    ) as unknown as ProseMirrorNode;
    const editor = renderProseMirror(before, {
      editorProps: { plugins: [history(), ...fx.pmu.plugins()] },
    });
    editor.setSelection("cursor");
    editor.type("{Backspace}");

    expect(editor.doc).toEqualProseMirrorNode(
      fx.b.doc(
        fx.b.ul({ spread: true }, fx.b.li(fx.b.p("a"), fx.b.p("b"))),
      ) as unknown as ProseMirrorNode,
    );
    expect(editor.command(undo)).toBe(true);
    expect(editor.doc).toEqualProseMirrorNode(before);
  });

  test("a nested list made loose leaves its parent tight", () => {
    expect(fx).toTransformInput(
      (b) => [
        b.ul(
          b.li(b.p("a"), b.ul(b.li(b.p("b")), b.li(b.p("<cursor>c")))),
          b.li(b.p("d")),
        ),
      ],
      "cursor",
      "{Backspace}",
      (b) => [
        b.ul(
          b.li(b.p("a"), b.ul({ spread: true }, b.li(b.p("b"), b.p("c")))),
          b.li(b.p("d")),
        ),
      ],
      "* a\n  * b\n\n    c\n* d",
    );
  });

  test("joining two tight lists into one item makes the list loose", () => {
    expect(fx).toTransformInput(
      (b) => [b.ul(b.li(b.p("a"))), b.ul(b.li(b.p("<cursor>b")))],
      "cursor",
      "{Backspace}{Backspace}",
      (b) => [b.ul({ spread: true }, b.li(b.p("a"), b.p("b")))],
      "* a\n\n  b",
    );
  });

  test("a loose list stays loose when its content could be tight again", () => {
    expect(fx).toTransformInput(
      (b) => [
        b.ul(
          { spread: true },
          b.li(b.p("a"), b.p("<cursor>b")),
          b.li(b.p("c")),
        ),
      ],
      "cursor",
      "{Backspace}",
      (b) => [b.ul({ spread: true }, b.li(b.p("ab")), b.li(b.p("c")))],
      "* ab\n\n* c",
    );
  });

  test("leaves lists whose content can be tight alone", () => {
    expect(fx).toTransformInput(
      (b) => [b.ul(b.li(b.p("a"), b.blockquote(b.p("<cursor>")))), b.p("c")],
      "cursor",
      "b",
      (b) => [b.ul(b.li(b.p("a"), b.blockquote(b.p("b")))), b.p("c")],
      "* a\n  > b\n\nc",
    );
  });
});

describe("UnorderedListExtension next to an ordered list", () => {
  const fx = createExtensionFixture(new UnorderedListExtension(), [
    new OrderedListExtension(),
  ]);

  test("a bullet after an ordered list starts a new list", () => {
    expect(fx).toTransformBlockInput(
      "1. a{Enter}{Enter}* b",
      (b) => [b.ol(b.li(b.p("a"))), b.ul(b.li(b.p("b")))],
      "1. a\n\n* b",
    );
  });

  test("`Backspace` moves the items into a preceding ordered list", () => {
    expect(fx).toTransformInput(
      (b) => [b.ol(b.li(b.p("a"))), b.ul(b.li(b.p("<cursor>b")))],
      "cursor",
      "{Backspace}",
      (b) => [b.ol(b.li(b.p("a")), b.li(b.p("b")))],
      "1. a\n2. b",
    );
  });
});
