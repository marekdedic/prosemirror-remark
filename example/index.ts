import "prosemirror-view/style/prosemirror.css";
import "prosemirror-example-setup/style/style.css";
import "prosemirror-menu/style/menu.css";

import { exampleSetup } from "prosemirror-example-setup";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import rehypeSanitize from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

import { ParagraphExtension } from "../src/extensions/ParagraphExtension";
import { RootExtension } from "../src/extensions/RootExtension";
import { TextExtension } from "../src/extensions/TextExtension";
import { ProseMirrorRemarkAdapter } from "../src/index";
import { defaultContent } from "./defaultContent";

const editor = document.querySelector("#editor")!;
const preview = document.querySelector("#preview-container")!;

const adapter = new ProseMirrorRemarkAdapter([
  new ParagraphExtension(),
  new RootExtension(),
  new TextExtension(),
]);

class ProseMirrorView {
  private readonly view: EditorView;

  public constructor(target: Element, content: string) {
    const schema = adapter.schema();
    this.view = new EditorView(target, {
      state: EditorState.create({
        doc: adapter.parse(content)!,
        plugins: exampleSetup({ schema: schema }),
        schema,
      }),
      dispatchTransaction: (tr): void => {
        this.view.updateState(this.view.state.apply(tr));
        void updatePreview(adapter.serialize(this.view.state.doc));
      },
    });
  }
}

async function updatePreview(source: string): Promise<void> {
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeSanitize)
    .use(rehypeStringify)
    .process(source);

  preview.innerHTML = String(file);
}

new ProseMirrorView(editor, defaultContent);
void updatePreview(defaultContent);
