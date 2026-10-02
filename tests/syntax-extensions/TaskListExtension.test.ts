import { describe, expect, test } from "vitest";

import { BlockquoteExtension } from "../../src/syntax-extensions/BlockquoteExtension";
import { ListItemExtension } from "../../src/syntax-extensions/ListItemExtension";
import { OrderedListExtension } from "../../src/syntax-extensions/OrderedListExtension";
import { TaskListItemExtension } from "../../src/syntax-extensions/TaskListItemExtension";
import { UnorderedListExtension } from "../../src/syntax-extensions/UnorderedListExtension";
import { createExtensionFixture } from "../utils/fixture";
import "../utils/matchers";

function renderedTaskList(checked: boolean): string {
  return `<ul data-spread="false"><li style="list-style-type: none; margin-left: -30px;"><span contenteditable="false" style="position: absolute; left: 5px;"><input ${checked ? 'checked="checked" ' : ""}disabled="disabled" type="checkbox"></span><span style="position: relative; left: 30px;"><p>a</p></span></li></ul>`;
}

describe("TaskListExtension", () => {
  const fx = createExtensionFixture(new UnorderedListExtension(), [
    new ListItemExtension(),
    new TaskListItemExtension(),
  ]);

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

    test("matches a list with an unchecked task item", () => {
      expect(fx).toMatchUnistNode({
        children: [
          {
            checked: false,
            children: [
              {
                children: [{ type: "text", value: "Hello" }],
                type: "paragraph",
              },
            ],
            type: "listItem",
          },
        ],
        ordered: false,
        spread: true,
        type: "list",
      });
    });

    test("matches a list with a checked task item", () => {
      expect(fx).toMatchUnistNode({
        children: [
          {
            checked: true,
            children: [
              {
                children: [{ type: "text", value: "Hello" }],
                type: "paragraph",
              },
            ],
            type: "listItem",
          },
        ],
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

    test("unchecked task item", () => {
      expect(fx).toConvertUnistNode(
        {
          children: [{ checked: false, children: [], type: "listItem" }],
          ordered: false,
          type: "list",
        },
        (b) => [b.ul(b.taskListItem({ checked: false }, b.p()))],
      );
    });

    test("checked task item", () => {
      expect(fx).toConvertUnistNode(
        {
          children: [{ checked: true, children: [], type: "listItem" }],
          ordered: false,
          type: "list",
        },
        (b) => [b.ul(b.taskListItem({ checked: true }, b.p()))],
      );
    });

    test("spread list item", () => {
      expect(fx).toConvertUnistNode(
        {
          children: [{ children: [], spread: true, type: "listItem" }],
          ordered: false,
          type: "list",
        },
        (b) => [b.ul(b.li({ spread: true }, b.p()))],
      );
    });

    test("regular list item with content", () => {
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

    test("unchecked task item with content", () => {
      expect(fx).toConvertUnistNode(
        {
          children: [
            {
              checked: false,
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
        (b) => [b.ul(b.taskListItem({ checked: false }, b.p("Hello World!")))],
      );
    });

    test("checked task item with content", () => {
      expect(fx).toConvertUnistNode(
        {
          children: [
            {
              checked: true,
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
        (b) => [b.ul(b.taskListItem({ checked: true }, b.p("Hello World!")))],
      );
    });

    test("regular list item with a nested task list", () => {
      expect(fx).toConvertUnistNode(
        {
          children: [
            {
              children: [
                {
                  children: [{ type: "text", value: "Hello" }],
                  type: "paragraph",
                },
                {
                  children: [
                    {
                      checked: true,
                      children: [
                        {
                          children: [{ type: "text", value: "World" }],
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
        (b) => [
          b.ul(
            b.li(
              b.p("Hello"),
              b.ul(b.taskListItem({ checked: true }, b.p("World"))),
            ),
          ),
        ],
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

    test("matches a `ul` with an unchecked task item", () => {
      expect(fx).toMatchProseMirrorNode((b) =>
        b.ul(b.taskListItem({ checked: false })),
      );
    });

    test("matches a `ul` with a checked task item", () => {
      expect(fx).toMatchProseMirrorNode((b) =>
        b.ul(b.taskListItem({ checked: true })),
      );
    });

    test("matches a `ul` with an unchecked task item and content", () => {
      expect(fx).toMatchProseMirrorNode((b) =>
        b.ul(b.taskListItem({ checked: false }, b.p("Hello World!"))),
      );
    });

    test("matches a `ul` with a checked task item and content", () => {
      expect(fx).toMatchProseMirrorNode((b) =>
        b.ul(b.taskListItem({ checked: true }, b.p("Hello World!"))),
      );
    });
  });

  describe("converts ProseMirror -> unist", () => {
    test("regular list item", () => {
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

    test.fails(
      "regular list item in a tight list with spread item (#1120)",
      () => {
        expect(fx).toConvertProseMirrorNode(
          (b) => b.ul(b.li({ spread: true }, b.p())),
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
              spread: false,
              type: "list",
            },
          ],
        );
      },
    );

    test("task item defaults to unchecked", () => {
      expect(fx).toConvertProseMirrorNode(
        (b) => b.ul(b.taskListItem(b.p())),
        [
          {
            children: [
              {
                checked: false,
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

    test("unchecked task item", () => {
      expect(fx).toConvertProseMirrorNode(
        (b) => b.ul(b.taskListItem({ checked: false }, b.p())),
        [
          {
            children: [
              {
                checked: false,
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

    test("checked task item", () => {
      expect(fx).toConvertProseMirrorNode(
        (b) => b.ul(b.taskListItem({ checked: true }, b.p())),
        [
          {
            children: [
              {
                checked: true,
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

    test("spread checked task item", () => {
      expect(fx).toConvertProseMirrorNode(
        (b) =>
          b.ul(
            { spread: true },
            b.taskListItem(
              {
                checked: true,
                spread: true,
              },
              b.p(),
            ),
          ),
        [
          {
            children: [
              {
                checked: true,
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

    test("checked task item with content", () => {
      expect(fx).toConvertProseMirrorNode(
        (b) => b.ul(b.taskListItem({ checked: true }, b.p("Hello World!"))),
        [
          {
            children: [
              {
                checked: true,
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

    test("task item with a nested regular list", () => {
      expect(fx).toConvertProseMirrorNode(
        (b) =>
          b.ul(
            b.taskListItem(
              { checked: true },
              b.p("Hello"),
              b.ul(b.li(b.p("World"))),
            ),
          ),
        [
          {
            children: [
              {
                checked: true,
                children: [
                  {
                    children: [{ type: "text", value: "Hello" }],
                    type: "paragraph",
                  },
                  {
                    children: [
                      {
                        children: [
                          {
                            children: [{ type: "text", value: "World" }],
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
  });

  describe("input rules", () => {
    test("`[ ] ` turns a regular item into an unchecked task item", () => {
      expect(fx).toTransformInput(
        (b) => [b.ul(b.li(b.p("<cursor>Hello")), b.li(b.p("World")))],
        "cursor",
        "[[ ] ",
        (b) => [
          b.ul(
            b.taskListItem({ checked: false }, b.p("Hello")),
            b.li(b.p("World")),
          ),
        ],
        "* [ ] Hello\n* World",
      );
    });

    test("`[x] ` turns a regular item into a checked task item", () => {
      expect(fx).toTransformInput(
        (b) => [b.ul(b.li(b.p("<cursor>Hello")), b.li(b.p("World")))],
        "cursor",
        "[[x] ",
        (b) => [
          b.ul(
            b.taskListItem({ checked: true }, b.p("Hello")),
            b.li(b.p("World")),
          ),
        ],
        "* [x] Hello\n* World",
      );
    });

    test("`[X] ` turns a regular item into a checked task item", () => {
      expect(fx).toTransformInput(
        (b) => [b.ul(b.li(b.p("<cursor>Hello")), b.li(b.p("World")))],
        "cursor",
        "[[X] ",
        (b) => [
          b.ul(
            b.taskListItem({ checked: true }, b.p("Hello")),
            b.li(b.p("World")),
          ),
        ],
        "* [x] Hello\n* World",
      );
    });

    test("`[] ` turns a regular item into an unchecked task item", () => {
      expect(fx).toTransformInput(
        (b) => [b.ul(b.li(b.p("<cursor>Hello")), b.li(b.p("World")))],
        "cursor",
        "[[] ",
        (b) => [
          b.ul(
            b.taskListItem({ checked: false }, b.p("Hello")),
            b.li(b.p("World")),
          ),
        ],
        "* [ ] Hello\n* World",
      );
    });

    test("creates an unchecked task item in an empty document", () => {
      expect(fx).toTransformBlockInput(
        "- [[ ] Hello",
        (b) => [b.ul(b.taskListItem({ checked: false }, b.p("Hello")))],
        "* [ ] Hello",
      );
    });

    test("creates a checked task item in an empty document", () => {
      expect(fx).toTransformBlockInput(
        "- [[x] Hello",
        (b) => [b.ul(b.taskListItem({ checked: true }, b.p("Hello")))],
        "* [x] Hello",
      );
    });

    test("creates a checked task item from an uppercase `X` in an empty document", () => {
      expect(fx).toTransformBlockInput(
        "- [[X] Hello",
        (b) => [b.ul(b.taskListItem({ checked: true }, b.p("Hello")))],
        "* [x] Hello",
      );
    });

    test("does not apply in a non-first paragraph of a list item", () => {
      expect(fx).toTransformInput(
        (b) => [b.ul(b.li(b.p("Hello"), b.p("<cursor>World")))],
        "cursor",
        "[[ ] ",
        (b) => [b.ul(b.li(b.p("Hello"), b.p("[ ] World")))],
        "* Hello\n\n  \\[ ] World",
      );
    });

    test("does not apply outside a list item", () => {
      expect(fx).toTransformInput(
        (b) => [b.p("<cursor>Hello")],
        "cursor",
        "[[ ] ",
        (b) => [b.p("[ ] Hello")],
        "\\[ ] Hello",
      );
    });

    test("does not apply to a task item", () => {
      expect(fx).toTransformInput(
        (b) => [b.ul(b.taskListItem(b.p("<cursor>Hello")))],
        "cursor",
        "[[ ] ",
        (b) => [b.ul(b.taskListItem(b.p("[ ] Hello")))],
        "* [ ] \\[ ] Hello",
      );
    });

    test("converts a regular item nested in a task item", () => {
      expect(fx).toTransformInput(
        (b) => [
          b.ul(b.taskListItem(b.p("Hello"), b.ul(b.li(b.p("<cursor>World"))))),
        ],
        "cursor",
        "[[x] ",
        (b) => [
          b.ul(
            b.taskListItem(
              b.p("Hello"),
              b.ul(b.taskListItem({ checked: true }, b.p("World"))),
            ),
          ),
        ],
        "* [ ] Hello\n  * [x] World",
      );
    });

    test("keeps the cursor in the converted item", () => {
      expect(fx).toTransformInput(
        (b) => [b.ul(b.li(b.p("<cursor>Hello")), b.li(b.p("World")))],
        "cursor",
        "[[ ] X",
        (b) => [
          b.ul(
            b.taskListItem({ checked: false }, b.p("XHello")),
            b.li(b.p("World")),
          ),
        ],
        "* [ ] XHello\n* World",
      );
    });

    test("keeps the cursor in the converted item when it is the last one", () => {
      expect(fx).toTransformInput(
        (b) => [b.ul(b.li(b.p("Hello")), b.li(b.p("<cursor>World")))],
        "cursor",
        "[[x] X",
        (b) => [
          b.ul(
            b.li(b.p("Hello")),
            b.taskListItem({ checked: true }, b.p("XWorld")),
          ),
        ],
        "* Hello\n* [x] XWorld",
      );
    });

    test("keeps the cursor in an item with multiple paragraphs", () => {
      expect(fx).toTransformInput(
        (b) => [b.ul(b.li(b.p("<cursor>Hello"), b.p("World")))],
        "cursor",
        "[[ ] X",
        (b) => [b.ul(b.taskListItem(b.p("XHello"), b.p("World")))],
        "* [ ] XHello\n\n  World",
      );
    });
  });

  describe("keymap", () => {
    test("`Backspace` turns a task item into a regular item", () => {
      expect(fx).toTransformInput(
        (b) => [
          b.ul(b.taskListItem(b.p("Hello")), b.taskListItem(b.p("World"))),
        ],
        0,
        "{Backspace}",
        (b) => [b.ul(b.li(b.p("Hello")), b.taskListItem(b.p("World")))],
        "* Hello\n* [ ] World",
      );
    });

    test("`Backspace` keeps the cursor in the converted item", () => {
      expect(fx).toTransformInput(
        (b) => [
          b.ul(
            b.taskListItem(b.p("<cursor>Hello")),
            b.taskListItem(b.p("World")),
          ),
        ],
        "cursor",
        "{Backspace}X",
        (b) => [b.ul(b.li(b.p("XHello")), b.taskListItem(b.p("World")))],
        "* XHello\n* [ ] World",
      );
    });

    test("`Backspace` keeps the cursor in the converted item when it is the last one", () => {
      expect(fx).toTransformInput(
        (b) => [
          b.ul(
            b.taskListItem(b.p("Hello")),
            b.taskListItem(b.p("<cursor>World")),
          ),
        ],
        "cursor",
        "{Backspace}X",
        (b) => [b.ul(b.taskListItem(b.p("Hello")), b.li(b.p("XWorld")))],
        "* [ ] Hello\n* XWorld",
      );
    });

    test("`Backspace` keeps the cursor in an item with multiple paragraphs", () => {
      expect(fx).toTransformInput(
        (b) => [b.ul(b.taskListItem(b.p("<cursor>Hello"), b.p("World")))],
        "cursor",
        "{Backspace}X",
        (b) => [b.ul(b.li(b.p("XHello"), b.p("World")))],
        "* XHello\n\n  World",
      );
    });

    test("`Backspace` at the start of a non-first paragraph of a task item joins the paragraphs", () => {
      expect(fx).toTransformInput(
        (b) => [b.ul(b.taskListItem(b.p("Hello"), b.p("<cursor>World")))],
        "cursor",
        "{Backspace}",
        (b) => [b.ul(b.taskListItem(b.p("HelloWorld")))],
        "* [ ] HelloWorld",
      );
    });

    test("`Backspace` in the middle of a task item deletes a character", () => {
      expect(fx).toTransformInput(
        (b) => [b.ul(b.taskListItem(b.p("He<cursor>llo")))],
        "cursor",
        "{Backspace}",
        (b) => [b.ul(b.taskListItem(b.p("Hllo")))],
        "* [ ] Hllo",
      );
    });

    test("`Backspace` at the start of a regular item is left to other bindings", () => {
      expect(fx).toTransformInput(
        (b) => [b.ul(b.li(b.p("Hello")), b.li(b.p("<cursor>World")))],
        "cursor",
        "{Backspace}",
        (b) => [b.ul(b.li(b.p("Hello"), b.p("World")))],
        "* Hello\n\n  World",
      );
    });

    test("`Backspace` joins a regular item's list with a preceding task list", () => {
      expect(fx).toTransformInput(
        (b) => [b.ul(b.taskListItem(b.p("a"))), b.ul(b.li(b.p("<cursor>b")))],
        "cursor",
        "{Backspace}",
        (b) => [b.ul(b.taskListItem(b.p("a")), b.li(b.p("b")))],
        "* [ ] a\n* b",
      );
    });

    test("`Backspace` on a task item after a list does not join it", () => {
      expect(fx).toTransformInput(
        (b) => [
          b.ul(b.taskListItem(b.p("a"))),
          b.ul(b.taskListItem(b.p("<cursor>b"))),
        ],
        "cursor",
        "{Backspace}",
        (b) => [b.ul(b.taskListItem(b.p("a"))), b.ul(b.li(b.p("b")))],
        "* [ ] a\n\n- b",
      );
    });

    test("`Delete` joins a task list with the following list", () => {
      expect(fx).toTransformInput(
        (b) => [
          b.ul(b.taskListItem(b.p("a<cursor>"))),
          b.ul(b.taskListItem(b.p("b"))),
        ],
        "cursor",
        "{Delete}",
        (b) => [b.ul(b.taskListItem(b.p("a")), b.taskListItem(b.p("b")))],
        "* [ ] a\n* [ ] b",
      );
    });

    test("`Enter` splits a task item", () => {
      expect(fx).toTransformInput(
        (b) => [b.ul(b.taskListItem(b.p("Hel<cursor>lo")))],
        "cursor",
        "{Enter}",
        (b) => [b.ul(b.taskListItem(b.p("Hel")), b.taskListItem(b.p("lo")))],
        "* [ ] Hel\n* [ ] lo",
      );
    });

    test("`Enter` in a checked task item creates an unchecked one", () => {
      expect(fx).toTransformInput(
        (b) => [b.ul(b.taskListItem({ checked: true }, b.p("Hel<cursor>lo")))],
        "cursor",
        "{Enter}",
        (b) => [
          b.ul(
            b.taskListItem({ checked: true }, b.p("Hel")),
            b.taskListItem(b.p("lo")),
          ),
        ],
        "* [x] Hel\n* [ ] lo",
      );
    });

    test("`Tab` nests a task item", () => {
      expect(fx).toTransformInput(
        (b) => [
          b.ul(
            b.taskListItem(b.p("Hello")),
            b.taskListItem(b.p("Wo<cursor>rld")),
          ),
        ],
        "cursor",
        "{Tab}",
        (b) => [
          b.ul(
            b.taskListItem(b.p("Hello"), b.ul(b.taskListItem(b.p("World")))),
          ),
        ],
        "* [ ] Hello\n  * [ ] World",
      );
    });

    test("`Shift-Tab` lifts a nested task item", () => {
      expect(fx).toTransformInput(
        (b) => [
          b.ul(
            b.taskListItem(
              b.p("Hello"),
              b.ul(b.taskListItem(b.p("Wo<cursor>rld"))),
            ),
          ),
        ],
        "cursor",
        "{Shift-Tab}",
        (b) => [
          b.ul(b.taskListItem(b.p("Hello")), b.taskListItem(b.p("World"))),
        ],
        "* [ ] Hello\n* [ ] World",
      );
    });

    test("`Shift-Tab` lifts a regular item nested in a task item", () => {
      expect(fx).toTransformInput(
        (b) => [
          b.ul(b.taskListItem(b.p("Hello"), b.ul(b.li(b.p("<cursor>World"))))),
        ],
        "cursor",
        "{Shift-Tab}",
        (b) => [b.ul(b.taskListItem(b.p("Hello")), b.li(b.p("World")))],
        "* [ ] Hello\n* World",
      );
    });

    test("`Shift-Tab` lifts a task item nested in a regular item", () => {
      expect(fx).toTransformInput(
        (b) => [
          b.ul(b.li(b.p("Hello"), b.ul(b.taskListItem(b.p("<cursor>World"))))),
        ],
        "cursor",
        "{Shift-Tab}",
        (b) => [b.ul(b.li(b.p("Hello")), b.taskListItem(b.p("World")))],
        "* Hello\n* [ ] World",
      );
    });

    test("`Shift-Tab` lifts a regular item following a task item in a nested list", () => {
      expect(fx).toTransformInput(
        (b) => [
          b.ul(
            b.li(
              b.p("Hello"),
              b.ul(b.taskListItem(b.p("A")), b.li(b.p("<cursor>B"))),
            ),
          ),
        ],
        "cursor",
        "{Shift-Tab}",
        (b) => [
          b.ul(
            b.li(b.p("Hello"), b.ul(b.taskListItem(b.p("A")))),
            b.li(b.p("B")),
          ),
        ],
        "* Hello\n  * [ ] A\n* B",
      );
    });

    test("`Shift-Tab` lifts a task item following a regular item in a nested list", () => {
      expect(fx).toTransformInput(
        (b) => [
          b.ul(
            b.taskListItem(
              b.p("Hello"),
              b.ul(b.li(b.p("A")), b.taskListItem(b.p("<cursor>B"))),
            ),
          ),
        ],
        "cursor",
        "{Shift-Tab}",
        (b) => [
          b.ul(
            b.taskListItem(b.p("Hello"), b.ul(b.li(b.p("A")))),
            b.taskListItem(b.p("B")),
          ),
        ],
        "* [ ] Hello\n  * A\n* [ ] B",
      );
    });

    test("`Shift-Tab` keeps the following item of the other type nested", () => {
      expect(fx).toTransformInput(
        (b) => [
          b.ul(
            b.taskListItem(
              b.p("Hello"),
              b.ul(b.taskListItem(b.p("<cursor>A")), b.li(b.p("B"))),
            ),
          ),
        ],
        "cursor",
        "{Shift-Tab}",
        (b) => [
          b.ul(
            b.taskListItem(b.p("Hello")),
            b.taskListItem(b.p("A"), b.ul(b.li(b.p("B")))),
          ),
        ],
        "* [ ] Hello\n* [ ] A\n  * B",
      );
    });

    test("`Tab` nests a regular item under a task item", () => {
      expect(fx).toTransformInput(
        (b) => [b.ul(b.taskListItem(b.p("Hello")), b.li(b.p("<cursor>World")))],
        "cursor",
        "{Tab}",
        (b) => [b.ul(b.taskListItem(b.p("Hello"), b.ul(b.li(b.p("World")))))],
        "* [ ] Hello\n  * World",
      );
    });

    test("`Tab` nests a task item under a regular item", () => {
      expect(fx).toTransformInput(
        (b) => [b.ul(b.li(b.p("Hello")), b.taskListItem(b.p("<cursor>World")))],
        "cursor",
        "{Tab}",
        (b) => [b.ul(b.li(b.p("Hello"), b.ul(b.taskListItem(b.p("World")))))],
        "* Hello\n  * [ ] World",
      );
    });

    test("`Tab` appends a regular item to a nested task list", () => {
      expect(fx).toTransformInput(
        (b) => [
          b.ul(
            b.taskListItem(b.p("Hello"), b.ul(b.taskListItem(b.p("A")))),
            b.li(b.p("<cursor>World")),
          ),
        ],
        "cursor",
        "{Tab}",
        (b) => [
          b.ul(
            b.taskListItem(
              b.p("Hello"),
              b.ul(b.taskListItem(b.p("A")), b.li(b.p("World"))),
            ),
          ),
        ],
        "* [ ] Hello\n  * [ ] A\n  * World",
      );
    });

    test("`Tab` nests a regular item under a task item in a list starting with a regular item", () => {
      expect(fx).toTransformInput(
        (b) => [
          b.ul(
            b.li(b.p("X")),
            b.taskListItem(b.p("Y")),
            b.li(b.p("<cursor>Z")),
          ),
        ],
        "cursor",
        "{Tab}",
        (b) => [
          b.ul(b.li(b.p("X")), b.taskListItem(b.p("Y"), b.ul(b.li(b.p("Z"))))),
        ],
        "* X\n* [ ] Y\n  * Z",
      );
    });

    test("`Tab` nests a task item under a regular item in a list starting with a task item", () => {
      expect(fx).toTransformInput(
        (b) => [
          b.ul(
            b.taskListItem(b.p("X")),
            b.li(b.p("Y")),
            b.taskListItem(b.p("<cursor>Z")),
          ),
        ],
        "cursor",
        "{Tab}",
        (b) => [
          b.ul(
            b.taskListItem(b.p("X")),
            b.li(b.p("Y"), b.ul(b.taskListItem(b.p("Z")))),
          ),
        ],
        "* [ ] X\n* Y\n  * [ ] Z",
      );
    });

    test("`Tab` nests a regular item in a list starting with a task item", () => {
      expect(fx).toTransformInput(
        (b) => [
          b.ul(
            b.taskListItem(b.p("X")),
            b.li(b.p("Y")),
            b.li(b.p("<cursor>Z")),
          ),
        ],
        "cursor",
        "{Tab}",
        (b) => [
          b.ul(b.taskListItem(b.p("X")), b.li(b.p("Y"), b.ul(b.li(b.p("Z"))))),
        ],
        "* [ ] X\n* Y\n  * Z",
      );
    });

    test("`Tab` nests a task item in a list starting with a regular item", () => {
      expect(fx).toTransformInput(
        (b) => [
          b.ul(
            b.li(b.p("X")),
            b.taskListItem(b.p("Y")),
            b.taskListItem(b.p("<cursor>Z")),
          ),
        ],
        "cursor",
        "{Tab}",
        (b) => [
          b.ul(
            b.li(b.p("X")),
            b.taskListItem(b.p("Y"), b.ul(b.taskListItem(b.p("Z")))),
          ),
        ],
        "* X\n* [ ] Y\n  * [ ] Z",
      );
    });

    test("`Enter` splits a regular item nested in a task item", () => {
      expect(fx).toTransformInput(
        (b) => [
          b.ul(b.taskListItem(b.p("Hello"), b.ul(b.li(b.p("Wo<cursor>rld"))))),
        ],
        "cursor",
        "{Enter}",
        (b) => [
          b.ul(
            b.taskListItem(
              b.p("Hello"),
              b.ul(b.li(b.p("Wo")), b.li(b.p("rld"))),
            ),
          ),
        ],
        "* [ ] Hello\n  * Wo\n  * rld",
      );
    });

    test("`Enter` splits a checked task item nested in a regular item", () => {
      expect(fx).toTransformInput(
        (b) => [
          b.ul(
            b.li(
              b.p("Hello"),
              b.ul(b.taskListItem({ checked: true }, b.p("Wo<cursor>rld"))),
            ),
          ),
        ],
        "cursor",
        "{Enter}",
        (b) => [
          b.ul(
            b.li(
              b.p("Hello"),
              b.ul(
                b.taskListItem({ checked: true }, b.p("Wo")),
                b.taskListItem(b.p("rld")),
              ),
            ),
          ),
        ],
        "* Hello\n  * [x] Wo\n  * [ ] rld",
      );
    });

    test("`Enter` lifts an empty task item nested in a task item", () => {
      expect(fx).toTransformInput(
        (b) => [
          b.ul(
            b.taskListItem(b.p("Hello"), b.ul(b.taskListItem(b.p("<cursor>")))),
          ),
        ],
        "cursor",
        "{Enter}",
        (b) => [b.ul(b.taskListItem(b.p("Hello")), b.taskListItem(b.p()))],
        "* [ ] Hello\n*",
      );
    });

    test("`Enter` lifts an empty regular item nested in a task item", () => {
      expect(fx).toTransformInput(
        (b) => [
          b.ul(b.taskListItem(b.p("Hello"), b.ul(b.li(b.p("<cursor>"))))),
        ],
        "cursor",
        "{Enter}",
        (b) => [b.ul(b.taskListItem(b.p("Hello")), b.li(b.p()))],
        "* [ ] Hello\n*",
      );
    });

    test("`Enter` lifts an empty task item nested in a regular item", () => {
      expect(fx).toTransformInput(
        (b) => [
          b.ul(b.li(b.p("Hello"), b.ul(b.taskListItem(b.p("<cursor>"))))),
        ],
        "cursor",
        "{Enter}",
        (b) => [b.ul(b.li(b.p("Hello")), b.taskListItem(b.p()))],
        "* Hello\n*",
      );
    });

    test("`Enter` in an empty task item exits the list", () => {
      expect(fx).toTransformInput(
        (b) => [
          b.ul(b.taskListItem(b.p("Hello")), b.taskListItem(b.p("<cursor>"))),
        ],
        "cursor",
        "{Enter}",
        (b) => [b.ul(b.taskListItem(b.p("Hello"))), b.p()],
        "* [ ] Hello\n",
      );
    });

    test("`Backspace` turns a task item nested in a regular item into a regular item", () => {
      expect(fx).toTransformInput(
        (b) => [
          b.ul(b.li(b.p("Hello"), b.ul(b.taskListItem(b.p("<cursor>World"))))),
        ],
        "cursor",
        "{Backspace}",
        (b) => [b.ul(b.li(b.p("Hello"), b.ul(b.li(b.p("World")))))],
        "* Hello\n  * World",
      );
    });

    test("`Backspace` at the start of a regular item joins it with a preceding task item", () => {
      expect(fx).toTransformInput(
        (b) => [b.ul(b.taskListItem(b.p("Hello")), b.li(b.p("<cursor>World")))],
        "cursor",
        "{Backspace}",
        (b) => [b.ul(b.taskListItem(b.p("Hello"), b.p("World")))],
        "* [ ] Hello\n\n  World",
      );
    });

    test("`Delete` joins a regular list with a following task list", () => {
      expect(fx).toTransformInput(
        (b) => [b.ul(b.li(b.p("a<cursor>"))), b.ul(b.taskListItem(b.p("b")))],
        "cursor",
        "{Delete}",
        (b) => [b.ul(b.li(b.p("a")), b.taskListItem(b.p("b")))],
        "* a\n* [ ] b",
      );
    });

    test("`Shift-Tab` lifts a top-level task item out of the list", () => {
      expect(fx).toTransformInput(
        (b) => [b.ul(b.taskListItem(b.p("<cursor>Hello")))],
        "cursor",
        "{Shift-Tab}",
        (b) => [b.p("Hello")],
        "Hello",
      );
    });

    test("`Tab` does nothing on the first task item", () => {
      expect(fx).toTransformInput(
        (b) => [b.ul(b.taskListItem(b.p("<cursor>Hello")), b.li(b.p("World")))],
        "cursor",
        "{Tab}",
        (b) => [b.ul(b.taskListItem(b.p("Hello")), b.li(b.p("World")))],
        "* [ ] Hello\n* World",
      );
    });
  });

  describe("parses DOM", () => {
    test("parses a checked task item", () => {
      expect(fx).toParseDOM(
        '<ul><li><span contenteditable="false"><input type="checkbox" checked></span><span><p>a</p></span></li></ul>',
        (b) => [b.ul(b.taskListItem({ checked: true }, b.p("a")))],
      );
    });

    test("parses an unchecked task item", () => {
      expect(fx).toParseDOM(
        '<ul><li><span contenteditable="false"><input type="checkbox"></span><span><p>a</p></span></li></ul>',
        (b) => [b.ul(b.taskListItem({ checked: false }, b.p("a")))],
      );
    });

    test("parses a task item with the checkbox as the first child", () => {
      expect(fx).toParseDOM(
        '<ul><li><input type="checkbox" checked><p>a</p></li></ul>',
        (b) => [b.ul(b.taskListItem({ checked: true }, b.p("a")))],
      );
    });

    test("parses a GitHub task list item", () => {
      expect(fx).toParseDOM(
        '<ul class="contains-task-list">\n<li class="task-list-item">\n<input type="checkbox" class="task-list-item-checkbox" checked disabled> a</li>\n</ul>',
        (b) => [b.ul(b.taskListItem({ checked: true }, b.p("a")))],
      );
    });

    test("parses a regular list item", () => {
      expect(fx).toParseDOM("<ul><li><p>a</p></li></ul>", (b) => [
        b.ul(b.li(b.p("a"))),
      ]);
    });

    test("parses a regular list item containing a nested task list", () => {
      expect(fx).toParseDOM(
        '<ul><li><p>a</p><ul><li><input type="checkbox" checked><p>b</p></li></ul></li></ul>',
        (b) => [
          b.ul(
            b.li(b.p("a"), b.ul(b.taskListItem({ checked: true }, b.p("b")))),
          ),
        ],
      );
    });

    test("parses a list with mixed task and regular items", () => {
      expect(fx).toParseDOM(
        '<ul><li><span contenteditable="false"><input type="checkbox" checked></span><span><p>a</p></span></li><li><p>b</p></li></ul>',
        (b) => [
          b.ul(b.taskListItem({ checked: true }, b.p("a")), b.li(b.p("b"))),
        ],
      );
    });

    test.each([true, false])(
      "parses its own rendered DOM with checked: %j",
      (checked) => {
        expect(fx).toParseDOM(renderedTaskList(checked), (b) => [
          b.ul(b.taskListItem({ checked }, b.p("a"))),
        ]);
      },
    );

    test.each([true, false])("renders DOM with checked: %j", (checked) => {
      expect(fx).toRenderDOM(
        (b) => [b.ul(b.taskListItem({ checked }, b.p("a")))],
        renderedTaskList(checked),
      );
    });
  });
});

describe("TaskListItemExtension input rules in other contexts", () => {
  const fx = createExtensionFixture(new TaskListItemExtension(), [
    new BlockquoteExtension(),
    new ListItemExtension(),
    new OrderedListExtension(),
    new UnorderedListExtension(),
  ]);

  test("converts an item of an ordered list", () => {
    expect(fx).toTransformInput(
      (b) => [b.ol(b.li(b.p("<cursor>Hello")), b.li(b.p("World")))],
      "cursor",
      "[[ ] X",
      (b) => [b.ol(b.taskListItem(b.p("XHello")), b.li(b.p("World")))],
      "1. [ ] XHello\n2. World",
    );
  });

  test("converts an item of a list in a blockquote", () => {
    expect(fx).toTransformInput(
      (b) => [
        b.blockquote(b.ul(b.li(b.p("<cursor>Hello")), b.li(b.p("World")))),
      ],
      "cursor",
      "[[ ] X",
      (b) => [
        b.blockquote(b.ul(b.taskListItem(b.p("XHello")), b.li(b.p("World")))),
      ],
      "> * [ ] XHello\n> * World",
    );
  });

  test("converts only the innermost item of a nested list", () => {
    expect(fx).toTransformInput(
      (b) => [
        b.ul(
          b.li(b.p("Hello"), b.ul(b.li(b.p("<cursor>World")))),
          b.li(b.p("Foo")),
        ),
      ],
      "cursor",
      "[[ ] X",
      (b) => [
        b.ul(
          b.li(b.p("Hello"), b.ul(b.taskListItem(b.p("XWorld")))),
          b.li(b.p("Foo")),
        ),
      ],
      "* Hello\n  * [ ] XWorld\n* Foo",
    );
  });
});

describe("TaskListItemExtension keymap applicability", () => {
  const fx = createExtensionFixture(new TaskListItemExtension(), [
    new UnorderedListExtension(),
    new ListItemExtension(),
  ]);

  test("`Backspace` applies at the start of a task list item", () => {
    expect(fx).toReportKeymapApplicability(
      (b) => [b.ul(b.taskListItem(b.p("<cursor>Hello")))],
      "cursor",
      "Backspace",
      true,
    );
  });

  test("`Backspace` does not apply in the middle of a task list item", () => {
    expect(fx).toReportKeymapApplicability(
      (b) => [b.ul(b.taskListItem(b.p("He<cursor>llo")))],
      "cursor",
      "Backspace",
      false,
    );
  });

  test("`Backspace` does not apply at the start of a non-first paragraph of a task list item", () => {
    expect(fx).toReportKeymapApplicability(
      (b) => [b.ul(b.taskListItem(b.p("Hello"), b.p("<cursor>World")))],
      "cursor",
      "Backspace",
      false,
    );
  });

  test("`Backspace` does not apply across a selection", () => {
    expect(fx).toReportKeymapApplicability(
      (b) => [b.ul(b.taskListItem(b.p("<from>He<to>llo")))],
      { anchor: "from", head: "to" },
      "Backspace",
      false,
    );
  });

  test("`Tab` applies to a regular item after a task item", () => {
    expect(fx).toReportKeymapApplicability(
      (b) => [b.ul(b.taskListItem(b.p("Hello")), b.li(b.p("<cursor>World")))],
      "cursor",
      "Tab",
      true,
    );
  });

  test("`Tab` does not apply outside a list", () => {
    expect(fx).toReportKeymapApplicability(
      (b) => [b.p("<cursor>Hello")],
      "cursor",
      "Tab",
      false,
    );
  });

  test("`Shift-Tab` applies to a regular item nested in a task item", () => {
    expect(fx).toReportKeymapApplicability(
      (b) => [
        b.ul(b.taskListItem(b.p("Hello"), b.ul(b.li(b.p("<cursor>World"))))),
      ],
      "cursor",
      "Shift-Tab",
      true,
    );
  });

  test("`Shift-Tab` does not apply outside a list", () => {
    expect(fx).toReportKeymapApplicability(
      (b) => [b.p("<cursor>Hello")],
      "cursor",
      "Shift-Tab",
      false,
    );
  });
});
