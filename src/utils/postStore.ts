import { BlogPost } from '../types';
import { BLOG_POSTS } from '../data/blogData';

const STORAGE_KEY = 'hacker_research_blog_posts_v2';
let memoryPostsCache: BlogPost[] | null = null;
let hasAttemptedRemoteFetch = false;

export function getAllPostsFromStorage(): BlogPost[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const posts = parsed.map((p) => ({
          ...p,
          imageUrl: p.imageUrl || '',
          published: p.published !== false,
        }));
        memoryPostsCache = posts;
        return posts;
      }
    }
  } catch (err) {
    console.error('Failed to parse stored posts:', err);
  }

  if (memoryPostsCache !== null && memoryPostsCache.length > 0) {
    return memoryPostsCache;
  }

  // Fallback to BLOG_POSTS from blogData
  const initial: BlogPost[] = Array.isArray(BLOG_POSTS) ? BLOG_POSTS : [];
  memoryPostsCache = initial;
  if (initial.length > 0) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    } catch (err) {
      console.error('Failed to save initial posts:', err);
    }
  }
  return initial;
}

/**
 * Attempts to fetch static posts from /posts.json (deployed with GitHub Pages)
 * If found and valid, merges or updates local storage so all browsers see the posts!
 */
export async function fetchAndSyncPublicPosts(): Promise<BlogPost[]> {
  if (hasAttemptedRemoteFetch) {
    return getAllPostsFromStorage();
  }
  hasAttemptedRemoteFetch = true;

  try {
    const res = await fetch('./posts.json', { cache: 'no-cache' });
    if (res.ok) {
      const remotePosts = await res.json();
      if (Array.isArray(remotePosts) && remotePosts.length > 0) {
        const local = getAllPostsFromStorage();
        // Merge strategy: if local is empty or remote has more/updated posts
        if (local.length === 0) {
          saveStoredPosts(remotePosts);
          return remotePosts;
        } else {
          // Add any remote posts that aren't in local by ID/slug
          const localIds = new Set(local.map((p) => p.id || p.slug));
          let hasNew = false;
          const merged = [...local];
          for (const rp of remotePosts) {
            if (!localIds.has(rp.id) && !localIds.has(rp.slug)) {
              merged.push(rp);
              hasNew = true;
            }
          }
          if (hasNew) {
            saveStoredPosts(merged);
            return merged;
          }
        }
      }
    }
  } catch (err) {
    console.log('No public posts.json found or failed to fetch:', err);
  }

  return getAllPostsFromStorage();
}

export function getStoredPosts(includeUnpublished: boolean = false): BlogPost[] {
  const all = getAllPostsFromStorage();
  if (includeUnpublished) {
    return all;
  }
  return all.filter((p) => p.published !== false);
}

export function saveStoredPosts(posts: BlogPost[]): void {
  memoryPostsCache = posts;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
    window.dispatchEvent(new Event('posts_updated'));
  } catch (err) {
    console.warn('LocalStorage quota exceeded when saving posts, relying on in-memory cache:', err);
    window.dispatchEvent(new Event('posts_updated'));
  }
}

export function addStoredPost(newPostData: Omit<BlogPost, 'id'>): BlogPost {
  const currentPosts = getAllPostsFromStorage();
  
  const rawSlug = newPostData.slug?.trim() || newPostData.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'post';

  let uniqueId = rawSlug;
  let counter = 1;
  while (currentPosts.some((p) => p.id === uniqueId || p.slug === uniqueId)) {
    uniqueId = `${rawSlug}-${counter}`;
    counter++;
  }

  const newPost: BlogPost = {
    ...newPostData,
    slug: uniqueId,
    id: uniqueId,
    published: newPostData.published !== false,
  };

  const updated = [newPost, ...currentPosts];
  saveStoredPosts(updated);
  return newPost;
}

export function updateStoredPost(id: string, updatedData: Partial<BlogPost>): BlogPost | null {
  const currentPosts = getAllPostsFromStorage();
  const index = currentPosts.findIndex((p) => p.id === id || p.slug === id);
  if (index === -1) return null;

  const existing = currentPosts[index];

  const updatedPost: BlogPost = {
    ...existing,
    ...updatedData,
    id: existing.id, // preserve immutable ID
    slug: updatedData.slug?.trim() || existing.slug || existing.id,
  };

  currentPosts[index] = updatedPost;
  saveStoredPosts(currentPosts);
  return updatedPost;
}

export function deleteStoredPost(id: string): BlogPost[] {
  const currentPosts = getAllPostsFromStorage();
  const updated = currentPosts.filter((p) => p.id !== id && p.slug !== id);
  saveStoredPosts(updated);
  return updated;
}

export function resetStoredPostsToDefault(): BlogPost[] {
  saveStoredPosts([]);
  return [];
}

/**
 * Downloads current posts as a formatted posts.json file
 */
export function exportPostsJSON(): void {
  const posts = getAllPostsFromStorage();
  const jsonStr = JSON.stringify(posts, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'posts.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Imports posts from a JSON string or parsed array
 */
export function importPostsJSON(jsonStr: string): { success: boolean; count: number; error?: string } {
  try {
    const parsed = JSON.parse(jsonStr);
    if (!Array.isArray(parsed)) {
      return { success: false, count: 0, error: 'JSON must be an array of posts' };
    }
    const current = getAllPostsFromStorage();
    const existingIds = new Set(current.map((p) => p.id || p.slug));
    const newPosts: BlogPost[] = [...current];
    let importedCount = 0;

    for (const item of parsed) {
      if (!item.title) continue;
      const id = item.id || item.slug || `post-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      if (!existingIds.has(id)) {
        newPosts.unshift({
          id,
          slug: item.slug || id,
          title: item.title,
          summary: item.summary || '',
          content: item.content || '',
          category: item.category || 'InfoSec',
          tags: Array.isArray(item.tags) ? item.tags : ['security'],
          date: item.date || new Date().toISOString().split('T')[0],
          readTime: item.readTime || '5 min read',
          imageUrl: item.imageUrl || '',
          published: item.published !== false,
        });
        existingIds.add(id);
        importedCount++;
      }
    }

    saveStoredPosts(newPosts);
    return { success: true, count: importedCount };
  } catch (err: any) {
    return { success: false, count: 0, error: err.message || 'Invalid JSON format' };
  }
}

/**
 * Commits public/posts.json directly to a GitHub repository using GitHub API
 */
export async function syncPostsToGitHub(
  token: string,
  repoPath: string, // e.g. "offsecfergali/offsecfergali-blog"
  branch: string = 'main'
): Promise<{ success: boolean; message: string }> {
  try {
    const cleanRepo = repoPath.replace(/^https:\/\/github\.com\//, '').replace(/\/$/, '');
    const posts = getAllPostsFromStorage();
    const jsonContent = JSON.stringify(posts, null, 2);
    // Base64 encode using UTF-8 support
    const encoder = new TextEncoder();
    const data = encoder.encode(jsonContent);
    let binary = '';
    for (let i = 0; i < data.length; i++) {
      binary += String.fromCharCode(data[i]);
    }
    const base64Content = btoa(binary);

    const filePath = 'public/posts.json';
    const apiUrl = `https://api.github.com/repos/${cleanRepo}/contents/${filePath}?ref=${branch}`;

    // Get current SHA if file exists
    let currentSha: string | null = null;
    try {
      const getRes = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });
      if (getRes.ok) {
        const fileInfo = await getRes.json();
        currentSha = fileInfo.sha;
      }
    } catch {
      // file might not exist yet
    }

    const putUrl = `https://api.github.com/repos/${cleanRepo}/contents/${filePath}`;
    const body: any = {
      message: `Update posts.json via Blog Admin [${new Date().toISOString().split('T')[0]}]`,
      content: base64Content,
      branch: branch,
    };
    if (currentSha) {
      body.sha = currentSha;
    }

    const putRes = await fetch(putUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!putRes.ok) {
      const errData = await putRes.json().catch(() => ({}));
      return {
        success: false,
        message: errData.message || `GitHub API error (${putRes.status})`,
      };
    }

    return {
      success: true,
      message: `Successfully published posts.json to ${cleanRepo}! GitHub Actions will deploy it shortly.`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Failed to connect to GitHub API',
    };
  }
}

