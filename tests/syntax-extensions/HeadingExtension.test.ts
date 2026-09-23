import { describe, expect, test } from "vitest";

import { HeadingExtension } from "../../src/syntax-extensions/HeadingExtension";
import { createExtensionFixture } from "../utils/fixture";
import "../utils/matchers";

describe("HeadingExtension", () => {
  const fx = createExtensionFixture(new HeadingExtension());

  test("handles the `heading` unist node", () => {
    expect(fx).toHandleUnistNode("heading");
  });

  test("provides the `heading` ProseMirror node", () => {
    expect(fx).toProvideNode("heading");
  });

  describe("matches unist nodes", () => {
    test.each([[1], [3], [6]])("matches `heading` depth %i", (depth) => {
      expect(fx).toMatchUnistNode({ children: [], depth, type: "heading" });
    });

    test("matches a `heading` with children", () => {
      expect(fx).toMatchUnistNode({
        children: [{ type: "text", value: "Hello World!" }],
        depth: 3,
        type: "heading",
      });
    });

    test("does not match other nodes", () => {
      expect(fx).not.toMatchUnistNode({ type: "other" });
    });
  });

  describe("converts unist -> ProseMirror", () => {
    test.each([[1], [3], [6]])("depth %i", (depth) => {
      expect(fx).toConvertUnistNode(
        {
          children: [{ type: "text", value: "Hello World!" }],
          depth,
          type: "heading",
        },
        (b) => [b.heading({ level: depth }, "Hello World!")],
      );
    });
  });

  describe("matches ProseMirror nodes", () => {
    test.each([[1], [3], [6]])("matches `heading` level %i", (level) => {
      expect(fx).toMatchProseMirrorNode((b) => b.heading({ level }));
    });

    test("matches a `heading` with content", () => {
      expect(fx).toMatchProseMirrorNode((b) =>
        b.heading({ level: 3 }, "Hello World!"),
      );
    });
  });

  describe("converts ProseMirror -> unist", () => {
    test("empty heading", () => {
      expect(fx).toConvertProseMirrorNode(
        (b) => b.heading({ level: 4 }),
        [{ children: [], depth: 4, type: "heading" }],
      );
    });

    test.each([[1], [3], [6]])("depth %i with content", (depth) => {
      expect(fx).toConvertProseMirrorNode(
        (b) => b.heading({ level: depth }, "Hello World!"),
        [
          {
            children: [{ type: "text", value: "Hello World!" }],
            depth,
            type: "heading",
          },
        ],
      );
    });
  });

  describe("keymap `#` increases the level", () => {
    test.each([
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
    ])("level %i -> %i", (from, to) => {
      expect(fx).toSupportKeymap(
        (b) => [b.heading({ level: from }, "Hello")],
        "start",
        "#",
        (b) => [b.heading({ level: to }, "Hello")],
        `${"#".repeat(to)} Hello`,
      );
    });

    test("level 6 is capped and inserts a literal `#`", () => {
      expect(fx).toSupportKeymap(
        (b) => [b.heading({ level: 6 }, "Hello")],
        "start",
        "#",
        (b) => [b.heading({ level: 6 }, "#Hello")],
        "###### #Hello",
      );
    });
  });

  describe("keymap `Shift-Tab` decreases the level", () => {
    test("level 2 -> 1", () => {
      expect(fx).toSupportKeymap(
        (b) => [b.heading({ level: 2 }, "Hello")],
        "start",
        "{Shift-Tab}",
        (b) => [b.heading({ level: 1 }, "Hello")],
        "# Hello",
      );
    });

    test("level 1 -> paragraph", () => {
      expect(fx).toSupportKeymap(
        (b) => [b.heading({ level: 1 }, "Hello")],
        "start",
        "{Shift-Tab}",
        (b) => [b.p("Hello")],
        "Hello",
      );
    });
  });

  describe("reports keymap applicability", () => {
    test("Shift-Tab applies inside a heading", () => {
      expect(fx).toReportKeymapApplicability(
        (b) => [b.heading({ level: 2 }, "<cursor>Hello")],
        "cursor",
        "Shift-Tab",
        true,
      );
    });

    test("# applies at the start of a heading", () => {
      expect(fx).toReportKeymapApplicability(
        (b) => [b.heading({ level: 2 }, "<cursor>Hello")],
        "cursor",
        "#",
        true,
      );
    });

    test("# does not apply in the middle of a heading", () => {
      expect(fx).toReportKeymapApplicability(
        (b) => [b.heading({ level: 2 }, "He<cursor>llo")],
        "cursor",
        "#",
        false,
      );
    });

    test("Backspace applies at the start of a heading", () => {
      expect(fx).toReportKeymapApplicability(
        (b) => [b.heading({ level: 2 }, "<cursor>Hello")],
        "cursor",
        "Backspace",
        true,
      );
    });

    test("Backspace does not apply in the middle of a heading", () => {
      expect(fx).toReportKeymapApplicability(
        (b) => [b.heading({ level: 2 }, "He<cursor>llo")],
        "cursor",
        "Backspace",
        false,
      );
    });

    test("# does not apply across a selection", () => {
      expect(fx).toReportKeymapApplicability(
        (b) => [b.heading({ level: 2 }, "H<from>el<to>lo")],
        { anchor: "from", head: "to" },
        "#",
        false,
      );
    });
  });

  describe("input rules", () => {
    test.each([[1], [2], [3], [4], [5], [6]])("level %i from `#`", (level) => {
      const hashes = "#".repeat(level);

      expect(fx).toApplyBlockInputRule(
        `${hashes} Hello World!`,
        `${hashes} Hello World!`,
        (b) => [b.heading({ level }, "Hello World!")],
      );
    });

    test.each([[" "], ["  "], ["   "]])(
      "level 1 tolerating %j leading spaces",
      (prefix) => {
        expect(fx).toApplyBlockInputRule(
          `${prefix}# Hello World!`,
          "# Hello World!",
          (b) => [b.heading({ level: 1 }, "Hello World!")],
        );
      },
    );

    test("rejects seven `#`", () => {
      expect(fx).toIgnoreBlockInputRule(
        "####### Hello World!",
        "\\####### Hello World!",
      );
    });
  });

  describe("DOM", () => {
    test.each([[1], [3], [6]])("parses <h%i>", (level) => {
      const tag = `h${String(level)}`;

      expect(fx).toParseDOM(`<${tag}>Hello</${tag}>`, (b) => [
        b.heading({ level }, "Hello"),
      ]);
    });

    test.each([[1], [4]])("renders level %i", (level) => {
      const tag = `h${String(level)}`;

      expect(fx).toRenderDOM(
        (b) => [b.heading({ level }, "Hello")],
        `<${tag}>Hello</${tag}>`,
      );
    });
  });
});
