import React, { useState } from 'react';
import { Check, Copy, Terminal } from 'lucide-react';
import { MermaidDiagram } from './MermaidDiagram';

interface CodeBlockWithCopyProps {
  language?: string;
  code: string;
}

export const CodeBlockWithCopy: React.FC<CodeBlockWithCopyProps> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);

  const cleanLang = (language || '').toLowerCase().trim();

  // Handle Mermaid diagrams
  if (cleanLang === 'mermaid' || cleanLang === 'diagram') {
    return <MermaidDiagram chart={code} />;
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getLanguageLabel = (lang: string) => {
    switch (lang) {
      case 'js':
      case 'javascript':
        return 'JavaScript';
      case 'ts':
      case 'typescript':
        return 'TypeScript';
      case 'py':
      case 'python':
        return 'Python';
      case 'bash':
      case 'sh':
      case 'shell':
      case 'zsh':
        return 'Bash / Shell';
      case 'ps1':
      case 'powershell':
        return 'PowerShell';
      case 'cpp':
      case 'c++':
      case 'c':
        return 'C / C++';
      case 'go':
      case 'golang':
        return 'Go';
      case 'rust':
      case 'rs':
        return 'Rust';
      case 'php':
        return 'PHP';
      case 'html':
        return 'HTML';
      case 'css':
        return 'CSS';
      case 'json':
        return 'JSON';
      case 'yaml':
      case 'yml':
        return 'YAML';
      case 'sql':
        return 'SQL';
      default:
        return lang ? lang.toUpperCase() : 'CODE';
    }
  };

  return (
    <div className="my-8 rounded-[2px] border border-[#2e2f33] bg-[#141518] overflow-hidden font-mono text-[14px]">
      {/* Top Bar with Language Badge and Copy Button */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#1b1b1e] border-b border-[#2e2f33] text-[12px] text-[#aaaaaa]">
        <div className="flex items-center space-x-2 text-white font-semibold">
          <Terminal className="w-3.5 h-3.5 text-white" />
          <span>{getLanguageLabel(cleanLang)}</span>
        </div>

        <button
          onClick={handleCopy}
          className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-[2px] bg-[#212225] hover:bg-[#2e2f33] border border-[#2e2f33] text-white transition-colors cursor-pointer text-[12px]"
          title="Copy Code Snippet"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-[#aaaaaa]" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Content Box */}
      <pre className="p-4 sm:p-5 overflow-x-auto text-[#e0e0e0] leading-relaxed text-[13px] sm:text-[14px] font-mono selection:bg-[#2e2f33]">
        <code>{code}</code>
      </pre>
    </div>
  );
};
