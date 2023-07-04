import { component$ } from "@builder.io/qwik";
import { type DocumentHead } from "@builder.io/qwik-city";
import { useAuthSignin } from "~/routes/plugin@auth";

export default component$(() => {
  const signIn = useAuthSignin();

  return (
    <>
      <button
        onClick$={() =>
          signIn.submit({
            providerId: "discord",
          })
        }
      >
        Sign In
      </button>
    </>
  );
});

export const head: DocumentHead = {
  title: "Welcome to Qwik",
  meta: [
    {
      name: "description",
      content: "Qwik site description",
    },
  ],
};
