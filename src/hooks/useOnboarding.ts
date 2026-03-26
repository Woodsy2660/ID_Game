import { useState, useCallback } from 'react';

export const ONBOARDING_TOTAL_STEPS = 5;

export interface OnboardingControls {
  isOpen: boolean;
  step: number;
  totalSteps: number;
  open: () => void;
  close: () => void;
  next: () => void;
  complete: () => void;
  goTo: (index: number) => void;
}

export function useOnboarding(): OnboardingControls {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0);

  const open = useCallback(() => {
    setStep(0);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const next = useCallback(() => {
    setStep((s) => Math.min(s + 1, ONBOARDING_TOTAL_STEPS - 1));
  }, []);

  const complete = useCallback(() => {
    setIsOpen(false);
  }, []);

  const goTo = useCallback((index: number) => {
    setStep(Math.max(0, Math.min(index, ONBOARDING_TOTAL_STEPS - 1)));
  }, []);

  return { isOpen, step, totalSteps: ONBOARDING_TOTAL_STEPS, open, close, next, complete, goTo };
}
