import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Sparkles,
  Wrench,
  Globe,
  Save,
  Send,
  Eye,
  ExternalLink,
  MessageSquare,
  Upload,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  Code2,
  Cpu,
  Brain,
  Layers,
  Zap,
  Database,
  Palette,
  Terminal,
  ShieldCheck,
  Bot,
  Laptop,
  Tablet,
  Smartphone,
  Copy,
  Check,
  RefreshCw,
  X,
  Mail,
  User,
  Github,
  Linkedin,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import {
  PortfolioWebsiteData,
  PortfolioTheme,
  PortfolioServiceCard,
  PortfolioProjectItem,
  PortfolioStatItem,
  PortfolioMessageData,
} from '@shared/types';

const THEME_OPTIONS: Array<{ id: PortfolioTheme; name: string; desc: string; colors: string; bg: string }> = [
  {
    id: 'teal_dark',
    name: 'Teal Modern',
    desc: 'Deep slate with cyan/teal neon accents',
    colors: 'bg-teal-500 text-teal-400 border-teal-500/30',
    bg: 'from-[#0B1120] to-[#111C33]',
  },
  {
    id: 'slate_clean',
    name: 'Slate Minimal',
    desc: 'Clean corporate steel with electric blue highlights',
    colors: 'bg-blue-500 text-blue-400 border-blue-500/30',
    bg: 'from-[#0F172A] to-[#1E293B]',
  },
  {
    id: 'indigo_creative',
    name: 'Indigo Creative',
    desc: 'Dark violet with vibrant purple gradients',
    colors: 'bg-purple-500 text-purple-400 border-purple-500/30',
    bg: 'from-[#0D0B18] to-[#18142E]',
  },
  {
    id: 'cyber_amber',
    name: 'Cyber Amber',
    desc: 'Obsidian black with sharp gold and amber accents',
    colors: 'bg-amber-400 text-amber-400 border-amber-500/30',
    bg: 'from-[#0C0A09] to-[#1C1917]',
  },
];

const AVAILABLE_ICONS = ['Code2', 'Cpu', 'Brain', 'Layers', 'Zap', 'Database', 'Globe', 'Palette', 'Terminal'];

export const PortfolioBuilderPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Builder View Modes
  const [activeTab, setActiveTab] = useState<'hero' | 'services' | 'projects' | 'about' | 'stats' | 'contact' | 'theme'>('hero');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [showAiWizard, setShowAiWizard] = useState(false);
  const [showMessagesModal, setShowMessagesModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // AI Wizard State
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardRole, setWizardRole] = useState('Full-Stack Software Engineer');
  const [wizardTone, setWizardTone] = useState<'tech_lead' | 'confident' | 'minimalist' | 'friendly'>('confident');
  const [wizardTheme, setWizardTheme] = useState<PortfolioTheme>('teal_dark');
  const [wizardGenerating, setWizardGenerating] = useState(false);

  // Main Portfolio State
  const [website, setWebsite] = useState<Partial<PortfolioWebsiteData>>({
    slug: '',
    status: 'DRAFT',
    theme: 'teal_dark',
    enableBot: true,
    headline: '',
    subheadline: '',
    heroCtaText: 'Explore Projects',
    heroCtaLink: '#projects',
    heroImageUrl: '',
    services: [
      { icon: 'Code2', title: 'Full-Stack Web Architecture', description: 'Building resilient end-to-end web platforms.' },
      { icon: 'Cpu', title: 'Distributed Systems & APIs', description: 'Designing low-latency backend microservices and databases.' },
      { icon: 'Brain', title: 'Applied AI & Vector Engines', description: 'Developing intelligent assistants and mathematical vector search.' },
    ],
    projects: [],
    aboutBio: '',
    aboutImageUrl: '',
    skills: [],
    stats: [
      { label: 'Projects Shipped', value: '4+', subtext: 'Production Grade' },
      { label: 'Verified Certifications', value: '3', subtext: 'Industry & NPTEL' },
      { label: 'Domain Skill Match', value: '92%', subtext: 'Verified' },
    ],
    contactEmail: user?.email || '',
    socials: { github: '', linkedin: '', website: '' },
    sectionsOrder: ['hero', 'services', 'projects', 'about', 'stats', 'contact', 'footer'],
    sectionsVisibility: { hero: true, services: true, projects: true, about: true, stats: true, contact: true, footer: true },
  });

  // Fetch Existing Portfolio
  const { data: portfolioData, isLoading } = useQuery({
    queryKey: ['myPortfolio'],
    queryFn: () => api.get<{ portfolio: PortfolioWebsiteData | null; studentProfile: any }>('/portfolios/me'),
  });

  // Fetch Visitor Messages
  const { data: messagesData } = useQuery({
    queryKey: ['myPortfolioMessages'],
    queryFn: () => api.get<{ messages: PortfolioMessageData[] }>('/portfolios/me/messages'),
  });

  // Initialize data when fetched
  useEffect(() => {
    if (portfolioData?.portfolio) {
      setWebsite(portfolioData.portfolio);
    } else if (portfolioData?.studentProfile) {
      const p = portfolioData.studentProfile;
      const defaultSlug = (p.user?.name || 'engineer').toLowerCase().replace(/\s+/g, '-');
      setWebsite(prev => ({
        ...prev,
        slug: defaultSlug,
        headline: p.headline ? `Crafting ${p.headline}` : 'Architecting Resilient Distributed Systems & Reactive Interfaces',
        subheadline: p.bio ? p.bio.slice(0, 180) + '...' : 'Building high-scale software applications and verified cloud microservices.',
        aboutBio: p.bio || '',
        contactEmail: p.user?.email || '',
        heroImageUrl: p.user?.avatarUrl || '',
        aboutImageUrl: p.user?.avatarUrl || '',
        socials: {
          github: p.githubUsername ? `https://github.com/${p.githubUsername}` : '',
          linkedin: p.linkedinUrl || '',
          email: p.user?.email || '',
        },
        projects: p.projectsJson ? JSON.parse(p.projectsJson).map((pr: any, i: number) => ({
          id: pr.id || `proj-${i}`,
          title: pr.title || 'Featured Project',
          description: pr.description || '',
          tags: pr.techStack || ['TypeScript', 'React'],
          githubUrl: pr.githubUrl || '',
          demoUrl: pr.demoUrl || '',
          thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80',
        })) : [],
      }));
    }
  }, [portfolioData]);

  // Save Mutation
  const saveMutation = useMutation({
    mutationFn: (payload: any) => api.put<{ portfolio: PortfolioWebsiteData }>('/portfolios/me', payload),
    onSuccess: (res) => {
      setWebsite(res.portfolio);
      queryClient.invalidateQueries({ queryKey: ['myPortfolio'] });
      setSaveToast('Draft saved successfully!');
      setTimeout(() => setSaveToast(null), 3000);
    },
  });

  // Publish Mutation
  const publishMutation = useMutation({
    mutationFn: () => api.post<{ portfolio: PortfolioWebsiteData }>('/portfolios/me/publish', {}),
    onSuccess: (res) => {
      setWebsite(res.portfolio);
      queryClient.invalidateQueries({ queryKey: ['myPortfolio'] });
      setSaveToast('Portfolio successfully published to live URL!');
      setTimeout(() => setSaveToast(null), 3500);
    },
  });

  // Image Upload Helper
  const handleImageUpload = async (file: File, targetField: 'heroImageUrl' | 'aboutImageUrl' | string) => {
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await api.post<{ imageUrl: string }>('/portfolios/upload-image', formData);
      if (targetField === 'heroImageUrl' || targetField === 'aboutImageUrl') {
        setWebsite(prev => ({ ...prev, [targetField]: res.imageUrl }));
      } else if (targetField.startsWith('project-')) {
        const projIdx = parseInt(targetField.replace('project-', ''), 10);
        setWebsite(prev => {
          const projs = [...(prev.projects || [])];
          if (projs[projIdx]) {
            projs[projIdx] = { ...projs[projIdx], thumbnail: res.imageUrl };
          }
          return { ...prev, projects: projs };
        });
      }
      setSaveToast('Image uploaded successfully!');
      setTimeout(() => setSaveToast(null), 2500);
    } catch (err: any) {
      console.error('Image upload failed:', err);
      alert('Failed to upload image. Please try again.');
    }
  };

  // Run AI Wizard Generation
  const handleRunAiWizard = async () => {
    setWizardGenerating(true);
    try {
      const res = await api.post<{ generated: Partial<PortfolioWebsiteData> }>('/portfolios/ai-wizard', {
        roleTarget: wizardRole,
        tone: wizardTone,
        theme: wizardTheme,
      });

      setWebsite(prev => ({
        ...prev,
        ...res.generated,
        theme: wizardTheme,
      }));

      setShowAiWizard(false);
      setSaveToast('✨ AI successfully generated your portfolio copy!');
      setTimeout(() => setSaveToast(null), 3500);
    } catch (err: any) {
      console.error('AI Wizard error:', err);
      alert(err.message || 'AI Generation encountered an issue.');
    } finally {
      setWizardGenerating(false);
    }
  };

  const handleCopyLink = () => {
    const liveUrl = `${window.location.origin}/p/${website.slug || 'me'}`;
    navigator.clipboard.writeText(liveUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const messagesList = messagesData?.messages || [];
  const unreadMessagesCount = messagesList.filter(m => !m.read).length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-console-bg flex flex-col items-center justify-center p-6">
        <div className="w-8 h-8 border-2 border-bridge-teal border-t-transparent rounded-full animate-spin mb-3" />
        <span className="text-xs font-mono text-console-text-muted">Loading portfolio editor...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-console-bg text-console-text flex flex-col font-sans">
      {/* ── TOP HEADER ACTION BAR ── */}
      <header className="bg-console-panel border-b border-console-border px-4 py-3 sticky top-0 z-30 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-bridge-teal to-campus-blue text-white flex items-center justify-center font-bold text-sm shadow-sm">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-console-text font-serif">Portfolio Website Builder</h1>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                  website.status === 'PUBLISHED'
                    ? 'bg-status-green/15 text-status-green border-status-green/30 font-semibold'
                    : 'bg-console-panel-raised text-console-text-muted border-console-border'
                }`}
              >
                {website.status === 'PUBLISHED' ? '● Published' : '○ Draft'}
              </span>
            </div>
            <div className="text-[11px] font-mono text-console-text-muted flex items-center gap-1">
              <span>Public URL:</span>
              <span className="text-bridge-teal font-semibold">/p/{website.slug || 'slug'}</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={() => setShowAiWizard(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-sm transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate with AI</span>
          </button>

          <button
            onClick={() => setShowMessagesModal(true)}
            className="relative flex items-center gap-1.5 px-3 py-2 rounded-xl bg-console-panel-raised hover:bg-console-border text-console-text text-xs font-medium border border-console-border transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5 text-bridge-teal" />
            <span>Visitor Inbox</span>
            {unreadMessagesCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-status-red text-white text-[9px] font-bold flex items-center justify-center ml-1">
                {unreadMessagesCount}
              </span>
            )}
          </button>

          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-console-panel-raised hover:bg-console-border text-console-text text-xs font-medium border border-console-border transition-colors"
            title="Copy Public Link"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-status-green" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Copied!' : 'Share URL'}</span>
          </button>

          <Link
            to={`/p/${website.slug || 'satyam-singh'}`}
            target="_blank"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-console-panel-raised hover:bg-console-border text-console-text text-xs font-medium border border-console-border transition-colors"
          >
            <Eye className="w-3.5 h-3.5 text-campus-blue" />
            <span>View Live</span>
          </Link>

          <button
            onClick={() => saveMutation.mutate(website)}
            disabled={saveMutation.isPending}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-console-panel-raised hover:bg-console-border text-console-text text-xs font-semibold border border-console-border transition-colors"
          >
            <Save className="w-3.5 h-3.5 text-bridge-teal" />
            <span>{saveMutation.isPending ? 'Saving...' : 'Save Draft'}</span>
          </button>

          <button
            onClick={() => publishMutation.mutate()}
            disabled={publishMutation.isPending}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-bridge-teal hover:bg-bridge-teal/90 text-slate-950 text-xs font-bold shadow-md shadow-bridge-teal/20 transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{publishMutation.isPending ? 'Publishing...' : 'Publish'}</span>
          </button>
        </div>
      </header>

      {/* Save / Toast Alert */}
      {saveToast && (
        <div className="fixed top-18 right-6 z-50 p-3.5 rounded-xl bg-status-green/15 border border-status-green/30 text-status-green text-xs font-medium flex items-center gap-2 shadow-2xl animate-fade-in">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* ── MAIN SPLIT VIEW (EDITOR LEFT + LIVE PREVIEW RIGHT) ── */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
        {/* ── LEFT PANEL: SECTION-BY-SECTION EDITOR ── */}
        <div className="lg:col-span-5 bg-console-panel border-r border-console-border flex flex-col h-[calc(100vh-61px)] overflow-y-auto">
          {/* Section Navigation Tabs */}
          <div className="p-3 border-b border-console-border bg-console-panel/80 sticky top-0 z-20 backdrop-blur-sm">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {[
                { id: 'hero', label: '1. Hero' },
                { id: 'services', label: '2. Focus' },
                { id: 'projects', label: '3. Projects' },
                { id: 'about', label: '4. About' },
                { id: 'stats', label: '5. Stats' },
                { id: 'contact', label: '6. Contact' },
                { id: 'theme', label: 'Theme & AI' },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    activeTab === t.id
                      ? 'bg-bridge-teal text-slate-950 font-semibold shadow-sm'
                      : 'text-console-text-muted hover:text-console-text hover:bg-console-panel-raised'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Contents */}
          <div className="p-5 space-y-6 flex-1">
            {/* 1. HERO TAB */}
            {activeTab === 'hero' && (
              <div className="space-y-4">
                <div className="border-b border-console-border/60 pb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-bridge-teal font-mono">
                    Hero Section
                  </h3>
                  <p className="text-[11px] text-console-text-muted">
                    Your prime headline, value proposition statement, and profile image.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-console-text">Custom URL Slug</label>
                  <div className="flex items-center">
                    <span className="px-3 py-2.5 rounded-l-xl bg-console-panel-raised border border-r-0 border-console-border text-xs font-mono text-console-text-muted">
                      /p/
                    </span>
                    <input
                      type="text"
                      value={website.slug || ''}
                      onChange={e => setWebsite(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '') }))}
                      placeholder="satyam-singh"
                      className="w-full px-3 py-2.5 rounded-r-xl bg-console-bg border border-console-border text-xs text-console-text font-mono focus:outline-none focus:border-bridge-teal"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-console-text">Primary Headline</label>
                  <textarea
                    rows={2}
                    value={website.headline || ''}
                    onChange={e => setWebsite(prev => ({ ...prev, headline: e.target.value }))}
                    placeholder="Crafting resilient distributed web systems & vector intelligence platforms"
                    className="w-full p-3 rounded-xl bg-console-bg border border-console-border text-xs text-console-text focus:outline-none focus:border-bridge-teal"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-console-text">Subheadline / Introduction</label>
                  <textarea
                    rows={3}
                    value={website.subheadline || ''}
                    onChange={e => setWebsite(prev => ({ ...prev, subheadline: e.target.value }))}
                    placeholder="Hi, I am Satyam Singh — Computer Science undergraduate at DTU. Specialized in high-throughput TypeScript backends, modern React interfaces, and production-grade architectures."
                    className="w-full p-3 rounded-xl bg-console-bg border border-console-border text-xs text-console-text focus:outline-none focus:border-bridge-teal"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-console-text">Hero CTA Button Text</label>
                    <input
                      type="text"
                      value={website.heroCtaText || ''}
                      onChange={e => setWebsite(prev => ({ ...prev, heroCtaText: e.target.value }))}
                      placeholder="Explore Featured Projects"
                      className="w-full px-3 py-2 rounded-xl bg-console-bg border border-console-border text-xs text-console-text focus:outline-none focus:border-bridge-teal"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-console-text">Hero CTA Target Link</label>
                    <input
                      type="text"
                      value={website.heroCtaLink || ''}
                      onChange={e => setWebsite(prev => ({ ...prev, heroCtaLink: e.target.value }))}
                      placeholder="#projects"
                      className="w-full px-3 py-2 rounded-xl bg-console-bg border border-console-border text-xs text-console-text focus:outline-none focus:border-bridge-teal"
                    />
                  </div>
                </div>

                {/* Hero Avatar Image Upload (No prompt!) */}
                <div className="space-y-2 pt-2">
                  <label className="text-xs font-mono text-console-text">Hero Profile Picture</label>
                  <div className="flex items-center gap-4">
                    <img
                      src={website.heroImageUrl || user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300'}
                      alt="Avatar Preview"
                      className="w-14 h-14 rounded-2xl object-cover border border-console-border"
                    />
                    <label className="cursor-pointer flex items-center gap-2 px-3.5 py-2 rounded-xl bg-console-panel-raised hover:bg-console-border text-xs text-console-text font-medium border border-console-border transition-colors">
                      <Upload className="w-3.5 h-3.5 text-bridge-teal" />
                      <span>Upload New Image</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => {
                          if (e.target.files?.[0]) handleImageUpload(e.target.files[0], 'heroImageUrl');
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* 2. SERVICES / FOCUS AREAS TAB */}
            {activeTab === 'services' && (
              <div className="space-y-4">
                <div className="border-b border-console-border/60 pb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-bridge-teal font-mono">
                    Focus Areas ("What I Do")
                  </h3>
                  <p className="text-[11px] text-console-text-muted">
                    3 distinct pillar cards showcasing your primary engineering specializations.
                  </p>
                </div>

                {(website.services || []).map((svc, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-console-bg border border-console-border space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-semibold text-bridge-teal">
                        Pillar #{idx + 1}
                      </span>
                      {/* Icon selector */}
                      <select
                        value={svc.icon}
                        onChange={e => {
                          const updated = [...(website.services || [])];
                          updated[idx].icon = e.target.value;
                          setWebsite(prev => ({ ...prev, services: updated }));
                        }}
                        className="text-xs font-mono bg-console-panel-raised border border-console-border px-2.5 py-1 rounded-lg text-console-text"
                      >
                        {AVAILABLE_ICONS.map(ic => (
                          <option key={ic} value={ic}>{ic}</option>
                        ))}
                      </select>
                    </div>

                    <input
                      type="text"
                      value={svc.title}
                      onChange={e => {
                        const updated = [...(website.services || [])];
                        updated[idx].title = e.target.value;
                        setWebsite(prev => ({ ...prev, services: updated }));
                      }}
                      placeholder="Title (e.g. Full-Stack Web Architecture)"
                      className="w-full px-3 py-2 rounded-xl bg-console-panel-raised border border-console-border text-xs text-console-text font-semibold focus:outline-none focus:border-bridge-teal"
                    />

                    <textarea
                      rows={2}
                      value={svc.description}
                      onChange={e => {
                        const updated = [...(website.services || [])];
                        updated[idx].description = e.target.value;
                        setWebsite(prev => ({ ...prev, services: updated }));
                      }}
                      placeholder="Description of what you do in this area..."
                      className="w-full p-2.5 rounded-xl bg-console-panel-raised border border-console-border text-xs text-console-text focus:outline-none focus:border-bridge-teal"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* 3. FEATURED PROJECTS TAB */}
            {activeTab === 'projects' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-console-border/60 pb-3">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-bridge-teal font-mono">
                      Featured Projects
                    </h3>
                    <p className="text-[11px] text-console-text-muted">
                      Add and customize projects shown with dynamic tag filter tabs.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const newProj: PortfolioProjectItem = {
                        id: `proj-${Date.now()}`,
                        title: 'New Project',
                        description: 'Describe the problem solved, architectural decisions, and impact.',
                        tags: ['React', 'TypeScript'],
                        githubUrl: 'https://github.com',
                        demoUrl: '',
                        thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800',
                      };
                      setWebsite(prev => ({ ...prev, projects: [...(prev.projects || []), newProj] }));
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-bridge-teal text-slate-950 text-xs font-bold shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Project</span>
                  </button>
                </div>

                {(website.projects || []).map((proj, idx) => (
                  <div key={proj.id || idx} className="p-4 rounded-xl bg-console-bg border border-console-border space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-semibold text-console-text">
                        Project #{idx + 1}
                      </span>
                      <button
                        onClick={() => {
                          setWebsite(prev => ({
                            ...prev,
                            projects: (prev.projects || []).filter((_, i) => i !== idx),
                          }));
                        }}
                        className="text-status-red hover:bg-status-red/10 p-1 rounded-lg transition-colors"
                        title="Delete project"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <input
                      type="text"
                      value={proj.title}
                      onChange={e => {
                        const updated = [...(website.projects || [])];
                        updated[idx].title = e.target.value;
                        setWebsite(prev => ({ ...prev, projects: updated }));
                      }}
                      placeholder="Project Title"
                      className="w-full px-3 py-2 rounded-xl bg-console-panel-raised border border-console-border text-xs text-console-text font-semibold focus:outline-none focus:border-bridge-teal"
                    />

                    <textarea
                      rows={2}
                      value={proj.description}
                      onChange={e => {
                        const updated = [...(website.projects || [])];
                        updated[idx].description = e.target.value;
                        setWebsite(prev => ({ ...prev, projects: updated }));
                      }}
                      placeholder="Detailed architectural summary..."
                      className="w-full p-2.5 rounded-xl bg-console-panel-raised border border-console-border text-xs text-console-text focus:outline-none focus:border-bridge-teal"
                    />

                    <div className="space-y-1">
                      <label className="text-[11px] font-mono text-console-text-muted">Tech Tags (comma separated)</label>
                      <input
                        type="text"
                        value={proj.tags?.join(', ') || ''}
                        onChange={e => {
                          const updated = [...(website.projects || [])];
                          updated[idx].tags = e.target.value.split(',').map(t => t.trim()).filter(Boolean);
                          setWebsite(prev => ({ ...prev, projects: updated }));
                        }}
                        placeholder="React, TypeScript, Node.js, PostgreSQL"
                        className="w-full px-3 py-1.5 rounded-xl bg-console-panel-raised border border-console-border text-xs text-console-text focus:outline-none focus:border-bridge-teal"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={proj.githubUrl || ''}
                        onChange={e => {
                          const updated = [...(website.projects || [])];
                          updated[idx].githubUrl = e.target.value;
                          setWebsite(prev => ({ ...prev, projects: updated }));
                        }}
                        placeholder="GitHub URL"
                        className="px-3 py-1.5 rounded-xl bg-console-panel-raised border border-console-border text-xs text-console-text focus:outline-none focus:border-bridge-teal"
                      />
                      <input
                        type="text"
                        value={proj.demoUrl || ''}
                        onChange={e => {
                          const updated = [...(website.projects || [])];
                          updated[idx].demoUrl = e.target.value;
                          setWebsite(prev => ({ ...prev, projects: updated }));
                        }}
                        placeholder="Live Demo URL"
                        className="px-3 py-1.5 rounded-xl bg-console-panel-raised border border-console-border text-xs text-console-text focus:outline-none focus:border-bridge-teal"
                      />
                    </div>

                    {/* Thumbnail upload */}
                    <div className="flex items-center gap-3 pt-1">
                      {proj.thumbnail && (
                        <img src={proj.thumbnail} alt="" className="w-12 h-10 rounded-lg object-cover border border-console-border" />
                      )}
                      <label className="cursor-pointer text-[11px] font-mono flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-console-panel-raised hover:bg-console-border border border-console-border text-console-text transition-colors">
                        <Upload className="w-3 h-3 text-bridge-teal" />
                        <span>Upload Thumbnail</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={e => {
                            if (e.target.files?.[0]) handleImageUpload(e.target.files[0], `project-${idx}`);
                          }}
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 4. ABOUT ME TAB */}
            {activeTab === 'about' && (
              <div className="space-y-4">
                <div className="border-b border-console-border/60 pb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-bridge-teal font-mono">
                    About Me
                  </h3>
                  <p className="text-[11px] text-console-text-muted">
                    Your professional narrative, bio, and verified skill badges.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-console-text">Full Narrative Bio</label>
                  <textarea
                    rows={6}
                    value={website.aboutBio || ''}
                    onChange={e => setWebsite(prev => ({ ...prev, aboutBio: e.target.value }))}
                    placeholder="Describe your engineering trajectory, academic foundation at DTU, and project achievements..."
                    className="w-full p-3 rounded-xl bg-console-bg border border-console-border text-xs text-console-text focus:outline-none focus:border-bridge-teal leading-relaxed"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-console-text">Verified Skills Badges (comma separated)</label>
                  <input
                    type="text"
                    value={website.skills?.join(', ') || ''}
                    onChange={e => setWebsite(prev => ({ ...prev, skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
                    placeholder="TypeScript, React.js, Node.js, PostgreSQL, Docker, System Design"
                    className="w-full px-3 py-2 rounded-xl bg-console-bg border border-console-border text-xs text-console-text focus:outline-none focus:border-bridge-teal"
                  />
                </div>

                <div className="space-y-2 pt-2">
                  <label className="text-xs font-mono text-console-text">About Section Photo</label>
                  <div className="flex items-center gap-4">
                    <img
                      src={website.aboutImageUrl || website.heroImageUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300'}
                      alt="About Avatar"
                      className="w-14 h-14 rounded-2xl object-cover border border-console-border"
                    />
                    <label className="cursor-pointer flex items-center gap-2 px-3.5 py-2 rounded-xl bg-console-panel-raised hover:bg-console-border text-xs text-console-text font-medium border border-console-border transition-colors">
                      <Upload className="w-3.5 h-3.5 text-bridge-teal" />
                      <span>Upload Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => {
                          if (e.target.files?.[0]) handleImageUpload(e.target.files[0], 'aboutImageUrl');
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* 5. STATS TAB */}
            {activeTab === 'stats' && (
              <div className="space-y-4">
                <div className="border-b border-console-border/60 pb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-bridge-teal font-mono">
                    Stats & Highlights Strip
                  </h3>
                  <p className="text-[11px] text-console-text-muted">
                    Real, verified engineering metrics (e.g. 6+ Projects Shipped, 4 Certifications).
                  </p>
                </div>

                {(website.stats || []).map((st, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-console-bg border border-console-border space-y-2">
                    <span className="text-xs font-mono text-bridge-teal font-semibold">
                      Stat #{idx + 1}
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={st.value}
                        onChange={e => {
                          const updated = [...(website.stats || [])];
                          updated[idx].value = e.target.value;
                          setWebsite(prev => ({ ...prev, stats: updated }));
                        }}
                        placeholder="Value (e.g. 6+)"
                        className="px-2.5 py-1.5 rounded-xl bg-console-panel-raised border border-console-border text-xs text-console-text font-bold"
                      />
                      <input
                        type="text"
                        value={st.label}
                        onChange={e => {
                          const updated = [...(website.stats || [])];
                          updated[idx].label = e.target.value;
                          setWebsite(prev => ({ ...prev, stats: updated }));
                        }}
                        placeholder="Label (e.g. Projects)"
                        className="px-2.5 py-1.5 rounded-xl bg-console-panel-raised border border-console-border text-xs text-console-text"
                      />
                      <input
                        type="text"
                        value={st.subtext || ''}
                        onChange={e => {
                          const updated = [...(website.stats || [])];
                          updated[idx].subtext = e.target.value;
                          setWebsite(prev => ({ ...prev, stats: updated }));
                        }}
                        placeholder="Subtext (e.g. Production)"
                        className="px-2.5 py-1.5 rounded-xl bg-console-panel-raised border border-console-border text-xs text-console-text"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 6. CONTACT TAB */}
            {activeTab === 'contact' && (
              <div className="space-y-4">
                <div className="border-b border-console-border/60 pb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-bridge-teal font-mono">
                    Contact & Social Handles
                  </h3>
                  <p className="text-[11px] text-console-text-muted">
                    Where recruiters and collaborator messages are delivered.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-console-text">Primary Contact Email</label>
                  <input
                    type="email"
                    value={website.contactEmail || ''}
                    onChange={e => setWebsite(prev => ({ ...prev, contactEmail: e.target.value }))}
                    placeholder="satyam.singh@dtu.ac.in"
                    className="w-full px-3 py-2 rounded-xl bg-console-bg border border-console-border text-xs text-console-text focus:outline-none focus:border-bridge-teal"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-console-text">GitHub URL</label>
                  <input
                    type="text"
                    value={website.socials?.github || ''}
                    onChange={e => setWebsite(prev => ({ ...prev, socials: { ...prev.socials, github: e.target.value } }))}
                    placeholder="https://github.com/satyamsingh"
                    className="w-full px-3 py-2 rounded-xl bg-console-bg border border-console-border text-xs text-console-text focus:outline-none focus:border-bridge-teal"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-console-text">LinkedIn URL</label>
                  <input
                    type="text"
                    value={website.socials?.linkedin || ''}
                    onChange={e => setWebsite(prev => ({ ...prev, socials: { ...prev.socials, linkedin: e.target.value } }))}
                    placeholder="https://linkedin.com/in/satyamsingh"
                    className="w-full px-3 py-2 rounded-xl bg-console-bg border border-console-border text-xs text-console-text focus:outline-none focus:border-bridge-teal"
                  />
                </div>
              </div>
            )}

            {/* 7. THEME & AI BOT TAB */}
            {activeTab === 'theme' && (
              <div className="space-y-6">
                <div className="border-b border-console-border/60 pb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-bridge-teal font-mono">
                    Theme & Interactive Features
                  </h3>
                  <p className="text-[11px] text-console-text-muted">
                    Select your visual colorway and enable the scoped public AI assistant.
                  </p>
                </div>

                {/* Colorway Options */}
                <div className="space-y-3">
                  <label className="text-xs font-mono text-console-text font-semibold">
                    Visual Design Theme
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {THEME_OPTIONS.map(th => (
                      <div
                        key={th.id}
                        onClick={() => setWebsite(prev => ({ ...prev, theme: th.id }))}
                        className={`p-3.5 rounded-xl cursor-pointer border transition-all ${
                          website.theme === th.id
                            ? 'bg-console-panel-raised border-bridge-teal shadow-md shadow-bridge-teal/10'
                            : 'bg-console-bg border-console-border hover:border-console-text-muted'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-console-text">{th.name}</span>
                          <span className={`w-3 h-3 rounded-full ${th.colors}`} />
                        </div>
                        <p className="text-[10px] text-console-text-muted">{th.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI Chatbot Toggle */}
                <div className="p-4 rounded-xl bg-console-bg border border-console-border space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-400 flex items-center justify-center">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-console-text">Floating AI Assistant</h4>
                        <p className="text-[10px] text-console-text-muted">"Ask me anything about my work!"</p>
                      </div>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={website.enableBot !== false}
                        onChange={e => setWebsite(prev => ({ ...prev, enableBot: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-console-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-bridge-teal" />
                    </label>
                  </div>
                  <p className="text-[11px] text-console-text-muted leading-relaxed">
                    When enabled, visitors on your published portfolio site can chat with a scoped AI assistant that answers questions exclusively using your public profile and project data.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT PANEL: LIVE INTERACTIVE PREVIEW ── */}
        <div className="lg:col-span-7 bg-black/40 flex flex-col h-[calc(100vh-61px)] overflow-hidden">
          {/* Viewport bar */}
          <div className="px-4 py-2 bg-console-panel/90 border-b border-console-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-console-text-muted">Live Preview:</span>
              <span className="text-[11px] font-mono font-semibold text-bridge-teal">
                {THEME_OPTIONS.find(t => t.id === website.theme)?.name}
              </span>
            </div>

            <div className="flex items-center gap-1.5 bg-console-bg p-1 rounded-lg border border-console-border">
              <button
                onClick={() => setPreviewDevice('desktop')}
                className={`p-1.5 rounded ${previewDevice === 'desktop' ? 'bg-bridge-teal text-slate-950' : 'text-console-text-muted hover:text-console-text'}`}
                title="Desktop View"
              >
                <Laptop className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setPreviewDevice('tablet')}
                className={`p-1.5 rounded ${previewDevice === 'tablet' ? 'bg-bridge-teal text-slate-950' : 'text-console-text-muted hover:text-console-text'}`}
                title="Tablet View"
              >
                <Tablet className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setPreviewDevice('mobile')}
                className={`p-1.5 rounded ${previewDevice === 'mobile' ? 'bg-bridge-teal text-slate-950' : 'text-console-text-muted hover:text-console-text'}`}
                title="Mobile View"
              >
                <Smartphone className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Scaled Preview Frame */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto flex justify-center items-start">
            <div
              className={`w-full transition-all duration-300 rounded-2xl overflow-hidden border border-slate-700 shadow-2xl bg-[#0B1120] ${
                previewDevice === 'mobile'
                  ? 'max-w-sm'
                  : previewDevice === 'tablet'
                  ? 'max-w-2xl'
                  : 'max-w-4xl'
              }`}
            >
              {/* Mini Preview Header */}
              <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/20">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-teal-500 text-slate-950 font-bold text-xs flex items-center justify-center font-serif">
                    {(user?.name || 'S').charAt(0)}
                  </div>
                  <span className="text-xs font-semibold text-slate-100">{user?.name || 'Satyam Singh'}</span>
                </div>
                <span className="text-[10px] font-mono text-teal-400">SkillBridge Verified</span>
              </div>

              {/* Mini Hero */}
              <div className="p-6 sm:p-8 space-y-4 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <img
                    src={website.heroImageUrl || user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300'}
                    alt="Preview Avatar"
                    className="w-24 h-24 rounded-2xl object-cover border-2 border-teal-500/50 shadow-lg"
                  />
                  <div className="space-y-2 flex-1">
                    <h2 className="text-xl sm:text-2xl font-bold font-serif text-slate-100 leading-snug">
                      {website.headline || 'Architecting Resilient Distributed Systems'}
                    </h2>
                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                      {website.subheadline || 'Building high-scale software applications and verified cloud microservices.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Mini Focus Areas */}
              <div className="p-6 border-t border-white/5 bg-white/[0.01] space-y-4">
                <span className="text-[10px] font-mono uppercase text-teal-400 font-semibold tracking-wider">
                  What I Do
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(website.services || []).map((s, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                      <div className="text-teal-400 text-xs font-bold flex items-center gap-1.5">
                        <Code2 className="w-3.5 h-3.5" />
                        <span>{s.title}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-2">{s.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mini Projects */}
              <div className="p-6 border-t border-white/5 space-y-4">
                <span className="text-[10px] font-mono uppercase text-teal-400 font-semibold tracking-wider">
                  Featured Projects ({(website.projects || []).length})
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(website.projects || []).slice(0, 2).map((p, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                      <div className="font-semibold text-xs text-slate-100">{p.title}</div>
                      <p className="text-[10px] text-slate-400 line-clamp-2">{p.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {p.tags?.map(t => (
                          <span key={t} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-slate-300">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mini Stats */}
              <div className="p-4 border-t border-white/5 bg-slate-950/60 grid grid-cols-3 gap-2 text-center">
                {(website.stats || []).map((st, idx) => (
                  <div key={idx} className="space-y-0.5">
                    <div className="text-base font-bold text-teal-400 font-serif">{st.value}</div>
                    <div className="text-[10px] font-mono text-slate-300">{st.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── AI WIZARD MODAL ── */}
      {showAiWizard && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-lg w-full rounded-2xl bg-console-panel border border-console-border shadow-2xl p-6 space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-console-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-console-text">AI Portfolio Copy Wizard</h3>
                  <p className="text-[11px] text-console-text-muted">Generates polished copy tailored to your profile</p>
                </div>
              </div>
              <button
                onClick={() => setShowAiWizard(false)}
                className="p-1 rounded-lg text-console-text-muted hover:text-console-text"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-console-text">Target Job Role / Title</label>
                <input
                  type="text"
                  value={wizardRole}
                  onChange={e => setWizardRole(e.target.value)}
                  placeholder="e.g. Full-Stack Distributed Systems Engineer"
                  className="w-full px-3 py-2.5 rounded-xl bg-console-bg border border-console-border text-xs text-console-text focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-console-text">Copywriting Tone</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'confident', label: 'Confident & Impactful' },
                    { id: 'tech_lead', label: 'Technical & Architectural' },
                    { id: 'minimalist', label: 'Crisp & Minimalist' },
                    { id: 'friendly', label: 'Warm & Collaborative' },
                  ].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setWizardTone(t.id as any)}
                      className={`p-2.5 rounded-xl text-xs font-medium border text-left transition-all ${
                        wizardTone === t.id
                          ? 'bg-purple-600/20 border-purple-500 text-purple-300 font-semibold'
                          : 'bg-console-bg border-console-border text-console-text-muted hover:text-console-text'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-console-text">Preferred Colorway Theme</label>
                <div className="grid grid-cols-2 gap-2">
                  {THEME_OPTIONS.map(th => (
                    <button
                      key={th.id}
                      type="button"
                      onClick={() => setWizardTheme(th.id)}
                      className={`p-2 rounded-xl text-xs border text-left flex items-center justify-between transition-all ${
                        wizardTheme === th.id
                          ? 'bg-purple-600/20 border-purple-500 text-purple-300 font-semibold'
                          : 'bg-console-bg border-console-border text-console-text-muted hover:text-console-text'
                      }`}
                    >
                      <span>{th.name}</span>
                      <span className={`w-2.5 h-2.5 rounded-full ${th.colors}`} />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowAiWizard(false)}
                className="px-4 py-2 rounded-xl text-xs text-console-text-muted hover:text-console-text"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleRunAiWizard}
                disabled={wizardGenerating}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-purple-600/20 disabled:opacity-50"
              >
                {wizardGenerating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Generating copy...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate Portfolio Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── VISITOR INBOX MODAL ── */}
      {showMessagesModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-2xl w-full rounded-2xl bg-console-panel border border-console-border shadow-2xl p-6 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-console-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-bridge-teal/20 text-bridge-teal flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-console-text">Visitor Inquiries Inbox</h3>
                  <p className="text-[11px] text-console-text-muted">Messages sent by recruiters on your public portfolio</p>
                </div>
              </div>
              <button
                onClick={() => setShowMessagesModal(false)}
                className="p-1 rounded-lg text-console-text-muted hover:text-console-text"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {messagesList.length === 0 ? (
                <div className="text-center py-12 space-y-2">
                  <Mail className="w-8 h-8 text-console-text-muted mx-auto" />
                  <p className="text-xs text-console-text-muted">No visitor messages received yet.</p>
                </div>
              ) : (
                messagesList.map(msg => (
                  <div
                    key={msg.id}
                    className="p-4 rounded-xl bg-console-bg border border-console-border space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-console-text flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-bridge-teal" />
                        <span>{msg.senderName}</span>
                      </span>
                      <span className="text-[10px] font-mono text-console-text-muted">
                        {new Date(msg.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="text-[11px] font-mono text-bridge-teal">
                      {msg.senderEmail}
                    </div>

                    <p className="text-xs text-console-text-muted leading-relaxed bg-console-panel-raised p-3 rounded-lg border border-console-border">
                      {msg.message}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
