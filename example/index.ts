import {EditorState} from "prosemirror-state";
import {EditorView} from "prosemirror-view";
import {schema, defaultMarkdownParser, defaultMarkdownSerializer} from "prosemirror-markdown";
import {exampleSetup} from "prosemirror-example-setup";
import "prosemirror-view/style/prosemirror.css";
import "prosemirror-example-setup/style/style.css";
import "prosemirror-menu/style/menu.css";
import {unified} from 'unified'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import remarkGfm from 'remark-gfm'
import rehypeSanitize from 'rehype-sanitize'
import rehypeStringify from 'rehype-stringify'
import { defaultContent } from "./defaultContent";

const editor = document.querySelector("#editor")!;
const preview = document.querySelector("#preview-container")!;

class ProseMirrorView {
  private readonly view: EditorView;

  constructor(target: Element, content: string) {
    this.view = new EditorView(target, {
      state: EditorState.create({
        doc: defaultMarkdownParser.parse(content)!,
        plugins: exampleSetup({schema})
      }),
      dispatchTransaction: (tr) => {
        this.view.updateState(this.view.state.apply(tr));
        updatePreview(this.content);
      }
    })
  }

  get content() {
    return defaultMarkdownSerializer.serialize(this.view.state.doc)
  }
  focus() { this.view.focus() }
  destroy() { this.view.destroy() }
}

async function updatePreview(source: string) {
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
updatePreview(defaultContent);
