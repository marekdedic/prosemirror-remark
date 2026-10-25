import type { Plugin } from "prosemirror-state";

import { tests } from "commonmark-spec";
import { DOMSerializer, type Node as ProseMirrorNode } from "prosemirror-model";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { describe, expect, test } from "vitest";
import {
  parseHTML,
  type ProseMirrorEditor,
  renderProseMirror,
} from "vitest-prosemirror";

import { CodeBlockExtension } from "../../src/syntax-extensions/CodeBlockExtension";
import { createExtensionFixture } from "../utils/fixture";

interface Attrs {
  lang: string | null;
  meta: string | null;
}

const fx = createExtensionFixture(new CodeBlockExtension());
const parser = unified().use(remarkParse);

function commonMarkFence(line: string): Attrs | null {
  const { children } = parser.parse(`${line}\n`);
  const [node] = children;
  if (children.length !== 1 || node.type !== "code" || node.value !== "") {
    return null;
  }
  return { lang: node.lang ?? null, meta: node.meta ?? null };
}

function enter(line: string): ProseMirrorNode | null {
  const editor = renderProseMirror(
    fx.b.doc(fx.b.p(line)) as unknown as ProseMirrorNode,
    {
      editorProps: {
        plugins: [fx.pmu.inputRulesPlugin(), fx.pmu.keymapPlugin()],
      },
    },
  );
  editor.setSelection("end");
  editor.type("{Enter}");
  return editor.doc.firstChild;
}

function handleTextInput(
  editor: ProseMirrorEditor,
  plugin: Plugin,
  from: number,
  to: number,
  text: string,
): boolean {
  return editor.command((state, _dispatch, view) =>
    view === undefined
      ? false
      : (plugin.props.handleTextInput?.call(
          plugin,
          view,
          from,
          to,
          text,
          () => state.tr,
        ) ?? false),
  );
}

const lines = [
  ...new Set(
    tests
      .filter((example) => example.section === "Fenced code blocks")
      .map((example) => example.markdown.split("\n")[0]),
  ),
  "```js title=a.js",
  "~~~ ~foo bar",
  "~~~ a`b c",
  "``` a`b",
  "```js ```",
  "~~~js ~~~",
  "```a&amp;b",
  "```c\\#",
  "```js x",
  "```js\tx",
  "\t```js",
  " ```js",
];
const typeable = /^ {0,3}(?:`{3,}|~{3,})[^ \t]*$/u;
const isTypeableFence = (line: string): boolean =>
  typeable.test(line) && commonMarkFence(line) !== null;
const fenceLines = lines.filter((line) => isTypeableFence(line));
const otherLines = lines.filter((line) => !isTypeableFence(line));

const awkwardValues: Array<Attrs> = [
  { lang: "a&amp;b", meta: null },
  { lang: "a&b", meta: null },
  { lang: "&lt;", meta: null },
  { lang: "a\\_b", meta: null },
  { lang: "a\\b", meta: null },
  { lang: "a`b", meta: null },
  { lang: "a~b", meta: null },
  { lang: "~foo", meta: null },
  { lang: "js x", meta: null },
  { lang: "c#", meta: null },
  { lang: "日本語", meta: null },
  { lang: "js", meta: 'title="&lt;x"' },
  { lang: "js", meta: "a`b" },
  { lang: "js", meta: "a\nb" },
  { lang: "js", meta: "x  " },
  { lang: "js", meta: "&#x60;" },
  { lang: "js", meta: "a\\*b" },
];

describe("CodeBlockExtension info string", () => {
  test.each([
    ["at the end of the paragraph", 6, true],
    ["inside the paragraph", 4, false],
  ])(
    "`Enter` in a fence line %s is guarded only at the end",
    (_, pos, guarded) => {
      const plugin = fx.pmu.inputRulesPlugin();
      const editor = renderProseMirror(
        fx.b.doc(fx.b.p("```js")) as unknown as ProseMirrorNode,
        { editorProps: { plugins: [plugin] } },
      );
      editor.setSelection(pos);

      expect(handleTextInput(editor, plugin, pos, pos, "\n")).toBe(guarded);
    },
  );

  test("text ending in a space inserted in one go converts the fence", () => {
    const plugin = fx.pmu.inputRulesPlugin();
    const editor = renderProseMirror(
      fx.b.doc(fx.b.p("```")) as unknown as ProseMirrorNode,
      { editorProps: { plugins: [plugin] } },
    );
    editor.setSelection("end");

    handleTextInput(editor, plugin, 4, 4, "js ");

    expect(editor.doc.firstChild?.type.name).toBe("code_block");
    expect({ ...editor.doc.firstChild?.attrs }).toStrictEqual({
      lang: "js",
      meta: null,
    });
  });

  test("an input method replacing a range in a fence line is left to the default handling", () => {
    const plugin = fx.pmu.inputRulesPlugin();
    const editor = renderProseMirror(
      fx.b.doc(fx.b.p("```js_teh")) as unknown as ProseMirrorNode,
      { editorProps: { plugins: [plugin] } },
    );
    editor.setSelection("end");
    const before = editor.doc;

    const handled = handleTextInput(editor, plugin, 7, 10, "the");

    expect(handled).toBe(false);
    expect(editor.doc.eq(before)).toBe(true);
  });

  test("an input method replacing a range is left to the default handling by the four-space rule", () => {
    const plugin = fx.pmu.inputRulesPlugin();
    const editor = renderProseMirror(
      fx.b.doc(fx.b.p("   x")) as unknown as ProseMirrorNode,
      { editorProps: { plugins: [plugin] } },
    );
    editor.setSelection("end");
    const before = editor.doc;

    const handled = handleTextInput(editor, plugin, 4, 5, " ");

    expect(handled).toBe(false);
    expect(editor.doc.eq(before)).toBe(true);
  });

  test.each(fenceLines)(
    "`Enter` after %j converts it as CommonMark reads it",
    (line) => {
      const node = enter(line);

      expect(node?.type.name).toBe("code_block");
      expect({ ...node?.attrs }).toStrictEqual(commonMarkFence(line));
    },
  );

  test.each(otherLines)(
    "`Enter` after %j, which CommonMark doesn't read as a fence followed by at most one word, does not convert it",
    (line) => {
      expect(enter(line)?.type.name).toBe("paragraph");
    },
  );

  test.each(awkwardValues)("%o round-trips through Markdown", (attrs) => {
    const doc = fx.b.doc(
      fx.b.code_block(attrs, "x"),
    ) as unknown as ProseMirrorNode;

    expect({
      ...fx.pmu.parse(fx.pmu.serialize(doc)).firstChild?.attrs,
    }).toStrictEqual(attrs);
  });

  test.each(awkwardValues)("%o round-trips through HTML", (attrs) => {
    const node = fx.resolveNodes(fx.b.code_block(attrs, "x"))[0];
    const container = document.createElement("div");
    container.appendChild(
      DOMSerializer.fromSchema(fx.schema).serializeNode(node),
    );

    expect({
      ...parseHTML(container.innerHTML, fx.schema).firstChild?.attrs,
    }).toStrictEqual(attrs);
  });
});
