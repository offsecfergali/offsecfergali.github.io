import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, ChevronRight, X, Calendar, ArrowRight } from 'lucide-react';
import { BlogPost } from '../types';
import { getStoredPosts } from '../utils/postStore';

interface TopNavBarProps {
  selectedPost?: BlogPost | null;
  selectedTag?: string;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({
  selectedPost,
  selectedTag,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [allPosts, setAllPosts] = useState<BlogPost[]>(() => getStoredPosts());
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const updatePosts = () => setAllPosts(getStoredPosts());
    window.addEventListener('posts_updated', updatePosts);
    window.addEventListener('storage', updatePosts);
    return () => {
      window.removeEventListener('posts_updated', updatePosts);
      window.removeEventListener('storage', updatePosts);
    };
  }, []);

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [searchOpen]);

  // Handle ESC key to close search modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && searchOpen) {
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchOpen]);

  const filteredPosts = searchQuery.trim() === ''
    ? []
    : allPosts.filter((post) => {
        const q = searchQuery.toLowerCase();
        return (
          post.title.toLowerCase().includes(q) ||
          post.summary.toLowerCase().includes(q) ||
          post.tags.some((t) => t.toLowerCase().includes(q)) ||
          post.category.toLowerCase().includes(q)
        );
      });

  const getBreadcrumbLabel = () => {
    if (selectedPost) {
      return (
        <>
          <button
            onClick={() => navigate('/')}
            className="hover:text-white transition-colors cursor-pointer"
          >
            Posts
          </button>
          <ChevronRight className="w-3.5 h-3.5 mx-1 text-[#6E7E6E]" />
          <span className="text-[#F5F5F5] truncate max-w-[200px] sm:max-w-[320px]">
            {selectedPost.title}
          </span>
        </>
      );
    }

    const path = location.pathname;
    if (path.startsWith('/about')) {
      return <span className="text-gray-200">About Me (/about)</span>;
    }
    if (path.startsWith('/archives')) {
      return <span className="text-gray-200">Archives (/archives)</span>;
    }
    if (path.startsWith('/tags')) {
      return (
        <span className="text-gray-200">
          Tags (/tags) {selectedTag ? `> #${selectedTag}` : ''}
        </span>
      );
    }
    return null;
  };

  return (
    <>
      {/* Top Header Navigation Bar */}
      <header className="sticky top-0 z-30 w-full bg-[#1b1b1e]/90 backdrop-blur-md border-b border-[#2e2f33] px-6 md:px-12 py-3.5 transition-colors">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* Breadcrumbs Left */}
          <nav aria-label="Breadcrumb" className="flex items-center text-[14px] font-mono text-[#aaaaaa] space-x-1.5 overflow-x-auto py-0.5">
            <button
              onClick={() => navigate('/')}
              className="hover:text-white transition-colors flex items-center cursor-pointer uppercase"
            >
              Home
            </button>
            
            {getBreadcrumbLabel() && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-[#aaaaaa] flex-shrink-0" />
                <div className="flex items-center text-[#F5F5F5] uppercase">
                  {getBreadcrumbLabel()}
                </div>
              </>
            )}
          </nav>

          {/* Search Trigger Right */}
          <button
            id="top-search-trigger"
            onClick={() => setSearchOpen(true)}
            className="flex items-center space-x-2 px-2.5 py-1 rounded-[2px] bg-[#212225] hover:bg-[#2e2f33] border border-[#2e2f33] text-[#aaaaaa] hover:text-white text-[12px] font-mono transition-colors cursor-pointer"
            title="Search articles and writeups (Ctrl+K)"
          >
            <Search className="w-3 h-3 text-white" />
            <span className="hidden sm:inline">SEARCH...</span>
            <kbd className="hidden md:inline-block px-1 py-0.2 text-[9px] font-mono bg-[#1b1b1e] border border-[#2e2f33] text-white rounded-[2px]">
              ⌘K
            </kbd>
          </button>
        </div>
      </header>

      {/* Interactive Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-2xl bg-[#212225] border border-[#2e2f33] rounded-[2px] shadow-2xl overflow-hidden font-body-serif">
            {/* Search Input Bar */}
            <div className="flex items-center px-4 py-3.5 border-b border-[#2e2f33]">
              <Search className="w-5 h-5 text-white mr-3 flex-shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search writeups, tools, tags, categories..."
                className="w-full bg-transparent text-[#F5F5F5] text-[16px] placeholder-[#aaaaaa] focus:outline-none font-mono"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="p-1 text-[#aaaaaa] hover:text-white transition-colors mr-2 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setSearchOpen(false)}
                className="px-2.5 py-1 text-xs font-mono bg-[#2e2f33] hover:bg-[#3a3b40] text-white border border-[#2e2f33] rounded-[2px] cursor-pointer"
              >
                ESC
              </button>
            </div>

            {/* Results Area */}
            <div className="max-h-[60vh] overflow-y-auto p-4 space-y-3 divide-y divide-[#2e2f33]">
              {searchQuery.trim() === '' ? (
                <div className="py-8 text-center text-[#aaaaaa] text-[14px] font-mono">
                  Type keywords to search research articles and writeups.
                </div>
              ) : filteredPosts.length === 0 ? (
                <div className="py-8 text-center text-[#aaaaaa] text-[14px]">
                  No articles found matching &quot;<span className="text-[#F5F5F5] font-medium">{searchQuery}</span>&quot;.
                </div>
              ) : (
                filteredPosts.map((post) => (
                  <button
                    key={post.id}
                    onClick={() => {
                      navigate(`/post/${post.id}`);
                      setSearchOpen(false);
                      setSearchQuery('');
                    }}
                    className="w-full text-left pt-3 first:pt-0 group block cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[12px] font-mono px-2 py-0.5 bg-[#2e2f33] text-white border border-[#2e2f33] rounded-[2px]">
                        {post.category}
                      </span>
                      <span className="text-[12px] text-[#aaaaaa] flex items-center gap-1 font-mono">
                        <Calendar className="w-3 h-3" />
                        {post.date}
                      </span>
                    </div>
                    <h3 className="text-[18px] font-bold text-[#F5F5F5] font-display uppercase group-hover:text-white transition-colors flex items-center justify-between">
                      <span>{post.title}</span>
                      <ArrowRight className="w-4 h-4 text-[#aaaaaa] group-hover:text-white opacity-0 group-hover:opacity-100 transition-all -translate-x-1 group-hover:translate-x-0" />
                    </h3>
                    <p className="text-[14px] text-[#D4D4D4] line-clamp-2 mt-1 font-normal">
                      {post.summary}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
