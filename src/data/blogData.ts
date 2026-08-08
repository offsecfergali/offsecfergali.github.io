import { BlogPost, Project, CategoryItem, ProjectEventItem } from '../types';

export const BLOG_PROFILE = {
  name: 'offsecfergali',
  author: 'Alae Eddine Fergali',
  role: 'Offensive Security Researcher',
  bio: 'Web Security • Red Team • Bug Bounty • CTF',
  handle: '@offsecfergali',
  description: 'Offensive Security Researcher',
  avatarUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=400&q=80',
  location: 'Morocco',
  socialLinks: {
    github: 'https://github.com/offsecfergali',
    linkedin: 'https://www.linkedin.com/in/alae-eddine-fergali-1a2996376/',
    x: 'https://x.com/al4e0x',
  },
};

export const BLOG_POSTS: BlogPost[] = [];

export const PROJECTS: Project[] = [];
export const CATEGORIES: CategoryItem[] = [
  { name: 'InfoSec', description: 'Hacking, Red Teaming & Exploits', count: 0, iconName: 'Terminal' },
  { name: 'Crypto', description: 'Lattice PQC & Cryptanalysis', count: 0, iconName: 'Lock' },
  { name: 'CTFs', description: 'Defcon & HackTheBox Writeups', count: 0, iconName: 'Flag' },
  { name: 'Research', description: 'Offensive Research & Vulnerability Analysis', count: 0, iconName: 'Cpu' },
];
export const PROJECT_EVENTS: ProjectEventItem[] = [];
