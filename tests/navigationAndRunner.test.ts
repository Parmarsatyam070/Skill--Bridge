import { describe, it, expect } from 'vitest';
import { getLabelForPath } from '../client/src/components/ConsoleBackButton';

describe('Universal Back Navigation Route & Label Mapping', () => {
  it('maps /dsa root and sub-problem paths correctly to "DSA & Coding"', () => {
    expect(getLabelForPath('/dsa')).toBe('DSA & Coding');
    expect(getLabelForPath('/dsa/two-sum')).toBe('DSA & Coding');
    expect(getLabelForPath('/dsa/find-minimum-in-rotated-sorted-array')).toBe('DSA & Coding');
    expect(getLabelForPath('/dsa/reverse-linked-list?lang=java')).toBe('DSA & Coding');
  });

  it('maps /assessment and query variations to "Skill Assessment"', () => {
    expect(getLabelForPath('/assessment')).toBe('Skill Assessment');
    expect(getLabelForPath('/assessment?tab=dsa')).toBe('Skill Assessment');
    expect(getLabelForPath('/assessment?category=domain')).toBe('Skill Assessment');
    expect(getLabelForPath('/assessments')).toBe('Skill Assessment');
  });

  it('maps core student console routes to authentic friendly labels', () => {
    expect(getLabelForPath('/dashboard')).toBe('Dashboard');
    expect(getLabelForPath('/profile')).toBe('Career Profile');
    expect(getLabelForPath('/skill-profile')).toBe('Skill Profile');
    expect(getLabelForPath('/learn')).toBe('Learning Hub');
    expect(getLabelForPath('/report-card')).toBe('Report Card');
    expect(getLabelForPath('/portfolio')).toBe('Portfolio Website');
    expect(getLabelForPath('/portfolio-builder')).toBe('Portfolio Builder');
  });

  it('gracefully handles unknown routes with "Previous Page"', () => {
    expect(getLabelForPath('/some-unknown-path')).toBe('Previous Page');
    expect(getLabelForPath('')).toBe('Previous Page');
  });
});
