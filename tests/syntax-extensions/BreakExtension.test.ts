import { ProseMirrorUnified } from "prosemirror-unified";
import { afterEach, describe, expect, test, vi } from "vitest";

import { BreakExtension } from "../../src/syntax-extensions/BreakExtension";
import { NodeExtensionTester } from "../utils/NodeExtensionTester";
import { ParagraphExtension } from "../utils/ParagraphExtension";
import { ParserProviderExtension } from "../utils/ParserProviderExtension";
import { RootExtension } from "../utils/RootExtension";
import { TextExtension } from "../utils/TextExtension";

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

new NodeExtensionTester(new BreakExtension(), {
  proseMirrorNodeName: "hard_break",
  unistNodeName: "break",
})
  .shouldMatchUnistNode({ type: "break" })
  .shouldNotMatchUnistNode({ type: "hard_break" })
  .shouldNotMatchUnistNode({ type: "other" })
  .shouldConvertUnistNode({ type: "break" }, (schema) => [
    schema.nodes["hard_break"].create(),
  ])
  .shouldMatchProseMirrorNode((schema) => schema.nodes["hard_break"].create())
  .shouldConvertProseMirrorNode(
    (schema) => schema.nodes["hard_break"].create(),
    [{ type: "break" }],
  )
  .shouldSupportKeymap(
    (schema) => [schema.nodes["paragraph"].create({}, [schema.text("Hello")])],
    3,
    "{Enter}",
    { ctrlKey: true },
    (schema) => [
      schema.nodes["paragraph"].create({}, [
        schema.text("He"),
        schema.nodes["hard_break"].create(),
        schema.text("llo"),
      ]),
    ],
    "He\\\nllo",
  )
  .shouldParseDOM("<p>Hello<br>World</p>", (schema) => [
    schema.nodes["paragraph"].create({}, [
      schema.text("Hello"),
      schema.nodes["hard_break"].create(),
      schema.text("World"),
    ]),
  ])
  .shouldRenderDOM(
    (schema) => [
      schema.nodes["paragraph"].create({}, [
        schema.text("Hello"),
        schema.nodes["hard_break"].create(),
        schema.text("World"),
      ]),
    ],
    "<p>Hello<br>World</p>",
  )
  .test();
