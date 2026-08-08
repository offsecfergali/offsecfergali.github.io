import React, { useEffect, useState } from 'react';
import mermaid from 'mermaid';

interface MermaidDiagramProps {
  chart: string;
}

export const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ chart }) => {
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'dark',
      securityLevel: 'loose',
    });

    let isMounted = true;

    const renderDiagram = async () => {
      try {
        setError(null);
        const uniqueId = `mermaid_${Math.random().toString(36).substring(2, 9)}`;
        const { svg: svgCode } = await mermaid.render(uniqueId, chart);
        if (isMounted) {
          setSvg(svgCode);
        }
      } catch (err: any) {
        if (isMounted) {
          console.warn('Mermaid render warning:', err);
          setError('Failed to render diagram. Check Mermaid syntax.');
        }
      }
    };

    if (chart && chart.trim()) {
      renderDiagram();
    }

    return () => {
      isMounted = false;
    };
  }, [chart]);

  if (error) {
    return (
      <div className="p-4 bg-[#1b1b1e] border border-yellow-500/30 text-yellow-400 font-mono text-[12px] my-4 rounded-[2px]">
        ⚠️ {error}
      </div>
    );
  }

  return (
    <div
      className="my-6 p-6 bg-[#1b1b1e] border border-[#2e2f33] rounded-[2px] overflow-x-auto flex justify-center"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
};
