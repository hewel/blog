/** @jsxImportSource react */
import { StrictMode, useState } from "react";
import { qwikify$ } from "@builder.io/qwik-react";
import { createEditor, Transforms, Element, Editor, type Descendant } from "slate";
import { Slate, Editable, withReact, type RenderElementProps } from "slate-react";

const initialValue = [
  {
    type: "paragraph",
    children: [{ text: "A line of text in a paragraph." }],
  },
];

const renderElement = (props: RenderElementProps) => {
  if (props.element.type === "code") {
    return <CodeElement {...props} />;
  }
  return <TextElement {...props} />;
};

const TextElement = ({ attributes, children }: RenderElementProps) => (
  <p {...attributes}>{children}</p>
);
const CodeElement = (props: RenderElementProps) => {
  return (
    <pre {...props.attributes}>
      <code>{props.children}</code>
    </pre>
  );
};

interface SlateEditorProps {
  onChange?: (value: Descendant[]) => void;
}

function SlateEditor({ onChange }: SlateEditorProps) {
  const [editor] = useState(() => withReact(createEditor()));
  return (
    <StrictMode>
      <Slate editor={editor} initialValue={initialValue} onChange={onChange}>
        <Editable
          renderElement={renderElement}
          onKeyDown={(event) => {
            if (event.key === "`" && event.ctrlKey) {
              // Prevent the "`" from being inserted by default.
              event.preventDefault();
              // Otherwise, set the currently selected blocks type to "code".
              Transforms.setNodes(
                editor,
                { type: "code" },
                { match: (n) => Element.isElement(n) && Editor.isBlock(editor, n) }
              );
            }
          }}
        />
      </Slate>
    </StrictMode>
  );
}

export const QSlateEditor = qwikify$(SlateEditor, { eagerness: "hover" });
