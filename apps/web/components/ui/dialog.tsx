'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

const DialogContext = React.createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
  titleId: string;
}>({ open: false, setOpen: () => {}, titleId: '' });

interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export function Dialog({ open: controlledOpen, onOpenChange, children }: DialogProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const titleId = React.useId();
  const previousActiveElement = React.useRef<HTMLElement | null>(null);

  const setOpen = React.useCallback(
    (value: boolean) => {
      if (isControlled) {
        onOpenChange?.(value);
      } else {
        setInternalOpen(value);
        onOpenChange?.(value);
      }
    },
    [isControlled, onOpenChange]
  );

  // Focus management & scroll lock
  React.useEffect(() => {
    if (open) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      // Return focus to the element that opened the dialog
      const prev = previousActiveElement.current;
      if (prev) {
        requestAnimationFrame(() => prev.focus());
        previousActiveElement.current = null;
      }
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <DialogContext.Provider value={{ open, setOpen, titleId }}>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div
          className="fixed inset-0 bg-black/80"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
        <div className="relative z-50 w-full max-w-lg mx-4">{children}</div>
      </div>
    </DialogContext.Provider>
  );
}

export function DialogTrigger({ asChild, children }: { asChild?: boolean; children: React.ReactNode }) {
  const { setOpen } = React.useContext(DialogContext);
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<{ onClick?: () => void }>, {
      onClick: () => setOpen(true)
    });
  }
  return <button onClick={() => setOpen(true)}>{children}</button>;
}

export function DialogContent({ children, className }: { children: React.ReactNode; className?: string }) {
  const { setOpen, titleId } = React.useContext(DialogContext);
  const contentRef = React.useRef<HTMLDivElement>(null);

  // Focus trap & Escape key
  React.useEffect(() => {
    const container = contentRef.current;
    if (!container) return;

    // Move focus into the dialog
    const autoFocus = container.querySelector<HTMLElement>(
      '[autofocus], button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    autoFocus?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setOpen(false);
        return;
      }

      if (e.key !== 'Tab' || !container) return;

      const focusable = container.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;

      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [setOpen]);

  return (
    <div
      ref={contentRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className={cn('rounded-lg border bg-card p-6 shadow-lg animate-in fade-in-0 zoom-in-95', className)}
    >
      {children}
    </div>
  );
}

export function DialogHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)}>{children}</div>;
}

export function DialogFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)}>{children}</div>;
}

export function DialogTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  const { titleId } = React.useContext(DialogContext);
  return (
    <h2 id={titleId} className={cn('text-lg font-semibold leading-none tracking-tight', className)}>
      {children}
    </h2>
  );
}

export function DialogDescription({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn('text-sm text-muted-foreground', className)}>{children}</p>;
}
