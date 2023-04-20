import "prosemirror-view/style/prosemirror.css";
import "prosemirror-example-setup/style/style.css";
import "prosemirror-menu/style/menu.css";

import { exampleSetup } from "prosemirror-example-setup";
import {
  defaultMarkdownParser,
  defaultMarkdownSerializer,
  schema,
} from "prosemirror-markdown";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import rehypeSanitize from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

import { defaultContent } from "./defaultContent";

const editor = document.querySelector("#editor")!;
const preview = document.querySelector("#preview-container")!;

class ProseMirrorView {
  private readonly view: EditorView;

  public constructor(target: Element, content: string) {
    this.view = new EditorView(target, {
      state: EditorState.create({
        doc: defaultMarkdownParser.parse(content)!,
        plugins: exampleSetup({ schema }),
      }),
      dispatchTransaction: (tr): void => {
        this.view.updateState(this.view.state.apply(tr));
        void updatePreview(
          defaultMarkdownSerializer.serialize(this.view.state.doc)
        );
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
