import { useEffect, useRef, useState } from 'react';
import type { Locale, UIKey } from '../../i18n/core';
import { translate } from '../../i18n/core';

const GUIDE_KEY = 'tritype.onboarding.v1.completed';

export function initialGuideOpen(storage?: Pick<Storage, 'getItem'> | null): boolean {
  try {
    return storage?.getItem(GUIDE_KEY) !== 'yes';
  } catch {
    return true;
  }
}

const FOCUSABLE_SELECTORS =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Onboarding({ locale }: { locale: Locale }) {
  const [open, setOpen] = useState(() => {
    try {
      return initialGuideOpen(typeof window !== 'undefined' ? window.localStorage : null);
    } catch {
      return true;
    }
  });

  const [step, setStep] = useState(0);
  const dialogRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLButtonElement>(null);
  const reopenedFromTriggerRef = useRef(false);

  const t = (key: UIKey) => translate(locale, key);
  const steps: UIKey[] = ['guideStep1', 'guideStep2', 'guideStep3'];

  function dismiss() {
    try {
      window.localStorage?.setItem(GUIDE_KEY, 'yes');
    } catch {
      /* storage denied */
    }
    setOpen(false);
  }

  function reopen() {
    reopenedFromTriggerRef.current = true;
    setStep(0);
    setOpen(true);
  }

  // Restore focus when closing
  useEffect(() => {
    if (!open) {
      if (reopenedFromTriggerRef.current && openerRef.current) {
        reopenedFromTriggerRef.current = false;
        openerRef.current.focus();
      } else {
        const startBtn = document.getElementById('start');
        if (startBtn) {
          startBtn.focus();
        } else if (openerRef.current) {
          openerRef.current.focus();
        }
      }
    }
  }, [open]);

  // Initial focus when dialog opens
  useEffect(() => {
    if (!open) return;
    const el = dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTORS);
    el?.focus();
  }, [open]);

  // Capture phase listener:
  // 1. Block background keyboard events when modal is open
  // 2. Escape dismisses
  // 3. Tab / Shift+Tab focus trap
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        dismiss();
        return;
      }

      const target = e.target as Node | null;
      const isInsideDialog = Boolean(dialogRef.current && target && dialogRef.current.contains(target));

      if (!isInsideDialog) {
        // Prevent all interaction with background elements while modal is open
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      if (e.key === 'Tab') {
        const focusable = Array.from(
          dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS) ?? []
        ).filter((el) => !el.hasAttribute('disabled') && el.tabIndex !== -1);

        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first || !dialogRef.current?.contains(document.activeElement)) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last || !dialogRef.current?.contains(document.activeElement)) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [open]);

  if (!open) {
    return (
      <button
        ref={openerRef}
        type="button"
        id="onboarding-reopen-btn"
        className="onboarding-reopen-btn"
        onClick={reopen}
      >
        {t('reopen')}
      </button>
    );
  }

  return (
    <>
      {/* Backdrop — blocks background interaction */}
      <div className="onboarding-backdrop" aria-hidden="true" onClick={dismiss} />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        className="onboarding-dialog"
        id="onboarding-dialog"
      >
        <h2 id="onboarding-title">{t('guideTitle')}</h2>
        <p className="onboarding-intro">{t('guideIntro')}</p>

        <p className="onboarding-step" aria-live="polite">
          {step + 1}/3 — {t(steps[step])}
        </p>

        <div className="onboarding-step-dots" aria-hidden="true">
          {steps.map((_, i) => (
            <span
              key={i}
              className={`step-dot${i === step ? ' active' : ''}`}
            />
          ))}
        </div>

        <p className="onboarding-privacy">{t('privacy')}</p>

        <div className="onboarding-actions">
          <button type="button" id="onboarding-skip-btn" onClick={dismiss}>
            {t('skip')}
          </button>
          {step > 0 && (
            <button type="button" id="onboarding-back-btn" onClick={() => setStep((s) => s - 1)}>
              {t('back')}
            </button>
          )}
          <button
            type="button"
            id="onboarding-next-btn"
            className="btn-primary"
            onClick={() => (step === 2 ? dismiss() : setStep((s) => s + 1))}
          >
            {step === 2 ? t('finish') : t('next')}
          </button>
        </div>
      </div>
    </>
  );
}
export default Onboarding;
