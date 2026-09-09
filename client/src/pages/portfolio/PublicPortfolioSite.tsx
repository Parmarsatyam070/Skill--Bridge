import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Code2,
  Cpu,
  Brain,
  Layers,
  Zap,
  Database,
  Globe,
  Palette,
  Github,
  Linkedin,
  Mail,
  ExternalLink,
  Send,
  Sparkles,
  Bot,
  X,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Share2,
  Terminal,
  ArrowRight,
  ShieldCheck,
  Award,
  ChevronDown,
} from 'lucide-react';
import { api } from '../../lib/api';
import { PortfolioWebsiteData, PortfolioTheme } from '@shared/types';

// Map string icon names to Lucide components
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Code2,
  Cpu,
  Brain,
  Layers,
  Zap,
  Database,
  Globe,
  Palette,
  Terminal,
};

// Theme styling configurations
const THEME_STYLES: Record<
  PortfolioTheme,
  {
    bg: string;
    cardBg: string;
    cardBorder: string;
    text: string;
    muted: string;
    accent: string;
    accentBg: string;
    accentBorder: string;
    heroGlow: string;
    pillActive: string;
  }
> = {
  teal_dark: {
    bg: 'bg-[#0B1120]',
    cardBg: 'bg-[#111C33]/80',
    cardBorder: 'border-[#1E293B]',
    text: 'text-slate-100',
    muted: 'text-slate-400',
    accent: 'text-teal-400',
    accentBg: 'bg-teal-500/15',
    accentBorder: 'border-teal-500/30',
    heroGlow: 'from-teal-500/20 via-cyan-500/10 to-transparent',
    pillActive: 'bg-teal-500 text-white font-bold shadow-lg shadow-teal-500/20',
  },
  slate_clean: {
    bg: 'bg-[#0F172A]',
    cardBg: 'bg-[#1E293B]/80',
    cardBorder: 'border-slate-700/60',
    text: 'text-slate-100',
    muted: 'text-slate-400',
    accent: 'text-blue-400',
    accentBg: 'bg-blue-500/15',
    accentBorder: 'border-blue-500/30',
    heroGlow: 'from-blue-500/20 via-indigo-500/10 to-transparent',
    pillActive: 'bg-blue-500 text-white font-semibold shadow-lg shadow-blue-500/20',
  },
  indigo_creative: {
    bg: 'bg-[#0D0B18]',
    cardBg: 'bg-[#18142E]/80',
    cardBorder: 'border-purple-900/50',
    text: 'text-purple-50',
    muted: 'text-purple-300/70',
    accent: 'text-purple-400',
    accentBg: 'bg-purple-500/15',
    accentBorder: 'border-purple-500/30',
    heroGlow: 'from-purple-600/25 via-pink-500/10 to-transparent',
    pillActive: 'bg-purple-500 text-white font-semibold shadow-lg shadow-purple-500/25',
  },
  cyber_amber: {
    bg: 'bg-[#0C0A09]',
    cardBg: 'bg-[#1C1917]/90',
    cardBorder: 'border-stone-800',
    text: 'text-amber-50',
    muted: 'text-stone-400',
    accent: 'text-amber-400',
    accentBg: 'bg-amber-500/15',
    accentBorder: 'border-amber-500/30',
    heroGlow: 'from-amber-500/20 via-orange-500/10 to-transparent',
    pillActive: 'bg-amber-400 text-stone-950 font-bold shadow-lg shadow-amber-500/20',
  },
};

export const PublicPortfolioSite: React.FC = () => {
  const { username, studentId } = useParams<{ username?: string; studentId?: string }>();
  const slugOrId = username || studentId;

  const [portfolio, setPortfolio] = useState<PortfolioWebsiteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeProjectTag, setActiveProjectTag] = useState('All');
  const [copied, setCopied] = useState(false);

  // Contact Form State
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMsg, setContactMsg] = useState('');
  const [contactSending, setContactSending] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);

  // Chatbot State
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string; suggestions?: string[] }>>([
    {
      sender: 'bot',
      text: 'Hello! I am an AI assistant representing this engineer. Ask me anything about their projects, technical expertise, verified skills, or background!',
      suggestions: ['What are your top projects?', 'What tech stack do you use?', 'How can I get in touch?'],
    },
  ]);

  useEffect(() => {
    if (!slugOrId) return;
    const fetchPortfolio = async () => {
      try {
        setLoading(true);
        const res = await api.get<{ portfolio: PortfolioWebsiteData }>(`/portfolios/public/${slugOrId}`);
        setPortfolio(res.portfolio);
      } catch (err: any) {
        console.error('Failed to load portfolio:', err);
        setError(err.message || 'Portfolio not found or is currently private.');
      } finally {
        setLoading(false);
      }
    };
    fetchPortfolio();
  }, [slugOrId]);

  const themeStyle = portfolio ? THEME_STYLES[portfolio.theme] || THEME_STYLES.teal_dark : THEME_STYLES.teal_dark;

  // Extract all distinct tags from projects
  const allTags = useMemo(() => {
    if (!portfolio?.projects) return ['All'];
    const tagsSet = new Set<string>(['All']);
    portfolio.projects.forEach(p => p.tags?.forEach(t => tagsSet.add(t)));
    return Array.from(tagsSet);
  }, [portfolio?.projects]);

  // Filtered projects
  const filteredProjects = useMemo(() => {
    if (!portfolio?.projects) return [];
    if (activeProjectTag === 'All') return portfolio.projects;
    return portfolio.projects.filter(p => p.tags?.includes(activeProjectTag));
  }, [portfolio?.projects, activeProjectTag]);

  // Handle Contact Submit
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactEmail.trim() || !contactMsg.trim()) return;

    setContactSending(true);
    setContactError(null);
    try {
      await api.post(`/portfolios/public/${slugOrId}/contact`, {
        senderName: contactName,
        senderEmail: contactEmail,
        message: contactMsg,
      });
      setContactSuccess(true);
      setContactName('');
      setContactEmail('');
      setContactMsg('');
    } catch (err: any) {
      setContactError(err.message || 'Failed to send message. Please try again.');
    } finally {
      setContactSending(false);
    }
  };

  // Handle Chat Message Submit
  const handleSendChat = async (userPrompt: string) => {
    if (!userPrompt.trim() || chatLoading) return;

    const newHistory = [...messages, { sender: 'user' as const, text: userPrompt }];
    setMessages(newHistory);
    setChatInput('');
    setChatLoading(true);

    try {
      const res = await api.post<{ reply: string; suggestions?: string[] }>(`/portfolios/public/${slugOrId}/chat`, {
        message: userPrompt,
      });
      setMessages(prev => [
        ...prev,
        {
          sender: 'bot',
          text: res.reply,
          suggestions: res.suggestions,
        },
      ]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          sender: 'bot',
          text: 'Apologies, I encountered an issue retrieving that information. Please try asking again.',
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B1120] text-slate-100 flex flex-col items-center justify-center p-6">
        <div className="w-10 h-10 border-3 border-teal-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-mono text-slate-400">Loading verified portfolio website...</p>
      </div>
    );
  }

  if (error || !portfolio) {
    return (
      <div className="min-h-screen bg-[#0B1120] text-slate-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-4 p-8 rounded-2xl bg-[#111C33] border border-slate-800 shadow-2xl">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold font-serif">Portfolio Unavailable</h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            {error || 'This portfolio is currently in draft mode or the address is incorrect.'}
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold text-xs transition-all shadow-lg shadow-teal-500/20"
          >
            <span>Return to SkillBridge</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  const { student } = portfolio;
  const studentName = student?.user?.name || 'Verified Engineer';
  const studentAvatar = portfolio.heroImageUrl || student?.user?.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${studentName}`;

  return (
    <div className={`min-h-screen ${themeStyle.bg} ${themeStyle.text} font-sans selection:bg-teal-500 selection:text-slate-950 transition-colors duration-300`}>
      {/* ── 1. STICKY HERO NAVIGATION ── */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-opacity-80 border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to={`/p/${portfolio.slug}`} className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-teal-500 to-cyan-400 text-slate-950 font-bold font-serif text-sm flex items-center justify-center shadow-sm">
              {studentName.charAt(0)}
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm tracking-tight group-hover:text-teal-400 transition-colors">
                {studentName}
              </span>
              <span className="text-[10px] font-mono text-slate-400 -mt-0.5">
                {student?.headline || 'Full-Stack Engineer'}
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-300">
            <a href="#home" className="hover:text-white transition-colors">Home</a>
            <a href="#services" className="hover:text-white transition-colors">What I Do</a>
            <a href="#projects" className="hover:text-white transition-colors">Projects</a>
            <a href="#about" className="hover:text-white transition-colors">About</a>
            <a href="#stats" className="hover:text-white transition-colors">Impact</a>
            <a href="#contact" className="hover:text-white transition-colors">Contact</a>
          </nav>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleShare}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs transition-colors"
              title="Share portfolio link"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
            {copied && (
              <span className="text-[10px] font-mono text-teal-400 animate-fade-in hidden sm:inline">
                Link Copied!
              </span>
            )}
            <a
              href="#contact"
              className={`px-4 py-2 rounded-xl text-xs font-semibold ${themeStyle.pillActive} transition-all`}
            >
              Get in Touch
            </a>
          </div>
        </div>
      </header>

      {/* ── 1. HERO SECTION ── */}
      <section id="home" className="relative pt-16 pb-24 px-4 sm:px-6 overflow-hidden">
        {/* Glow backdrop */}
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b ${themeStyle.heroGlow} blur-3xl pointer-events-none -z-10`} />

        <div className="max-w-5xl mx-auto flex flex-col-reverse lg:flex-row items-center justify-between gap-12">
          <div className="flex-1 text-center lg:text-left space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-slate-300 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
              <span>Available for High-Impact Engineering Roles</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight font-serif leading-[1.15]">
              {portfolio.headline || 'Architecting Resilient Distributed Systems & Reactive Interfaces'}
            </h1>

            <p className={`text-sm sm:text-base ${themeStyle.muted} max-w-2xl leading-relaxed`}>
              {portfolio.subheadline || 'Building enterprise web architectures, low-latency TypeScript microservices, and modern frontend user experiences.'}
            </p>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
              <a
                href={portfolio.heroCtaLink || '#projects'}
                className={`px-6 py-3 rounded-xl text-xs font-semibold ${themeStyle.pillActive} flex items-center gap-2 transition-all`}
              >
                <span>{portfolio.heroCtaText || 'Explore Projects'}</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <a
                href="#contact"
                className="px-6 py-3 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 transition-all"
              >
                Contact Directly
              </a>
            </div>

            {/* Socials Link Row */}
            {portfolio.socials && (
              <div className="flex items-center justify-center lg:justify-start gap-4 pt-4 text-slate-400">
                {portfolio.socials.github && (
                  <a
                    href={portfolio.socials.github}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 hover:text-white transition-colors"
                  >
                    <Github className="w-4 h-4" />
                  </a>
                )}
                {portfolio.socials.linkedin && (
                  <a
                    href={portfolio.socials.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 hover:text-white transition-colors"
                  >
                    <Linkedin className="w-4 h-4" />
                  </a>
                )}
                {portfolio.contactEmail && (
                  <a
                    href={`mailto:${portfolio.contactEmail}`}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 hover:text-white transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                  </a>
                )}
              </div>
            )}
          </div>

          <div className="relative">
            <div className="w-48 h-48 sm:w-64 sm:h-64 lg:w-72 lg:h-72 rounded-3xl p-1 bg-gradient-to-tr from-teal-500 via-cyan-400 to-indigo-500 shadow-2xl shadow-teal-500/10">
              <img
                src={studentAvatar}
                alt={studentName}
                className="w-full h-full object-cover rounded-[22px]"
              />
            </div>
            <div className="absolute -bottom-4 -right-2 bg-[#111C33] border border-slate-700/80 p-2.5 rounded-xl shadow-xl flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-400" />
              <div className="text-[11px] font-mono leading-tight">
                <div className="font-semibold text-slate-100">SkillBridge Verified</div>
                <div className="text-slate-400">94% Skill Match</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. SERVICES / FOCUS AREAS ("WHAT I DO") ── */}
      {portfolio.sectionsVisibility?.services !== false && portfolio.services && portfolio.services.length > 0 && (
        <section id="services" className="py-20 px-4 sm:px-6 border-t border-white/5">
          <div className="max-w-5xl mx-auto space-y-12">
            <div className="text-center space-y-3">
              <span className={`text-xs font-mono uppercase tracking-wider ${themeStyle.accent}`}>
                Core Competencies
              </span>
              <h2 className="text-2xl sm:text-4xl font-bold font-serif">
                What I Bring to Engineering Teams
              </h2>
              <p className={`text-xs sm:text-sm ${themeStyle.muted} max-w-xl mx-auto`}>
                Focused areas of architectural design and hands-on software development.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {portfolio.services.map((svc, idx) => {
                const IconComponent = ICON_MAP[svc.icon] || Code2;
                return (
                  <div
                    key={idx}
                    className={`p-6 rounded-2xl ${themeStyle.cardBg} ${themeStyle.cardBorder} border hover:border-teal-500/40 transition-all duration-300 hover:-translate-y-1 shadow-lg space-y-4 group`}
                  >
                    <div className={`w-12 h-12 rounded-xl ${themeStyle.accentBg} ${themeStyle.accentBorder} border flex items-center justify-center ${themeStyle.accent} group-hover:scale-110 transition-transform`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold font-serif text-slate-100">
                      {svc.title}
                    </h3>
                    <p className={`text-xs ${themeStyle.muted} leading-relaxed`}>
                      {svc.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── 3. FEATURED PROJECTS (WITH TAG FILTER TABS) ── */}
      {portfolio.sectionsVisibility?.projects !== false && portfolio.projects && portfolio.projects.length > 0 && (
        <section id="projects" className="py-20 px-4 sm:px-6 border-t border-white/5">
          <div className="max-w-5xl mx-auto space-y-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-3">
                <span className={`text-xs font-mono uppercase tracking-wider ${themeStyle.accent}`}>
                  Selected Works
                </span>
                <h2 className="text-2xl sm:text-4xl font-bold font-serif">
                  Featured Engineering Projects
                </h2>
                <p className={`text-xs sm:text-sm ${themeStyle.muted}`}>
                  Full-stack platforms, distributed systems, and real-time architectures.
                </p>
              </div>

              {/* Tag filter pills */}
              <div className="flex flex-wrap gap-2">
                {allTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => setActiveProjectTag(tag)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      activeProjectTag === tag
                        ? themeStyle.pillActive
                        : 'bg-white/5 hover:bg-white/10 text-slate-400 border border-white/5'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map(proj => (
                <div
                  key={proj.id}
                  className={`rounded-2xl overflow-hidden ${themeStyle.cardBg} ${themeStyle.cardBorder} border hover:border-teal-500/40 transition-all duration-300 hover:-translate-y-1 shadow-lg flex flex-col justify-between group`}
                >
                  <div>
                    {proj.thumbnail ? (
                      <div className="h-44 w-full overflow-hidden bg-slate-900">
                        <img
                          src={proj.thumbnail}
                          alt={proj.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ) : (
                      <div className="h-36 w-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-slate-600">
                        <Code2 className="w-10 h-10" />
                      </div>
                    )}

                    <div className="p-5 space-y-3">
                      <h3 className="font-serif font-bold text-base text-slate-100 group-hover:text-teal-400 transition-colors">
                        {proj.title}
                      </h3>
                      <p className={`text-xs ${themeStyle.muted} line-clamp-3 leading-relaxed`}>
                        {proj.description}
                      </p>

                      {/* Tag Chips */}
                      {proj.tags && proj.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {proj.tags.map(t => (
                            <span
                              key={t}
                              className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-slate-300 border border-white/5"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-5 pt-0 flex items-center gap-3">
                    {proj.githubUrl && (
                      <a
                        href={proj.githubUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium text-slate-200 transition-colors border border-white/5"
                      >
                        <Github className="w-3.5 h-3.5" />
                        <span>Source</span>
                      </a>
                    )}
                    {proj.demoUrl && (
                      <a
                        href={proj.demoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold ${themeStyle.pillActive} transition-all`}
                      >
                        <span>Live Demo</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 4. ABOUT ME SECTION ── */}
      {portfolio.sectionsVisibility?.about !== false && (
        <section id="about" className="py-20 px-4 sm:px-6 border-t border-white/5">
          <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-4 flex justify-center">
              <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-3xl overflow-hidden p-1 bg-gradient-to-tr from-cyan-400 via-teal-500 to-indigo-500 shadow-2xl">
                <img
                  src={portfolio.aboutImageUrl || studentAvatar}
                  alt={studentName}
                  className="w-full h-full object-cover rounded-[22px]"
                />
              </div>
            </div>

            <div className="lg:col-span-8 space-y-6">
              <div className="space-y-2">
                <span className={`text-xs font-mono uppercase tracking-wider ${themeStyle.accent}`}>
                  Engineering Background
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold font-serif">
                  About {studentName}
                </h2>
              </div>

              <p className={`text-xs sm:text-sm ${themeStyle.muted} leading-relaxed whitespace-pre-line`}>
                {portfolio.aboutBio ||
                  student?.bio ||
                  'Passionate software engineering undergraduate with deep domain expertise in building modern web architectures, distributed systems, and applied AI pipelines.'}
              </p>

              {/* Skills badges */}
              {portfolio.skills && portfolio.skills.length > 0 && (
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-semibold font-mono text-slate-300">
                    Verified Technical Toolchain
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {portfolio.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className={`text-xs font-mono px-3 py-1 rounded-lg ${themeStyle.cardBg} ${themeStyle.cardBorder} border text-slate-200 flex items-center gap-1.5`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                        <span>{skill}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── 5. STATS / HIGHLIGHTS STRIP (REAL METRICS) ── */}
      {portfolio.sectionsVisibility?.stats !== false && portfolio.stats && portfolio.stats.length > 0 && (
        <section id="stats" className="py-16 px-4 sm:px-6 border-t border-white/5 bg-white/[0.01]">
          <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6">
            {portfolio.stats.map((stat, idx) => (
              <div
                key={idx}
                className={`p-6 rounded-2xl ${themeStyle.cardBg} ${themeStyle.cardBorder} border text-center space-y-2 shadow-sm`}
              >
                <div className={`text-3xl sm:text-4xl font-extrabold font-serif ${themeStyle.accent}`}>
                  {stat.value}
                </div>
                <div className="text-xs font-bold text-slate-100 uppercase tracking-wider font-mono">
                  {stat.label}
                </div>
                {stat.subtext && (
                  <div className={`text-[11px] ${themeStyle.muted}`}>
                    {stat.subtext}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── 6. CONTACT SECTION ── */}
      {portfolio.sectionsVisibility?.contact !== false && (
        <section id="contact" className="py-20 px-4 sm:px-6 border-t border-white/5">
          <div className="max-w-4xl mx-auto space-y-12">
            <div className="text-center space-y-3">
              <span className={`text-xs font-mono uppercase tracking-wider ${themeStyle.accent}`}>
                Direct Collaboration
              </span>
              <h2 className="text-2xl sm:text-4xl font-bold font-serif">
                Let's Build Something Impactful
              </h2>
              <p className={`text-xs sm:text-sm ${themeStyle.muted} max-w-lg mx-auto`}>
                Send a direct message regarding internship openings, project collaborations, or technical opportunities.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              {/* Contact info left */}
              <div className="md:col-span-5 space-y-6">
                <div className={`p-6 rounded-2xl ${themeStyle.cardBg} ${themeStyle.cardBorder} border space-y-4`}>
                  <h3 className="font-serif font-bold text-sm text-slate-100">
                    Communication Channels
                  </h3>
                  <div className="space-y-3 text-xs">
                    {portfolio.contactEmail && (
                      <div className="flex items-center gap-2.5 text-slate-300">
                        <Mail className="w-4 h-4 text-teal-400 flex-shrink-0" />
                        <a href={`mailto:${portfolio.contactEmail}`} className="hover:underline truncate">
                          {portfolio.contactEmail}
                        </a>
                      </div>
                    )}
                    {student?.institution && (
                      <div className="flex items-center gap-2.5 text-slate-300">
                        <Award className="w-4 h-4 text-teal-400 flex-shrink-0" />
                        <span>{student.institution}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-teal-500/10 border border-teal-500/20 text-xs text-teal-300 flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>
                    Inquiries are saved directly to the candidate's verified SkillBridge message portal.
                  </span>
                </div>
              </div>

              {/* Form right */}
              <div className="md:col-span-7">
                <form
                  onSubmit={handleContactSubmit}
                  className={`p-6 rounded-2xl ${themeStyle.cardBg} ${themeStyle.cardBorder} border space-y-4`}
                >
                  {contactSuccess && (
                    <div className="p-4 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-300 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Thank you! Your message has been sent to {studentName}.</span>
                    </div>
                  )}

                  {contactError && (
                    <div className="p-4 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      <span>{contactError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[11px] font-mono text-slate-300">Your Name</label>
                      <input
                        type="text"
                        required
                        value={contactName}
                        onChange={e => setContactName(e.target.value)}
                        placeholder="e.g. Vikram Mehta"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-black/30 border border-slate-700/80 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-teal-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-mono text-slate-300">Your Email</label>
                      <input
                        type="email"
                        required
                        value={contactEmail}
                        onChange={e => setContactEmail(e.target.value)}
                        placeholder="e.g. vikram@techcorp.com"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-black/30 border border-slate-700/80 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-mono text-slate-300">Message</label>
                    <textarea
                      rows={4}
                      required
                      value={contactMsg}
                      onChange={e => setContactMsg(e.target.value)}
                      placeholder="Hi, we loved your projects and would like to discuss an opportunity..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/30 border border-slate-700/80 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={contactSending}
                    className={`w-full py-3 rounded-xl text-xs font-semibold ${themeStyle.pillActive} flex items-center justify-center gap-2 transition-all disabled:opacity-50`}
                  >
                    {contactSending ? (
                      <span>Sending inquiry...</span>
                    ) : (
                      <>
                        <span>Send Message</span>
                        <Send className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── 7. FOOTER ── */}
      <footer className="py-12 px-4 sm:px-6 border-t border-white/5 text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-teal-500 to-cyan-400 text-slate-950 font-bold font-serif text-xs flex items-center justify-center">
            {studentName.charAt(0)}
          </div>
          <span className="font-serif font-bold text-xs text-slate-200">
            {studentName}
          </span>
        </div>
        <p className="text-[11px] font-mono text-slate-500">
          © {new Date().getFullYear()} {studentName} • Powered by{' '}
          <Link to="/" className="text-teal-400 hover:underline">
            SkillBridge
          </Link>{' '}
          Digital Portfolio Architecture
        </p>
      </footer>

      {/* ── FLOATING AI CHATBOT BUBBLE ("Ask me anything about my work!") ── */}
      {portfolio.enableBot && (
        <div className="fixed bottom-6 right-6 z-50">
          {chatOpen ? (
            <div className="w-80 sm:w-96 h-[480px] rounded-2xl bg-[#0F172A] border border-slate-700 shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
              {/* Chat Header */}
              <div className="p-3.5 bg-[#1E293B] border-b border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-teal-500/20 border border-teal-500/40 text-teal-400 flex items-center justify-center">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-100">Ask about {studentName}</h4>
                    <span className="text-[10px] font-mono text-teal-400">AI Profile Assistant</span>
                  </div>
                </div>
                <button
                  onClick={() => setChatOpen(false)}
                  className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Chat Messages Log */}
              <div className="flex-1 p-3.5 overflow-y-auto space-y-3 text-xs">
                {messages.map((m, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] p-3 rounded-2xl leading-relaxed ${
                        m.sender === 'user'
                          ? 'bg-teal-500 text-slate-950 font-medium rounded-tr-none'
                          : 'bg-[#1E293B] text-slate-200 border border-slate-700/80 rounded-tl-none'
                      }`}
                    >
                      {m.text}
                    </div>

                    {/* Quick suggestion chips */}
                    {m.suggestions && m.suggestions.length > 0 && idx === messages.length - 1 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {m.suggestions.map((sug, sIdx) => (
                          <button
                            key={sIdx}
                            onClick={() => handleSendChat(sug)}
                            className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-white/5 hover:bg-teal-500/20 border border-white/10 text-teal-300 transition-colors"
                          >
                            {sug}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {chatLoading && (
                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 p-2">
                    <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                    <span>Analyzing profile knowledge...</span>
                  </div>
                )}
              </div>

              {/* Chat Input Bar */}
              <form
                onSubmit={e => {
                  e.preventDefault();
                  handleSendChat(chatInput);
                }}
                className="p-3 bg-[#1E293B] border-t border-slate-700 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  placeholder={`Ask anything about ${studentName.split(' ')[0]}...`}
                  className="flex-1 px-3 py-2 rounded-xl bg-black/40 border border-slate-700 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || chatLoading}
                  className="p-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 disabled:opacity-40 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          ) : (
            <button
              onClick={() => setChatOpen(true)}
              className="flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-tr from-teal-500 to-cyan-400 text-slate-950 font-semibold text-xs shadow-2xl hover:scale-105 transition-all group"
            >
              <Bot className="w-4 h-4" />
              <span>Ask me anything about my work!</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
