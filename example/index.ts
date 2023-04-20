import {EditorState} from "prosemirror-state";
import {EditorView} from "prosemirror-view";
import {schema, defaultMarkdownParser, defaultMarkdownSerializer} from "prosemirror-markdown";
import {exampleSetup} from "prosemirror-example-setup";
import "prosemirror-view/style/prosemirror.css";
import "prosemirror-example-setup/style/style.css";
import "prosemirror-menu/style/menu.css";

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
        //current state as json in text area
        preview.innerHTML = this.content;
      }
    })
  }

  get content() {
    return defaultMarkdownSerializer.serialize(this.view.state.doc)
  }
  focus() { this.view.focus() }
  destroy() { this.view.destroy() }
}


new ProseMirrorView(editor, "Hello World from **markdown**");
