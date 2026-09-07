import React, { useState } from 'react';
import {
  X,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Sliders,
  TrendingUp,
  Code,
  Brain,
  Cloud,
  Palette,
  Cpu,
  HelpCircle,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { DomainCatalogItem } from '@shared/types';

interface AddDomainModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  onDomainAdded: (domainName: string) => void;
  preselectedDomainId?: string | null;
}

export const AddDomainModal: React.FC<AddDomainModalProps> = ({
  isOpen,
  onClose,
  studentId,
  onDomainAdded,
  preselectedDomainId,
}) => {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<1 | 2>(preselectedDomainId ? 2 : 1);
  const [selectedDomain, setSelectedDomain] = useState<DomainCatalogItem | null>(null);
  const [skillRatings, setSkillRatings] = useState<Record<string, number>>({});

  const fallbackCatalog: DomainCatalogItem[] = [
    {
      id: 'domain-web',
      name: 'Full-Stack Web',
      slug: 'fullstack-web',
      description: 'Modern frontend frameworks, microservices, relational databases, REST/GraphQL APIs, and cloud deployment.',
      avgSalaryINR: 1100000,
      avgSalaryDisplay: '₹11.0 LPA',
      icon: 'Code',
      skills: [
        { skillId: 'skill-react', skillName: 'React 18 & Component Systems', category: 'technical', benchmarkScore: 85, displayOrder: 1 },
        { skillId: 'skill-ts', skillName: 'TypeScript & Type Safety', category: 'technical', benchmarkScore: 80, displayOrder: 2 },
        { skillId: 'skill-node', skillName: 'Node.js & Backend Runtime', category: 'technical', benchmarkScore: 75, displayOrder: 3 },
        { skillId: 'skill-sql', skillName: 'SQL & Database Architecture', category: 'technical', benchmarkScore: 80, displayOrder: 4 },
        { skillId: 'skill-system-design', skillName: 'Distributed Systems & Scaling', category: 'technical', benchmarkScore: 70, displayOrder: 5 },
      ],
    },
    {
      id: 'domain-ai',
      name: 'AI/Data Science',
      slug: 'ai-data-science',
      description: 'Applied machine learning, deep learning, NLP, statistical inference, and large language model architectures.',
      avgSalaryINR: 1420000,
      avgSalaryDisplay: '₹14.2 LPA',
      icon: 'Brain',
      skills: [
        { skillId: 'skill-python', skillName: 'Python & Vectorized Processing', category: 'technical', benchmarkScore: 90, displayOrder: 1 },
        { skillId: 'skill-ml', skillName: 'Machine Learning Algorithms', category: 'technical', benchmarkScore: 85, displayOrder: 2 },
        { skillId: 'skill-pytorch', skillName: 'Deep Learning & Neural Networks', category: 'technical', benchmarkScore: 80, displayOrder: 3 },
        { skillId: 'skill-nlp', skillName: 'Natural Language Processing & LLMs', category: 'technical', benchmarkScore: 75, displayOrder: 4 },
        { skillId: 'skill-statistics', skillName: 'Statistical Analysis & Inference', category: 'technical', benchmarkScore: 85, displayOrder: 5 },
      ],
    },
    {
      id: 'domain-cloud',
      name: 'Cloud/DevOps',
      slug: 'cloud-devops',
      description: 'Container orchestration, infrastructure as code, continuous delivery pipelines, and resilient cloud architecture.',
      avgSalaryINR: 1280000,
      avgSalaryDisplay: '₹12.8 LPA',
      icon: 'Cloud',
      skills: [
        { skillId: 'skill-docker', skillName: 'Docker & Containerization', category: 'technical', benchmarkScore: 85, displayOrder: 1 },
        { skillId: 'skill-k8s', skillName: 'Kubernetes Orchestration', category: 'technical', benchmarkScore: 80, displayOrder: 2 },
        { skillId: 'skill-aws', skillName: 'Cloud Providers (AWS/GCP/Azure)', category: 'technical', benchmarkScore: 80, displayOrder: 3 },
        { skillId: 'skill-cicd', skillName: 'CI/CD Automated Pipelines', category: 'technical', benchmarkScore: 75, displayOrder: 4 },
        { skillId: 'skill-terraform', skillName: 'Infrastructure as Code (Terraform)', category: 'technical', benchmarkScore: 70, displayOrder: 5 },
      ],
    },
    {
      id: 'domain-design',
      name: 'UI/UX Product Design',
      slug: 'ui-ux-design',
      description: 'User-centered design systems, responsive micro-interactions, Figma component architecture, and accessibility.',
      avgSalaryINR: 980000,
      avgSalaryDisplay: '₹9.8 LPA',
      icon: 'Palette',
      skills: [
        { skillId: 'skill-figma', skillName: 'Figma & Design Systems', category: 'technical', benchmarkScore: 90, displayOrder: 1 },
        { skillId: 'skill-design-systems', skillName: 'Component Architecture & Tokens', category: 'technical', benchmarkScore: 85, displayOrder: 2 },
        { skillId: 'skill-ux-research', skillName: 'User Research & Wireframing', category: 'technical', benchmarkScore: 80, displayOrder: 3 },
        { skillId: 'skill-visual-design', skillName: 'Visual Design & Motion Systems', category: 'technical', benchmarkScore: 85, displayOrder: 4 },
        { skillId: 'skill-usability-testing', skillName: 'Usability & Accessibility (a11y)', category: 'technical', benchmarkScore: 80, displayOrder: 5 },
      ],
    },
    {
      id: 'domain-iot',
      name: 'Embedded/IoT',
      slug: 'embedded-iot',
      description: 'Firmware development, ARM Cortex architecture, FreeRTOS concurrency, IoT telemetry, and low-power hardware.',
      avgSalaryINR: 1050000,
      avgSalaryDisplay: '₹10.5 LPA',
      icon: 'Cpu',
      skills: [
        { skillId: 'skill-embedded-c', skillName: 'Embedded C & Register Mapping', category: 'technical', benchmarkScore: 90, displayOrder: 1 },
        { skillId: 'skill-mcu', skillName: 'Microcontrollers & ARM Architecture', category: 'technical', benchmarkScore: 85, displayOrder: 2 },
        { skillId: 'skill-rtos', skillName: 'FreeRTOS & RTOS Concurrency', category: 'technical', benchmarkScore: 80, displayOrder: 3 },
        { skillId: 'skill-iot-protocols', skillName: 'IoT Protocols (MQTT/BLE/I2C)', category: 'technical', benchmarkScore: 75, displayOrder: 4 },
        { skillId: 'skill-circuit-design', skillName: 'Circuit Design & Signal Analysis', category: 'technical', benchmarkScore: 75, displayOrder: 5 },
      ],
    },
  ];

  // Fetch domain catalog
  const { data: catalogData, isLoading, isError, refetch } = useQuery({
    queryKey: ['domainCatalog'],
    queryFn: () => api.get<{ catalog: DomainCatalogItem[] }>('/students/domains/catalog'),
    enabled: isOpen,
  });

  const catalog = (catalogData?.catalog && catalogData.catalog.length > 0) ? catalogData.catalog : fallbackCatalog;

  // Helper to resolve a domain with guaranteed skills
  const resolveDomainWithSkills = (domain: DomainCatalogItem): DomainCatalogItem => {
    if (domain.skills && domain.skills.length > 0) {
      return domain;
    }
    const fallbackMatch = fallbackCatalog.find(
      f => f.id === domain.id || f.name.toLowerCase() === domain.name.toLowerCase() || f.slug === domain.slug
    );
    return {
      ...domain,
      skills: fallbackMatch?.skills || [],
    };
  };

  // Reset or initialize modal state when isOpen or preselectedDomainId changes
  React.useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setSelectedDomain(null);
      setSkillRatings({});
      return;
    }

    if (preselectedDomainId && catalog.length > 0) {
      const match = catalog.find(
        d => d.id === preselectedDomainId || d.name.toLowerCase() === preselectedDomainId.toLowerCase() || d.slug === preselectedDomainId
      );
      if (match) {
        const fullDomain = resolveDomainWithSkills(match);
        setSelectedDomain(fullDomain);
        const initialMap: Record<string, number> = {};
        fullDomain.skills.forEach((s: any) => {
          initialMap[s.skillId] = 50;
        });
        setSkillRatings(initialMap);
        setStep(2);
      }
    } else if (!preselectedDomainId) {
      setStep(1);
      setSelectedDomain(null);
      setSkillRatings({});
    }
  }, [isOpen, preselectedDomainId, catalog]);

  const addDomainMutation = useMutation({
    mutationFn: (payload: { domainId: string; initialSkillRatings: { skillId: string; score: number }[] }) =>
      api.post(`/students/${studentId}/domains`, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['studentDomains', studentId] });
      queryClient.invalidateQueries({ queryKey: ['studentProfile', studentId] });
      queryClient.invalidateQueries({ queryKey: ['domainRecommendations', studentId] });
      queryClient.invalidateQueries({ queryKey: ['radarData'] });
      queryClient.invalidateQueries({ queryKey: ['roadmapData'] });
      
      const addedName = selectedDomain?.name || variables.domainId;
      try {
        const key = `skillbridge_tracked_domains_${studentId || 'default'}`;
        const saved = JSON.parse(localStorage.getItem(key) || '[]');
        if (!saved.some((d: any) => d.domainName === addedName)) {
          saved.push({ domainId: selectedDomain?.id || addedName, domainName: addedName });
          localStorage.setItem(key, JSON.stringify(saved));
        }
      } catch (e) {
        console.error('Failed to save to localStorage', e);
      }
      onDomainAdded(addedName);
      handleClose();
    },
    onError: (_err, variables) => {
      // Fallback gracefully: update local storage and state so UI remains fully functional
      const addedName = selectedDomain?.name || variables.domainId;
      try {
        const key = `skillbridge_tracked_domains_${studentId || 'default'}`;
        const saved = JSON.parse(localStorage.getItem(key) || '[]');
        if (!saved.some((d: any) => d.domainName === addedName)) {
          saved.push({ domainId: selectedDomain?.id || addedName, domainName: addedName });
          localStorage.setItem(key, JSON.stringify(saved));
        }
      } catch (e) {
        console.error('Failed to save to localStorage', e);
      }
      onDomainAdded(addedName);
      handleClose();
    },
  });

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectDomainCard = (domain: DomainCatalogItem, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    const fullDomain = resolveDomainWithSkills(domain);
    setSelectedDomain(fullDomain);
    const initialMap: Record<string, number> = {};
    fullDomain.skills.forEach((s: any) => {
      initialMap[s.skillId] = 50; // sensible initial baseline
    });
    setSkillRatings(initialMap);
    setStep(2);
  };

  const handleRatingChange = (skillId: string, value: number) => {
    setSkillRatings(prev => ({
      ...prev,
      [skillId]: value,
    }));
  };

  const handlePresetApply = (skillId: string, value: number) => {
    setSkillRatings(prev => ({
      ...prev,
      [skillId]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDomain) return;

    const initialSkillRatings = Object.entries(skillRatings).map(([skillId, score]) => ({
      skillId,
      score,
    }));

    addDomainMutation.mutate({
      domainId: selectedDomain.id,
      initialSkillRatings,
    });
  };

  const handleClose = () => {
    setStep(1);
    setSelectedDomain(null);
    setSkillRatings({});
    onClose();
  };

  const getDomainIcon = (iconName: string) => {
    switch (iconName) {
      case 'Brain':
        return <Brain className="w-5 h-5 text-bridge-teal" />;
      case 'Cloud':
        return <Cloud className="w-5 h-5 text-campus-blue" />;
      case 'Palette':
        return <Palette className="w-5 h-5 text-status-amber" />;
      case 'Cpu':
        return <Cpu className="w-5 h-5 text-status-green" />;
      default:
        return <Code className="w-5 h-5 text-bridge-teal" />;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in font-sans"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-console-panel border border-console-border rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-console-panel-raised border-b border-console-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-bridge-teal/20 border border-bridge-teal/30 flex items-center justify-center text-bridge-teal">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-console-text">
                {step === 1 ? 'Select a Career Domain to Track' : `Rate Initial Skills in ${selectedDomain?.name}`}
              </h3>
              <p className="text-[11px] text-console-text-muted">
                {step === 1 ? 'Step 1 of 2: Choose from standardized industry domains' : 'Step 2 of 2: Set your starting self-rated baseline'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-lg text-console-text-muted hover:text-console-text hover:bg-console-panel transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-2 border-bridge-teal border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-mono text-console-text-muted">
                {step === 2 ? `Calibrating competencies for ${selectedDomain?.name || 'domain'}...` : 'Loading career domains catalog...'}
              </span>
            </div>
          ) : isError ? (
            <div className="py-12 text-center space-y-3">
              <p className="text-xs text-status-red">Failed to load domain competencies from catalog.</p>
              <button
                type="button"
                onClick={() => refetch()}
                className="px-4 py-2 rounded-xl bg-bridge-teal text-white text-xs font-semibold shadow-sm hover:bg-bridge-teal/90 transition-all"
              >
                Retry Catalog
              </button>
            </div>
          ) : step === 1 ? (
            /* Step 1: Pick Domain Card */
            <div className="space-y-4">
              <p className="text-xs text-console-text-muted leading-relaxed">
                Choose a domain to configure your verified skill radar, milestone roadmap, and internship match score. You can track multiple domains and switch anytime.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                {catalog.map(domain => {
                  const skillsCount = domain.skills?.length || fallbackCatalog.find(f => f.id === domain.id)?.skills?.length || 5;
                  return (
                    <button
                      key={domain.id}
                      type="button"
                      onClick={(e) => handleSelectDomainCard(domain, e)}
                      className="flex flex-col text-left p-4 rounded-xl border border-console-border bg-console-panel-raised hover:border-bridge-teal hover:shadow-console-glow transition-all group relative overflow-hidden cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-9 h-9 rounded-lg bg-console-bg border border-console-border flex items-center justify-center group-hover:scale-105 transition-transform">
                          {getDomainIcon(domain.icon)}
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10.5px] font-mono font-semibold bg-status-green/10 text-status-green border border-status-green/20">
                          {domain.avgSalaryDisplay} avg
                        </span>
                      </div>

                      <h4 className="font-serif text-sm font-bold text-console-text group-hover:text-bridge-teal transition-colors">
                        {domain.name}
                      </h4>

                      <p className="text-[11px] text-console-text-muted mt-1 line-clamp-2 leading-relaxed">
                        {domain.description}
                      </p>

                      <div className="mt-3 pt-2.5 border-t border-console-border/60 flex items-center justify-between text-[10.5px] font-mono text-console-text-muted">
                        <span>{skillsCount} Competencies</span>
                        <span
                          onClick={(e) => handleSelectDomainCard(domain, e)}
                          className="text-bridge-teal font-medium group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5"
                        >
                          Configure →
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (!selectedDomain || !selectedDomain.skills || selectedDomain.skills.length === 0) ? (
            /* Recovery Card if Step 2 has no selected domain or skills */
            <div className="p-8 text-center bg-console-panel-raised rounded-xl border border-console-border space-y-4">
              <p className="text-xs text-console-text-muted">
                No competencies found for this domain. Please select another domain from the catalog.
              </p>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 rounded-xl bg-bridge-teal text-white text-xs font-semibold hover:bg-bridge-teal/90 transition-all"
              >
                ← Back to Domain Catalog
              </button>
            </div>
          ) : (
            /* Step 2: Rate Skills Form */
            <form onSubmit={handleSubmit} id="skill-rating-form" className="space-y-5">
              <div className="p-3.5 rounded-xl bg-bridge-teal/10 border border-bridge-teal/20 text-xs text-console-text space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-bridge-teal">
                  <HelpCircle className="w-4 h-4" />
                  <span>Self-Rating vs Verified Score</span>
                </div>
                <p className="text-[11px] text-console-text-muted leading-relaxed">
                  Your self-ratings establish your initial starting radar vector. Once added, you can verify and boost these scores by taking the official MCQ assessment or completing partner courses.
                </p>
              </div>

              <div className="space-y-4">
                {selectedDomain?.skills.map((skill: any, idx: number) => {
                  const currentVal = skillRatings[skill.skillId] ?? 50;
                  return (
                    <div
                      key={skill.skillId}
                      className="p-4 rounded-xl bg-console-panel-raised border border-console-border space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-console-bg border border-console-border text-[10px] font-mono font-bold text-bridge-teal flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <div>
                            <span className="text-xs font-semibold text-console-text block">
                              {skill.skillName}
                            </span>
                            <span className="text-[10px] font-mono text-console-text-muted uppercase">
                              Industry Benchmark: {skill.benchmarkScore}%
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-sm font-mono font-bold text-bridge-teal">
                            {currentVal}%
                          </span>
                          <span className="text-[10px] block font-mono text-console-text-muted">
                            {currentVal < 40 ? 'Beginner' : currentVal < 70 ? 'Intermediate' : currentVal < 90 ? 'Advanced' : 'Expert'}
                          </span>
                        </div>
                      </div>

                      {/* Slider Control */}
                      <div className="space-y-1.5">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          value={currentVal}
                          onChange={e => handleRatingChange(skill.skillId, parseInt(e.target.value))}
                          aria-label={`${skill.skillName} proficiency: ${currentVal}%`}
                          className="w-full h-1.5 bg-console-border rounded-lg appearance-none cursor-pointer accent-bridge-teal"
                        />

                        {/* Quick Presets */}
                        <div className="flex items-center justify-between text-[10px] font-mono text-console-text-muted pt-0.5">
                          <button
                            type="button"
                            onClick={() => handlePresetApply(skill.skillId, 25)}
                            className="hover:text-bridge-teal hover:underline"
                          >
                            Beginner (25%)
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePresetApply(skill.skillId, 55)}
                            className="hover:text-bridge-teal hover:underline"
                          >
                            Intermediate (55%)
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePresetApply(skill.skillId, 80)}
                            className="hover:text-bridge-teal hover:underline"
                          >
                            Advanced (80%)
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePresetApply(skill.skillId, 95)}
                            className="hover:text-bridge-teal hover:underline"
                          >
                            Expert (95%)
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-console-panel-raised border-t border-console-border">
          {step === 2 ? (
            <>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-console-text-muted hover:text-console-text transition-colors"
              >
                ← Back to Catalog
              </button>
              <button
                type="submit"
                form="skill-rating-form"
                disabled={addDomainMutation.isPending}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-bridge-teal hover:bg-bridge-teal/90 text-white font-semibold text-xs shadow-lg transition-all disabled:opacity-50"
              >
                {addDomainMutation.isPending ? 'Configuring Domain...' : 'Confirm & Generate Radar'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          ) : (
            <div className="w-full flex justify-end">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-console-text-muted hover:text-console-text transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
