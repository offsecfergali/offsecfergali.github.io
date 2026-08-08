import React, { useState, useEffect } from 'react';
import { getStoredProfile, SiteProfile } from '../utils/profileStore';

export const Footer: React.FC = () => {
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

  return (
    <footer className="w-full bg-[#212225] border-t border-[#2e2f33] py-6 px-4 text-center mt-16 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between text-[14px] font-normal text-gray-400 gap-3">
        <p className="font-mono text-[13px] text-[#aaaaaa]">
          &copy; {new Date().getFullYear()} <strong className="text-gray-200 font-medium">{profile.author || profile.name}</strong> • Built with Hugo • Hosted on GitHub Pages
        </p>
        <div className="flex items-center space-x-4 text-[13px]">
          <span className="text-white font-mono">{profile.name} security research</span>
        </div>
      </div>
    </footer>
  );
};
