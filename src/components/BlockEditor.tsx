import React, { useState } from 'react';
import { compressAndSaveImage, uploadImageToServer } from '../utils/imageUtils';
import {
  ContentBlock,
  BlockType,
  generateBlockId,
} from '../utils/blockEditorUtils';
import {
  GripVertical,
  ArrowUp,
  ArrowDown,
  Trash2,
  Plus,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Pilcrow,
  Image as ImageIcon,
  Code2,
  Quote,
  List,
  ListOrdered,
  Table as TableIcon,
  Minus,
  Upload,
  Bold,
  Italic,
  Underline,
  Link as LinkIcon,
  Code
} from 'lucide-react';

interface BlockEditorProps {
  blocks: ContentBlock[];
  onChange: (blocks: ContentBlock[]) => void;
}

export const BlockEditor: React.FC<BlockEditorProps> = ({ blocks, onChange }) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [activeAddMenuIndex, setActiveAddMenuIndex] = useState<number | null>(null);

  // Helper to update a single block
  const updateBlock = (index: number, updatedFields: Partial<ContentBlock>) => {
    const newBlocks = [...blocks];
    newBlocks[index] = { ...newBlocks[index], ...updatedFields };
    onChange(newBlocks);
  };

  // Delete a block
  const deleteBlock = (index: number) => {
    if (blocks.length <= 1) {
      // If last block, reset to empty paragraph
      onChange([{ id: generateBlockId(), type: 'paragraph', text: '' }]);
      return;
    }
    const newBlocks = blocks.filter((_, i) => i !== index);
    onChange(newBlocks);
  };

  // Move block up or down
  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= blocks.length) return;
    const newBlocks = [...blocks];
    const temp = newBlocks[index];
    newBlocks[index] = newBlocks[targetIndex];
    newBlocks[targetIndex] = temp;
    onChange(newBlocks);
  };

  // Insert block at specific index
  const addBlockAt = (index: number, type: BlockType) => {
    const newBlock: ContentBlock = {
      id: generateBlockId(),
      type,
      text: '',
    };

    if (type === 'image') {
      newBlock.src = '';
      newBlock.caption = '';
      newBlock.size = 'full';
    } else if (type === 'code') {
      newBlock.language = 'bash';
    } else if (type === 'list') {
      newBlock.listType = 'bullet';
      newBlock.items = ['Item 1', 'Item 2'];
    } else if (type === 'table') {
      newBlock.tableData = [
        ['Header 1', 'Header 2'],
        ['Cell 1', 'Cell 2'],
      ];
    }

    const newBlocks = [...blocks];
    newBlocks.splice(index + 1, 0, newBlock);
    onChange(newBlocks);
    setActiveAddMenuIndex(null);
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const newBlocks = [...blocks];
    const [draggedItem] = newBlocks.splice(draggedIndex, 1);
    newBlocks.splice(dropIndex, 0, draggedItem);
    onChange(newBlocks);
    setDraggedIndex(null);
  };

  // Image Upload handler
  const handleImageUpload = async (index: number, file: File) => {
    try {
      const serverUrl = await uploadImageToServer(file);
      if (serverUrl) {
        updateBlock(index, { src: serverUrl });
        return;
      }
    } catch (err) {
      console.warn('Server upload failed, using compression fallback:', err);
    }

    try {
      const compressedDataUrl = await compressAndSaveImage(
        file,
        `block_img_${Date.now()}`,
        1000,
        800,
        0.75
      );
      updateBlock(index, { src: compressedDataUrl });
    } catch (err) {
      console.error('Failed to process image:', err);
    }
  };

  // Formatting helpers for text fields
  const applyTextFormat = (
    index: number,
    wrapperStart: string,
    wrapperEnd: string = wrapperStart
  ) => {
    const currentText = blocks[index].text || '';
    updateBlock(index, { text: `${currentText}${wrapperStart}text${wrapperEnd}` });
  };

  const addLinkFormat = (index: number) => {
    const currentText = blocks[index].text || '';
    updateBlock(index, { text: `${currentText} [Link Title](https://example.com)` });
  };

  return (
    <div className="space-y-4 font-serif text-[#D4D4D4]">
      <div className="flex items-center justify-between pb-2 border-b border-[#2e2f33] font-mono text-[12px] text-[#aaaaaa]">
        <span>VISUAL BLOCK EDITOR ({blocks.length} BLOCKS)</span>
        <span>Drag handles or use ⬆️ ⬇️ to reorder</span>
      </div>

      <div className="space-y-4">
        {blocks.map((block, index) => (
          <div key={block.id} className="group relative space-y-2">
            {/* Block Card Container */}
            <div
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              className={`
                bg-[#212225] border border-[#2e2f33] hover:border-[#44464d] rounded-[2px] p-4 transition-all
                ${draggedIndex === index ? 'opacity-40 border-dashed border-white' : ''}
              `}
            >
              {/* Block Action Bar */}
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#2e2f33] font-mono text-[11px] text-[#aaaaaa]">
                <div className="flex items-center space-x-2">
                  <div
                    className="p-1 cursor-grab active:cursor-grabbing hover:text-white text-[#888888] flex items-center gap-1"
                    title="Drag to reorder block"
                  >
                    <GripVertical className="w-4 h-4" />
                    <span className="uppercase text-[10px] tracking-wider font-bold">
                      {block.type}
                    </span>
                  </div>

                  {/* Move Up / Down Buttons */}
                  <div className="flex items-center space-x-1 pl-2 border-l border-[#2e2f33]">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => moveBlock(index, 'up')}
                      className="p-1 hover:bg-[#2e2f33] rounded text-[#aaaaaa] disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                      title="Move block up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={index === blocks.length - 1}
                      onClick={() => moveBlock(index, 'down')}
                      className="p-1 hover:bg-[#2e2f33] rounded text-[#aaaaaa] disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                      title="Move block down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Right Side: Type Converter & Delete */}
                <div className="flex items-center space-x-2">
                  <select
                    value={block.type}
                    onChange={(e) => updateBlock(index, { type: e.target.value as BlockType })}
                    className="bg-[#1b1b1e] border border-[#2e2f33] text-white px-2 py-0.5 rounded-[2px] text-[11px] font-mono focus:outline-none"
                  >
                    <option value="paragraph">Paragraph</option>
                    <option value="h1">Heading 1 (H1)</option>
                    <option value="h2">Heading 2 (H2)</option>
                    <option value="h3">Heading 3 (H3)</option>
                    <option value="h4">Heading 4 (H4)</option>
                    <option value="image">Image</option>
                    <option value="code">Code Block</option>
                    <option value="blockquote">Quote</option>
                    <option value="list">List</option>
                    <option value="table">Table</option>
                    <option value="hr">Divider Line</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => deleteBlock(index)}
                    className="p-1 text-red-400 hover:bg-red-500/10 rounded transition-colors cursor-pointer"
                    title="Delete block"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* BLOCK BODY INPUTS BASED ON TYPE */}

              {/* 1. Headings (H1, H2, H3, H4) */}
              {(block.type === 'h1' || block.type === 'h2' || block.type === 'h3' || block.type === 'h4') && (
                <div className="space-y-1">
                  <input
                    type="text"
                    value={block.text || ''}
                    onChange={(e) => updateBlock(index, { text: e.target.value })}
                    placeholder={`Heading ${block.type.toUpperCase()} text...`}
                    className={`
                      w-full bg-[#1b1b1e] border border-[#2e2f33] focus:border-white text-white px-3 py-2 font-serif focus:outline-none rounded-[2px]
                      ${block.type === 'h1' ? 'text-[24px] font-bold uppercase' : ''}
                      ${block.type === 'h2' ? 'text-[20px] font-bold uppercase' : ''}
                      ${block.type === 'h3' ? 'text-[18px] font-semibold' : ''}
                      ${block.type === 'h4' ? 'text-[16px] font-semibold' : ''}
                    `}
                  />
                </div>
              )}

              {/* 2. Paragraph with Quick Rich Formatting Toolbar */}
              {block.type === 'paragraph' && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-1 bg-[#1b1b1e] border border-[#2e2f33] p-1 rounded-[2px] font-mono text-[11px]">
                    <button
                      type="button"
                      onClick={() => applyTextFormat(index, '**')}
                      className="p-1 hover:bg-[#2e2f33] rounded text-white flex items-center space-x-1 cursor-pointer"
                      title="Bold"
                    >
                      <Bold className="w-3 h-3" />
                      <span className="hidden sm:inline">Bold</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => applyTextFormat(index, '*')}
                      className="p-1 hover:bg-[#2e2f33] rounded text-white flex items-center space-x-1 cursor-pointer"
                      title="Italic"
                    >
                      <Italic className="w-3 h-3" />
                      <span className="hidden sm:inline">Italic</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => applyTextFormat(index, '<u>', '</u>')}
                      className="p-1 hover:bg-[#2e2f33] rounded text-white flex items-center space-x-1 cursor-pointer"
                      title="Underline"
                    >
                      <Underline className="w-3 h-3" />
                      <span className="hidden sm:inline">Underline</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => applyTextFormat(index, '`')}
                      className="p-1 hover:bg-[#2e2f33] rounded text-white flex items-center space-x-1 cursor-pointer"
                      title="Inline Code"
                    >
                      <Code className="w-3 h-3" />
                      <span className="hidden sm:inline">Code</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => addLinkFormat(index)}
                      className="p-1 hover:bg-[#2e2f33] rounded text-white flex items-center space-x-1 cursor-pointer"
                      title="Add Link"
                    >
                      <LinkIcon className="w-3 h-3" />
                      <span className="hidden sm:inline">Link</span>
                    </button>
                  </div>

                  <textarea
                    rows={3}
                    value={block.text || ''}
                    onChange={(e) => updateBlock(index, { text: e.target.value })}
                    placeholder="Type paragraph text or markdown..."
                    className="w-full bg-[#1b1b1e] border border-[#2e2f33] focus:border-white text-[#D4D4D4] p-3 text-[15px] font-serif leading-relaxed focus:outline-none rounded-[2px] resize-y"
                  />
                </div>
              )}

              {/* 3. Image Block (Upload from computer or paste URL, Choose Size, Captions) */}
              {block.type === 'image' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* File Upload Button */}
                    <div>
                      <label className="block text-[11px] font-mono uppercase text-[#aaaaaa] mb-1">
                        Upload Image File
                      </label>
                      <label className="flex items-center justify-center space-x-2 bg-[#1b1b1e] hover:bg-[#2e2f33] border border-[#2e2f33] text-white px-3 py-2 rounded-[2px] text-[12px] font-mono cursor-pointer transition-colors">
                        <Upload className="w-4 h-4 text-white" />
                        <span>Choose Image File...</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handleImageUpload(index, e.target.files[0]);
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {/* Image URL Input */}
                    <div>
                      <label className="block text-[11px] font-mono uppercase text-[#aaaaaa] mb-1">
                        Or Image Web URL
                      </label>
                      <input
                        type="text"
                        value={block.src || ''}
                        onChange={(e) => updateBlock(index, { src: e.target.value })}
                        placeholder="https://example.com/image.jpg"
                        className="w-full bg-[#1b1b1e] border border-[#2e2f33] focus:border-white text-white px-3 py-2 text-[13px] font-mono focus:outline-none rounded-[2px]"
                      />
                    </div>
                  </div>

                  {/* Size Selector & Caption Input */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-mono uppercase text-[#aaaaaa] mb-1">
                        Image Display Size
                      </label>
                      <div className="flex items-center space-x-1 font-mono text-[11px]">
                        {(['small', 'medium', 'large', 'full'] as const).map((sz) => (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => updateBlock(index, { size: sz })}
                            className={`
                              flex-1 py-1.5 uppercase rounded-[2px] border transition-colors cursor-pointer
                              ${
                                (block.size || 'full') === sz
                                  ? 'bg-white text-black font-bold border-white'
                                  : 'bg-[#1b1b1e] text-[#aaaaaa] border-[#2e2f33] hover:text-white'
                              }
                            `}
                          >
                            {sz}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono uppercase text-[#aaaaaa] mb-1">
                        Caption below image
                      </label>
                      <input
                        type="text"
                        value={block.caption || ''}
                        onChange={(e) => updateBlock(index, { caption: e.target.value })}
                        placeholder="e.g. Figure 1: Network packet flow analysis"
                        className="w-full bg-[#1b1b1e] border border-[#2e2f33] focus:border-white text-white px-3 py-1.5 text-[13px] font-serif focus:outline-none rounded-[2px]"
                      />
                    </div>
                  </div>

                  {/* Live Image Preview */}
                  {Boolean(block.src && block.src.trim()) ? (
                    <div className="pt-2">
                      <div
                        className={`
                          mx-auto bg-[#1b1b1e] rounded-[2px] overflow-hidden p-1 border border-[#2e2f33]
                          ${(block.size || 'full') === 'small' ? 'max-w-xs' : ''}
                          ${(block.size || 'full') === 'medium' ? 'max-w-md' : ''}
                          ${(block.size || 'full') === 'large' ? 'max-w-xl' : ''}
                          ${(block.size || 'full') === 'full' ? 'w-full' : ''}
                        `}
                      >
                        <img
                          src={block.src.trim()}
                          alt={block.caption || 'Preview'}
                          referrerPolicy="no-referrer"
                          className="w-full h-auto object-cover rounded-[2px]"
                          onError={(e) => {
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80';
                          }}
                        />
                        {block.caption && (
                          <p className="text-center text-[12px] font-serif text-[#aaaaaa] mt-1.5 italic">
                            {block.caption}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 text-center border border-dashed border-[#2e2f33] rounded-[2px] font-mono text-[12px] text-[#aaaaaa]">
                      Upload an image file or paste an image URL above to display preview.
                    </div>
                  )}
                </div>
              )}

              {/* 4. Code Block */}
              {block.type === 'code' && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 font-mono text-[11px]">
                    <span className="text-[#aaaaaa] uppercase">Language:</span>
                    <input
                      type="text"
                      value={block.language || 'bash'}
                      onChange={(e) => updateBlock(index, { language: e.target.value })}
                      placeholder="bash, python, js, c, etc."
                      className="bg-[#1b1b1e] border border-[#2e2f33] text-white px-2 py-1 rounded-[2px] text-[11px] focus:outline-none font-mono"
                    />
                  </div>
                  <textarea
                    rows={4}
                    value={block.text || ''}
                    onChange={(e) => updateBlock(index, { text: e.target.value })}
                    placeholder="// Paste code snippet here..."
                    className="w-full bg-[#1b1b1e] border border-[#2e2f33] focus:border-white text-white p-3 font-mono text-[13px] focus:outline-none rounded-[2px]"
                  />
                </div>
              )}

              {/* 5. Blockquote */}
              {block.type === 'blockquote' && (
                <div className="space-y-2 border-l-2 border-white pl-3">
                  <textarea
                    rows={2}
                    value={block.text || ''}
                    onChange={(e) => updateBlock(index, { text: e.target.value })}
                    placeholder="Quote text..."
                    className="w-full bg-[#1b1b1e] border border-[#2e2f33] focus:border-white text-white p-2.5 font-serif italic text-[15px] focus:outline-none rounded-[2px]"
                  />
                </div>
              )}

              {/* 6. List Block (Bulleted or Numbered) */}
              {block.type === 'list' && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 font-mono text-[11px]">
                    <span className="text-[#aaaaaa] uppercase">Type:</span>
                    <button
                      type="button"
                      onClick={() => updateBlock(index, { listType: 'bullet' })}
                      className={`px-2.5 py-1 rounded-[2px] border cursor-pointer ${
                        (block.listType || 'bullet') === 'bullet'
                          ? 'bg-white text-black font-bold border-white'
                          : 'bg-[#1b1b1e] text-[#aaaaaa] border-[#2e2f33]'
                      }`}
                    >
                      Bulleted
                    </button>
                    <button
                      type="button"
                      onClick={() => updateBlock(index, { listType: 'numbered' })}
                      className={`px-2.5 py-1 rounded-[2px] border cursor-pointer ${
                        block.listType === 'numbered'
                          ? 'bg-white text-black font-bold border-white'
                          : 'bg-[#1b1b1e] text-[#aaaaaa] border-[#2e2f33]'
                      }`}
                    >
                      Numbered
                    </button>
                  </div>

                  <div className="space-y-2 pl-2">
                    {(block.items || ['']).map((item, itemIdx) => (
                      <div key={itemIdx} className="flex items-center space-x-2 font-serif">
                        <span className="font-mono text-[12px] text-[#aaaaaa] w-5 text-right flex-shrink-0">
                          {block.listType === 'numbered' ? `${itemIdx + 1}.` : '•'}
                        </span>
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => {
                            const newItems = [...(block.items || [''])];
                            newItems[itemIdx] = e.target.value;
                            updateBlock(index, { items: newItems });
                          }}
                          placeholder={`List item ${itemIdx + 1}...`}
                          className="flex-1 bg-[#1b1b1e] border border-[#2e2f33] focus:border-white text-white px-3 py-1.5 text-[14px] focus:outline-none rounded-[2px]"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newItems = (block.items || ['']).filter((_, i) => i !== itemIdx);
                            updateBlock(index, { items: newItems.length > 0 ? newItems : [''] });
                          }}
                          className="p-1 text-red-400 hover:bg-red-500/10 rounded cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        updateBlock(index, { items: [...(block.items || []), ''] });
                      }}
                      className="inline-flex items-center space-x-1 font-mono text-[11px] text-white hover:underline cursor-pointer pt-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add List Item</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 7. Table Block */}
              {block.type === 'table' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between font-mono text-[11px] text-[#aaaaaa]">
                    <span>EDIT TABLE MATRIX</span>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          const currentData = block.tableData || [['H1', 'H2'], ['C1', 'C2']];
                          const newRow = currentData[0].map((_, c) => `Cell ${c + 1}`);
                          updateBlock(index, { tableData: [...currentData, newRow] });
                        }}
                        className="px-2 py-1 bg-[#1b1b1e] hover:bg-[#2e2f33] text-white border border-[#2e2f33] rounded-[2px] cursor-pointer"
                      >
                        + Add Row
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const currentData = block.tableData || [['H1', 'H2'], ['C1', 'C2']];
                          const newColIndex = currentData[0].length + 1;
                          const newData = currentData.map((row, rIdx) => [
                            ...row,
                            rIdx === 0 ? `Header ${newColIndex}` : `Cell ${newColIndex}`,
                          ]);
                          updateBlock(index, { tableData: newData });
                        }}
                        className="px-2 py-1 bg-[#1b1b1e] hover:bg-[#2e2f33] text-white border border-[#2e2f33] rounded-[2px] cursor-pointer"
                      >
                        + Add Column
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto border border-[#2e2f33] rounded-[2px]">
                    <table className="w-full text-left font-mono text-[12px] border-collapse">
                      <thead>
                        <tr className="bg-[#1b1b1e]">
                          {(block.tableData?.[0] || ['Header 1', 'Header 2']).map((header, cIdx) => (
                            <th key={cIdx} className="p-2 border-r border-[#2e2f33] last:border-r-0">
                              <input
                                type="text"
                                value={header}
                                onChange={(e) => {
                                  const newData = [...(block.tableData || [])];
                                  newData[0][cIdx] = e.target.value;
                                  updateBlock(index, { tableData: newData });
                                }}
                                className="w-full bg-[#212225] border border-[#2e2f33] text-white px-2 py-1 focus:outline-none uppercase font-bold"
                              />
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(block.tableData?.slice(1) || [['Val 1', 'Val 2']]).map((row, rIdx) => (
                          <tr key={rIdx} className="border-t border-[#2e2f33]">
                            {row.map((cell, cIdx) => (
                              <td key={cIdx} className="p-2 border-r border-[#2e2f33] last:border-r-0">
                                <input
                                  type="text"
                                  value={cell}
                                  onChange={(e) => {
                                    const newData = [...(block.tableData || [])];
                                    newData[rIdx + 1][cIdx] = e.target.value;
                                    updateBlock(index, { tableData: newData });
                                  }}
                                  className="w-full bg-[#1b1b1e] border border-[#2e2f33] text-[#D4D4D4] px-2 py-1 focus:outline-none"
                                />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 8. Horizontal Divider */}
              {block.type === 'hr' && (
                <div className="py-2 text-center">
                  <hr className="border-t border-[#2e2f33]" />
                  <span className="text-[11px] font-mono text-[#aaaaaa]">Horizontal Separator Line</span>
                </div>
              )}
            </div>

            {/* In-Between Add Block Bar */}
            <div className="flex items-center justify-center relative py-1">
              <button
                type="button"
                onClick={() =>
                  setActiveAddMenuIndex(activeAddMenuIndex === index ? null : index)
                }
                className="px-3 py-1 bg-[#1b1b1e] hover:bg-[#2e2f33] border border-[#2e2f33] text-[#aaaaaa] hover:text-white rounded-[2px] font-mono text-[11px] flex items-center space-x-1 cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Insert Block Below</span>
              </button>

              {activeAddMenuIndex === index && (
                <div className="absolute top-8 z-30 bg-[#212225] border border-[#2e2f33] rounded-[2px] shadow-2xl p-3 grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px] animate-fade-in w-full max-w-xl">
                  <button
                    type="button"
                    onClick={() => addBlockAt(index, 'paragraph')}
                    className="p-2 bg-[#1b1b1e] hover:bg-[#2e2f33] text-white border border-[#2e2f33] rounded flex items-center space-x-2 cursor-pointer"
                  >
                    <Pilcrow className="w-4 h-4 text-white" />
                    <span>Paragraph</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => addBlockAt(index, 'image')}
                    className="p-2 bg-[#1b1b1e] hover:bg-[#2e2f33] text-white border border-[#2e2f33] rounded flex items-center space-x-2 cursor-pointer"
                  >
                    <ImageIcon className="w-4 h-4 text-white" />
                    <span>Image</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => addBlockAt(index, 'h2')}
                    className="p-2 bg-[#1b1b1e] hover:bg-[#2e2f33] text-white border border-[#2e2f33] rounded flex items-center space-x-2 cursor-pointer"
                  >
                    <Heading2 className="w-4 h-4 text-white" />
                    <span>Heading H2</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => addBlockAt(index, 'h3')}
                    className="p-2 bg-[#1b1b1e] hover:bg-[#2e2f33] text-white border border-[#2e2f33] rounded flex items-center space-x-2 cursor-pointer"
                  >
                    <Heading3 className="w-4 h-4 text-white" />
                    <span>Heading H3</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => addBlockAt(index, 'code')}
                    className="p-2 bg-[#1b1b1e] hover:bg-[#2e2f33] text-white border border-[#2e2f33] rounded flex items-center space-x-2 cursor-pointer"
                  >
                    <Code2 className="w-4 h-4 text-white" />
                    <span>Code Block</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => addBlockAt(index, 'blockquote')}
                    className="p-2 bg-[#1b1b1e] hover:bg-[#2e2f33] text-white border border-[#2e2f33] rounded flex items-center space-x-2 cursor-pointer"
                  >
                    <Quote className="w-4 h-4 text-white" />
                    <span>Quote</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => addBlockAt(index, 'list')}
                    className="p-2 bg-[#1b1b1e] hover:bg-[#2e2f33] text-white border border-[#2e2f33] rounded flex items-center space-x-2 cursor-pointer"
                  >
                    <List className="w-4 h-4 text-white" />
                    <span>List</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => addBlockAt(index, 'table')}
                    className="p-2 bg-[#1b1b1e] hover:bg-[#2e2f33] text-white border border-[#2e2f33] rounded flex items-center space-x-2 cursor-pointer"
                  >
                    <TableIcon className="w-4 h-4 text-white" />
                    <span>Table</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
