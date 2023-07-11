import { component$ } from "@builder.io/qwik"
import { type DocumentHead } from "@builder.io/qwik-city"
import { useAuthSession } from "./plugin@auth"

export default component$(() => {
  const session = useAuthSession()

  return (
    <>
      <h1>Hi 👋</h1>
      <p>
        Can't wait to see what you build with qwik!
        <br />
        Happy coding.
      </p>
      <p>{JSON.stringify(session.value)}</p>
    </>
  )
})

export const head: DocumentHead = {
  title: "Welcome to Qwik",
  meta: [
    {
      name: "description",
      content: "Qwik site description",
    },
  ],
}
