import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { Message } from '../types';
import type { Components } from 'react-markdown';

interface MessageItemProps {
  message: Message;
}

interface CodeProps {
  inline?: boolean;
  className?: string;
  children: React.ReactNode;
}

const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  let className = "mb-2";
  let prefix = '';
  
  switch (message.role) {
    case 'user':
      className += ' text-blue-400';
      prefix = '> ';
      break;
    case 'bot':
      prefix = '$ ';
      break;
    case 'system':
      className += ' text-yellow-500';
      prefix = '# ';
      break;
  }

  const markdownComponents: Components = {
    //@ts-expect-error - We're not using all the props
    code: ({inline, className, children, ...props }: CodeProps) => {
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : 'text';
      
      return !inline ? (
        <SyntaxHighlighter
          style={atomDark}
          language={language}
          PreTag="div"
          className="rounded-md my-2"
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      ) : (
        <code className="bg-gray-800 px-1 rounded text-green-400" {...props}>
          {children}
        </code>
      );
    },
    pre: ({ children }) => <>{children}</>,
    p: ({ children }) => <span className="inline">{children}</span>,
    a: ({ href, children }) => (
      <a href={href} className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    ),
    ul: ({ children }) => <ul className="list-disc ml-4 my-2 block">{children}</ul>,
    ol: ({ children }) => <ol className="list-decimal ml-4 my-2 block">{children}</ol>,
    li: ({ children }) => <li className="ml-2">{children}</li>,
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-green-700">
        {children}
      </blockquote>
    ),
    table: ({ children }) => (
      <table className="border-collapse my-2 w-full">
        {children}
      </table>
    ),
    th: ({ children }) => (
      <th className="border border-green-700 px-2 py-1 bg-green-900">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="border border-green-700 px-2 py-1">
        {children}
      </td>
    )
  };

  return (
    <div className={className}>
      <span className="opacity-50">[{message.timestamp}] </span>
      <span>{prefix}</span>
      {message.role === 'bot' ? (
        <ReactMarkdown 
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeKatex, rehypeRaw]}
          components={markdownComponents}
        >
          {message.content}
        </ReactMarkdown>
      ) : (
        <span>{message.content}</span>
      )}
    </div>
  );
};

export default MessageItem;