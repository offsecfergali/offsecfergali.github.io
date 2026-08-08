export type BlockType = 
  | 'h1' 
  | 'h2' 
  | 'h3' 
  | 'h4' 
  | 'paragraph' 
  | 'image' 
  | 'code' 
  | 'blockquote' 
  | 'list' 
  | 'table' 
  | 'hr';

export interface ContentBlock {
  id: string;
  type: BlockType;
  text?: string;
  // Image properties
  src?: string;
  caption?: string;
  size?: 'small' | 'medium' | 'large' | 'full';
  // Code block
  language?: string;
  // List block
  listType?: 'bullet' | 'numbered';
  items?: string[];
  // Table block
  tableData?: string[][]; // row 0 is header
}

export function generateBlockId(): string {
  return 'block_' + Math.random().toString(36).substring(2, 11);
}

/**
 * Converts array of ContentBlocks into Markdown string
 */
export function blocksToMarkdown(blocks: ContentBlock[]): string {
  return blocks
    .map((block) => {
      switch (block.type) {
        case 'h1':
          return `# ${block.text || ''}`;
        case 'h2':
          return `## ${block.text || ''}`;
        case 'h3':
          return `### ${block.text || ''}`;
        case 'h4':
          return `#### ${block.text || ''}`;
        case 'paragraph':
          return block.text || '';
        case 'image': {
          if (!block.src || !block.src.trim()) return '';
          const cap = (block.caption || '').replace(/"/g, "'").trim();
          const sz = block.size || 'full';
          const cleanSrc = block.src.includes('|') ? block.src.split('|')[0].trim() : block.src.trim();
          if (cap) {
            return `![${cap}](${cleanSrc} "${cap}|${sz}")`;
          }
          return `![](${cleanSrc} "|${sz}")`;
        }
        case 'code':
          return `\`\`\`${block.language || ''}\n${block.text || ''}\n\`\`\``;
        case 'blockquote':
          return `> ${block.text || ''}`;
        case 'list': {
          const items = block.items || [''];
          if (block.listType === 'numbered') {
            return items.map((it, idx) => `${idx + 1}. ${it}`).join('\n');
          }
          return items.map((it) => `- ${it}`).join('\n');
        }
        case 'table': {
          const data = block.tableData || [['Header 1', 'Header 2'], ['Value 1', 'Value 2']];
          if (data.length === 0) return '';
          const headerRow = `| ${data[0].join(' | ')} |`;
          const separatorRow = `| ${data[0].map(() => '---').join(' | ')} |`;
          const bodyRows = data.slice(1).map((row) => `| ${row.join(' | ')} |`).join('\n');
          return `${headerRow}\n${separatorRow}${bodyRows ? '\n' + bodyRows : ''}`;
        }
        case 'hr':
          return '---';
        default:
          return block.text || '';
      }
    })
    .join('\n\n');
}

/**
 * Converts Markdown string into array of ContentBlocks
 */
export function markdownToBlocks(markdown: string): ContentBlock[] {
  if (!markdown || !markdown.trim()) {
    return [
      {
        id: generateBlockId(),
        type: 'paragraph',
        text: '',
      },
    ];
  }

  const blocks: ContentBlock[] = [];
  const lines = markdown.split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i++;
      continue;
    }

    // Code block
    if (trimmed.startsWith('```')) {
      const lang = trimmed.replace('```', '').trim();
      i++;
      const codeLines: string[] = [];
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++; // skip ending ```
      blocks.push({
        id: generateBlockId(),
        type: 'code',
        language: lang || 'bash',
        text: codeLines.join('\n'),
      });
      continue;
    }

    // Horizontal rule
    if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
      blocks.push({
        id: generateBlockId(),
        type: 'hr',
      });
      i++;
      continue;
    }

    // HTML Image tag: <img src="..." alt="..." />
    if (trimmed.toLowerCase().startsWith('<img')) {
      const srcMatch = trimmed.match(/src=["']([^"']+)["']/i);
      const altMatch = trimmed.match(/alt=["']([^"']+)["']/i);
      if (srcMatch && srcMatch[1]) {
        blocks.push({
          id: generateBlockId(),
          type: 'image',
          src: srcMatch[1].trim(),
          caption: altMatch ? altMatch[1].trim() : '',
          size: 'full',
        });
        i++;
        continue;
      }
    }

    // Image block: ![alt](url "title|size") or ![alt](url|caption)
    if (trimmed.startsWith('![') && trimmed.includes('](')) {
      const closingAltIdx = trimmed.indexOf('](');
      const alt = trimmed.slice(2, closingAltIdx);
      let inner = trimmed.slice(closingAltIdx + 2);
      if (inner.endsWith(')')) {
        inner = inner.slice(0, -1).trim();
      }

      let src = inner;
      let caption = alt;
      let size: 'small' | 'medium' | 'large' | 'full' = 'full';

      // Check for title in quotes: url "caption|size"
      const firstQuoteIdx = inner.indexOf('"');
      const lastQuoteIdx = inner.lastIndexOf('"');
      if (firstQuoteIdx !== -1 && lastQuoteIdx > firstQuoteIdx) {
        src = inner.slice(0, firstQuoteIdx).trim();
        const titleAttr = inner.slice(firstQuoteIdx + 1, lastQuoteIdx).trim();
        if (titleAttr) {
          const parts = titleAttr.split('|');
          if (parts.length > 1) {
            caption = parts[0] || alt;
            if (['small', 'medium', 'large', 'full'].includes(parts[1].trim())) {
              size = parts[1].trim() as any;
            }
          } else if (['small', 'medium', 'large', 'full'].includes(parts[0].trim())) {
            size = parts[0].trim() as any;
          } else {
            caption = parts[0];
          }
        }
      } else if (src.includes('|')) {
        const parts = src.split('|');
        src = parts[0].trim();
        if (parts[1]) caption = parts[1].trim();
        if (parts[2] && ['small', 'medium', 'large', 'full'].includes(parts[2].trim())) {
          size = parts[2].trim() as any;
        }
      }

      blocks.push({
        id: generateBlockId(),
        type: 'image',
        src,
        caption,
        size,
      });
      i++;
      continue;
    }

    // Headings
    if (trimmed.startsWith('# ')) {
      blocks.push({
        id: generateBlockId(),
        type: 'h1',
        text: trimmed.replace(/^#\s+/, ''),
      });
      i++;
      continue;
    }
    if (trimmed.startsWith('## ')) {
      blocks.push({
        id: generateBlockId(),
        type: 'h2',
        text: trimmed.replace(/^##\s+/, ''),
      });
      i++;
      continue;
    }
    if (trimmed.startsWith('### ')) {
      blocks.push({
        id: generateBlockId(),
        type: 'h3',
        text: trimmed.replace(/^###\s+/, ''),
      });
      i++;
      continue;
    }
    if (trimmed.startsWith('#### ')) {
      blocks.push({
        id: generateBlockId(),
        type: 'h4',
        text: trimmed.replace(/^####\s+/, ''),
      });
      i++;
      continue;
    }

    // Blockquote
    if (trimmed.startsWith('>')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ''));
        i++;
      }
      blocks.push({
        id: generateBlockId(),
        type: 'blockquote',
        text: quoteLines.join('\n'),
      });
      continue;
    }

    // List (bullet or numbered)
    if (/^[-*+]\s+/.test(trimmed) || /^\d+\.\s+/.test(trimmed)) {
      const isNumbered = /^\d+\.\s+/.test(trimmed);
      const items: string[] = [];
      while (
        i < lines.length &&
        ((isNumbered && /^\d+\.\s+/.test(lines[i].trim())) ||
          (!isNumbered && /^[-*+]\s+/.test(lines[i].trim())))
      ) {
        items.push(
          lines[i]
            .trim()
            .replace(/^[-*+]\s+/, '')
            .replace(/^\d+\.\s+/, '')
        );
        i++;
      }
      blocks.push({
        id: generateBlockId(),
        type: 'list',
        listType: isNumbered ? 'numbered' : 'bullet',
        items,
      });
      continue;
    }

    // Table
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const tableRows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        const rowLine = lines[i].trim();
        // Skip delimiter line | --- | --- |
        if (!/^\|[\s-|-]+\|$/.test(rowLine)) {
          const cells = rowLine
            .split('|')
            .slice(1, -1)
            .map((c) => c.trim());
          tableRows.push(cells);
        }
        i++;
      }
      if (tableRows.length > 0) {
        blocks.push({
          id: generateBlockId(),
          type: 'table',
          tableData: tableRows,
        });
        continue;
      }
    }

    // Paragraph (or multi-line paragraph block)
    const paraLines: string[] = [line];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].trim().startsWith('#') &&
      !lines[i].trim().startsWith('```') &&
      !lines[i].trim().startsWith('>') &&
      !lines[i].trim().startsWith('!') &&
      !/^[-*+]\s+/.test(lines[i].trim()) &&
      !/^\d+\.\s+/.test(lines[i].trim()) &&
      !lines[i].trim().startsWith('|')
    ) {
      paraLines.push(lines[i]);
      i++;
    }

    blocks.push({
      id: generateBlockId(),
      type: 'paragraph',
      text: paraLines.join('\n'),
    });
  }

  return blocks.length > 0
    ? blocks
    : [
        {
          id: generateBlockId(),
          type: 'paragraph',
          text: '',
        },
      ];
}
