import { describe, expect, test } from "vitest";

import { BoldExtension } from "../../src/syntax-extensions/BoldExtension";
import { HorizontalRuleExtension } from "../../src/syntax-extensions/HorizontalRuleExtension";
import { ItalicExtension } from "../../src/syntax-extensions/ItalicExtension";
import { createExtensionFixture } from "../utils/fixture";
import "../utils/matchers";

describe("HorizontalRuleExtension", () => {
  const fx = createExtensionFixture(new HorizontalRuleExtension(), [
    new BoldExtension(),
    new ItalicExtension(),
  ]);

  test("handles the `thematicBreak` unist node", () => {
    expect(fx).toHandleUnistNode("thematicBreak");
  });

  test("provides the `horizontal_rule` ProseMirror node", () => {
    expect(fx).toProvideNode("horizontal_rule");
  });

  describe("matches unist nodes", () => {
    test("matches `thematicBreak`", () => {
      expect(fx).toMatchUnistNode({ type: "thematicBreak" });
    });

    test("does not match `horizontal_rule`", () => {
      expect(fx).not.toMatchUnistNode({ type: "horizontal_rule" });
    });

    test("does not match other nodes", () => {
      expect(fx).not.toMatchUnistNode({ type: "other" });
    });
  });

  test("converts unist -> ProseMirror", () => {
    expect(fx).toConvertUnistNode({ type: "thematicBreak" }, (b) => [b.hr()]);
  });

  test("matches a `horizontal_rule` ProseMirror node", () => {
    expect(fx).toMatchProseMirrorNode((b) => b.hr());
  });

  test("converts ProseMirror -> unist", () => {
    expect(fx).toConvertProseMirrorNode(
      (b) => b.hr(),
      [{ type: "thematicBreak" }],
    );
  });

  describe("keymap `Mod-_` inserts a horizontal rule", () => {
    test("empty document", () => {
      expect(fx).toSupportKeymap(
        () => [],
        "start",
        "{Mod-_}",
        (b) => [b.hr()],
        "---",
      );
    });

    test("cursor selection", () => {
      expect(fx).toSupportKeymap(
        (b) => [b.p("abcdef")],
        4,
        "{Mod-_}",
        (b) => [b.p("abc"), b.hr(), b.p("def")],
        "abc\n\n---\n\ndef",
      );
    });

    test("range selection", () => {
      expect(fx).toSupportKeymap(
        (b) => [b.p("abcdef")],
        { anchor: 3, head: 5 },
        "{Mod-_}",
        (b) => [b.p("ab"), b.hr(), b.p("ef")],
        "ab\n\n---\n\nef",
      );
    });
  });

  describe("input rules", () => {
    test.each([
      ["***{Enter}"],
      ["---{Enter}"],
      ["___{Enter}"],
      [" ***{Enter}"],
      ["  ***{Enter}"],
      ["   ***{Enter}"],
    ])("matches %j", (input) => {
      expect(fx).toApplyBlockInputRule(input, "\n\n---\n", (b) => [
        b.p(),
        b.hr(),
        b.p(),
      ]);
    });

    test("does not match `*-*`", () => {
      expect(fx).toIgnoreBlockInputRule("*-*{Enter}", "*-*\n", (b) => [
        b.p(b.em("-")),
        b.p(),
      ]);
    });

    test("does not match `*_*`", () => {
      expect(fx).toIgnoreBlockInputRule("*_*{Enter}", "*\\_*\n", (b) => [
        b.p(b.em("_")),
        b.p(),
      ]);
    });

    test("does not match `* **`", () => {
      expect(fx).toIgnoreBlockInputRule("* **{Enter}", "\\* \\*\\*\n", (b) => [
        b.p("* **"),
        b.p(),
      ]);
    });

    test("does not match `** *`", () => {
      expect(fx).toIgnoreBlockInputRule("** *{Enter}", "\\*\\* \\*\n", (b) => [
        b.p("** *"),
        b.p(),
      ]);
    });

    test("does not match `a***`", () => {
      expect(fx).toIgnoreBlockInputRule("a***{Enter}", "a\\*\\*\\*\n", (b) => [
        b.p("a***"),
        b.p(),
      ]);
    });

    test("does not match `***bold italic***`", () => {
      expect(fx).toIgnoreBlockInputRule(
        "***bold italic***",
        "**\\*bold italic**\\*",
        (b) => [b.p(b.strong("*bold italic"), "*")],
      );
    });
  });

  test("parses DOM", () => {
    expect(fx).toParseDOM("<hr>", (b) => [b.hr()]);
  });

  test("renders DOM", () => {
    expect(fx).toRenderDOM((b) => [b.hr()], "<div><hr></div>");
  });
});
