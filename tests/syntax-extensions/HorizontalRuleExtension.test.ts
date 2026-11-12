import { describe, expect, test } from "vitest";

import { BoldExtension } from "../../src/syntax-extensions/BoldExtension";
import { HorizontalRuleExtension } from "../../src/syntax-extensions/HorizontalRuleExtension";
import { InlineCodeExtension } from "../../src/syntax-extensions/InlineCodeExtension";
import { ItalicExtension } from "../../src/syntax-extensions/ItalicExtension";
import { createExtensionFixture } from "../utils/fixture";
import "../utils/matchers";

describe("HorizontalRuleExtension", () => {
  const fx = createExtensionFixture(new HorizontalRuleExtension(), [
    new BoldExtension(),
    new ItalicExtension(),
  ]);
  const fxWithInlineCode = createExtensionFixture(
    new HorizontalRuleExtension(),
    [new InlineCodeExtension()],
  );

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
      expect(fx).toTransformInput(
        () => [],
        "start",
        "{Mod-_}",
        (b) => [b.hr()],
        "---",
      );
    });

    test("cursor selection", () => {
      expect(fx).toTransformInput(
        (b) => [b.p("abc<cursor>def")],
        "cursor",
        "{Mod-_}",
        (b) => [b.p("abc"), b.hr(), b.p("def")],
        "abc\n\n---\n\ndef",
      );
    });

    test("range selection", () => {
      expect(fx).toTransformInput(
        (b) => [b.p("ab<from>cd<to>ef")],
        { anchor: "from", head: "to" },
        "{Mod-_}",
        (b) => [b.p("ab"), b.hr(), b.p("ef")],
        "ab\n\n---\n\nef",
      );
    });
  });

  test("keymap `Mod-_` reports applicability", () => {
    expect(fx).toReportKeymapApplicability(
      (b) => [b.p("abc<cursor>def")],
      "cursor",
      "Mod-_",
      true,
    );
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
      expect(fx).toTransformBlockInput(input, (b) => [b.hr(), b.p()], "---\n");
    });

    test("the cursor moves to the paragraph after the rule", () => {
      expect(fx).toTransformBlockInput(
        "---{Enter}a",
        (b) => [b.hr(), b.p("a")],
        "---\n\na",
      );
    });

    test("`Enter` in the middle of the line splits it", () => {
      expect(fx).toTransformInput(
        (b) => [b.p("---<cursor>a")],
        "cursor",
        "{Enter}",
        (b) => [b.p("---"), b.p("a")],
        "\\---\n\na",
      );
    });

    test("does not match `*-*`", () => {
      expect(fx).toTransformBlockInput(
        "*-*{Enter}",
        (b) => [b.p(b.em("-")), b.p()],
        "*-*\n",
      );
    });

    test("does not match `*_*`", () => {
      expect(fx).toTransformBlockInput(
        "*_*{Enter}",
        (b) => [b.p(b.em("_")), b.p()],
        "*\\_*\n",
      );
    });

    test("does not match `* **`", () => {
      expect(fx).toTransformBlockInput(
        "* **{Enter}",
        (b) => [b.p("* **"), b.p()],
        "\\* \\*\\*\n",
      );
    });

    test("does not match `** *`", () => {
      expect(fx).toTransformBlockInput(
        "** *{Enter}",
        (b) => [b.p("** *"), b.p()],
        "\\*\\* \\*\n",
      );
    });

    test("does not match `a***`", () => {
      expect(fx).toTransformBlockInput(
        "a***{Enter}",
        (b) => [b.p("a***"), b.p()],
        "a\\*\\*\\*\n",
      );
    });

    test("does not match `***bold italic***`", () => {
      expect(fx).toTransformBlockInput(
        "***bold italic***",
        (b) => [b.p(b.strong("*bold italic"), "*")],
        "**\\*bold italic**\\*",
      );
    });

    test.each([["***"], ["---"], ["___"]])(
      "inline code %j followed by `Enter` stays inline code",
      (line) => {
        expect(fxWithInlineCode).toTransformInput(
          (b) => [b.p(b.code(line), "<cursor>")],
          "cursor",
          "{Enter}a",
          (b) => [b.p(b.code(line)), b.p("a")],
          `\`${line}\`\n\na`,
        );
      },
    );
  });

  test("parses DOM", () => {
    expect(fx).toParseDOM("<hr>", (b) => [b.hr()]);
  });

  test("renders DOM", () => {
    expect(fx).toRenderDOM((b) => [b.hr()], "<div><hr></div>");
  });
});
