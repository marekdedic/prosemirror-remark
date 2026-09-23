import {
  DOMSerializer,
  Fragment,
  type Mark,
  type Node as ProseMirrorNode,
} from "prosemirror-model";
import {
  MarkExtension,
  NodeExtension,
  type SyntaxExtension,
} from "prosemirror-unified";
import {
  expect,
  type MatcherState,
  type MockInstance,
  type SyncMatcherResult,
  vi,
} from "vitest";
import {
  parseHTML,
  renderProseMirror,
  type TesterSelection,
} from "vitest-prosemirror";

import type {
  BuiltNode,
  ExtensionFixture,
  TestBuilders,
  UnistLike,
} from "./fixture";

type Build<T> = (b: TestBuilders) => T;

function assertMarkExtension(
  extension: SyntaxExtension<UnistLike>,
): asserts extension is MarkExtension<UnistLike> {
  if (!(extension instanceof MarkExtension)) {
    throw new Error(
      `Expected a MarkExtension but got ${extension.constructor.name}`,
    );
  }
}

function assertNodeExtension(
  extension: SyntaxExtension<UnistLike>,
): asserts extension is NodeExtension<UnistLike> {
  if (!(extension instanceof NodeExtension)) {
    throw new Error(
      `Expected a NodeExtension but got ${extension.constructor.name}`,
    );
  }
}

function nodesEqual(
  actual: ProseMirrorNode,
  expected: ProseMirrorNode,
): SyncMatcherResult {
  try {
    expect(actual).toEqualProseMirrorNode(expected);
    return {
      message: () => "expected ProseMirror nodes to differ",
      pass: true,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { message: () => message, pass: false };
  }
}

function noWarningsLogged(
  warn: MockInstance,
  ctx: MatcherState,
): SyncMatcherResult {
  return {
    message: () =>
      `expected console.warn not to have been called, but it was called with\n${ctx.utils.printReceived(
        warn.mock.calls,
      )}`,
    pass: warn.mock.calls.length === 0,
  };
}

expect.extend({
  toConvertProseMirrorNode(
    this: MatcherState,
    fx: ExtensionFixture<UnistLike>,
    source: Build<BuiltNode>,
    target: Array<UnistLike>,
  ): SyncMatcherResult {
    const actual = fx.convertProseMirrorNode(fx.resolveNodes(source(fx.b))[0]);
    return {
      actual,
      expected: target,
      message: () => "expected ProseMirror -> unist conversion to match",
      pass: this.equals(actual, target, undefined, true),
    };
  },

  toConvertUnistNode(
    this: MatcherState,
    fx: ExtensionFixture<UnistLike>,
    source: UnistLike,
    target: Build<Array<BuiltNode>>,
    injectNodes: Array<UnistLike> = [],
  ): SyncMatcherResult {
    const context: Record<string, unknown> = {};
    for (const node of injectNodes) {
      fx.convertUnistNode(node, context);
    }
    const actual = fx.convertUnistNode(source, context);
    fx.extension.postUnistToProseMirrorHook(context);
    const expected = fx.resolveNodes(target(fx.b));
    return {
      actual,
      expected,
      message: () => "expected unist -> ProseMirror conversion to match",
      pass: this.equals(actual, expected, undefined, true),
    };
  },

  toHandleUnistNode(
    this: MatcherState,
    fx: ExtensionFixture<UnistLike>,
    name: string,
  ): SyncMatcherResult {
    const actual = fx.extension.unistNodeName();
    return {
      actual,
      expected: name,
      message: () => `expected handled unist node to be "${name}"`,
      pass: actual === name,
    };
  },

  toMatchProseMirrorMark(
    this: MatcherState,
    fx: ExtensionFixture<UnistLike>,
    mark: Build<Mark>,
  ): SyncMatcherResult {
    const { extension } = fx;
    assertMarkExtension(extension);
    const markName = extension.proseMirrorMarkName();
    const built = mark(fx.b);
    return {
      message: () =>
        `expected mark ${built.type.name} ${this.isNot ? "not " : ""}to be ${String(markName)}`,
      pass: built.type.name === markName,
    };
  },

  toMatchProseMirrorNode(
    this: MatcherState,
    fx: ExtensionFixture<UnistLike>,
    node: Build<BuiltNode>,
  ): SyncMatcherResult {
    const { extension } = fx;
    assertNodeExtension(extension);
    return {
      message: () =>
        `expected the extension ${this.isNot ? "not " : ""}to match the ProseMirror node`,
      pass: extension.proseMirrorToUnistTest(fx.resolveNodes(node(fx.b))[0]),
    };
  },

  toMatchUnistNode(
    this: MatcherState,
    fx: ExtensionFixture<UnistLike>,
    node: UnistLike,
  ): SyncMatcherResult {
    return {
      message: () =>
        `expected the extension ${this.isNot ? "not " : ""}to match unist node ${this.utils.printReceived(node)}`,
      pass: fx.extension.unistToProseMirrorTest(node),
    };
  },

  toParseDOM(
    this: MatcherState,
    fx: ExtensionFixture<UnistLike>,
    html: string,
    target: Build<Array<BuiltNode>>,
  ): SyncMatcherResult {
    const actual = parseHTML(html, fx.schema);
    const expected = fx.schema.nodes["doc"].create(
      {},
      fx.resolveNodes(target(fx.b)),
    );
    return nodesEqual(actual, expected);
  },

  toProvideMark(
    this: MatcherState,
    fx: ExtensionFixture<UnistLike>,
    name: string | null,
  ): SyncMatcherResult {
    const { extension } = fx;
    assertMarkExtension(extension);
    const actual = extension.proseMirrorMarkName();
    return {
      actual,
      expected: name,
      message: () => `expected provided mark to be ${String(name)}`,
      pass: actual === name,
    };
  },

  toProvideNode(
    this: MatcherState,
    fx: ExtensionFixture<UnistLike>,
    name: string | null,
  ): SyncMatcherResult {
    const { extension } = fx;
    assertNodeExtension(extension);
    const actual = extension.proseMirrorNodeName();
    return {
      actual,
      expected: name,
      message: () => `expected provided node to be ${String(name)}`,
      pass: actual === name,
    };
  },

  toRenderDOM(
    this: MatcherState,
    fx: ExtensionFixture<UnistLike>,
    source: Build<Array<BuiltNode>>,
    html: string,
  ): SyncMatcherResult {
    const container = document.createElement("div");
    container.appendChild(
      DOMSerializer.fromSchema(fx.schema).serializeFragment(
        Fragment.from(fx.resolveNodes(source(fx.b))),
      ),
    );
    return {
      actual: container.innerHTML,
      expected: html,
      message: () => "expected DOM rendering to match",
      pass: container.innerHTML === html,
    };
  },

  toReportKeymapApplicability(
    this: MatcherState,
    fx: ExtensionFixture<UnistLike>,
    nodes: Build<Array<BuiltNode>>,
    selection: TesterSelection,
    key: string,
    applicable: boolean,
  ): SyncMatcherResult {
    const doc = fx.b.doc(...nodes(fx.b)) as unknown as ProseMirrorNode;
    const editor = renderProseMirror(doc);
    editor.setSelection(selection);

    const command = fx.extension.proseMirrorKeymap(fx.schema)[key];
    // Invoked without dispatch, the command must only report applicability.
    if (command(editor.state) !== applicable) {
      return {
        actual: !applicable,
        expected: applicable,
        message: () =>
          `expected keymap applicability to be ${String(applicable)}`,
        pass: false,
      };
    }
    return nodesEqual(editor.doc, doc);
  },

  toTransformInput(
    this: MatcherState,
    fx: ExtensionFixture<UnistLike>,
    before: Build<Array<BuiltNode>>,
    selection: TesterSelection,
    editorInput: string,
    after: Build<Array<BuiltNode>>,
    markdownOutput: string,
  ): SyncMatcherResult {
    const docAfter = fx.schema.nodes["doc"].create(
      {},
      fx.resolveNodes(after(fx.b)),
    );

    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const editor = renderProseMirror(
      fx.b.doc(...before(fx.b)) as unknown as ProseMirrorNode,
      {
        editorProps: {
          plugins: [fx.pmu.inputRulesPlugin(), fx.pmu.keymapPlugin()],
        },
      },
    );
    editor.setSelection(selection);
    editor.type(editorInput);

    const nodes = nodesEqual(editor.doc, docAfter);
    if (!nodes.pass) {
      return nodes;
    }
    const serialized = fx.pmu.serialize(editor.doc).replace(/\n$/gu, "");
    if (serialized !== markdownOutput) {
      return {
        message: () =>
          `expected serialisation\n${this.utils.printReceived(
            serialized,
          )}\nto equal\n${this.utils.printExpected(markdownOutput)}`,
        pass: false,
      };
    }
    return noWarningsLogged(warn, this);
  },
});

interface ExtensionMatchers<R> {
  toConvertProseMirrorNode(
    source: Build<BuiltNode>,
    target: Array<UnistLike>,
  ): R;
  toConvertUnistNode(
    source: UnistLike,
    target: Build<Array<BuiltNode>>,
    injectNodes?: Array<UnistLike>,
  ): R;
  toHandleUnistNode(name: string): R;
  toMatchProseMirrorMark(mark: Build<Mark>): R;
  toMatchProseMirrorNode(node: Build<BuiltNode>): R;
  toMatchUnistNode(node: UnistLike): R;
  toParseDOM(html: string, target: Build<Array<BuiltNode>>): R;
  toProvideMark(name: string | null): R;
  toProvideNode(name: string | null): R;
  toRenderDOM(source: Build<Array<BuiltNode>>, html: string): R;
  toReportKeymapApplicability(
    nodes: Build<Array<BuiltNode>>,
    selection: TesterSelection,
    key: string,
    applicable: boolean,
  ): R;
  toTransformInput(
    before: Build<Array<BuiltNode>>,
    selection: TesterSelection,
    editorInput: string,
    after: Build<Array<BuiltNode>>,
    markdownOutput: string,
  ): R;
}

/* eslint-disable @typescript-eslint/no-empty-object-type, @typescript-eslint/no-unused-vars -- Override for vitest matchers; the type parameters must match vitest's Matchers signature exactly */
declare module "vitest" {
  interface Matchers<
    R extends Promise<void> | void = Promise<void> | void,
    T = unknown,
  > extends ExtensionMatchers<R> {}
}
/* eslint-enable */
