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
      expect(fx).toTransformInput(
        (b) => [b.p()],
        "end",
        input,
        (b) => [b.p(), b.hr(), b.p()],
        "\n\n---\n",
      );
    });

    test("does not match `*-*`", () => {
      expect(fx).toTransformInput(
        (b) => [b.p()],
        "end",
        "*-*{Enter}",
        (b) => [b.p(b.em("-")), b.p()],
        "*-*\n",
      );
    });

    test("does not match `*_*`", () => {
      expect(fx).toTransformInput(
        (b) => [b.p()],
        "end",
        "*_*{Enter}",
        (b) => [b.p(b.em("_")), b.p()],
        "*\\_*\n",
      );
    });

    test("does not match `* **`", () => {
      expect(fx).toTransformInput(
        (b) => [b.p()],
        "end",
        "* **{Enter}",
        (b) => [b.p("* **"), b.p()],
        "\\* \\*\\*\n",
      );
    });

    test("does not match `** *`", () => {
      expect(fx).toTransformInput(
        (b) => [b.p()],
        "end",
        "** *{Enter}",
        (b) => [b.p("** *"), b.p()],
        "\\*\\* \\*\n",
      );
    });

    test("does not match `a***`", () => {
      expect(fx).toTransformInput(
        (b) => [b.p()],
        "end",
        "a***{Enter}",
        (b) => [b.p("a***"), b.p()],
        "a\\*\\*\\*\n",
      );
    });

    test("does not match `***bold italic***`", () => {
      expect(fx).toTransformInput(
        (b) => [b.p()],
        "end",
        "***bold italic***",
        (b) => [b.p(b.strong("*bold italic"), "*")],
        "**\\*bold italic**\\*",
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
