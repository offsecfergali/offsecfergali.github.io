import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useParams, Navigate } from 'react-router-dom';
import { BlogPost } from './types';
import { getStoredPosts, fetchAndSyncPublicPosts } from './utils/postStore';
import { Sidebar } from './components/Sidebar';
import { TopNavBar } from './components/TopNavBar';
import { RightSidebar } from './components/RightSidebar';
import { Footer } from './components/Footer';
import { RssModal } from './components/RssModal';
import { HomeView } from './components/HomeView';
import { AboutView } from './components/AboutView';
import { ArchivesView } from './components/ArchivesView';
import { TagsView } from './components/TagsView';
import { AdminEditView } from './components/AdminEditView';
import { PostDetailModal } from './components/PostDetailModal';

function PostDetailRoute() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<BlogPost[]>(() => getStoredPosts());

  useEffect(() => {
    const update = () => setPosts(getStoredPosts());
    window.addEventListener('posts_updated', update);
    window.addEventListener('storage', update);
    return () => {
      window.removeEventListener('posts_updated', update);
      window.removeEventListener('storage', update);
    };
  }, []);

  const post = posts.find((p) => p.id === id || p.slug === id);

  if (!post) {
    return (
      <div className="space-y-4 py-12 text-center text-[#aaaaaa] font-mono">
        <p className="text-[18px]">Article directory not found or deleted.</p>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-[#212225] border border-[#2e2f33] text-white rounded-[2px] cursor-pointer hover:bg-[#2e2f33] transition-colors"
        >
          Return to / (Home Directory)
        </button>
      </div>
    );
  }

  return (
    <PostDetailModal
      post={post}
      allPosts={posts}
      onClose={() => navigate('/')}
      onSelectTag={(tag) => navigate(`/tags/${tag}`)}
      onSelectPost={(p) => navigate(`/post/${p.slug || p.id}`)}
    />
  );
}

function TagsRoute() {
  const { tag } = useParams<{ tag: string }>();
  const navigate = useNavigate();

  return (
    <TagsView
      onSelectPost={(post) => navigate(`/post/${post.slug || post.id}`)}
      initialTag={tag}
    />
  );
}

export default function App() {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [rssModalOpen, setRssModalOpen] = useState<boolean>(false);
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);

  useEffect(() => {
    fetchAndSyncPublicPosts();
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-[#1b1b1e] text-[#D4D4D4]' : 'bg-slate-50 text-slate-900'} font-serif flex flex-col`}>
      {/* Left Sidebar Navigation */}
      <Sidebar
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        onOpenRss={() => setRssModalOpen(true)}
        mobileOpen={mobileOpen}
        onToggleMobile={() => setMobileOpen(!mobileOpen)}
      />

      {/* Main Content Area */}
      <div className="md:ml-[290px] flex-1 flex flex-col min-h-screen transition-colors bg-[#1b1b1e]">
        {/* Top Header Navigation */}
        <TopNavBar />

        {/* 3-Column Main Content Body */}
        <div className="flex-1 max-w-[1440px] w-full mx-auto px-6 py-10 sm:px-10 sm:py-14 md:px-12 lg:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-14 items-start">
            {/* Main Content Routes */}
            <main className="lg:col-span-9 xl:col-span-9 w-full min-w-0">
              <Routes>
                <Route
                  path="/"
                  element={
                    <HomeView
                      onSelectPost={(post) => navigate(`/post/${post.slug || post.id}`)}
                      onSelectTag={(tag) => navigate(`/tags/${tag}`)}
                    />
                  }
                />
                <Route path="/post/:id" element={<PostDetailRoute />} />
                <Route path="/about" element={<AboutView />} />
                <Route
                  path="/archives"
                  element={
                    <ArchivesView
                      onSelectPost={(post) => navigate(`/post/${post.slug || post.id}`)}
                    />
                  }
                />
                <Route path="/tags" element={<TagsRoute />} />
                <Route path="/tags/:tag" element={<TagsRoute />} />
                
                {/* Hidden Password-Protected Admin Route */}
                <Route path="/edit" element={<AdminEditView />} />

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>

            {/* Right Sidebar Widget Column */}
            <div className="lg:col-span-3 xl:col-span-3 w-full">
              <RightSidebar />
            </div>
          </div>
        </div>

        {/* Footer */}
        <Footer />
      </div>

      {/* RSS Feed Modal */}
      {rssModalOpen && <RssModal onClose={() => setRssModalOpen(false)} />}
    </div>
  );
}
