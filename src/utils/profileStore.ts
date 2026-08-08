import { BLOG_PROFILE } from '../data/blogData';

export interface SiteProfile {
  name: string;
  author: string;
  role: string;
  bio: string;
  handle: string;
  description: string;
  avatarUrl: string;
  aboutPhotoUrl: string;
  location: string;
  aboutWhoAmI: string;
  aboutStory: string;
  interests: string[];
  socialLinks: {
    github: string;
    linkedin: string;
    x: string;
  };
}

const PROFILE_STORAGE_KEY = 'hacker_blog_site_profile_v2';

const DEFAULT_PROFILE: SiteProfile = {
  name: BLOG_PROFILE.name,
  author: BLOG_PROFILE.author,
  role: BLOG_PROFILE.role,
  bio: BLOG_PROFILE.bio,
  handle: BLOG_PROFILE.handle,
  description: BLOG_PROFILE.description,
  avatarUrl: BLOG_PROFILE.avatarUrl,
  aboutPhotoUrl: BLOG_PROFILE.avatarUrl,
  location: BLOG_PROFILE.location,
  aboutWhoAmI: `I’m Alae Eddine Fergali, 17 years old, a Moroccan offensive security enthusiast focused on web application security, bug bounty hunting, and penetration testing. I enjoy breaking down how vulnerabilities work, sharing practical attack techniques, and documenting lessons learned from labs, real-world research, and CTF challenges.\n\nMy interests include reconnaissance, web exploitation, API security, Active Directory, and offensive AI. I continuously build projects, experiment with new tools, and publish write-ups that help security professionals and aspiring ethical hackers improve their skills.\n\nThis blog is where I share research, tutorials, security tools, walkthroughs, and insights from my journey toward becoming a professional penetration tester. Every article is written with one goal: to make offensive security more practical, accessible, and hands-on.`,
  aboutStory: `I started my cybersecurity journey when I was 15 years old. After I got banned from a Discord server, I became curious about how systems could be secured and whether I could understand how they worked. That curiosity led me to install Kali Linux and begin learning about cybersecurity.\n\nFrom that day on, I never stopped learning. I spent countless hours practicing, researching, and improving my skills. Over time, I discovered that my true passion was web application security, especially bug bounty hunting.\n\nI began studying vulnerabilities such as Cross-Site Scripting (XSS), SQL Injection, and other common web security issues. I enjoyed the challenge of finding vulnerabilities, understanding how they worked, and learning how to identify and report them responsibly.\n\nToday, I continue to develop my skills through hands-on labs, CTFs, bug bounty practice, and continuous learning. My goal is to become a skilled offensive security professional and contribute to making the web more secure.`,
  interests: [
    'Web Application Security',
    'Bug Bounty Hunting',
    'Penetration Testing',
    'Reconnaissance & OSINT',
    'API Security',
    'Active Directory',
    'Red Teaming',
    'Offensive AI',
    'CTFs & Security Research',
  ],
  socialLinks: {
    github: BLOG_PROFILE.socialLinks.github,
    linkedin: BLOG_PROFILE.socialLinks.linkedin,
    x: BLOG_PROFILE.socialLinks.x,
  },
};

export function getStoredProfile(): SiteProfile {
  try {
    const saved = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...DEFAULT_PROFILE,
        ...parsed,
        aboutPhotoUrl: parsed.aboutPhotoUrl || parsed.avatarUrl || DEFAULT_PROFILE.aboutPhotoUrl,
        socialLinks: {
          ...DEFAULT_PROFILE.socialLinks,
          ...(parsed.socialLinks || {}),
        },
      };
    }
  } catch (err) {
    console.error('Failed to load profile:', err);
  }
  return DEFAULT_PROFILE;
}

export function saveStoredProfile(profile: SiteProfile): void {
  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    window.dispatchEvent(new Event('profile_updated'));
  } catch (err) {
    console.error('Failed to save profile:', err);
  }
}
