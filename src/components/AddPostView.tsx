import React, { useState, useRef } from 'react';
import { Terminal, Image as ImageIcon, Send, Eye, Edit3, Check, Tag, Calendar, Clock, BookOpen, Upload, Plus } from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { addStoredPost } from '../utils/postStore';
import { BlogPost } from '../types';
import { compressAndSaveImage, resolveImageUrl, customUrlTransform } from '../utils/imageUtils';

interface AddPostViewProps {
  onPostPublished: (newPost: BlogPost) => void;
}

const PRESET_IMAGES = [
  {
    name: 'Cosmic Cyber',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Hacker Skull',
    url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Cyber Circuit',
    url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Dark Matrix',
    url: 'https://images.unsplash.com/photo-1510511459019-5dee997dd1db?auto=format&fit=crop&w=600&q=80',
  },
];

export const AddPostView: React.FC<AddPostViewProps> = ({ onPostPublished }) => {
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [category, setCategory] = useState<'InfoSec' | 'Crypto' | 'CTFs' | 'Research'>('InfoSec');
  const [date, setDate] = useState(() => {
    const today = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[today.getMonth()]} ${today.getDate()}, ${today.getFullYear()}`;
  });
  const [readTime, setReadTime] = useState('5 min read');
  const [imageUrl, setImageUrl] = useState(PRESET_IMAGES[0].url);
  const [tags, setTags] = useState('hacking, pentest, research');
  const [content, setContent] = useState(`### Research Summary

Write your technical vulnerability analysis, exploit chain, or security research here...

\`\`\`bash
# Example command block
$ ./exploit --target 10.10.10.10 --port 443
\`\`\`
`);

  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');
  const [isSuccess, setIsSuccess] = useState(false);
  const [showImageUrlModal, setShowImageUrlModal] = useState(false);
  const [modalImgUrl, setModalImgUrl] = useState('');
  const [modalImgCaption, setModalImgCaption] = useState('');
  const contentImageFileInputRef = useRef<HTMLInputElement>(null);

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressAndSaveImage(file, `thumb_${Date.now()}`, 1000, 800, 0.85);
        setImageUrl(compressed);
      } catch (err) {
        console.error('Thumbnail upload failed:', err);
        alert('Failed to process image file.');
      }
    }
  };

  const handleContentImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressAndSaveImage(file, `article_img_${Date.now()}`, 1200, 900, 0.85);
        const imageMarkdown = `\n\n![${file.name.replace(/\.[^/.]+$/, '')}](${compressed})\n\n`;
        setContent((prev) => prev + imageMarkdown);
      } catch (err) {
        console.error('Article image upload failed:', err);
        alert('Failed to process image file.');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !summary.trim() || !content.trim()) {
      alert('Please fill out Title, Summary, and Article Content.');
      return;
    }

    const tagArray = tags
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);

    const newPost = addStoredPost({
      title: title.trim().toUpperCase(),
      summary: summary.trim(),
      category,
      date: date.trim() || 'Jun 2, 1337',
      readTime: readTime.trim() || '5 min read',
      imageUrl: imageUrl.trim() || PRESET_IMAGES[0].url,
      tags: tagArray.length > 0 ? tagArray : ['hacking', 'research'],
      content: content.trim(),
      featured: true,
    });

    setIsSuccess(true);
    setTimeout(() => {
      onPostPublished(newPost);
    }, 600);
  };

  return (
    <div className="animate-fade-in text-[#D4D4D4] max-w-[920px] mx-auto font-serif pb-16">
      {/* Header Banner */}
      <div className="border-b border-[#2A352A] pb-6 mb-8">
        <div className="flex items-center space-x-3 text-[#38a169] mb-2 font-mono text-[14px]">
          <Terminal className="w-5 h-5" />
          <span>root@offsecfergali:~/journal/post$ ./new_post.sh</span>
        </div>
        <h1 className="text-[28px] sm:text-[34px] font-bold text-white uppercase tracking-tight font-serif">
          Publish New Research Entry
        </h1>
        <p className="text-[15px] text-[#A0AFA0] mt-1 font-serif">
          Create and publish offensive security, exploit dynamics, or cryptographic research writeups.
        </p>
      </div>

      {isSuccess ? (
        <div className="bg-[#0E160E] border border-[#38a169] p-8 rounded-[2px] text-center space-y-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#162B16] text-[#38a169]">
            <Check className="w-6 h-6" />
          </div>
          <h2 className="text-[22px] font-bold text-white uppercase tracking-wide">
            Article Published Successfully!
          </h2>
          <p className="text-[#A0AFA0] text-[15px] font-mono">
            Redirecting to article entry...
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Title & Category Row */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-8 space-y-2">
              <label className="block text-[13px] font-mono text-[#38a169] uppercase tracking-wider">
                Article Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. YOUR RANDOM EMAIL ADRESS WAS ALREADY HACKED"
                required
                className="w-full bg-[#0A0F0A] border border-[#2A352A] focus:border-[#38a169] text-white px-4 py-3 text-[16px] font-serif uppercase tracking-tight focus:outline-none transition-colors rounded-[2px]"
              />
            </div>

            <div className="md:col-span-4 space-y-2">
              <label className="block text-[13px] font-mono text-[#38a169] uppercase tracking-wider">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full bg-[#0A0F0A] border border-[#2A352A] focus:border-[#38a169] text-white px-4 py-3 text-[15px] font-mono focus:outline-none transition-colors rounded-[2px]"
              >
                <option value="InfoSec">InfoSec</option>
                <option value="Crypto">Crypto</option>
                <option value="CTFs">CTFs</option>
                <option value="Research">Research</option>
              </select>
            </div>
          </div>

          {/* Excerpt / Summary */}
          <div className="space-y-2">
            <label className="block text-[13px] font-mono text-[#38a169] uppercase tracking-wider">
              Summary / Excerpt *
            </label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={3}
              placeholder="Brief summary of the research or vulnerability..."
              required
              className="w-full bg-[#0A0F0A] border border-[#2A352A] focus:border-[#38a169] text-[#D1D5DB] p-4 text-[15px] font-serif focus:outline-none transition-colors rounded-[2px] leading-relaxed"
            />
          </div>

          {/* Date, Read Time, Tags Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="block text-[13px] font-mono text-[#38a169] uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Date
              </label>
              <input
                type="text"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                placeholder="e.g. Jun 2, 1337"
                className="w-full bg-[#0A0F0A] border border-[#2A352A] focus:border-[#38a169] text-white px-3.5 py-2.5 text-[14px] font-mono focus:outline-none transition-colors rounded-[2px]"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[13px] font-mono text-[#38a169] uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Read Time
              </label>
              <input
                type="text"
                value={readTime}
                onChange={(e) => setReadTime(e.target.value)}
                placeholder="e.g. 5 min read"
                className="w-full bg-[#0A0F0A] border border-[#2A352A] focus:border-[#38a169] text-white px-3.5 py-2.5 text-[14px] font-mono focus:outline-none transition-colors rounded-[2px]"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[13px] font-mono text-[#38a169] uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" /> Tags (Comma separated)
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="hacking, glpi, ad"
                className="w-full bg-[#0A0F0A] border border-[#2A352A] focus:border-[#38a169] text-white px-3.5 py-2.5 text-[14px] font-mono focus:outline-none transition-colors rounded-[2px]"
              />
            </div>
          </div>

          {/* Thumbnail Selection */}
          <div className="space-y-3">
            <label className="block text-[13px] font-mono text-[#38a169] uppercase tracking-wider flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5" /> Thumbnail Image
            </label>
            
            {/* Presets */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {PRESET_IMAGES.map((preset) => {
                const isSelected = imageUrl === preset.url;
                return (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => setImageUrl(preset.url)}
                    className={`relative border p-1 rounded-[2px] overflow-hidden text-left cursor-pointer transition-all ${
                      isSelected ? 'border-[#38a169] bg-[#162216]' : 'border-[#2A352A] bg-[#0A0F0A] hover:border-[#38a169]/50'
                    }`}
                  >
                    <img src={preset.url || undefined} alt={preset.name} className="w-full h-24 object-cover mb-1 border border-white/20" />
                    <span className="text-[11px] font-mono text-[#A0AFA0] block truncate px-1">
                      {preset.name}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Upload or Custom Image URL */}
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Or enter custom image URL (https://..., drive.google.com, etc.)"
                className="flex-1 bg-[#0A0F0A] border border-[#2A352A] focus:border-[#38a169] text-white px-3.5 py-2.5 text-[14px] font-mono focus:outline-none transition-colors rounded-[2px]"
              />

              <label className="inline-flex items-center justify-center px-4 py-2 bg-[#162216] hover:bg-[#203020] border border-[#2A352A] text-[#38a169] font-mono text-[13px] uppercase cursor-pointer rounded-[2px] space-x-2 flex-shrink-0">
                <Upload className="w-4 h-4" />
                <span>Upload Picture</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Article Markdown Content Editor */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#2A352A] pb-2 gap-2">
              <label className="text-[13px] font-mono text-[#38a169] uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" /> Article Content (Markdown) *
              </label>
              
              <div className="flex flex-wrap items-center gap-2">
                {/* Insert Image Controls */}
                <label className="inline-flex items-center space-x-1.5 bg-[#162216] hover:bg-[#203020] border border-[#2A352A] text-[#38a169] px-3 py-1 rounded-[2px] text-[12px] font-mono uppercase cursor-pointer transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Insert Picture File</span>
                  <input
                    ref={contentImageFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleContentImageUpload}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={() => setShowImageUrlModal(true)}
                  className="inline-flex items-center space-x-1.5 bg-[#162216] hover:bg-[#203020] border border-[#2A352A] text-[#38a169] px-3 py-1 rounded-[2px] text-[12px] font-mono uppercase cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Insert Picture URL</span>
                </button>

                {/* Write / Preview Mode Toggle */}
                <div className="flex items-center space-x-1 font-mono text-[12px] bg-[#0A0F0A] p-0.5 border border-[#2A352A] rounded-[2px]">
                  <button
                    type="button"
                    onClick={() => setActiveTab('write')}
                    className={`px-3 py-1 flex items-center space-x-1.5 transition-colors ${
                      activeTab === 'write' ? 'bg-[#38a169] text-black font-semibold' : 'text-[#8A9B8A] hover:text-white'
                    }`}
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>WRITE</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('preview')}
                    className={`px-3 py-1 flex items-center space-x-1.5 transition-colors ${
                      activeTab === 'preview' ? 'bg-[#38a169] text-black font-semibold' : 'text-[#8A9B8A] hover:text-white'
                    }`}
                  >
                    <Eye className="w-3 h-3" />
                    <span>PREVIEW</span>
                  </button>
                </div>
              </div>
            </div>

            {activeTab === 'write' ? (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={14}
                required
                placeholder="Write article in Markdown format..."
                className="w-full bg-[#0A0F0A] border border-[#2A352A] focus:border-[#38a169] text-white p-4 font-mono text-[14px] leading-relaxed focus:outline-none transition-colors rounded-[2px]"
              />
            ) : (
              <div className="w-full min-h-[320px] bg-[#0A0F0A] border border-[#2A352A] p-6 rounded-[2px] prose prose-invert max-w-none text-[#D1D5DB] font-serif">
                <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} urlTransform={customUrlTransform}>{content || '*No content written yet.*'}</Markdown>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-4 flex items-center justify-end space-x-4 border-t border-[#2A352A]">
            <button
              type="submit"
              className="px-6 py-3 bg-[#38a169] hover:bg-[#2f855a] text-black font-mono font-bold text-[14px] uppercase tracking-wider flex items-center space-x-2 transition-colors cursor-pointer rounded-[2px] shadow-sm"
            >
              <Send className="w-4 h-4" />
              <span>Publish Research Entry</span>
            </button>
          </div>
        </form>
      )}

      {/* Modal for Inserting Picture URL */}
      {showImageUrlModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121812] border border-[#2A352A] rounded-[2px] p-6 max-w-md w-full space-y-4 shadow-2xl animate-fade-in text-white font-mono">
            <h3 className="text-[16px] font-bold text-[#38a169] uppercase flex items-center gap-2">
              <ImageIcon className="w-4 h-4" /> Insert Picture Web URL
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-[12px] uppercase text-[#8A9B8A] mb-1">
                  Image Web URL (or data URL)
                </label>
                <input
                  type="text"
                  autoFocus
                  value={modalImgUrl}
                  onChange={(e) => setModalImgUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/... or data:image/..."
                  className="w-full bg-[#0A0F0A] border border-[#2A352A] focus:border-[#38a169] text-white px-3 py-2 text-[13px] focus:outline-none rounded-[2px]"
                />
              </div>

              <div>
                <label className="block text-[12px] uppercase text-[#8A9B8A] mb-1">
                  Picture Caption (Optional)
                </label>
                <input
                  type="text"
                  value={modalImgCaption}
                  onChange={(e) => setModalImgCaption(e.target.value)}
                  placeholder="e.g. Architecture diagram of vulnerability"
                  className="w-full bg-[#0A0F0A] border border-[#2A352A] focus:border-[#38a169] text-white px-3 py-2 text-[13px] focus:outline-none rounded-[2px]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowImageUrlModal(false);
                  setModalImgUrl('');
                  setModalImgCaption('');
                }}
                className="px-4 py-2 border border-[#2A352A] hover:bg-[#1f2d1f] text-[#aaaaaa] hover:text-white text-[12px] uppercase rounded-[2px] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (modalImgUrl.trim()) {
                    const cap = modalImgCaption.trim() || 'Article Image';
                    setContent((prev) => `${prev}\n\n![${cap}](${modalImgUrl.trim()})\n\n`);
                    setShowImageUrlModal(false);
                    setModalImgUrl('');
                    setModalImgCaption('');
                  }
                }}
                className="px-4 py-2 bg-[#38a169] hover:bg-[#2f855a] text-black font-bold text-[12px] uppercase rounded-[2px] cursor-pointer"
              >
                Insert Picture
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
