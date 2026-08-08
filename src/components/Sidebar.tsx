import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Github, 
  Linkedin, 
  Rss, 
  Sun, 
  Moon, 
  AtSign,
} from 'lucide-react';
import { getStoredProfile, SiteProfile } from '../utils/profileStore';

interface SidebarProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenRss: () => void;
  mobileOpen: boolean;
  onToggleMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  darkMode,
  onToggleDarkMode,
  onOpenRss,
  mobileOpen,
  onToggleMobile,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [profile, setProfile] = useState<SiteProfile>(() => getStoredProfile());

  useEffect(() => {
    const updateProfile = () => setProfile(getStoredProfile());
    window.addEventListener('profile_updated', updateProfile);
    window.addEventListener('storage', updateProfile);
    return () => {
      window.removeEventListener('profile_updated', updateProfile);
      window.removeEventListener('storage', updateProfile);
    };
  }, []);

  const navItems = [
    { path: '/', label: 'HOME' },
    { path: '/about', label: 'ABOUT' },
    { path: '/archives', label: 'ARCHIVES' },
    { path: '/tags', label: 'TAGS' },
  ];

  return (
    <>
      {/* Mobile Header Bar */}
      <div className="md:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-[#212225] text-gray-100 border-b border-[#2e2f33]">
        <div className="flex items-center space-x-3">
          {Boolean(profile.avatarUrl && profile.avatarUrl.trim()) ? (
            <img 
              src={profile.avatarUrl.trim()} 
              alt={profile.name} 
              referrerPolicy="no-referrer"
              className="w-9 h-9 rounded-full object-cover border border-[#2e2f33]"
            />
          ) : null}
          <div>
            <span className="font-bold text-sm block text-[#F5F5F5] font-display uppercase tracking-wider">
              {profile.name}
            </span>
          </div>
        </div>
        <button
          id="mobile-menu-toggle"
          onClick={onToggleMobile}
          className="px-3 py-1.5 rounded bg-[#2e2f33] border border-[#2e2f33] text-white text-xs font-mono transition-colors"
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? 'CLOSE' : 'MENU'}
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div 
          className="md:hidden fixed inset-0 z-40 bg-black/70"
          onClick={onToggleMobile}
        />
      )}

      {/* Main Sidebar Panel */}
      <aside
        id="main-left-sidebar"
        className={`
          fixed top-0 bottom-0 left-0 z-50 w-[290px] flex flex-col justify-between
          transition-transform duration-300 ease-in-out
          bg-[#212225] text-[#D4D4D4] border-r border-[#2e2f33]
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Scrollable Container for Profile & Navigation */}
        <div className="flex-1 overflow-y-auto px-7 pt-9 pb-6">
          
          {/* Profile Section */}
          <div className="flex flex-col items-center text-center pb-8 border-b border-[#2e2f33]">
            {/* Circular Avatar */}
            <div className="mb-4">
              {Boolean(profile.avatarUrl && profile.avatarUrl.trim()) ? (
                <img
                  src={profile.avatarUrl.trim()}
                  alt={profile.name}
                  referrerPolicy="no-referrer"
                  className="w-[115px] h-[115px] rounded-full object-cover border border-[#2e2f33]"
                />
              ) : null}
            </div>

            {/* Blog Name */}
            <h1 className="text-[20px] font-bold text-[#F5F5F5] font-display uppercase tracking-wider mb-1">
              {profile.name}
            </h1>

            {/* Two-Line Professional Bio */}
            <div className="space-y-1 text-[13px] font-mono text-white leading-relaxed max-w-[220px]">
              <p className="font-semibold">{profile.role}</p>
              <p className="text-[#aaaaaa] text-[12px]">{profile.bio}</p>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="py-7" aria-label="Main Navigation">
            <ul className="space-y-2">
              {navItems.map((item) => {
                const isActive = item.path === '/' 
                  ? location.pathname === '/' 
                  : location.pathname.startsWith(item.path);

                return (
                  <li key={item.path}>
                    <button
                      id={`nav-dir-${item.label.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                      onClick={() => {
                        navigate(item.path);
                        if (mobileOpen) onToggleMobile();
                      }}
                      className={`
                        w-full text-left py-1 text-[13px] font-mono tracking-widest transition-colors flex items-center border-l-2 cursor-pointer
                        ${isActive 
                          ? 'border-white text-white font-semibold pl-3 bg-transparent' 
                          : 'border-transparent text-[#aaaaaa] hover:text-[#F5F5F5] pl-3 bg-transparent'
                        }
                      `}
                    >
                      {item.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        {/* Social Icons & Copyright */}
        <div className="p-5 bg-[#212225] border-t border-[#2e2f33]">
          <div className="flex items-center justify-center space-x-3 text-white">
            {profile.socialLinks?.x && (
              <a
                href={profile.socialLinks.x}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded text-[#aaaaaa] hover:text-white transition-colors"
                title="X (Twitter)"
                aria-label="X Profile"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            )}

            {profile.socialLinks?.linkedin && (
              <a
                href={profile.socialLinks.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded text-[#aaaaaa] hover:text-white transition-colors"
                title="LinkedIn"
                aria-label="LinkedIn Profile"
              >
                <Linkedin className="w-4 h-4" />
              </a>
            )}

            {profile.socialLinks?.github && (
              <a
                href={profile.socialLinks.github}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded text-[#aaaaaa] hover:text-white transition-colors"
                title="GitHub"
                aria-label="GitHub Profile"
              >
                <Github className="w-4 h-4" />
              </a>
            )}

            <button
              id="dark-mode-toggle"
              onClick={onToggleDarkMode}
              className="p-1.5 rounded text-[#aaaaaa] hover:text-white transition-colors cursor-pointer"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle Theme Mode"
            >
              {darkMode ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>
          </div>
          <div className="text-[12px] text-center text-[#aaaaaa] mt-2.5 font-mono tracking-wide">
            © {new Date().getFullYear()} {profile.name}
          </div>
        </div>
      </aside>
    </>
  );
};
