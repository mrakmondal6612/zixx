import { cn } from "@/lib/utils";
import { forwardRef } from "react";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';

interface CodeBlockProps extends React.HTMLAttributes<HTMLDivElement> {
  language?: string;
  children: string;
  showLineNumbers?: boolean;
}

export const CodeBlock = forwardRef<HTMLDivElement, CodeBlockProps>(
  ({ className, language = 'javascript', children, showLineNumbers = true, ...props }, ref) => {
    return (
      <div 
        ref={ref} 
        className={cn("rounded-md overflow-hidden text-sm", className)}
        {...props}
      >
        <SyntaxHighlighter
          language={language}
          style={vscDarkPlus}
          showLineNumbers={showLineNumbers}
          customStyle={{
            margin: 0,
            borderRadius: '0.375rem',
            padding: '1rem',
            fontSize: '0.875rem',
            lineHeight: '1.5',
            backgroundColor: '#1e1e1e',
          }}
          wrapLines={true}
          wrapLongLines={false}
        >
          {children}
        </SyntaxHighlighter>
      </div>
    );
  }
);

CodeBlock.displayName = 'CodeBlock';
