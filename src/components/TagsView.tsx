import React, { useState, useEffect } from 'react';
import { BlogPost } from '../types';
import { getStoredPosts } from '../utils/postStore';
import { Tag as TagIcon, ArrowRight } from 'lucide-react';

interface TagsViewProps {
  onSelectPost: (post: BlogPost) => void;
  initialTag?: string;
}

export const TagsView: React.FC<TagsViewProps> = ({ onSelectPost, initialTag }) => {
  const [posts, setPosts] = useState<BlogPost[]>(() => getStoredPosts());

  useEffect(() => {
    const updatePosts = () => setPosts(getStoredPosts());
    window.addEventListener('posts_updated', updatePosts);
    window.addEventListener('storage', updatePosts);
    return () => {
      window.removeEventListener('posts_updated', updatePosts);
      window.removeEventListener('storage', updatePosts);
    };
  }, []);

  // Aggregate tags and count occurrences
  const tagCounts = posts.reduce((acc, post) => {
    post.tags.forEach((tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  const allTags = Object.keys(tagCounts).sort((a, b) => tagCounts[b] - tagCounts[a]);
  const [selectedTag, setSelectedTag] = useState<string>(initialTag || allTags[0] || '');

  const filteredPosts = selectedTag 
    ? posts.filter(p => p.tags.includes(selectedTag))
    : posts;

  return (
    <div className="space-y-10 animate-fade-in text-[#D4D4D4] font-serif">
      <div className="space-y-2 pb-4 border-b border-[#2e2f33]">
        <h1 className="text-[32px] sm:text-[40px] font-bold text-white uppercase tracking-tight">
          Research Tag Index
        </h1>
        <p className="text-[15px] font-mono text-[#aaaaaa]">
          Filter articles by security tags and research vectors.
        </p>
      </div>

      {/* Tag Cloud */}
      <div className="bg-[#212225] border border-[#2e2f33] p-5 space-y-3 rounded-[2px]">
        <div className="flex items-center space-x-2 text-[13px] font-mono text-white">
          <TagIcon className="w-4 h-4" />
          <span>SELECT A TAG ({allTags.length} AVAILABLE)</span>
        </div>

        {allTags.length === 0 ? (
          <p className="text-[13px] font-mono text-[#aaaaaa]">No tags available yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => {
              const count = tagCounts[tag];
              const isSelected = selectedTag === tag;
              return (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`
                    px-3 py-1 text-[13px] font-mono transition-all flex items-center space-x-2 cursor-pointer rounded-[2px]
                    ${isSelected
                      ? 'bg-white text-black font-bold'
                      : 'bg-[#2e2f33] text-[#aaaaaa] hover:text-white border border-[#2e2f33]'
                    }
                  `}
                >
                  <span>#{tag}</span>
                  <span className={`text-[11px] px-1.5 py-0.2 rounded ${isSelected ? 'bg-black/20 text-black' : 'bg-[#212225] text-white'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Filtered Posts List */}
      <div className="space-y-6 pt-2">
        <h2 className="text-[22px] font-bold text-white font-serif uppercase tracking-tight">
          Articles Tagged {selectedTag ? `#${selectedTag}` : 'None'} ({filteredPosts.length})
        </h2>

        {filteredPosts.length === 0 ? (
          <div className="p-8 text-center bg-[#212225] border border-[#2e2f33] rounded-[2px] font-mono text-[#aaaaaa]">
            No articles found with this tag.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPosts.map((post) => (
              <div
                key={post.id}
                onClick={() => onSelectPost(post)}
                className="group cursor-pointer bg-[#212225] hover:bg-[#2e2f33] border border-[#2e2f33] p-5 transition-all space-y-3 rounded-[2px]"
              >
                <div className="flex items-center justify-between text-[13px] font-mono text-white">
                  <span>⛏️ {post.date}</span>
                  <span>📕 {post.category}</span>
                </div>

                <h4 className="text-[20px] font-bold text-white uppercase group-hover:text-[#cccccc] transition-colors leading-snug">
                  {post.title}
                </h4>

                <p className="text-[15px] text-[#cccccc] leading-relaxed line-clamp-2">
                  {post.summary}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-[#2e2f33]">
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((t) => (
                      <span
                        key={t}
                        className={`text-[12px] font-mono ${t === selectedTag ? 'text-white font-bold' : 'text-[#aaaaaa]'}`}
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                  <span className="text-[13px] font-mono text-white flex items-center space-x-1 group-hover:translate-x-1 transition-transform">
                    <span>Read Article</span>
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
