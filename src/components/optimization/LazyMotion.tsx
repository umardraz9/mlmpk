'use client';

/**
 * Lazy-loaded Framer Motion components for better performance
 * Only loads motion features when needed, reducing initial bundle size
 */

import { LazyMotion, domAnimation, m } from 'framer-motion';
import { ReactNode } from 'react';

/**
 * Wrapper that provides lazy-loaded Framer Motion features
 * Use this instead of importing motion directly
 */
export function LazyMotionWrapper({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      {children}
    </LazyMotion>
  );
}

/**
 * Optimized motion div component
 * Use this instead of motion.div for better performance
 */
export const MotionDiv = m.div;
export const MotionSpan = m.span;
export const MotionButton = m.button;
export const MotionSection = m.section;
export const MotionArticle = m.article;
export const MotionNav = m.nav;
export const MotionUl = m.ul;
export const MotionLi = m.li;

/**
 * Common animation presets for consistent performance
 */
export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3, ease: 'easeOut' },
};

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 },
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: { duration: 0.2, ease: 'easeOut' },
};

export const slideInFromRight = {
  initial: { x: '100%' },
  animate: { x: 0 },
  exit: { x: '100%' },
  transition: { type: 'spring', damping: 20, stiffness: 300 },
};

export const slideInFromLeft = {
  initial: { x: '-100%' },
  animate: { x: 0 },
  exit: { x: '-100%' },
  transition: { type: 'spring', damping: 20, stiffness: 300 },
};

/**
 * Stagger children animation helper
 */
export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};
