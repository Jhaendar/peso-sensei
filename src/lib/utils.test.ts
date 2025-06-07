import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn utility function', () => {
  it('should merge class names correctly', () => {
    expect(cn('bg-red-500', 'text-white')).toBe('bg-red-500 text-white');
  });

  it('should handle conditional classes', () => {
    expect(cn('base', true && 'conditional-true', false && 'conditional-false')).toBe('base conditional-true');
  });

  it('should override conflicting tailwind classes', () => {
    // Example: p-2 should override p-4 if twMerge works correctly
    expect(cn('p-4', 'p-2')).toBe('p-2');
    // Example: bg-red-500 should be overridden by bg-blue-500
    expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
  });

  it('should handle various input types', () => {
    expect(cn('text-lg', ['font-bold', 'italic'], { 'tracking-wide': true, 'leading-loose': false })).toBe('text-lg font-bold italic tracking-wide');
  });

  it('should return an empty string for no inputs', () => {
    expect(cn()).toBe('');
  });

  it('should handle falsy values gracefully', () => {
    expect(cn(null, undefined, 'actual-class', false, 0, '')).toBe('actual-class');
  });
});
