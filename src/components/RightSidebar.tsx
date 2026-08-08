import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BlogPost } from '../types';
import { getStoredPosts } from '../utils/postStore';

export const RightSidebar: React.FC = () => {
  const navigate = useNavigate();
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

  const recentPosts = posts.slice(0, 5);

  // Dynamically derive tags from published posts
  const dynamicTags = Array.from(new Set(posts.flatMap((p) => p.tags || [])));

  return (
    <aside className="w-full space-y-10 sticky top-24 text-[#D4D4D4] font-serif">
      {/* Recently Updated Section */}
      <div className="space-y-3">
        <div className="pb-2 border-b border-[#2e2f33]">
          <h2 className="text-[14px] font-bold text-[#F5F5F5] font-serif uppercase tracking-wider">
            Recently Published
          </h2>
        </div>

        {recentPosts.length === 0 ? (
          <p className="text-[13px] font-mono text-[#aaaaaa]">No recent posts.</p>
        ) : (
          <ul className="space-y-3">
            {recentPosts.map((post) => (
              <li key={post.id}>
                <button
                  onClick={() => navigate(`/post/${post.slug || post.id}`)}
                  className="w-full text-left group block focus:outline-none transition-colors cursor-pointer"
                >
                  <span className="text-[13px] font-medium text-[#D4D4D4] group-hover:text-white transition-colors leading-snug block font-serif uppercase">
                    {post.title}
                  </span>
                  <span className="text-[11px] font-mono text-[#aaaaaa] block mt-0.5">
                    ⛏️ {post.date}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Topics Section */}
      <div className="space-y-3 pt-2">
        <div className="pb-2 border-b border-[#2e2f33]">
          <h2 className="text-[14px] font-bold text-[#F5F5F5] font-serif uppercase tracking-wider">
            Research Tags
          </h2>
        </div>

        {dynamicTags.length === 0 ? (
          <p className="text-[13px] font-mono text-[#aaaaaa]">No tags available.</p>
        ) : (
          <div className="flex flex-wrap gap-2 pt-1 font-mono text-[12px]">
            {dynamicTags.map((tag) => (
              <button
                key={tag}
                onClick={() => navigate(`/tags/${tag.toLowerCase()}`)}
                className="inline-flex items-center px-2 py-0.5 bg-[#212225] hover:bg-[#2e2f33] text-[#aaaaaa] hover:text-white border border-[#2e2f33] transition-colors cursor-pointer rounded-[2px]"
              >
                <span>#{tag}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
};
