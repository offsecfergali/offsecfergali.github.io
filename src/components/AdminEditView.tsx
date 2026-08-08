import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { resolveImageUrl, customUrlTransform, uploadImageToServer, compressAndSaveImage } from '../utils/imageUtils';
import { BlockEditor } from './BlockEditor';
import {
  markdownToBlocks,
  blocksToMarkdown,
  ContentBlock,
} from '../utils/blockEditorUtils';
import {
  Lock,
  Terminal,
  LogOut,
  Plus,
  Edit3,
  Trash2,
  Eye,
  Check,
  Send,
  Calendar,
  Clock,
  Tag,
  Image as ImageIcon,
  BookOpen,
  AlertTriangle,
  Globe,
  Upload,
  User,
  Settings,
  FileText,
  Camera,
  AtSign,
  Github,
  Linkedin,
  Rss,
  Layers,
  Download,
  RefreshCw,
  Share2,
} from 'lucide-react';
import { BlogPost } from '../types';
import {
  getStoredPosts,
  addStoredPost,
  updateStoredPost,
  deleteStoredPost,
  exportPostsJSON,
  importPostsJSON,
  syncPostsToGitHub,
  fetchAndSyncPublicPosts,
} from '../utils/postStore';
import { getStoredProfile, saveStoredProfile, SiteProfile } from '../utils/profileStore';

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

export const AdminEditView: React.FC = () => {
  const navigate = useNavigate();

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!sessionStorage.getItem('admin_session_token');
  });
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  // Admin Section Switch: 'articles' or 'site'
  const [adminSection, setAdminSection] = useState<'articles' | 'site'>('articles');

  // Posts State
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);
  const [postToDelete, setPostToDelete] = useState<BlogPost | null>(null);

  // Article Form Fields
  const [formTitle, setFormTitle] = useState<string>('');
  const [formSlug, setFormSlug] = useState<string>('');
  const [formSummary, setFormSummary] = useState<string>('');
  const [formContent, setFormContent] = useState<string>('');
  const [formCategory, setFormCategory] = useState<'InfoSec' | 'Crypto' | 'CTFs' | 'Research'>('InfoSec');
  const [formTags, setFormTags] = useState<string>('hacking, research');
  const [formDate, setFormDate] = useState<string>('');
  const [formReadTime, setFormReadTime] = useState<string>('5 min read');
  const [formImageUrl, setFormImageUrl] = useState<string>(PRESET_IMAGES[0].url);
  const [formPublished, setFormPublished] = useState<boolean>(true);

  const [editorBlocks, setEditorBlocks] = useState<ContentBlock[]>([]);
  const [activeTab, setActiveTab] = useState<'blocks' | 'write' | 'preview'>('blocks');
  const [notification, setNotification] = useState<string | null>(null);

  // Modal for inserting image URL
  const [showImageUrlModal, setShowImageUrlModal] = useState(false);
  const [modalImgUrl, setModalImgUrl] = useState('');
  const [modalImgCaption, setModalImgCaption] = useState('');

  // Profile / Site Settings State
  const [siteForm, setSiteForm] = useState<SiteProfile>(() => getStoredProfile());

  // GitHub Sync & Import/Export State
  const [showSyncModal, setShowSyncModal] = useState<boolean>(false);
  const [ghRepo, setGhRepo] = useState<string>(() => localStorage.getItem('gh_sync_repo') || 'offsecfergali/offsecfergali-blog');
  const [ghToken, setGhToken] = useState<string>(() => localStorage.getItem('gh_sync_token') || '');
  const [isSyncingGH, setIsSyncingGH] = useState<boolean>(false);
  const [ghSyncStatus, setGhSyncStatus] = useState<{ success: boolean; message: string } | null>(null);

  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const importFileInputRef = useRef<HTMLInputElement>(null);

  // Refresh posts
  const refreshPosts = () => {
    setPosts(getStoredPosts(true));
  };

  const handleGitHubPublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ghRepo.trim() || !ghToken.trim()) {
      alert('Please enter your GitHub repository name (e.g. username/repository) and a GitHub Personal Access Token.');
      return;
    }
    localStorage.setItem('gh_sync_repo', ghRepo.trim());
    localStorage.setItem('gh_sync_token', ghToken.trim());

    setIsSyncingGH(true);
    setGhSyncStatus(null);
    const res = await syncPostsToGitHub(ghToken.trim(), ghRepo.trim());
    setIsSyncingGH(false);
    setGhSyncStatus(res);
    if (res.success) {
      showNotification('Published posts.json to GitHub! Your site will auto-deploy.');
    }
  };

  const handleImportJSONFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content) {
        const res = importPostsJSON(content);
        if (res.success) {
          refreshPosts();
          showNotification(`Successfully imported ${res.count} new article(s)!`);
        } else {
          alert(`Import failed: ${res.error}`);
        }
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  useEffect(() => {
    if (isAuthenticated) {
      refreshPosts();
      setSiteForm(getStoredProfile());
    }
  }, [isAuthenticated]);

  // Handle Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput.trim()) return;

    setIsVerifying(true);
    setAuthError(null);

    // Client-side verification for static GitHub Pages hosting
    const storedCustomPass = localStorage.getItem('admin_password_key');
    const validPassword = storedCustomPass || 'GJW9';

    setTimeout(() => {
      if (passwordInput.trim() === validPassword) {
        const token = `static_admin_token_${Date.now()}`;
        sessionStorage.setItem('admin_session_token', token);
        setIsAuthenticated(true);
        setPasswordInput('');
        setAuthError(null);
      } else {
        setAuthError('403 - Unauthorized');
      }
      setIsVerifying(false);
    }, 200);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_session_token');
    setIsAuthenticated(false);
    setAuthError(null);
    setPasswordInput('');
  };

  // Article Actions
  const startCreateNew = () => {
    setEditingPost(null);
    setIsCreatingNew(true);

    const today = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dateStr = `${months[today.getMonth()]} ${today.getDate()}, ${today.getFullYear()}`;

    const defaultContent = `### Technical Vulnerability & Research Analysis\n\nWrite content here...`;
    setFormTitle('');
    setFormSlug('');
    setFormSummary('');
    setFormContent(defaultContent);
    setEditorBlocks(markdownToBlocks(defaultContent));
    setFormCategory('InfoSec');
    setFormTags('hacking, pentest');
    setFormDate(dateStr);
    setFormReadTime('5 min read');
    setFormImageUrl(PRESET_IMAGES[0].url);
    setFormPublished(true);
    setActiveTab('blocks');
  };

  const startEditPost = (post: BlogPost) => {
    setIsCreatingNew(false);
    setEditingPost(post);

    setFormTitle(post.title);
    setFormSlug(post.slug || post.id);
    setFormSummary(post.summary);
    setFormContent(post.content);
    setEditorBlocks(markdownToBlocks(post.content));
    setFormCategory(post.category);
    setFormTags(post.tags.join(', '));
    setFormDate(post.date);
    setFormReadTime(post.readTime);
    setFormImageUrl(post.imageUrl || PRESET_IMAGES[0].url);
    setFormPublished(post.published !== false);
    setActiveTab('blocks');
  };

  const handleSavePost = (e: React.FormEvent) => {
    e.preventDefault();

    const finalContent = activeTab === 'blocks' ? blocksToMarkdown(editorBlocks) : formContent;

    if (!formTitle.trim() || !formSummary.trim() || !finalContent.trim()) {
      alert('Title, Excerpt, and Article Content are required.');
      return;
    }

    const tagArray = formTags
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);

    const postData = {
      title: formTitle.trim(),
      slug: formSlug.trim() || formTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      summary: formSummary.trim(),
      content: finalContent.trim(),
      category: formCategory,
      tags: tagArray.length > 0 ? tagArray : ['research'],
      date: formDate.trim() || 'Jul 23, 2026',
      readTime: formReadTime.trim() || '5 min read',
      imageUrl: formImageUrl.trim(),
      published: formPublished,
    };

    if (isCreatingNew) {
      addStoredPost(postData);
      showNotification('New post created successfully.');
    } else if (editingPost) {
      updateStoredPost(editingPost.id, postData);
      showNotification(`Post "${formTitle}" updated successfully.`);
    }

    refreshPosts();
    setIsCreatingNew(false);
    setEditingPost(null);
  };

  const handleDelete = (post: BlogPost) => {
    setPostToDelete(post);
  };

  const confirmDelete = () => {
    if (!postToDelete) return;
    deleteStoredPost(postToDelete.id);
    refreshPosts();
    showNotification(`Article "${postToDelete.title}" deleted.`);
    setPostToDelete(null);
  };

  const handleTogglePublish = (post: BlogPost) => {
    const newStatus = !(post.published !== false);
    updateStoredPost(post.id, { published: newStatus });
    refreshPosts();
    showNotification(`Post status updated to ${newStatus ? 'Published' : 'Unpublished (Draft)'}.`);
  };

  const handleArticleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const url = await uploadImageToServer(file);
        setFormImageUrl(url);
        showNotification('Featured image uploaded.');
      } catch (err) {
        console.error('Image upload failed:', err);
        const compressed = await compressAndSaveImage(file, `post_img_${Date.now()}`, 800, 600, 0.85);
        setFormImageUrl(compressed);
        showNotification('Featured image uploaded.');
      }
    }
  };

  // Profile / Site Picture Upload Handlers
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressAndSaveImage(file, `avatar_img_${Date.now()}`, 500, 500, 0.85);
        setSiteForm((prev) => ({ ...prev, avatarUrl: compressed }));
        showNotification('Sidebar logo/avatar updated.');
      } catch (err) {
        console.error('Avatar upload failed:', err);
        alert('Failed to process avatar file.');
      }
    }
  };

  const handleAboutPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressAndSaveImage(file, `about_img_${Date.now()}`, 600, 600, 0.85);
        setSiteForm((prev) => ({ ...prev, aboutPhotoUrl: compressed }));
        showNotification('About page profile photo updated.');
      } catch (err) {
        console.error('About photo upload failed:', err);
        alert('Failed to process image file.');
      }
    }
  };

  // Save Site & Profile Settings
  const handleSaveSiteProfile = (e: React.FormEvent) => {
    e.preventDefault();
    saveStoredProfile(siteForm);
    showNotification('Website profile, pictures & biography saved successfully!');
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // -------------------------------------------------------------
  // UNAUTHENTICATED GATE
  // -------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 font-mono animate-fade-in text-[#D4D4D4]">
        <div className="w-full max-w-md bg-[#212225] border border-[#2e2f33] p-6 sm:p-8 rounded-[2px] shadow-2xl space-y-6">
          <div className="flex items-center space-x-3 text-white border-b border-[#2e2f33] pb-4">
            <Terminal className="w-6 h-6" />
            <span className="text-[14px] font-bold uppercase tracking-wider">
              /edit — Authentication Required
            </span>
          </div>

          {authError ? (
            <div className="space-y-4">
              <div className="bg-[#1C0A0A] border border-[#522020] p-4 text-[#FF6B6B] rounded-[2px] flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-[16px] tracking-wide uppercase">
                    403 - Unauthorized
                  </h3>
                  <p className="text-[13px] text-[#FFA3A3] mt-1 leading-relaxed">
                    Access to this directory is denied. Invalid authorization credentials provided.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setAuthError(null);
                  setPasswordInput('');
                }}
                className="w-full py-2.5 bg-[#2e2f33] hover:bg-[#3a3b40] border border-[#2e2f33] text-white font-bold text-[13px] uppercase tracking-wider transition-colors cursor-pointer rounded-[2px]"
              >
                Try Password Again
              </button>
            </div>
          ) : (
            <form onSubmit={handleLoginSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="block text-[12px] uppercase text-[#aaaaaa] tracking-wider flex items-center space-x-2">
                  <Lock className="w-3.5 h-3.5 text-white" />
                  <span>Enter Access Key / Password</span>
                </label>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoFocus
                  className="w-full bg-[#1b1b1e] border border-[#2e2f33] focus:border-white text-white px-4 py-3 text-[15px] font-mono focus:outline-none transition-colors rounded-[2px]"
                />
              </div>

              <button
                type="submit"
                disabled={isVerifying}
                className="w-full py-3 bg-white hover:bg-gray-200 text-black font-bold text-[14px] uppercase tracking-wider transition-colors cursor-pointer rounded-[2px] flex items-center justify-center space-x-2"
              >
                <span>{isVerifying ? 'Verifying...' : 'Authenticate'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // AUTHENTICATED ADMIN DASHBOARD AT /edit
  // -------------------------------------------------------------
  return (
    <div className="space-y-8 animate-fade-in font-serif text-[#D4D4D4] pb-16">
      {/* Header Banner */}
      <div className="bg-[#212225] border border-[#2e2f33] p-5 sm:p-6 rounded-[2px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-mono">
        <div>
          <div className="flex items-center space-x-2 text-white text-[13px] font-bold uppercase tracking-wider">
            <Terminal className="w-4 h-4" />
            <span>Admin Dashboard (/edit)</span>
          </div>
          <h1 className="text-[24px] sm:text-[28px] font-bold text-white uppercase tracking-tight font-serif mt-1">
            Website Content & Profile Editor
          </h1>
        </div>

        <button
          onClick={handleLogout}
          className="inline-flex items-center space-x-2 px-3.5 py-2 bg-[#1C0A0A] hover:bg-[#2A1010] border border-[#522020] text-[#FF8888] text-[13px] uppercase tracking-wider transition-colors cursor-pointer rounded-[2px]"
        >
          <LogOut className="w-4 h-4" />
          <span>Exit Admin</span>
        </button>
      </div>

      {/* Main Section Navigation Bar */}
      <div className="flex items-center space-x-3 font-mono text-[13px] border-b border-[#2e2f33] pb-3">
        <button
          onClick={() => {
            setAdminSection('articles');
            setIsCreatingNew(false);
            setEditingPost(null);
          }}
          className={`px-4 py-2 border rounded-[2px] transition-colors cursor-pointer flex items-center space-x-2 uppercase font-bold ${
            adminSection === 'articles'
              ? 'bg-[#2e2f33] border-white text-white'
              : 'bg-[#212225] border-[#2e2f33] text-[#aaaaaa] hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Articles Directory ({posts.length})</span>
        </button>

        <button
          onClick={() => {
            setAdminSection('site');
            setIsCreatingNew(false);
            setEditingPost(null);
          }}
          className={`px-4 py-2 border rounded-[2px] transition-colors cursor-pointer flex items-center space-x-2 uppercase font-bold ${
            adminSection === 'site'
              ? 'bg-[#2e2f33] border-white text-white'
              : 'bg-[#212225] border-[#2e2f33] text-[#aaaaaa] hover:text-white'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Site Profile, Pictures & Bio</span>
        </button>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="bg-[#212225] border border-white p-3 text-[14px] font-mono text-white flex items-center space-x-2 rounded-[2px] animate-fade-in">
          <Check className="w-4 h-4 text-white" />
          <span>{notification}</span>
        </div>
      )}

      {/* SECTION 1: SITE PROFILE & PICTURES SETTINGS */}
      {adminSection === 'site' && (
        <form onSubmit={handleSaveSiteProfile} className="bg-[#0A0F0A] border border-[#2A352A] p-6 sm:p-8 rounded-[2px] space-y-8 font-serif">
          <div className="border-b border-[#2A352A] pb-4">
            <h2 className="text-[22px] font-bold text-white uppercase tracking-wide flex items-center space-x-2">
              <User className="w-5 h-5 text-[#38a169]" />
              <span>Website Identity & Profile Configuration</span>
            </h2>
            <p className="text-[13px] font-mono text-[#8A9B8A] mt-1">
              All changes saved here will update the website picture, logo, title, bio, social links, and About page.
            </p>
          </div>

          {/* Image 1: Sidebar Avatar / Website Logo */}
          <div className="space-y-4 bg-[#050805] border border-[#2A352A] p-5 rounded-[2px]">
            <div className="flex items-center justify-between border-b border-[#2A352A] pb-2">
              <label className="text-[14px] font-mono text-[#38a169] uppercase tracking-wider flex items-center space-x-2">
                <Camera className="w-4 h-4" />
                <span>1. Left Sidebar Avatar & Logo (offsecfergali)</span>
              </label>
              <span className="text-[11px] font-mono text-[#8A9B8A]">Displays in left navigation bar</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="relative group flex-shrink-0">
                {Boolean(siteForm.avatarUrl && siteForm.avatarUrl.trim()) ? (
                  <img
                    src={resolveImageUrl(siteForm.avatarUrl)}
                    alt="Sidebar Avatar"
                    referrerPolicy="no-referrer"
                    className="w-24 h-24 rounded-full object-cover border-2 border-[#38a169] shadow-lg"
                  />
                ) : null}
              </div>

              <div className="space-y-3 flex-1 w-full">
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={siteForm.avatarUrl}
                    onChange={(e) => setSiteForm({ ...siteForm, avatarUrl: e.target.value })}
                    placeholder="Sidebar Logo Image URL (https://..., drive.google.com, etc.)"
                    className="flex-1 bg-[#0A0F0A] border border-[#2A352A] focus:border-[#38a169] text-white px-3.5 py-2.5 text-[14px] font-mono focus:outline-none transition-colors rounded-[2px]"
                  />

                  <label className="inline-flex items-center justify-center px-4 py-2.5 bg-[#162216] hover:bg-[#203020] border border-[#2A352A] text-[#38a169] font-mono text-[13px] uppercase cursor-pointer rounded-[2px] space-x-2 flex-shrink-0">
                    <Upload className="w-4 h-4" />
                    <span>Upload Logo</span>
                    <input
                      ref={avatarFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <p className="text-[12px] font-mono text-[#8A9B8A]">
                  Upload or link a custom logo image for the left sidebar navigation bar.
                </p>
              </div>
            </div>
          </div>

          {/* Image 2: About Me Page Profile Photo */}
          <div className="space-y-4 bg-[#050805] border border-[#2A352A] p-5 rounded-[2px]">
            <div className="flex items-center justify-between border-b border-[#2A352A] pb-2">
              <label className="text-[14px] font-mono text-[#38a169] uppercase tracking-wider flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>2. About Me Page Profile Photo ({siteForm.author || 'Author'})</span>
              </label>
              <span className="text-[11px] font-mono text-[#8A9B8A]">Displays on /about page</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="relative group flex-shrink-0">
                {Boolean((siteForm.aboutPhotoUrl || siteForm.avatarUrl) && (siteForm.aboutPhotoUrl || siteForm.avatarUrl)!.trim()) ? (
                  <img
                    src={resolveImageUrl(siteForm.aboutPhotoUrl || siteForm.avatarUrl)}
                    alt="About Profile Photo"
                    referrerPolicy="no-referrer"
                    className="w-24 h-24 rounded-full object-cover border-2 border-[#38a169] shadow-lg"
                  />
                ) : null}
              </div>

              <div className="space-y-3 flex-1 w-full">
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={siteForm.aboutPhotoUrl || ''}
                    onChange={(e) => setSiteForm({ ...siteForm, aboutPhotoUrl: e.target.value })}
                    placeholder="About Profile Photo URL (https://..., drive.google.com, etc.)"
                    className="flex-1 bg-[#0A0F0A] border border-[#2A352A] focus:border-[#38a169] text-white px-3.5 py-2.5 text-[14px] font-mono focus:outline-none transition-colors rounded-[2px]"
                  />

                  <label className="inline-flex items-center justify-center px-4 py-2.5 bg-[#162216] hover:bg-[#203020] border border-[#2A352A] text-[#38a169] font-mono text-[13px] uppercase cursor-pointer rounded-[2px] space-x-2 flex-shrink-0">
                    <Upload className="w-4 h-4" />
                    <span>Upload Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAboutPhotoUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <p className="text-[12px] font-mono text-[#8A9B8A]">
                  Upload or link a separate personal profile picture for the /about page.
                </p>
              </div>
            </div>
          </div>

          {/* Identity Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-[13px] font-mono text-[#38a169] uppercase tracking-wider">
                Website Title / Blog Name
              </label>
              <input
                type="text"
                value={siteForm.name}
                onChange={(e) => setSiteForm({ ...siteForm, name: e.target.value })}
                required
                className="w-full bg-[#050805] border border-[#2A352A] focus:border-[#38a169] text-white px-4 py-3 text-[15px] font-mono uppercase focus:outline-none transition-colors rounded-[2px]"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[13px] font-mono text-[#38a169] uppercase tracking-wider">
                Author Full Name
              </label>
              <input
                type="text"
                value={siteForm.author}
                onChange={(e) => setSiteForm({ ...siteForm, author: e.target.value })}
                required
                className="w-full bg-[#050805] border border-[#2A352A] focus:border-[#38a169] text-white px-4 py-3 text-[15px] font-serif focus:outline-none transition-colors rounded-[2px]"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[13px] font-mono text-[#38a169] uppercase tracking-wider">
                Professional Role / Title
              </label>
              <input
                type="text"
                value={siteForm.role}
                onChange={(e) => setSiteForm({ ...siteForm, role: e.target.value })}
                required
                className="w-full bg-[#050805] border border-[#2A352A] focus:border-[#38a169] text-white px-4 py-3 text-[15px] font-mono focus:outline-none transition-colors rounded-[2px]"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[13px] font-mono text-[#38a169] uppercase tracking-wider">
                User Handle / Username
              </label>
              <input
                type="text"
                value={siteForm.handle}
                onChange={(e) => setSiteForm({ ...siteForm, handle: e.target.value })}
                required
                className="w-full bg-[#050805] border border-[#2A352A] focus:border-[#38a169] text-white px-4 py-3 text-[15px] font-mono focus:outline-none transition-colors rounded-[2px]"
              />
            </div>
          </div>

          {/* Sidebar Bio Tagline */}
          <div className="space-y-2">
            <label className="block text-[13px] font-mono text-[#38a169] uppercase tracking-wider">
              Sidebar Tagline / Subtitle
            </label>
            <input
              type="text"
              value={siteForm.bio}
              onChange={(e) => setSiteForm({ ...siteForm, bio: e.target.value })}
              className="w-full bg-[#050805] border border-[#2A352A] focus:border-[#38a169] text-white px-4 py-3 text-[15px] font-serif focus:outline-none transition-colors rounded-[2px]"
            />
          </div>

          {/* Social Links */}
          <div className="space-y-4 bg-[#050805] border border-[#2A352A] p-5 rounded-[2px]">
            <h3 className="text-[14px] font-mono text-[#38a169] uppercase tracking-wider">
              Social Links
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-[12px] font-mono text-[#8A9B8A] flex items-center space-x-2">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-[#38a169]">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  <span>X (Twitter) URL</span>
                </label>
                <input
                  type="text"
                  value={siteForm.socialLinks?.x || ''}
                  onChange={(e) => setSiteForm({
                    ...siteForm,
                    socialLinks: { ...siteForm.socialLinks, x: e.target.value }
                  })}
                  className="w-full bg-[#0A0F0A] border border-[#2A352A] focus:border-[#38a169] text-white px-3 py-2 text-[13px] font-mono focus:outline-none rounded-[2px]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[12px] font-mono text-[#8A9B8A] flex items-center space-x-2">
                  <Linkedin className="w-3.5 h-3.5 text-[#38a169]" />
                  <span>LinkedIn URL</span>
                </label>
                <input
                  type="text"
                  value={siteForm.socialLinks?.linkedin || ''}
                  onChange={(e) => setSiteForm({
                    ...siteForm,
                    socialLinks: { ...siteForm.socialLinks, linkedin: e.target.value }
                  })}
                  className="w-full bg-[#0A0F0A] border border-[#2A352A] focus:border-[#38a169] text-white px-3 py-2 text-[13px] font-mono focus:outline-none rounded-[2px]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[12px] font-mono text-[#8A9B8A] flex items-center space-x-2">
                  <Github className="w-3.5 h-3.5 text-[#38a169]" />
                  <span>GitHub URL</span>
                </label>
                <input
                  type="text"
                  value={siteForm.socialLinks?.github || ''}
                  onChange={(e) => setSiteForm({
                    ...siteForm,
                    socialLinks: { ...siteForm.socialLinks, github: e.target.value }
                  })}
                  className="w-full bg-[#0A0F0A] border border-[#2A352A] focus:border-[#38a169] text-white px-3 py-2 text-[13px] font-mono focus:outline-none rounded-[2px]"
                />
              </div>
            </div>
          </div>

          {/* About Page Text Sections */}
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="block text-[13px] font-mono text-[#38a169] uppercase tracking-wider">
                "Who am I?" Content (About Page)
              </label>
              <textarea
                value={siteForm.aboutWhoAmI}
                onChange={(e) => setSiteForm({ ...siteForm, aboutWhoAmI: e.target.value })}
                rows={6}
                className="w-full bg-[#050805] border border-[#2A352A] focus:border-[#38a169] text-[#D1D5DB] p-4 text-[15px] font-serif leading-relaxed focus:outline-none transition-colors rounded-[2px]"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[13px] font-mono text-[#38a169] uppercase tracking-wider">
                Areas of Interest (Comma separated)
              </label>
              <input
                type="text"
                value={siteForm.interests ? siteForm.interests.join(', ') : ''}
                onChange={(e) => setSiteForm({
                  ...siteForm,
                  interests: e.target.value.split(',').map((s) => s.trim()).filter((s) => s.length > 0)
                })}
                className="w-full bg-[#050805] border border-[#2A352A] focus:border-[#38a169] text-white px-4 py-3 text-[14px] font-mono focus:outline-none transition-colors rounded-[2px]"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[13px] font-mono text-[#38a169] uppercase tracking-wider">
                "How did this all begin?" Story Content
              </label>
              <textarea
                value={siteForm.aboutStory}
                onChange={(e) => setSiteForm({ ...siteForm, aboutStory: e.target.value })}
                rows={6}
                className="w-full bg-[#050805] border border-[#2A352A] focus:border-[#38a169] text-[#D1D5DB] p-4 text-[15px] font-serif leading-relaxed focus:outline-none transition-colors rounded-[2px]"
              />
            </div>
          </div>

          {/* Save Profile Submit Bar */}
          <div className="pt-4 flex items-center justify-end border-t border-[#2A352A]">
            <button
              type="submit"
              className="px-6 py-3 bg-[#38a169] hover:bg-[#2f855a] text-black font-mono font-bold text-[14px] uppercase tracking-wider flex items-center space-x-2 transition-colors cursor-pointer rounded-[2px]"
            >
              <Send className="w-4 h-4" />
              <span>Save Website Profile & Settings</span>
            </button>
          </div>
        </form>
      )}

      {/* SECTION 2: ARTICLES MANAGEMENT */}
      {adminSection === 'articles' && (
        <>
          {/* VIEW A: FORM (CREATE / EDIT) */}
          {(isCreatingNew || editingPost) ? (
            <div className="bg-[#0A0F0A] border border-[#2A352A] p-6 sm:p-8 rounded-[2px] space-y-8">
              <div className="flex items-center justify-between border-b border-[#2A352A] pb-4">
                <h2 className="text-[22px] font-bold text-white uppercase tracking-wide flex items-center space-x-2">
                  <Edit3 className="w-5 h-5 text-[#38a169]" />
                  <span>{isCreatingNew ? 'Create New Article' : `Edit: ${editingPost?.title}`}</span>
                </h2>

                <button
                  onClick={() => {
                    setIsCreatingNew(false);
                    setEditingPost(null);
                  }}
                  className="px-3 py-1.5 bg-[#162216] border border-[#2A352A] text-[#8A9B8A] hover:text-white font-mono text-[12px] uppercase transition-colors cursor-pointer rounded-[2px]"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleSavePost} className="space-y-6 font-serif">
                {/* Title & Slug */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  <div className="md:col-span-7 space-y-2">
                    <label className="block text-[13px] font-mono text-[#38a169] uppercase tracking-wider">
                      Article Title *
                    </label>
                    <input
                      type="text"
                      value={formTitle}
                      onChange={(e) => {
                        setFormTitle(e.target.value);
                        if (isCreatingNew) {
                          setFormSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
                        }
                      }}
                      required
                      placeholder="Title of research paper or advisory"
                      className="w-full bg-[#050805] border border-[#2A352A] focus:border-[#38a169] text-white px-4 py-3 text-[16px] font-serif uppercase tracking-tight focus:outline-none transition-colors rounded-[2px]"
                    />
                  </div>

                  <div className="md:col-span-5 space-y-2">
                    <label className="block text-[13px] font-mono text-[#38a169] uppercase tracking-wider">
                      Slug / URL Path *
                    </label>
                    <div className="flex items-center">
                      <span className="bg-[#162216] border border-r-0 border-[#2A352A] px-3 py-3 text-[13px] font-mono text-[#8A9B8A]">
                        /post/
                      </span>
                      <input
                        type="text"
                        value={formSlug}
                        onChange={(e) => setFormSlug(e.target.value)}
                        required
                        placeholder="my-custom-slug"
                        className="w-full bg-[#050805] border border-[#2A352A] focus:border-[#38a169] text-white px-3 py-3 text-[14px] font-mono focus:outline-none transition-colors rounded-[2px]"
                      />
                    </div>
                  </div>
                </div>

                {/* Category, Status, Date, Read Time */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <label className="block text-[13px] font-mono text-[#38a169] uppercase tracking-wider">
                      Category *
                    </label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value as any)}
                      className="w-full bg-[#050805] border border-[#2A352A] focus:border-[#38a169] text-white px-3.5 py-2.5 text-[14px] font-mono focus:outline-none transition-colors rounded-[2px]"
                    >
                      <option value="InfoSec">InfoSec</option>
                      <option value="Crypto">Crypto</option>
                      <option value="CTFs">CTFs</option>
                      <option value="Research">Research</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[13px] font-mono text-[#38a169] uppercase tracking-wider">
                      Visibility / Status
                    </label>
                    <button
                      type="button"
                      onClick={() => setFormPublished(!formPublished)}
                      className={`w-full py-2.5 px-3.5 text-[13px] font-mono uppercase tracking-wider border rounded-[2px] transition-colors cursor-pointer text-left flex items-center justify-between ${
                        formPublished
                          ? 'bg-[#162216] border-[#38a169] text-[#38a169] font-bold'
                          : 'bg-[#2A1C0A] border-[#734A12] text-[#FFB347]'
                      }`}
                    >
                      <span>{formPublished ? 'Published' : 'Unpublished (Draft)'}</span>
                      <Globe className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[13px] font-mono text-[#38a169] uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" /> Date
                    </label>
                    <input
                      type="text"
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      placeholder="Jul 23, 2026"
                      className="w-full bg-[#050805] border border-[#2A352A] focus:border-[#38a169] text-white px-3.5 py-2.5 text-[14px] font-mono focus:outline-none transition-colors rounded-[2px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[13px] font-mono text-[#38a169] uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> Read Time
                    </label>
                    <input
                      type="text"
                      value={formReadTime}
                      onChange={(e) => setFormReadTime(e.target.value)}
                      placeholder="5 min read"
                      className="w-full bg-[#050805] border border-[#2A352A] focus:border-[#38a169] text-white px-3.5 py-2.5 text-[14px] font-mono focus:outline-none transition-colors rounded-[2px]"
                    />
                  </div>
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <label className="block text-[13px] font-mono text-[#38a169] uppercase tracking-wider flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" /> Tags (Comma separated)
                  </label>
                  <input
                    type="text"
                    value={formTags}
                    onChange={(e) => setFormTags(e.target.value)}
                    placeholder="hacking, pentest, active-directory"
                    className="w-full bg-[#050805] border border-[#2A352A] focus:border-[#38a169] text-white px-3.5 py-2.5 text-[14px] font-mono focus:outline-none transition-colors rounded-[2px]"
                  />
                </div>

                {/* Summary / Excerpt */}
                <div className="space-y-2">
                  <label className="block text-[13px] font-mono text-[#38a169] uppercase tracking-wider">
                    Summary / Excerpt *
                  </label>
                  <textarea
                    value={formSummary}
                    onChange={(e) => setFormSummary(e.target.value)}
                    rows={3}
                    required
                    placeholder="Brief summary of the research article..."
                    className="w-full bg-[#050805] border border-[#2A352A] focus:border-[#38a169] text-[#D1D5DB] p-4 text-[15px] font-serif focus:outline-none transition-colors rounded-[2px] leading-relaxed"
                  />
                </div>

                {/* Featured Image */}
                <div className="space-y-3">
                  <label className="block text-[13px] font-mono text-[#38a169] uppercase tracking-wider flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5" /> Featured Image
                  </label>

                  {/* Presets */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {PRESET_IMAGES.map((preset) => {
                      const isSelected = formImageUrl === preset.url;
                      return (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => setFormImageUrl(preset.url)}
                          className={`relative border p-1 rounded-[2px] overflow-hidden text-left cursor-pointer transition-all ${
                            isSelected ? 'border-[#38a169] bg-[#162216]' : 'border-[#2A352A] bg-[#050805] hover:border-[#38a169]/50'
                          }`}
                        >
                          <img src={preset.url || undefined} alt={preset.name} className="w-full h-20 object-cover mb-1 border border-white/20" />
                          <span className="text-[11px] font-mono text-[#A0AFA0] block truncate px-1">
                            {preset.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Upload or Custom URL */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      value={formImageUrl}
                      onChange={(e) => setFormImageUrl(e.target.value)}
                      placeholder="Image URL or upload file directly ->"
                      className="flex-1 bg-[#050805] border border-[#2A352A] focus:border-[#38a169] text-white px-3.5 py-2.5 text-[14px] font-mono focus:outline-none transition-colors rounded-[2px]"
                    />

                    <label className="inline-flex items-center justify-center px-4 py-2 bg-[#162216] hover:bg-[#203020] border border-[#38a169] text-[#38a169] font-mono text-[13px] uppercase cursor-pointer rounded-[2px] space-x-2 font-bold shadow-sm transition-all">
                      <Upload className="w-4 h-4" />
                      <span>Upload Local File</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleArticleImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Article Content (Rich Block Editor & Markdown) */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#2e2f33] pb-3 gap-2">
                    <label className="text-[13px] font-mono text-white uppercase tracking-wider flex items-center gap-1.5 font-bold">
                      <BookOpen className="w-4 h-4 text-white" /> Article Content & Media Editor *
                    </label>

                    <div className="flex flex-wrap items-center space-x-1 font-mono text-[12px] bg-[#1b1b1e] p-1 border border-[#2e2f33] rounded-[2px]">
                      <button
                        type="button"
                        onClick={() => {
                          if (activeTab === 'write') {
                            setEditorBlocks(markdownToBlocks(formContent));
                          }
                          setActiveTab('blocks');
                        }}
                        className={`px-3 py-1 flex items-center space-x-1.5 transition-colors cursor-pointer rounded-[2px] ${
                          activeTab === 'blocks' ? 'bg-white text-black font-bold' : 'text-[#aaaaaa] hover:text-white'
                        }`}
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>VISUAL BLOCK EDITOR</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (activeTab === 'blocks') {
                            setFormContent(blocksToMarkdown(editorBlocks));
                          }
                          setActiveTab('write');
                        }}
                        className={`px-3 py-1 flex items-center space-x-1.5 transition-colors cursor-pointer rounded-[2px] ${
                          activeTab === 'write' ? 'bg-white text-black font-bold' : 'text-[#aaaaaa] hover:text-white'
                        }`}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>RAW MARKDOWN</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (activeTab === 'blocks') {
                            setFormContent(blocksToMarkdown(editorBlocks));
                          }
                          setActiveTab('preview');
                        }}
                        className={`px-3 py-1 flex items-center space-x-1.5 transition-colors cursor-pointer rounded-[2px] ${
                          activeTab === 'preview' ? 'bg-white text-black font-bold' : 'text-[#aaaaaa] hover:text-white'
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>PREVIEW</span>
                      </button>
                    </div>
                  </div>

                  {activeTab === 'blocks' && (
                    <BlockEditor
                      blocks={editorBlocks}
                      onChange={(updatedBlocks) => {
                        setEditorBlocks(updatedBlocks);
                        setFormContent(blocksToMarkdown(updatedBlocks));
                      }}
                    />
                  )}

                  {activeTab === 'write' && (
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2 bg-[#050805] p-2 border border-[#2e2f33] rounded-[2px]">
                        <label className="inline-flex items-center space-x-1.5 bg-[#162216] hover:bg-[#203020] border border-[#2A352A] text-[#38a169] px-3 py-1 rounded-[2px] text-[12px] font-mono uppercase cursor-pointer transition-colors">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Insert Picture File</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                try {
                                  const imageUrl = await uploadImageToServer(file);
                                  const markdownImg = `\n\n![${file.name.replace(/\.[^/.]+$/, '')}](${imageUrl})\n\n`;
                                  const newContent = formContent + markdownImg;
                                  setFormContent(newContent);
                                  setEditorBlocks(markdownToBlocks(newContent));
                                } catch (err) {
                                  console.error('Failed to process image:', err);
                                  alert('Failed to process image file.');
                                }
                              }
                            }}
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
                      </div>

                      <textarea
                        value={formContent}
                        onChange={(e) => {
                          setFormContent(e.target.value);
                          setEditorBlocks(markdownToBlocks(e.target.value));
                        }}
                        rows={14}
                        required
                        placeholder="Write research article in Markdown format..."
                        className="w-full bg-[#1b1b1e] border border-[#2e2f33] focus:border-white text-white p-4 font-mono text-[14px] leading-relaxed focus:outline-none transition-colors rounded-[2px]"
                      />
                    </div>
                  )}

                  {activeTab === 'preview' && (
                    <div className="w-full min-h-[320px] bg-[#1b1b1e] border border-[#2e2f33] p-6 rounded-[2px] prose prose-invert max-w-none text-[#D1D5DB] font-serif">
                      <Markdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeRaw]}
                        urlTransform={customUrlTransform}
                        components={{
                          img({ src, alt, title }) {
                            if (!src || !src.trim()) return null;
                            let actualSrc = resolveImageUrl(src);
                            let captionText = alt || '';
                            let sizeClass = 'w-full mx-auto';

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

                            return (
                              <figure className={`my-6 group cursor-pointer ${sizeClass}`}>
                                <img
                                  src={actualSrc}
                                  alt={captionText || 'Article preview image'}
                                  referrerPolicy="no-referrer"
                                  className="w-full h-auto rounded-[2px] object-cover"
                                  onError={(e) => {
                                    console.warn('Preview image load error:', actualSrc);
                                  }}
                                />
                                {captionText && (
                                  <figcaption className="text-center font-serif text-[13px] text-[#aaaaaa] mt-2 italic">
                                    {captionText}
                                  </figcaption>
                                )}
                              </figure>
                            );
                          },
                        }}
                      >
                        {formContent || blocksToMarkdown(editorBlocks) || '*No content written yet.*'}
                      </Markdown>
                    </div>
                  )}
                </div>

                {/* Submit Bar */}
                <div className="pt-4 flex items-center justify-end space-x-4 border-t border-[#2A352A]">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingNew(false);
                      setEditingPost(null);
                    }}
                    className="px-5 py-2.5 bg-[#162216] hover:bg-[#203020] border border-[#2A352A] text-[#8A9B8A] hover:text-white font-mono text-[13px] uppercase transition-colors cursor-pointer rounded-[2px]"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[#38a169] hover:bg-[#2f855a] text-black font-mono font-bold text-[14px] uppercase tracking-wider flex items-center space-x-2 transition-colors cursor-pointer rounded-[2px]"
                  >
                    <Send className="w-4 h-4" />
                    <span>Save Article</span>
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* VIEW B: ALL POSTS LIST TABLE */
            <div className="space-y-6">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-[#2A352A] pb-4">
                <div>
                  <h2 className="text-[20px] font-bold text-white uppercase tracking-tight font-serif">
                    Articles Directory ({posts.length})
                  </h2>
                  <p className="text-[13px] font-mono text-[#8A9B8A] mt-0.5">
                    Manage articles & publish to GitHub for public cross-browser viewing.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 font-mono text-[12px]">
                  {/* Download posts.json */}
                  <button
                    type="button"
                    onClick={exportPostsJSON}
                    className="inline-flex items-center space-x-1.5 px-3 py-2 bg-[#162216] hover:bg-[#203020] border border-[#2A352A] text-[#38a169] rounded-[2px] cursor-pointer transition-colors"
                    title="Download posts.json to save inside public/ directory"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export JSON</span>
                  </button>

                  {/* Import posts.json */}
                  <label className="inline-flex items-center space-x-1.5 px-3 py-2 bg-[#162216] hover:bg-[#203020] border border-[#2A352A] text-[#38a169] rounded-[2px] cursor-pointer transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Import JSON</span>
                    <input
                      ref={importFileInputRef}
                      type="file"
                      accept=".json"
                      onChange={handleImportJSONFile}
                      className="hidden"
                    />
                  </label>

                  {/* Toggle GitHub Sync Card */}
                  <button
                    type="button"
                    onClick={() => setShowSyncModal(!showSyncModal)}
                    className={`inline-flex items-center space-x-1.5 px-3.5 py-2 border rounded-[2px] font-bold uppercase transition-colors cursor-pointer ${
                      showSyncModal
                        ? 'bg-white text-black border-white'
                        : 'bg-[#212225] border-[#2e2f33] text-white hover:border-white'
                    }`}
                  >
                    <Github className="w-4 h-4" />
                    <span>GitHub Sync</span>
                  </button>

                  {/* Create New Article */}
                  <button
                    onClick={startCreateNew}
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-[#38a169] hover:bg-[#2f855a] text-black font-bold text-[13px] uppercase tracking-wider transition-colors cursor-pointer rounded-[2px]"
                  >
                    <Plus className="w-4 h-4" />
                    <span>New Article</span>
                  </button>
                </div>
              </div>

              {/* GITHUB SYNC & PUBLISHING CARD */}
              {showSyncModal && (
                <div className="bg-[#121812] border border-[#2A352A] p-5 rounded-[2px] space-y-4 font-mono animate-fade-in">
                  <div className="flex items-center justify-between border-b border-[#2A352A] pb-3">
                    <div className="flex items-center space-x-2 text-[#38a169] font-bold uppercase text-[14px]">
                      <Github className="w-4 h-4" />
                      <span>Publish Articles Globally to GitHub Pages</span>
                    </div>
                    <span className="text-[11px] text-[#8A9B8A]">
                      Makes all posts visible on any browser or device
                    </span>
                  </div>

                  <form onSubmit={handleGitHubPublish} className="space-y-4">
                    <p className="text-[12px] text-[#A0AFA0] leading-relaxed">
                      Because static blogs run client-side, click below to push your latest <code className="text-white bg-black px-1.5 py-0.5 rounded">public/posts.json</code> directly to your GitHub repository. GitHub Actions will auto-deploy it so everyone across all browsers can see your articles!
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] text-[#8A9B8A] uppercase">
                          GitHub Repository (username/repo)
                        </label>
                        <input
                          type="text"
                          value={ghRepo}
                          onChange={(e) => setGhRepo(e.target.value)}
                          placeholder="offsecfergali/offsecfergali-blog"
                          required
                          className="w-full bg-[#050805] border border-[#2A352A] text-white px-3 py-2 text-[13px] focus:border-[#38a169] focus:outline-none rounded-[2px]"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] text-[#8A9B8A] uppercase">
                          GitHub Personal Access Token (PAT)
                        </label>
                        <input
                          type="password"
                          value={ghToken}
                          onChange={(e) => setGhToken(e.target.value)}
                          placeholder="ghp_••••••••••••••••••••••••••••"
                          required
                          className="w-full bg-[#050805] border border-[#2A352A] text-white px-3 py-2 text-[13px] focus:border-[#38a169] focus:outline-none rounded-[2px]"
                        />
                      </div>
                    </div>

                    {ghSyncStatus && (
                      <div
                        className={`p-3 rounded-[2px] text-[12px] border ${
                          ghSyncStatus.success
                            ? 'bg-[#0A1F0A] border-[#1E4D1E] text-[#63E663]'
                            : 'bg-[#1C0A0A] border-[#522020] text-[#FF8888]'
                        }`}
                      >
                        {ghSyncStatus.message}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-[#2A352A]">
                      <a
                        href="https://github.com/settings/tokens/new?scopes=repo&description=Blog+Posts+Sync"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-[#38a169] underline hover:text-[#52c480]"
                      >
                        Need a token? Generate GitHub PAT (repo scope) →
                      </a>

                      <button
                        type="submit"
                        disabled={isSyncingGH}
                        className="px-5 py-2.5 bg-[#38a169] hover:bg-[#2f855a] text-black font-bold uppercase text-[12px] tracking-wider transition-colors cursor-pointer rounded-[2px] flex items-center space-x-2"
                      >
                        {isSyncingGH ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Publishing to GitHub...</span>
                          </>
                        ) : (
                          <>
                            <Share2 className="w-3.5 h-3.5" />
                            <span>Push posts.json to GitHub Repo</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <div className="space-y-4">
                {posts.map((post) => {
                  const isPub = post.published !== false;
                  return (
                    <div
                      key={post.id}
                      className="bg-[#0A0F0A] border border-[#2A352A] p-5 rounded-[2px] flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-[#38a169]/50 transition-colors"
                    >
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3 text-[12px] font-mono">
                          <span
                            className={`px-2 py-0.5 rounded-[2px] font-bold uppercase ${
                              isPub
                                ? 'bg-[#162216] text-[#38a169] border border-[#2A352A]'
                                : 'bg-[#2A1C0A] text-[#FFB347] border border-[#734A12]'
                            }`}
                          >
                            {isPub ? 'PUBLISHED' : 'DRAFT'}
                          </span>
                          <span className="text-[#8A9B8A]">📕 {post.category}</span>
                          <span className="text-[#8A9B8A]">⛏️ {post.date}</span>
                          <span className="text-[#6E7E6E]">/post/{post.slug || post.id}</span>
                        </div>

                        <h3 className="text-[18px] font-bold text-white uppercase font-serif leading-snug">
                          {post.title}
                        </h3>

                        <p className="text-[13px] text-[#A0AFA0] line-clamp-1 font-serif">
                          {post.summary}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-2 self-start md:self-center font-mono text-[12px]">
                        <button
                          onClick={() => handleTogglePublish(post)}
                          className={`px-3 py-1.5 rounded-[2px] border transition-colors cursor-pointer ${
                            isPub
                              ? 'bg-[#162216] border-[#2A352A] text-[#8A9B8A] hover:text-white'
                              : 'bg-[#2A1C0A] border-[#734A12] text-[#FFB347] hover:bg-[#3D280F]'
                          }`}
                          title="Toggle Publish Status"
                        >
                          {isPub ? 'Unpublish' : 'Publish'}
                        </button>

                        <button
                          onClick={() => startEditPost(post)}
                          className="px-3 py-1.5 bg-[#0E160E] hover:bg-[#162216] border border-[#2A352A] text-[#38a169] font-bold uppercase transition-colors cursor-pointer rounded-[2px] flex items-center space-x-1"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>

                        <button
                          onClick={() => handleDelete(post)}
                          className="px-3 py-1.5 bg-[#1C0A0A] hover:bg-[#2A1010] border border-[#522020] text-[#FF8888] font-bold uppercase transition-colors cursor-pointer rounded-[2px] flex items-center space-x-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
      {/* Delete Confirmation Modal */}
      {postToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-serif">
          <div className="bg-[#212225] border border-[#2e2f33] p-6 rounded-[2px] max-w-md w-full space-y-4 text-[#D4D4D4] shadow-2xl">
            <div className="flex items-center space-x-3 text-red-400 font-mono text-[14px] uppercase font-bold border-b border-[#2e2f33] pb-3">
              <Trash2 className="w-5 h-5 text-red-400" />
              <span>Delete Article</span>
            </div>
            <p className="text-[14px] leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-white">&quot;{postToDelete.title}&quot;</strong>? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end space-x-3 font-mono text-[12px] pt-2">
              <button
                type="button"
                onClick={() => setPostToDelete(null)}
                className="px-4 py-2 bg-[#2e2f33] hover:bg-[#3a3b40] border border-[#2e2f33] text-[#aaaaaa] hover:text-white uppercase transition-colors cursor-pointer rounded-[2px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 border border-red-500 text-white font-bold uppercase transition-colors cursor-pointer rounded-[2px]"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
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
                    const markdownImg = `\n\n![${cap}](${modalImgUrl.trim()})\n\n`;
                    const newContent = formContent + markdownImg;
                    setFormContent(newContent);
                    setEditorBlocks(markdownToBlocks(newContent));
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
