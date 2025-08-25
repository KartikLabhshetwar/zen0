import { cn } from "@/lib/utils"
import { marked } from "marked"
import { memo, useId, useMemo } from "react"
import ReactMarkdown, { Components } from "react-markdown"
import remarkBreaks from "remark-breaks"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import { CodeBlock, CodeBlockCode } from "./code-block"
import "katex/dist/katex.min.css"

export type MarkdownProps = {
  children: string
  id?: string
  className?: string
  components?: Partial<Components>
}

function parseMarkdownIntoBlocks(markdown: string): string[] {
  try {
    // Handle the case when markdown is undefined or not a string
    if (!markdown || typeof markdown !== 'string') {
      return [];
    }
    
    // For markdown content, return as single block to preserve structure
    return [markdown];
  } catch (error) {
    console.warn('Markdown parsing failed, using fallback:', error);
    return [markdown];
  }
}

function extractLanguage(className?: string): string {
  if (!className) return "plaintext"
  const match = className.match(/language-(\w+)/)
  return match ? match[1] : "plaintext"
}

const INITIAL_COMPONENTS: Partial<Components> = {
  code: function CodeComponent({ className, children, ...props }) {
    const isInline =
      !props.node?.position?.start.line ||
      props.node?.position?.start.line === props.node?.position?.end.line

    if (isInline) {
      return (
        <span
          className={cn(
            "bg-gray-200 rounded px-2 py-1 font-mono text-sm text-gray-800",
            className
          )}
          {...props}
        >
          {children}
        </span>
      )
    }

    const language = extractLanguage(className)

    return (
      <CodeBlock className={className}>
        <CodeBlockCode code={children as string} language={language} />
      </CodeBlock>
    )
  },
  pre: function PreComponent({ children }) {
    return <>{children}</>
  },
  p: function ParagraphComponent({ children, ...props }) {
    return (
      <p className="mb-4 text-gray-800 leading-relaxed font-space-grotesk" {...props}>
        {children}
      </p>
    )
  },
  h1: function H1Component({ children, ...props }) {
    return (
      <h1 className="text-2xl font-bold mb-6 text-gray-900 leading-tight font-space-grotesk" {...props}>
        {children}
      </h1>
    )
  },
  h2: function H2Component({ children, ...props }) {
    return (
      <h2 className="text-xl font-semibold mb-4 text-gray-900 leading-tight font-space-grotesk" {...props}>
        {children}
      </h2>
    )
  },
  h3: function H3Component({ children, ...props }) {
    return (
      <h3 className="text-lg font-medium mb-3 text-gray-900 leading-tight font-space-grotesk" {...props}>
        {children}
      </h3>
    )
  },
  h4: function H4Component({ children, ...props }) {
    return (
      <h4 className="text-base font-medium mb-2 text-gray-900 leading-tight font-space-grotesk" {...props}>
        {children}
      </h4>
    )
  },
  ul: function UlComponent({ children, ...props }) {
    return (
      <ul className="mb-4 space-y-2 list-disc list-inside text-gray-700 font-space-grotesk" {...props}>
        {children}
      </ul>
    )
  },
  ol: function OlComponent({ children, ...props }) {
    return (
      <ol className="mb-4 space-y-2 list-decimal list-inside text-gray-700 font-space-grotesk" {...props}>
        {children}
      </ol>
    )
  },
  li: function LiComponent({ children, ...props }) {
    return (
      <li className="mb-1 text-gray-700 leading-relaxed font-space-grotesk" {...props}>
        {children}
      </li>
    )
  },
  table: function TableComponent({ children, ...props }) {
    return (
      <table className="w-full mb-4 border-collapse border border-gray-300" {...props}>
        {children}
      </table>
    )
  },
  th: function ThComponent({ children, ...props }) {
    return (
      <th className="border border-gray-300 bg-gray-100 px-4 py-2 text-left font-semibold text-gray-900" {...props}>
        {children}
      </th>
    )
  },
  td: function TdComponent({ children, ...props }) {
    return (
      <td className="border border-gray-300 px-4 py-2 text-gray-700" {...props}>
        {children}
      </td>
    )
  },
  blockquote: function BlockquoteComponent({ children, ...props }) {
    return (
      <blockquote className="mb-4 border-l-4 border-gray-300 pl-4 italic text-gray-600" {...props}>
        {children}
      </blockquote>
    )
  },
  // Math block styling
  div: function DivComponent({ className, children, ...props }) {
    if (className?.includes('math-display')) {
      return (
        <div className="my-4 p-4 bg-gray-50 rounded-lg border border-gray-200 overflow-x-auto" {...props}>
          {children}
        </div>
      )
    }
    return <div {...props}>{children}</div>
  },
  hr: function HrComponent({ ...props }) {
    return (
      <hr className="my-6 border-gray-300" {...props} />
    )
  },
  strong: function StrongComponent({ children, ...props }) {
    return (
      <strong className="font-semibold text-gray-900" {...props}>
        {children}
      </strong>
    )
  },
  em: function EmComponent({ children, ...props }) {
    return (
      <em className="italic text-gray-800" {...props}>
        {children}
      </em>
    )
  }
}

const MemoizedMarkdownBlock = memo(
  function MarkdownBlock({
    content,
    components = INITIAL_COMPONENTS,
  }: {
    content: string
    components?: Partial<Components>
  }) {
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    )
  },
  function propsAreEqual(prevProps, nextProps) {
    return prevProps.content === nextProps.content
  }
)

MemoizedMarkdownBlock.displayName = "MemoizedMarkdownBlock"

function MarkdownComponent({
  children,
  id,
  className,
  components = INITIAL_COMPONENTS,
}: MarkdownProps) {
  const generatedId = useId()
  const blockId = id ?? generatedId
  const blocks = useMemo(() => parseMarkdownIntoBlocks(children), [children])

  return (
    <div className={className}>
      {blocks.map((block, index) => (
        <MemoizedMarkdownBlock
          key={`${blockId}-block-${index}`}
          content={block}
          components={components}
        />
      ))}
    </div>
  )
}

const Markdown = memo(MarkdownComponent)
Markdown.displayName = "Markdown"

export { Markdown }
