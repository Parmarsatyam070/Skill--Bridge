import { prisma } from '../config/prisma.js';

// In-memory alias cache for ultra-fast lookup
const aliasCache = new Map<string, string>(); // aliasLower -> canonicalSkillId
let isCacheLoaded = false;

const DEFAULT_ALIASES: Record<string, string[]> = {
  'react': ['react.js', 'reactjs', 'react native', 'react-js'],
  'node.js': ['nodejs', 'node', 'node js'],
  'python': ['py', 'python3', 'python 3', 'python2'],
  'javascript': ['js', 'es6', 'ecmascript'],
  'typescript': ['ts'],
  'c++': ['cpp', 'cplusplus'],
  'c#': ['csharp', 'c sharp'],
  'sql': ['postgresql', 'postgres', 'mysql', 'plsql'],
  'docker': ['containerization', 'containers'],
  'aws': ['amazon web services', 'amazon aws'],
  'machine learning': ['ml', 'deep learning', 'data science'],
  'mongodb': ['mongo', 'nosql mongodb'],
};

export async function initSkillNormalizer(): Promise<void> {
  if (isCacheLoaded) return;

  try {
    const aliases = await prisma.skillAlias.findMany({
      include: { skill: true },
    });

    aliases.forEach(a => {
      aliasCache.set(a.alias.toLowerCase().trim(), a.skillId);
    });

    // If alias table is completely empty, seed default aliases safely
    if (aliases.length === 0) {
      const skills = await prisma.skill.findMany();
      const skillNameMap = new Map(skills.map(s => [s.name.toLowerCase().trim(), s.id]));

      for (const [canonicalName, aliasList] of Object.entries(DEFAULT_ALIASES)) {
        const skillId = skillNameMap.get(canonicalName.toLowerCase());
        if (skillId) {
          for (const alias of aliasList) {
            try {
              await prisma.skillAlias.upsert({
                where: { alias: alias.toLowerCase().trim() },
                update: {},
                create: {
                  alias: alias.toLowerCase().trim(),
                  skillId,
                },
              });
              aliasCache.set(alias.toLowerCase().trim(), skillId);
            } catch {}
          }
        }
      }
    }

    isCacheLoaded = true;
  } catch (err) {
    console.error('Failed to initialize skill normalizer aliases:', err);
  }
}

/**
 * Normalizes an arbitrary skill string to canonical Skill ID if found.
 */
export async function normalizeSkillName(rawName: string): Promise<string | null> {
  if (!rawName) return null;
  const clean = rawName.toLowerCase().trim();

  if (!isCacheLoaded) {
    await initSkillNormalizer();
  }

  // Check alias cache
  if (aliasCache.has(clean)) {
    return aliasCache.get(clean)!;
  }

  // Check exact skill name
  const skill = await prisma.skill.findFirst({
    where: { name: { equals: rawName.trim(), mode: 'insensitive' } },
    select: { id: true },
  });

  if (skill) {
    aliasCache.set(clean, skill.id);
    return skill.id;
  }

  return null;
}
