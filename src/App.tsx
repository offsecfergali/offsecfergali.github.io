/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Copy, 
  Check, 
  Menu, 
  X,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

interface DocItem {
  id: string;
  section: 'Writeups' | 'About' | 'Research';
  title: string;
  slug: string;
  readTime: string;
  date: string;
  author: string;
  summary: string;
  content: string;
  codeSnippet?: string;
}

const INITIAL_DOCS: DocItem[] = [
  {
    id: 'about-intro',
    section: 'About',
    title: 'About Me',
    slug: 'about-me',
    readTime: '2 min read',
    date: 'Oct 2026',
    author: 'Alae Eddine',
    summary: 'Penetration tester and bug bounty hunter from Morocco.',
    content: `I'm Alae Eddine, a 17-year-old penetration tester and bug bounty hunter from Morocco. I started my cybersecurity journey in 2024, focusing on penetration testing, web application security, bug bounty, and red teaming.

I spend most of my time hunting for vulnerabilities, practicing on platforms like Hack The Box and TryHackMe, and improving my offensive security skills through hands-on research.

This playbook is based on the practical methodology I've developed through real-world research, labs, and experience.

Find me on X/Twitter.`
  },
  {
    id: 'writeup-sample-1',
    section: 'Writeups',
    title: 'Container Escape via Cgroup Namespace',
    slug: 'container-escape-cgroup',
    readTime: '6 min read',
    date: 'Oct 2026',
    author: 'Alae Eddine',
    summary: 'Technical walkthrough of privilege escalation from container to host worker node.',
    content: `During recent engagements, analyzing container configurations revealed critical cgroup namespace exposure vectors allowing root code execution on host nodes.`,
    codeSnippet: `docker run --rm -v /:/host -it ubuntu:latest /bin/chroot /host /bin/bash`
  },
  {
    id: 'writeup-sample-2',
    section: 'Writeups',
    title: 'Active Directory Kerberoasting at Scale',
    slug: 'ad-kerberoasting',
    readTime: '8 min read',
    date: 'Oct 2026',
    author: 'Alae Eddine',
    summary: 'Requesting service ticket hashes without generating suspicious Event ID 4624 login noise.',
    content: `Kerberoasting remains one of the most reliable post-exploitation techniques in enterprise environments utilizing Microsoft Active Directory.`,
    codeSnippet: `Get-DomainUser -SPN | Select-Object samaccountname, serviceprincipalname`
  },
  {
    id: 'research-recon',
    section: 'Research',
    title: 'Reconnaissance & OSINT Methodology',
    slug: 'recon-osint-methodology',
    readTime: '5 min read',
    date: 'Oct 2026',
    author: 'Alae Eddine',
    summary: 'Systematic approach to target profiling and attack surface mapping.',
    content: `Comprehensive reconnaissance is essential for identifying unmonitored perimeter assets, shadow IT, and developer credential leaks across public repositories.`
  }
];

export default function App() {
  const [docs, setDocs] = useState<DocItem[]>(() => {
    const saved = localStorage.getItem('offsecfergali_docs_v3');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_DOCS;
  });

  const [currentDocId, setCurrentDocId] = useState<string>('about-intro');
  const [activeCategoryIndex, setActiveCategoryIndex] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const currentDoc = docs.find(d => d.id === currentDocId);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const filteredDocs = docs.filter(d => 
    d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sections = ['Writeups', 'About', 'Research'] as const;

  return (
    <div className="min-h-screen bg-white text-black font-['Inter',sans-serif] flex flex-col">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 bg-white border-b border-neutral-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-1.5 border border-neutral-300 rounded hover:bg-neutral-100"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          
          <a href="#" onClick={() => { setActiveCategoryIndex(null); setCurrentDocId('about-intro'); }} className="font-bold tracking-tight text-sm md:text-base cursor-pointer">
            offsecfergali
          </a>
        </div>

        {/* Search Input */}
        <div className="relative w-56 md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input 
            type="text" 
            placeholder="Search..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-50 border border-neutral-200 rounded-md pl-9 pr-12 py-1.5 text-xs text-black placeholder-neutral-400 focus:outline-none focus:border-black transition-colors"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
            <span className="text-[10px] font-mono px-1.5 py-0.5 bg-neutral-200 text-neutral-600 rounded">⌘</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 bg-neutral-200 text-neutral-600 rounded">K</span>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex">
        {/* Left Sidebar */}
        <aside className={`
          fixed md:static inset-y-0 left-0 z-40 w-72 bg-white border-r border-neutral-200 p-6 space-y-8 overflow-y-auto transition-transform
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          pt-16 md:pt-6
        `}>
          {searchQuery ? (
            <div className="space-y-4">
              <div className="text-xs font-mono font-bold text-neutral-500 uppercase">
                Search Results ({filteredDocs.length})
              </div>
              <div className="space-y-1">
                {filteredDocs.map(doc => (
                  <button
                    key={doc.id}
                    onClick={() => { setActiveCategoryIndex(null); setCurrentDocId(doc.id); setIsMobileMenuOpen(false); setSearchQuery(''); }}
                    className="w-full text-left px-3 py-2 rounded text-xs transition-colors text-neutral-600 hover:text-black hover:bg-neutral-50"
                  >
                    {doc.title}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            sections.map(section => (
              <div key={section} className="space-y-3">
                <button 
                  onClick={() => { setActiveCategoryIndex(section); }}
                  className={`text-[11px] font-mono font-bold tracking-wider text-left uppercase hover:text-black transition-colors ${activeCategoryIndex === section ? 'text-black underline' : 'text-neutral-500'}`}
                >
                  {section}
                </button>
                <div className="space-y-0.5">
                  {docs.filter(d => d.section === section).map(doc => (
                    <button
                      key={doc.id}
                      onClick={() => { setActiveCategoryIndex(null); setCurrentDocId(doc.id); setIsMobileMenuOpen(false); }}
                      className={`w-full text-left px-3 py-1.5 rounded text-xs transition-colors leading-relaxed ${!activeCategoryIndex && currentDocId === doc.id ? 'bg-neutral-100 font-semibold text-black' : 'text-neutral-600 hover:text-black hover:bg-neutral-50'}`}
                    >
                      {doc.title}
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </aside>

        {/* Right Content Area */}
        <main className="flex-1 p-6 md:p-12 max-w-4xl mx-auto space-y-8">
          {activeCategoryIndex ? (
            <div className="space-y-6">
              <div className="border-b border-neutral-200 pb-4">
                <div className="text-xs font-mono text-neutral-500 mb-1">Index</div>
                <h1 className="text-3xl font-extrabold tracking-tight text-black">
                  All {activeCategoryIndex}
                </h1>
              </div>

              <div className="space-y-4">
                {docs.filter(d => d.section === activeCategoryIndex).map(doc => (
                  <div 
                    key={doc.id}
                    onClick={() => { setActiveCategoryIndex(null); setCurrentDocId(doc.id); }}
                    className="border border-neutral-200 rounded-lg p-5 hover:border-black transition-colors cursor-pointer space-y-2 group bg-white"
                  >
                    <div className="flex items-center justify-between text-xs font-mono text-neutral-500">
                      <span>{doc.date}</span>
                      <span>{doc.readTime}</span>
                    </div>
                    <h2 className="text-lg font-bold text-black group-hover:underline">
                      {doc.title}
                    </h2>
                    <p className="text-sm text-neutral-600 line-clamp-2">
                      {doc.summary}
                    </p>
                    <div className="flex items-center gap-1 text-xs font-mono font-bold text-black pt-2">
                      <span>Read article</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : currentDoc ? (
            <>
              <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
                <div className="text-xs font-mono text-neutral-500">
                  <button onClick={() => setActiveCategoryIndex(currentDoc.section)} className="hover:underline">
                    {currentDoc.section}
                  </button> 
                  <span className="mx-1">/</span> 
                  <span className="text-black font-medium">{currentDoc.title}</span>
                </div>

                <div className="relative">
                  <button 
                    onClick={() => handleCopy(currentDoc.content)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-neutral-300 rounded hover:bg-neutral-50 transition-colors cursor-pointer"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-neutral-600" />}
                    <span>{isCopied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <article className="space-y-6">
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-black">
                  {currentDoc.title}
                </h1>

                <div className="prose max-w-none space-y-4 text-neutral-800 text-sm md:text-base leading-relaxed">
                  <p className="text-base md:text-lg font-medium text-neutral-900">
                    {currentDoc.summary}
                  </p>

                  <div className="space-y-4 whitespace-pre-line">
                    {currentDoc.content}
                  </div>

                  {currentDoc.id === 'about-intro' && (
                    <div className="pt-4">
                      <a 
                        href="https://twitter.com" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-black border border-black px-4 py-2 hover:bg-black hover:text-white transition-colors"
                      >
                        <span>Find me on X/Twitter</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}

                  {currentDoc.codeSnippet && (
                    <div className="my-6 rounded-lg bg-neutral-950 text-neutral-100 font-mono text-xs p-4 overflow-x-auto border border-neutral-800">
                      <pre className="text-emerald-400">{currentDoc.codeSnippet}</pre>
                    </div>
                  )}
                </div>

                <div className="pt-8 mt-12 border-t border-neutral-200 flex items-center justify-between text-xs font-mono text-neutral-500">
                  <div>Author: {currentDoc.author}</div>
                  <div>Published: {currentDoc.date}</div>
                </div>
              </article>
            </>
          ) : null}
        </main>
      </div>
    </div>
  );
}
