'use client';

import { useEffect, useId, useRef } from 'react';
import type { MouseEvent, ReactNode } from 'react';
import { Button } from './button';

type DialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  drawer?: boolean;
};

export function Dialog({ open, onClose, title, children, drawer = false }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();

    return () => {
      if (dialog.open) dialog.close();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  function closeFromBackdrop(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) onClose();
  }

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      className={drawer ? 'dialog drawer' : 'dialog'}
      onClick={closeFromBackdrop}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <header className="dialog-heading">
        <h2 id={titleId}>{title}</h2>
        <Button className="button-secondary icon-button" onClick={onClose} aria-label="Cerrar diálogo">×</Button>
      </header>
      {children}
    </dialog>
  );
}

export function Drawer(props: Omit<DialogProps, 'drawer'>) {
  return <Dialog {...props} drawer />;
}
