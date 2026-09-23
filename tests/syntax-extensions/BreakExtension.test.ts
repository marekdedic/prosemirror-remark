import { ProseMirrorUnified } from "prosemirror-unified";
import { afterEach, describe, expect, test, vi } from "vitest";

import { BreakExtension } from "../../src/syntax-extensions/BreakExtension";
import { ParagraphExtension } from "../../src/syntax-extensions/ParagraphExtension";
import { RootExtension } from "../../src/syntax-extensions/RootExtension";
import { TextExtension } from "../../src/syntax-extensions/TextExtension";
import { createExtensionFixture } from "../utils/fixture";
import { ParserProviderExtension } from "../utils/ParserProviderExtension";
import "../utils/matchers";

/*
 * The Ctrl-Enter binding depends on a global, so it can't be expressed through
 * the tester - the keymap has to be built with navigator stubbed.
 */
function keymapKeys(): Array<string> {
  const pmu = new ProseMirrorUnified([
    new ParserProviderExtension(),
    new RootExtension(),
    new ParagraphExtension(),
    new TextExtension(),
    new BreakExtension(),
  ]);
  return Object.keys(new BreakExtension().proseMirrorKeymap(pmu.schema()));
}

describe("BreakExtension keymap", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("Binds Ctrl-Enter on a Mac", () => {
    expect.assertions(1);

    vi.stubGlobal("navigator", { platform: "MacIntel" });

    expect(keymapKeys()).toStrictEqual([
      "Mod-Enter",
      "Shift-Enter",
      "Ctrl-Enter",
    ]);
  });

  test("Binds Ctrl-Enter on an iPhone", () => {
    expect.assertions(1);

    vi.stubGlobal("navigator", { platform: "iPhone" });

    expect(keymapKeys()).toContain("Ctrl-Enter");
  });

  test("Doesn't bind Ctrl-Enter off a Mac", () => {
    expect.assertions(1);

    vi.stubGlobal("navigator", { platform: "Linux x86_64" });

    expect(keymapKeys()).toStrictEqual(["Mod-Enter", "Shift-Enter"]);
  });

  test("Doesn't bind Ctrl-Enter without a navigator", () => {
    expect.assertions(1);

    vi.stubGlobal("navigator", undefined);

    expect(keymapKeys()).toStrictEqual(["Mod-Enter", "Shift-Enter"]);
  });
});

describe("BreakExtension", () => {
  const fx = createExtensionFixture(new BreakExtension());

  test("handles the `break` unist node", () => {
    expect(fx).toHandleUnistNode("break");
  });

  test("provides the `hard_break` ProseMirror node", () => {
    expect(fx).toProvideNode("hard_break");
  });

  describe("matches unist nodes", () => {
    test("matches `break`", () => {
      expect(fx).toMatchUnistNode({ type: "break" });
    });

    test("does not match `hard_break`", () => {
      expect(fx).not.toMatchUnistNode({ type: "hard_break" });
    });

    test("does not match other nodes", () => {
      expect(fx).not.toMatchUnistNode({ type: "other" });
    });
  });

  test("converts unist -> ProseMirror", () => {
    expect(fx).toConvertUnistNode({ type: "break" }, (b) => [b.br()]);
  });

  test("matches a `hard_break` ProseMirror node", () => {
    expect(fx).toMatchProseMirrorNode((b) => b.br());
  });

  test("converts ProseMirror -> unist", () => {
    expect(fx).toConvertProseMirrorNode((b) => b.br(), [{ type: "break" }]);
  });

  test("keymap `Mod-Enter` inserts a hard break", () => {
    expect(fx).toSupportKeymap(
      (b) => [b.p("Hello")],
      3,
      "{Mod-Enter}",
      (b) => [b.p("He", b.br(), "llo")],
      "He\\\nllo",
    );
  });

  test("parses DOM", () => {
    expect(fx).toParseDOM("<p>Hello<br>World</p>", (b) => [
      b.p("Hello", b.br(), "World"),
    ]);
  });

  test("renders DOM", () => {
    expect(fx).toRenderDOM(
      (b) => [b.p("Hello", b.br(), "World")],
      "<p>Hello<br>World</p>",
    );
  });
});
