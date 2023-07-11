import { component$, Fragment } from "@builder.io/qwik"
import { server$ } from "@builder.io/qwik-city"
import { getHighlighter, type IThemedToken } from "shiki"
import { css } from "~/styled-system/css"

const highlightContent = server$(async (code: string) => {
  const highlighter = await getHighlighter({
    theme: "github-dark-dimmed",
  })
  return {
    tokens: highlighter.codeToThemedTokens(code),
    bg: highlighter.getBackgroundColor(),
    fg: highlighter.getForegroundColor(),
    theme: highlighter.getTheme(),
  }
})

const renderCode = (tokens: IThemedToken[][], bg: string, fg: string) => {
  return (
    <pre
      class={css({
        fontFamily: "'JetBrains Mono', monospace",
        padding: "0.75rem 1rem",
        borderRadius: "0.5rem",
      })}
      style={{
        color: fg,
        backgroundColor: bg,
      }}
    >
      <code
        class={css({
          fontFamily: "inherit",
          color: "inherit",
          padding: 0,
          bgColor: "transparent",
          fontSize: "0.8rem",
        })}
      >
        {tokens.map((line, lineIndex) => (
          <Fragment key={lineIndex}>
            {line.map(({ content, color }, index) => (
              <span
                key={`line-${index}`}
                style={{
                  color,
                }}
              >
                {content}
              </span>
            ))}
            <br />
          </Fragment>
        ))}
      </code>
    </pre>
  )
}

export default component$(() => {
  return <span>hi</span>
})
