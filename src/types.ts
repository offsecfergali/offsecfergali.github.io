export type NavTab = 
  | 'HOME'
  | 'ADD_POST'
  | 'ABOUT'
  | 'ARCHIVES'
  | 'TAGS';

export interface BlogPost {
  id: string;
  slug?: string;
  title: string;
  date: string;
  readTime: string;
  category: 'Research' | 'InfoSec' | 'Crypto' | 'CTFs';
  tags: string[];
  summary: string;
  content: string;
  featured?: boolean;
  imageUrl?: string;
  published?: boolean;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  githubUrl: string;
  stars: number;
  language: string;
  updatedAt: string;
}

export interface ProjectEventItem {
  id: string;
  year: string;
  eventName: string;
  description: string;
  linkText: string;
  linkUrl: string;
  badge?: string;
}

export interface CategoryItem {
  name: 'Research' | 'InfoSec' | 'Crypto' | 'CTFs';
  description: string;
  count: number;
  iconName: string;
}
