import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '../../utils/cn';

interface ModalProps {
  open: boolean;
  onClose?: () => void;
  children: ReactNode;
  dismissible?: boolean;
  className?: string;
}

export function Modal({ open, onClose, children, dismissible = true, className }: ModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-void/85 backdrop-blur-sm p-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={() => dismissible && onClose?.()}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.85, opacity: 0, y: 24 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 12 }}
            transition={{ type: 'spring', stiffness: 280, damping: 24 }}
            className={cn('chamfer glass-panel w-full max-w-sm p-7 shadow-glow-lg', className)}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
