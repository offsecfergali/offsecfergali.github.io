import React, { useState } from 'react';
import { Rss, Copy, Check, X } from 'lucide-react';
import { getStoredProfile } from '../utils/profileStore';
import { getAllPostsFromStorage } from '../utils/postStore';

interface RssModalProps {
  onClose: () => void;
}

export const RssModal: React.FC<RssModalProps> = ({ onClose }) => {
  const [copied, setCopied] = useState(false);
  const profile = getStoredProfile();
  const posts = getAllPostsFromStorage();

  const rssFeedXml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${profile.name}</title>
    <link>https://offsecfergali.blog</link>
    <description>${profile.bio}</description>
    <language>en-us</language>
    ${posts.map(p => `
    <item>
      <title>${p.title}</title>
      <link>https://offsecfergali.blog/posts/${p.id}</link>
      <pubDate>${p.date}</pubDate>
      <category>${p.category}</category>
      <description>${p.summary}</description>
    </item>`).join('')}
  </channel>
</rss>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(rssFeedXml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#212225] border border-[#2e2f33] rounded-[2px] w-full max-w-xl p-6 shadow-2xl space-y-4 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-[2px] bg-[#2e2f33] text-[#aaaaaa] hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-[2px] bg-[#2e2f33] text-white">
            <Rss className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white font-mono uppercase">
              RSS 2.0 / Atom Feed
            </h3>
            <p className="text-xs text-[#aaaaaa] font-serif">
              Subscribe using Feedly, NetNewsWire, or your favorite feed reader
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-[#aaaaaa]">
            <span>FEED XML SPECIFICATION</span>
            <button
              onClick={handleCopy}
              className="inline-flex items-center space-x-1 text-white hover:underline cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied XML' : 'Copy XML'}</span>
            </button>
          </div>

          <div className="bg-[#1b1b1e] border border-[#2e2f33] rounded-[2px] p-4 max-h-60 overflow-y-auto font-mono text-[11px] text-[#D4D4D4] custom-scrollbar">
            <pre><code>{rssFeedXml}</code></pre>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-[2px] bg-[#2e2f33] hover:bg-[#3a3b40] text-white text-xs font-mono transition-colors cursor-pointer"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
};
