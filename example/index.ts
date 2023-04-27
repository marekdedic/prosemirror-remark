import "prosemirror-view/style/prosemirror.css";
import "prosemirror-example-setup/style/style.css";
import "prosemirror-menu/style/menu.css";

import { exampleSetup } from "prosemirror-example-setup";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import rehypeSanitize from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
//import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

import { BlockquoteExtension } from "../src/extensions/BlockquoteExtension";
import { BoldExtension } from "../src/extensions/BoldExtension";
import { HeadingExtension } from "../src/extensions/HeadingExtension";
import { HorizontalRuleExtension } from "../src/extensions/HorizontalRuleExtension";
import { ItalicExtension } from "../src/extensions/ItalicExtension";
import { ListItemExtension } from "../src/extensions/ListItemExtension";
import { OrderedListExtension } from "../src/extensions/OrderedListExtension";
import { ParagraphExtension } from "../src/extensions/ParagraphExtension";
import { RootExtension } from "../src/extensions/RootExtension";
import { TextExtension } from "../src/extensions/TextExtension";
import { UnorderedListExtension } from "../src/extensions/UnorderedListExtension";
import { ProseMirrorRemark } from "../src/index";
import { defaultContent } from "./defaultContent";

const editor = document.querySelector("#editor")!;
const preview = document.querySelector("#preview-container")!;

const adapter = new ProseMirrorRemark([
  new BlockquoteExtension(),
  new BoldExtension(),
  new HeadingExtension(),
  new HorizontalRuleExtension(),
  new ItalicExtension(),
  new ListItemExtension(),
  new OrderedListExtension(),
  new ParagraphExtension(),
  new RootExtension(),
  new TextExtension(),
  new UnorderedListExtension(),
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
    //.use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeSanitize)
    .use(rehypeStringify)
    .process(source);

  preview.innerHTML = String(file);
}

new ProseMirrorView(editor, defaultContent);
void updatePreview(defaultContent);
