import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { dracula } from "react-syntax-highlighter/dist/esm/styles/prism";

const MarkdownRenderer = ({ content = "" }) => {
  return (
    <div className="text-slate-700 leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ ...props }) => (
            <h1
              className="text-2xl font-bold mt-6 mb-3 text-slate-900"
              {...props}
            />
          ),

          h2: ({ ...props }) => (
            <h2
              className="text-xl font-semibold mt-5 mb-3 text-slate-900"
              {...props}
            />
          ),

          h3: ({ ...props }) => (
            <h3
              className="text-lg font-semibold mt-4 mb-2 text-slate-900"
              {...props}
            />
          ),

          h4: ({ ...props }) => (
            <h4
              className="text-base font-semibold mt-3 mb-2 text-slate-900"
              {...props}
            />
          ),

          p: ({ ...props }) => (
            <p
              className="mb-3 leading-7 text-slate-700"
              {...props}
            />
          ),

          a: ({ ...props }) => (
            <a
              className="text-emerald-600 hover:text-emerald-700 underline"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            />
          ),

          ul: ({ ...props }) => (
            <ul
              className="list-disc list-inside ml-4 mb-3"
              {...props}
            />
          ),

          ol: ({ ...props }) => (
            <ol
              className="list-decimal list-inside ml-4 mb-3"
              {...props}
            />
          ),

          li: ({ ...props }) => (
            <li className="mb-1" {...props} />
          ),

          strong: ({ ...props }) => (
            <strong
              className="font-semibold text-slate-900"
              {...props}
            />
          ),

          em: ({ ...props }) => (
            <em
              className="italic text-slate-700"
              {...props}
            />
          ),

          blockquote: ({ ...props }) => (
            <blockquote
              className="border-l-4 border-emerald-500 pl-4 italic text-slate-600 my-4"
              {...props}
            />
          ),

          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "");

            if (match) {
              return (
                <SyntaxHighlighter
                  style={dracula}
                  language={match[1]}
                  PreTag="div"
                  {...props}
                >
                  {String(children).replace(/\n$/, "")}
                </SyntaxHighlighter>
              );
            }

            return (
              <code
                className="bg-slate-100 px-1.5 py-0.5 rounded text-sm font-mono text-pink-600"
                {...props}
              >
                {children}
              </code>
            );
          },

          pre: ({ ...props }) => (
            <pre
              className="bg-slate-900 text-white rounded-lg overflow-x-auto my-4"
              {...props}
            />
          ),

          table: ({ ...props }) => (
            <table
              className="table-auto border-collapse border border-slate-300 my-4 w-full"
              {...props}
            />
          ),

          th: ({ ...props }) => (
            <th
              className="border border-slate-300 bg-slate-100 px-3 py-2 text-left font-semibold"
              {...props}
            />
          ),

          td: ({ ...props }) => (
            <td
              className="border border-slate-300 px-3 py-2"
              {...props}
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;