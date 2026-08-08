import React, { useState } from 'react';
import { BlogPost } from '../types';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { resolveImageUrl, customUrlTransform } from '../utils/imageUtils';
import { LightboxModal } from './LightboxModal';
import { CodeBlockWithCopy } from './CodeBlockWithCopy';
import { VideoEmbed } from './VideoEmbed';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Check, 
  Copy, 
  Bookmark, 
  Tag as TagIcon,
  List,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  User
} from 'lucide-react';

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface PostDetailModalProps {
  post: BlogPost;
  allPosts?: BlogPost[];
  onClose: () => void;
  onSelectTag: (tag: string) => void;
  onSelectPost?: (post: BlogPost) => void;
}

export const PostDetailModal: React.FC<PostDetailModalProps> = ({
  post,
  allPosts = [],
  onClose,
  onSelectTag,
  onSelectPost,
}) => {
  const [copied, setCopied] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [showToc, setShowToc] = useState(true);
  const [lightboxImg, setLightboxImg] = useState<{ url: string; caption?: string; alt?: string } | null>(null);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Extract Table of Contents from headings
  const extractToc = (content: string): TocItem[] => {
    const lines = content.split('\n');
    const items: TocItem[] = [];

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('## ')) {
        const text = trimmed.replace(/^##\s+/, '').replace(/#*$/, '').trim();
        const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        if (text) items.push({ id, text, level: 2 });
      } else if (trimmed.startsWith('### ')) {
        const text = trimmed.replace(/^###\s+/, '').replace(/#*$/, '').trim();
        const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        if (text) items.push({ id, text, level: 3 });
      }
    });

    return items;
  };

  const tocItems = extractToc(post.content || '');

  // Calculate Previous and Next posts
  const currentIndex = allPosts.findIndex((p) => p.id === post.id || p.slug === post.slug);
  const prevPost = currentIndex > 0 ? allPosts[currentIndex - 1] : null;
  const nextPost = currentIndex >= 0 && currentIndex < allPosts.length - 1 ? allPosts[currentIndex + 1] : null;

  return (
    <div className="animate-fade-in text-[#D4D4D4] font-serif">
      {/* Centered Medium-Style Article Layout Column */}
      <div className="max-w-[780px] mx-auto space-y-8">
        
        {/* Top Control Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-[#2e2f33] font-mono text-[14px]">
          <button
            id="back-to-articles-button"
            onClick={onClose}
            className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-[2px] bg-[#212225] hover:bg-[#2e2f33] border border-[#2e2f33] text-[#F5F5F5] transition-colors cursor-pointer uppercase tracking-wider text-[13px]"
          >
            <ArrowLeft className="w-4 h-4 text-white" />
            <span>Back to Journal</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setBookmarked(!bookmarked)}
              className={`p-2 rounded-[2px] text-[14px] transition-colors border cursor-pointer ${
                bookmarked ? 'bg-white text-black border-white' : 'bg-[#212225] hover:bg-[#2e2f33] border-[#2e2f33] text-[#aaaaaa]'
              }`}
              title="Bookmark Article"
            >
              <Bookmark className="w-4 h-4" />
            </button>

            <button
              onClick={handleCopyLink}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-[2px] bg-[#212225] hover:bg-[#2e2f33] border border-[#2e2f33] text-[#F5F5F5] transition-colors cursor-pointer uppercase tracking-wider text-[13px]"
              title="Copy Share Link"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-[#aaaaaa]" />}
              <span>{copied ? 'Copied' : 'Share'}</span>
            </button>
          </div>
        </div>

        {/* Featured Image - Complete Original Image without Borders or Frames */}
        {Boolean(post.imageUrl && post.imageUrl.trim()) && (
          <div 
            onClick={() => setLightboxImg({ url: resolveImageUrl(post.imageUrl), caption: post.title, alt: post.title })}
            className="w-full cursor-zoom-in group my-2 overflow-hidden"
          >
            <img
              src={resolveImageUrl(post.imageUrl)}
              alt={post.title}
              referrerPolicy="no-referrer"
              className="w-full h-auto object-contain transition-opacity duration-300 group-hover:opacity-95"
              onError={(e) => {
                if (!e.currentTarget.dataset.fallback) {
                  e.currentTarget.dataset.fallback = 'true';
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80';
                }
              }}
            />
          </div>
        )}

        {/* Article Metadata & Header */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 font-mono text-[13px]">
            <span className="px-2.5 py-1 rounded-[2px] bg-[#212225] text-white border border-[#2e2f33] uppercase font-bold tracking-wider">
              {post.category}
            </span>
          </div>

          {/* Medium 52px Headline */}
          <h1 className="text-[34px] sm:text-[44px] md:text-[52px] font-bold text-white font-serif leading-[1.15] tracking-tight">
            {post.title}
          </h1>

          {/* Author • Date • Reading Time */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[14px] font-sans text-[#aaaaaa] border-b border-[#2e2f33] pb-6">
            <span className="flex items-center space-x-1.5 text-white font-medium">
              <User className="w-4 h-4 text-white" />
              <span>Security Researcher</span>
            </span>
            <span>•</span>
            <span className="flex items-center space-x-1.5">
              <Calendar className="w-4 h-4 text-[#aaaaaa]" />
              <span>{post.date}</span>
            </span>
            <span>•</span>
            <span className="flex items-center space-x-1.5">
              <Clock className="w-4 h-4 text-[#aaaaaa]" />
              <span>{post.readTime}</span>
            </span>
          </div>

          {/* Subheading / Summary */}
          {post.summary && (
            <p className="text-[19px] sm:text-[21px] text-[#e0e0e0] font-serif leading-[1.6] italic border-l-2 border-white/60 pl-4 py-1">
              {post.summary}
            </p>
          )}
        </div>

        {/* Table of Contents Box */}
        {tocItems.length > 0 && (
          <div className="my-6 p-4 sm:p-5 bg-[#141518] border border-[#2e2f33] rounded-[2px] font-sans">
            <button
              onClick={() => setShowToc(!showToc)}
              className="w-full flex items-center justify-between text-white font-bold text-[15px] uppercase tracking-wider font-mono cursor-pointer"
            >
              <div className="flex items-center space-x-2">
                <List className="w-4 h-4 text-white" />
                <span>Table of Contents ({tocItems.length} Sections)</span>
              </div>
              {showToc ? <ChevronUp className="w-4 h-4 text-[#aaaaaa]" /> : <ChevronDown className="w-4 h-4 text-[#aaaaaa]" />}
            </button>

            {showToc && (
              <ul className="mt-4 space-y-2 font-serif text-[15px] border-t border-[#2e2f33] pt-3">
                {tocItems.map((item, idx) => (
                  <li
                    key={idx}
                    style={{ paddingLeft: item.level === 3 ? '1.25rem' : '0' }}
                  >
                    <a
                      href={`#${item.id}`}
                      className="text-[#aaaaaa] hover:text-white transition-colors flex items-center space-x-2"
                      onClick={(e) => {
                        e.preventDefault();
                        const el = document.getElementById(item.id);
                        if (el) {
                          el.scrollIntoView({ behavior: 'smooth' });
                        }
                      }}
                    >
                      <span className="font-mono text-[12px] text-white/50">•</span>
                      <span>{item.text}</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Article Body Content */}
        <div className="prose prose-invert max-w-none text-[#D4D4D4] font-serif text-[19px] sm:text-[21px] leading-[1.8] space-y-6">
          <Markdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            urlTransform={customUrlTransform}
            components={{
              p({ children }) {
                const textContent = typeof children === 'string' ? children.trim() : '';
                
                // Video embed check
                if (textContent && textContent.startsWith('http') && (textContent.includes('youtube.com') || textContent.includes('youtu.be') || textContent.includes('vimeo.com'))) {
                  return <VideoEmbed url={textContent} />;
                }

                // Direct standalone image URL check
                const isImgUrl =
                  textContent &&
                  (textContent.startsWith('data:image/') ||
                    textContent.startsWith('blob:') ||
                    /\.(jpg|jpeg|png|webp|gif|svg|avif)(\?.*)?$/i.test(textContent) ||
                    (textContent.startsWith('http') &&
                      (textContent.includes('images.unsplash.com') ||
                        textContent.includes('imgur.com') ||
                        textContent.includes('githubusercontent.com'))));

                if (isImgUrl) {
                  const resolvedImg = resolveImageUrl(textContent);
                  return (
                    <figure className="my-8 group cursor-pointer w-full mx-auto">
                      <img
                        src={resolvedImg}
                        alt="Article image"
                        referrerPolicy="no-referrer"
                        className="w-full h-auto rounded-[2px] hover:opacity-95 transition-opacity cursor-zoom-in"
                        onClick={() => setLightboxImg({ url: resolvedImg, caption: '', alt: '' })}
                        onError={(e) => {
                          if (!e.currentTarget.dataset.fallback) {
                            e.currentTarget.dataset.fallback = 'true';
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80';
                          }
                        }}
                      />
                    </figure>
                  );
                }

                return <div className="mb-8 leading-[1.8] text-[#D4D4D4]">{children}</div>;
              },
              img({ src, alt, title }) {
                if (!src || !src.trim()) return null;
                let actualSrc = resolveImageUrl(src);
                let captionText = alt || '';
                let sizeClass = 'w-full mx-auto';

                // Extract clean URL if src contains pipe separator
                if (actualSrc.includes('|')) {
                  const parts = actualSrc.split('|');
                  actualSrc = resolveImageUrl(parts[0].trim());
                  if (parts[1] && !captionText) {
                    captionText = parts[1].trim();
                  }
                }

                if (title) {
                  if (title.includes('small')) sizeClass = 'max-w-xs mx-auto';
                  else if (title.includes('medium')) sizeClass = 'max-w-md mx-auto';
                  else if (title.includes('large')) sizeClass = 'max-w-2xl mx-auto';
                  else if (title.includes('full')) sizeClass = 'w-full mx-auto';

                  const parts = title.split('|');
                  if (parts[0] && parts[0] !== 'small' && parts[0] !== 'medium' && parts[0] !== 'large' && parts[0] !== 'full') {
                    captionText = parts[0].trim();
                  }
                }

                if (!actualSrc) return null;

                return (
                  <figure className={`my-8 group cursor-pointer ${sizeClass}`}>
                    <img
                      src={actualSrc}
                      alt={captionText || 'Article image'}
                      referrerPolicy="no-referrer"
                      className="w-full h-auto rounded-[2px] hover:opacity-95 transition-opacity cursor-zoom-in"
                      onClick={() => setLightboxImg({ url: actualSrc, caption: captionText, alt: captionText })}
                      onError={(e) => {
                        console.warn('Article image failed to load:', actualSrc);
                      }}
                    />
                    {captionText && (
                      <figcaption className="text-center font-serif text-[14px] text-[#aaaaaa] mt-3 italic">
                        {captionText}
                      </figcaption>
                    )}
                  </figure>
                );
              },
              table({ children }) {
                return (
                  <div className="overflow-x-auto my-8 border border-[#2e2f33] rounded-[2px]">
                    <table className="w-full text-left font-sans text-[15px] border-collapse">
                      {children}
                    </table>
                  </div>
                );
              },
              thead({ children }) {
                return <thead className="bg-[#1b1b1e] border-b border-[#2e2f33] text-white font-mono uppercase text-[13px]">{children}</thead>;
              },
              th({ children }) {
                return <th className="p-3.5 font-bold border-r border-[#2e2f33] last:border-r-0">{children}</th>;
              },
              td({ children }) {
                return <td className="p-3.5 border-t border-r border-[#2e2f33] last:border-r-0 text-[#D4D4D4]">{children}</td>;
              },
              tr({ children }) {
                return <tr className="hover:bg-[#1b1b1e]/60 transition-colors">{children}</tr>;
              },
              blockquote({ children }) {
                return (
                  <blockquote className="border-l-4 border-white pl-5 py-2 my-8 italic text-[#E0E0E0] text-[20px] font-serif">
                    {children}
                  </blockquote>
                );
              },
              code({ className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '');
                const codeString = String(children).replace(/\n$/, '');

                if (match) {
                  return (
                    <CodeBlockWithCopy
                      language={match[1]}
                      code={codeString}
                    />
                  );
                }

                // Inline code snippet
                return (
                  <code className="bg-[#1b1b1e] text-white px-2 py-0.5 rounded-[2px] font-mono text-[15px] border border-[#2e2f33]" {...props}>
                    {children}
                  </code>
                );
              },
              hr() {
                return <hr className="border-t border-[#2e2f33] my-10" />;
              },
              h1({ children }) {
                const text = String(children || '');
                const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                return (
                  <h1 id={id} className="text-[32px] sm:text-[40px] font-bold text-white font-serif tracking-tight mt-12 mb-6 border-b border-[#2e2f33] pb-3 scroll-mt-24">
                    {children}
                  </h1>
                );
              },
              h2({ children }) {
                const text = String(children || '');
                const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                return (
                  <h2 id={id} className="text-[26px] sm:text-[32px] font-bold text-white font-serif tracking-tight mt-10 mb-4 border-b border-[#2e2f33] pb-2 scroll-mt-24">
                    {children}
                  </h2>
                );
              },
              h3({ children }) {
                const text = String(children || '');
                const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                return (
                  <h3 id={id} className="text-[22px] sm:text-[25px] font-semibold text-white font-serif tracking-wide mt-8 mb-3 scroll-mt-24">
                    {children}
                  </h3>
                );
              },
              h4({ children }) {
                const text = String(children || '');
                const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                return (
                  <h4 id={id} className="text-[18px] sm:text-[20px] font-semibold text-white font-serif mt-6 mb-2">
                    {children}
                  </h4>
                );
              },
              ul({ children }) {
                return <ul className="list-disc pl-8 space-y-3 my-6 text-[#D4D4D4]">{children}</ul>;
              },
              ol({ children }) {
                return <ol className="list-decimal pl-8 space-y-3 my-6 text-[#D4D4D4]">{children}</ol>;
              }
            }}
          >
            {post.content}
          </Markdown>
        </div>

        {/* Tags Section */}
        <div className="pt-8 border-t border-[#2e2f33] flex flex-wrap items-center gap-2 font-mono">
          <span className="text-[14px] text-[#aaaaaa] flex items-center space-x-1.5 mr-2 font-bold uppercase">
            <TagIcon className="w-4 h-4 text-white" />
            <span>TAGS:</span>
          </span>
          {post.tags.map((tag) => (
            <button
              key={tag}
              onClick={() => {
                onClose();
                onSelectTag(tag);
              }}
              className="text-[13px] px-3.5 py-1.5 rounded-[2px] bg-[#1b1b1e] hover:bg-[#2e2f33] border border-[#2e2f33] text-[#aaaaaa] hover:text-white transition-colors cursor-pointer"
            >
              #{tag}
            </button>
          ))}
        </div>

        {/* Previous / Next Article Navigation Footer */}
        {(prevPost || nextPost) && (
          <div className="pt-8 border-t border-[#2e2f33] grid grid-cols-1 sm:grid-cols-2 gap-4 font-sans">
            {prevPost ? (
              <button
                onClick={() => {
                  if (onSelectPost) onSelectPost(prevPost);
                }}
                className="p-4 rounded-[2px] bg-[#1b1b1e] hover:bg-[#2e2f33] border border-[#2e2f33] text-left transition-colors cursor-pointer group space-y-1"
              >
                <div className="flex items-center space-x-1.5 text-[12px] font-mono text-[#aaaaaa] group-hover:text-white transition-colors">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>PREVIOUS ARTICLE</span>
                </div>
                <div className="font-serif font-bold text-white text-[16px] line-clamp-1 group-hover:underline">
                  {prevPost.title}
                </div>
                <div className="text-[12px] text-[#888888]">
                  {prevPost.date} • {prevPost.category}
                </div>
              </button>
            ) : <div />}

            {nextPost && (
              <button
                onClick={() => {
                  if (onSelectPost) onSelectPost(nextPost);
                }}
                className="p-4 rounded-[2px] bg-[#1b1b1e] hover:bg-[#2e2f33] border border-[#2e2f33] text-right transition-colors cursor-pointer group space-y-1 sm:col-start-2"
              >
                <div className="flex items-center justify-end space-x-1.5 text-[12px] font-mono text-[#aaaaaa] group-hover:text-white transition-colors">
                  <span>NEXT ARTICLE</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
                <div className="font-serif font-bold text-white text-[16px] line-clamp-1 group-hover:underline">
                  {nextPost.title}
                </div>
                <div className="text-[12px] text-[#888888]">
                  {nextPost.date} • {nextPost.category}
                </div>
              </button>
            )}
          </div>
        )}

      </div>

      {/* Lightbox Modal for Image Zoom */}
      {lightboxImg && (
        <LightboxModal
          imageUrl={lightboxImg.url}
          caption={lightboxImg.caption}
          altText={lightboxImg.alt}
          onClose={() => setLightboxImg(null)}
        />
      )}
    </div>
  );
};
