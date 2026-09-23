import { describe, expect, test } from "vitest";

import { ListItemExtension } from "../../src/syntax-extensions/ListItemExtension";
import { TaskListItemExtension } from "../../src/syntax-extensions/TaskListItemExtension";
import { UnorderedListExtension } from "../../src/syntax-extensions/UnorderedListExtension";
import { createExtensionFixture } from "../utils/fixture";
import "../utils/matchers";

// TODO: Add input rule tests
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

    test("regular list item (again)", () => {
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
  });

  describe("keymap", () => {
    test("`Backspace` turns a task item into a regular item", () => {
      expect(fx).toSupportKeymap(
        (b) => [
          b.ul(b.taskListItem(b.p("Hello")), b.taskListItem(b.p("World"))),
        ],
        0,
        "{Backspace}",
        (b) => [b.ul(b.li(b.p("Hello")), b.taskListItem(b.p("World")))],
        "* Hello\n* [ ] World",
      );
    });

    test("`Backspace` in the middle of a task item deletes a character", () => {
      expect(fx).toSupportKeymap(
        (b) => [b.ul(b.taskListItem(b.p("Hello")))],
        5,
        "{Backspace}",
        (b) => [b.ul(b.taskListItem(b.p("Hllo")))],
        "* [ ] Hllo",
      );
    });

    test("`Backspace` at the start of a regular item is left to other bindings", () => {
      expect(fx).toSupportKeymap(
        (b) => [b.ul(b.li(b.p("Hello")), b.li(b.p("World")))],
        10,
        "{Backspace}",
        (b) => [b.ul(b.li(b.p("Hello"), b.p("World")))],
        "* Hello\n\n  World",
      );
    });
  });
});

describe("TaskListItemExtension keymap applicability", () => {
  const fx = createExtensionFixture(new TaskListItemExtension(), [
    new UnorderedListExtension(),
    new ListItemExtension(),
  ]);

  test("`Backspace` does not apply across a selection", () => {
    expect(fx).toReportKeymapApplicability(
      (b) => [b.ul(b.taskListItem(b.p("Hello")))],
      { from: 3, to: 5 },
      "Backspace",
      false,
    );
  });
});
