"use client"

import ReactMarkdown from "react-markdown"
import { Button } from "@/components/ui/button"
import { Copy, Check } from "lucide-react"
import { useState, useEffect } from "react"

interface MarkdownRendererProps {
  content: string
}

function MermaidDiagram({ code }: { code: string }) {
  const [diagramHtml, setDiagramHtml] = useState<string>("")

  useEffect(() => {
    const renderVisualDiagram = (mermaidCode: string) => {
      try {
        // Parse flowchart/graph diagrams
        if (mermaidCode.includes("flowchart") || mermaidCode.includes("graph")) {
          const lines = mermaidCode.split("\n").filter((line) => line.trim())
          const nodes: { [key: string]: string } = {}
          const connections: Array<{ from: string; to: string; label?: string }> = []

          lines.forEach((line) => {
            const trimmed = line.trim()
            // Parse node definitions like: A[Start] or B(Process)
            const nodeMatch = trimmed.match(/(\w+)\[([^\]]+)\]|(\w+)$$([^)]+)$$|(\w+)\{([^}]+)\}/)
            if (nodeMatch) {
              const id = nodeMatch[1] || nodeMatch[3] || nodeMatch[5]
              const label = nodeMatch[2] || nodeMatch[4] || nodeMatch[6]
              if (id && label) nodes[id] = label
            }

            // Parse connections like: A --> B or A --> B : label
            const connMatch = trimmed.match(/(\w+)\s*-->\s*(\w+)(?:\s*:\s*(.+))?/)
            if (connMatch) {
              connections.push({
                from: connMatch[1],
                to: connMatch[2],
                label: connMatch[3]?.trim(),
              })
            }
          })

          // Generate visual HTML
          let html = `<div class="bg-white border rounded-lg p-6 my-4">
            <div class="text-sm font-medium text-gray-700 mb-4">Flowchart Diagram</div>
            <div class="flex flex-wrap gap-4 items-center justify-center min-h-[200px]">`

          Object.entries(nodes).forEach(([id, label]) => {
            html += `<div class="bg-blue-100 border-2 border-blue-300 rounded-lg px-4 py-2 text-sm font-medium text-blue-800 shadow-sm" data-node="${id}">
              ${label}
            </div>`
          })

          if (connections.length > 0) {
            html += `<div class="w-full mt-4 text-xs text-gray-600">
              <div class="font-medium mb-2">Connections:</div>`
            connections.forEach((conn) => {
              const fromLabel = nodes[conn.from] || conn.from
              const toLabel = nodes[conn.to] || conn.to
              html += `<div class="flex items-center gap-2 mb-1">
                <span class="bg-gray-100 px-2 py-1 rounded">${fromLabel}</span>
                <span>→</span>
                <span class="bg-gray-100 px-2 py-1 rounded">${toLabel}</span>
                ${conn.label ? `<span class="text-gray-500">: ${conn.label}</span>` : ""}
              </div>`
            })
            html += `</div>`
          }

          html += `</div></div>`
          return html
        }

        // Parse sequence diagrams
        if (mermaidCode.includes("sequenceDiagram")) {
          const lines = mermaidCode
            .split("\n")
            .filter((line) => line.trim() && !line.trim().startsWith("sequenceDiagram"))
          const participants: string[] = []
          const messages: Array<{ from: string; to: string; message: string }> = []

          lines.forEach((line) => {
            const trimmed = line.trim()
            // Parse participant declarations
            const participantMatch = trimmed.match(/participant\s+(\w+)(?:\s+as\s+(.+))?/)
            if (participantMatch) {
              participants.push(participantMatch[2] || participantMatch[1])
            }

            // Parse messages like: A->>B: Hello
            const messageMatch = trimmed.match(/(\w+)\s*->>?\+?\s*(\w+)\s*:\s*(.+)/)
            if (messageMatch) {
              messages.push({
                from: messageMatch[1],
                to: messageMatch[2],
                message: messageMatch[3].trim(),
              })
            }
          })

          let html = `<div class="bg-white border rounded-lg p-6 my-4">
            <div class="text-sm font-medium text-gray-700 mb-4">Sequence Diagram</div>`

          if (participants.length > 0) {
            html += `<div class="flex justify-around mb-4">`
            participants.forEach((p) => {
              html += `<div class="bg-green-100 border-2 border-green-300 rounded-lg px-3 py-2 text-sm font-medium text-green-800">
                ${p}
              </div>`
            })
            html += `</div>`
          }

          if (messages.length > 0) {
            html += `<div class="space-y-2">`
            messages.forEach((msg, i) => {
              html += `<div class="flex items-center gap-2 text-sm">
                <span class="bg-gray-100 px-2 py-1 rounded text-xs">${i + 1}</span>
                <span class="font-medium">${msg.from}</span>
                <span class="text-gray-500">→</span>
                <span class="font-medium">${msg.to}</span>
                <span class="text-gray-600">: ${msg.message}</span>
              </div>`
            })
            html += `</div>`
          }

          html += `</div>`
          return html
        }

        // Generic diagram fallback with better parsing
        const lines = mermaidCode.split("\n").filter((line) => line.trim())
        let html = `<div class="bg-white border rounded-lg p-6 my-4">
          <div class="text-sm font-medium text-gray-700 mb-4">Diagram</div>
          <div class="bg-gray-50 rounded-lg p-4 font-mono text-sm space-y-1">`

        lines.forEach((line) => {
          const trimmed = line.trim()
          if (trimmed) {
            html += `<div class="text-gray-700">${trimmed}</div>`
          }
        })

        html += `</div>
          <div class="text-xs text-gray-500 mt-3">Parsed diagram structure</div>
        </div>`

        return html
      } catch (err) {
        return `<div class="text-red-500 text-sm p-4 border border-red-200 rounded bg-red-50">
          Error parsing diagram: ${err}
        </div>`
      }
    }

    const html = renderVisualDiagram(code)
    setDiagramHtml(html)
  }, [code])

  return <div dangerouslySetInnerHTML={{ __html: diagramHtml }} />
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedCode(text)
      setTimeout(() => setCopiedCode(null), 2000)
    } catch (err) {
      console.error("Failed to copy text: ", err)
    }
  }

  return (
    <div className="prose prose-sm max-w-none dark:prose-invert [&>*]:!leading-relaxed [&>*]:!m-0 [&>*+*]:!mt-3">
      <ReactMarkdown
        components={{
          code({ node, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || "")
            const codeString = String(children).replace(/\n$/, "")
            const language = match ? match[1] : ""

            if (language === "mermaid") {
              return <MermaidDiagram code={codeString} />
            }

            if (match) {
              return (
                <div className="relative group">
                  <Button
                    {...({ size: "sm" } as any)}
                    variant="ghost"
                    className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    onClick={() => copyToClipboard(codeString)}
                  >
                    {copiedCode === codeString ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto text-sm font-mono leading-relaxed">
                    <code className={className} {...props}>
                      {codeString}
                    </code>
                  </pre>
                </div>
              )
            }

            return (
              <code className="bg-muted px-1 py-0.5 rounded text-sm font-mono" {...props}>
                {children}
              </code>
            )
          },
          h1: ({ children }) => <h1 className="text-2xl font-bold mt-6 mb-4 text-foreground">{children}</h1>,
          h2: ({ children }) => <h2 className="text-xl font-semibold mt-5 mb-3 text-foreground">{children}</h2>,
          h3: ({ children }) => <h3 className="text-lg font-medium mt-4 mb-2 text-foreground">{children}</h3>,
          p: ({ children }) => <p className="mb-3 leading-relaxed text-foreground">{children}</p>,
          ul: ({ children }) => <ul className="list-disc list-inside mb-3 space-y-1 text-foreground">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside mb-3 space-y-1 text-foreground">{children}</ol>,
          li: ({ children }) => <li className="text-foreground">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-muted-foreground pl-4 italic my-4 text-muted-foreground">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-4">
              <table className="min-w-full border-collapse border border-muted">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-muted bg-muted/50 px-3 py-2 text-left font-medium text-foreground">
              {children}
            </th>
          ),
          td: ({ children }) => <td className="border border-muted px-3 py-2 text-foreground">{children}</td>,
          a: ({ children, href }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              {children}
            </a>
          ),
          strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
          em: ({ children }) => <em className="italic text-foreground">{children}</em>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
