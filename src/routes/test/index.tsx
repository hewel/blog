import { component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import { type Descendant } from "slate";
import { QSlateEditor } from "~/integrations/react/slate";

export default component$(() => {
  const state = useSignal<Descendant[]>();

  useVisibleTask$(({ track }) => {
    track(state);
    console.log(state.value);
  });

  return (
    <>
      <QSlateEditor
        onChange$={(value) => {
          state.value = value;
        }}
      />
    </>
  );
});
