import React, { useState, useEffect } from 'react';
import { BlogPost } from '../types';
import { getStoredPosts } from '../utils/postStore';

interface HomeViewProps {
  onSelectPost: (post: BlogPost) => void;
  onSelectCategory?: (category: string) => void;
  onSelectTag?: (tag: string) => void;
  posts?: BlogPost[];
}

export const HomeView: React.FC<HomeViewProps> = ({
  onSelectPost,
  posts: propPosts,
}) => {
  const [posts, setPosts] = useState<BlogPost[]>(propPosts || getStoredPosts());

  useEffect(() => {
    if (propPosts) {
      setPosts(propPosts);
      return;
    }

    const updatePosts = () => {
      setPosts(getStoredPosts());
    };

    window.addEventListener('posts_updated', updatePosts);
    window.addEventListener('storage', updatePosts);
    return () => {
      window.removeEventListener('posts_updated', updatePosts);
      window.removeEventListener('storage', updatePosts);
    };
  }, [propPosts]);

  return (
    <div className="animate-fade-in text-[#E0E0E0] w-full font-serif">
      {/* Posts List - Classic hacker research blog layout matching reference screenshot */}
      <section className="space-y-12 md:space-y-16">
        {posts.length === 0 ? (
          <div className="p-12 text-center bg-[#212225] border border-[#2e2f33] rounded-[2px] font-mono text-[#aaaaaa]">
            <p className="text-[16px] text-white mb-2">No research articles published yet.</p>
            <p className="text-[13px] text-[#aaaaaa]">New security writeups and research will appear here once published.</p>
          </div>
        ) : (
          posts.map((post) => (
            <article
              key={post.id}
              id={`post-card-${post.id}`}
              onClick={() => onSelectPost(post)}
              className="group cursor-pointer transition-colors"
            >
              {/* Horizontal Flex Container */}
              <div className="flex flex-col sm:flex-row items-start gap-8 md:gap-10">
                {/* Square Image Thumbnail with 2px 50% white border */}
                {Boolean(post.imageUrl && post.imageUrl.trim()) && (
                  <div className="w-[260px] h-[260px] flex-shrink-0 bg-[#212225] border-2 border-white/50 rounded-[2px] overflow-hidden">
                    <img
                      src={post.imageUrl.trim()}
                      alt={post.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80';
                      }}
                    />
                  </div>
                )}

                {/* Content Column (Aligned with top of image) */}
                <div className="flex-1 min-w-0 flex flex-col justify-start pt-0.5">
                  {/* Title - Bold Uppercase Serif */}
                  <h2 className="text-[26px] sm:text-[32px] md:text-[36px] font-bold text-white font-serif uppercase tracking-tight leading-[1.15] mb-4 group-hover:text-[#cccccc] transition-colors">
                    {post.title}
                  </h2>

                  {/* Description Excerpt */}
                  <p className="text-[15px] sm:text-[16px] text-[#D1D5DB] leading-[1.65] font-serif mb-5">
                    {post.summary}
                  </p>

                  {/* Metadata Row */}
                  <div className="flex items-center space-x-5 text-[14px] font-mono">
                    <span className="flex items-center space-x-2">
                      <span className="text-[16px]">⛏️</span>
                      <span className="text-white font-medium">{post.date}</span>
                    </span>

                    <span className="flex items-center space-x-2">
                      <span className="text-[16px]">📕</span>
                      <span className="text-white font-medium">{post.category}</span>
                    </span>

                    <span className="flex items-center">
                      <span className="text-[16px]">🧈</span>
                    </span>
                  </div>
                </div>
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
};
