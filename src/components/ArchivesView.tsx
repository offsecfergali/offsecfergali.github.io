import React, { useState, useEffect } from 'react';
import { BlogPost } from '../types';
import { getStoredPosts } from '../utils/postStore';
import { Calendar, ArrowRight } from 'lucide-react';

interface ArchivesViewProps {
  onSelectPost: (post: BlogPost) => void;
}

export const ArchivesView: React.FC<ArchivesViewProps> = ({ onSelectPost }) => {
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

  return (
    <div className="space-y-10 animate-fade-in text-[#D4D4D4] font-serif">
      <div className="space-y-2 pb-4 border-b border-[#2e2f33]">
        <h1 className="text-[32px] sm:text-[40px] font-bold text-white uppercase tracking-tight">
          Research Archives
        </h1>
        <p className="text-[15px] font-mono text-[#aaaaaa]">
          Index of all published security advisories, vulnerability analyses, and CTF writeups.
        </p>
      </div>

      <div className="space-y-4">
        {posts.length === 0 ? (
          <div className="p-8 text-center bg-[#212225] border border-[#2e2f33] rounded-[2px] font-mono text-[#aaaaaa]">
            No archives published yet.
          </div>
        ) : (
          posts.map((post) => (
            <div
              key={post.id}
              onClick={() => onSelectPost(post)}
              className="group cursor-pointer bg-[#212225] hover:bg-[#2e2f33] border border-[#2e2f33] p-5 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-[2px]"
            >
              <div className="space-y-2 min-w-0 flex-1">
                <div className="flex items-center space-x-4 text-[13px] font-mono text-white">
                  <span className="flex items-center space-x-1.5">
                    <span>⛏️</span>
                    <span>{post.date}</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center space-x-1.5">
                    <span>📕</span>
                    <span>{post.category}</span>
                  </span>
                  <span>•</span>
                  <span>{post.readTime}</span>
                </div>

                <h3 className="text-[20px] sm:text-[22px] font-bold text-white uppercase group-hover:text-[#cccccc] transition-colors leading-snug">
                  {post.title}
                </h3>
              </div>

              <div className="flex items-center space-x-1 text-[13px] font-mono text-white group-hover:translate-x-1 transition-transform self-end md:self-center">
                <span>Read</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
