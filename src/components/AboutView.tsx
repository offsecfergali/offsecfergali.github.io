import React, { useState, useEffect } from 'react';
import { getStoredProfile, SiteProfile } from '../utils/profileStore';

export const AboutView: React.FC = () => {
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

  const renderParagraphs = (text: string) => {
    return text.split('\n\n').map((para, i) => (
      <p key={i} className="leading-relaxed">
        {para}
      </p>
    ));
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 md:px-8 space-y-12 animate-fade-in text-[#aaaaaa]">
      {/* Top Left Page Title */}
      <div className="text-left">
        <h1 className="text-[48px] sm:text-[52px] md:text-[56px] font-medium sm:font-semibold text-slate-900 dark:text-white tracking-tight leading-tight font-display uppercase">
          About {profile.author || profile.name}
        </h1>
        <p className="text-[15px] font-mono text-white mt-1">
          {profile.role} • {profile.handle}
        </p>
      </div>

      {/* Centered Profile Photo (Read Only) */}
      <div className="flex justify-center py-2">
        <div className="relative">
          {Boolean((profile.aboutPhotoUrl || profile.avatarUrl) && (profile.aboutPhotoUrl || profile.avatarUrl)!.trim()) ? (
            <img
              src={(profile.aboutPhotoUrl || profile.avatarUrl)!.trim()}
              alt={profile.author || profile.name}
              referrerPolicy="no-referrer"
              className="w-64 h-64 sm:w-72 sm:h-72 rounded-full object-cover border-2 border-slate-200 dark:border-[#2e2f33] shadow-xl"
            />
          ) : null}
        </div>
      </div>

      {/* Main Content Sections */}
      <div className="space-y-12 text-[17px] sm:text-[18px] leading-[1.7] font-normal text-slate-700 dark:text-[#aaaaaa]">
        
        {/* Section 1: Who am I? */}
        <section className="space-y-4">
          <h2 className="text-[32px] md:text-[36px] font-medium text-slate-900 dark:text-white tracking-tight font-display uppercase">
            Who am I?
          </h2>
          <div className="space-y-4 font-normal text-[17px] sm:text-[18px] text-slate-700 dark:text-[#aaaaaa]">
            {renderParagraphs(profile.aboutWhoAmI)}
          </div>
        </section>

        {/* Section 2: Areas of Interest */}
        {profile.interests && profile.interests.length > 0 && (
          <section className="space-y-4 pt-2">
            <h2 className="text-[32px] md:text-[36px] font-medium text-slate-900 dark:text-white tracking-tight font-display uppercase">
              Areas of Interest
            </h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {profile.interests.map((interest, index) => (
                <li key={index} className="flex items-center space-x-3 text-[14px] font-mono text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-[#212225] px-4 py-2.5 rounded-[2px] border border-slate-200 dark:border-[#2e2f33]">
                  <span className="w-2 h-2 rounded-full bg-white flex-shrink-0" />
                  <span>{interest}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Section 3: How did this all begin? */}
        {profile.aboutStory && (
          <section className="space-y-4 pt-2">
            <h2 className="text-[32px] md:text-[36px] font-medium text-slate-900 dark:text-white tracking-tight font-display uppercase">
              How did this all begin?
            </h2>
            <div className="space-y-4 font-normal text-[17px] sm:text-[18px] text-slate-700 dark:text-[#aaaaaa]">
              {renderParagraphs(profile.aboutStory)}
            </div>
          </section>
        )}

      </div>
    </div>
  );
};
