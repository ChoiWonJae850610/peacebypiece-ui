"use client";

import { useId, useRef, type ReactNode } from "react";
import BaseModal from "@/components/common/modal/BaseModal";
import ModalBody from "@/components/common/modal/ModalBody";
import ModalFooter from "@/components/common/modal/ModalFooter";
import ModalHeader from "@/components/common/modal/ModalHeader";
import { useModalEnvironment } from "@/components/common/modal/modalUtils";

export default function ModalShell({
  open,
  title,
  onClose,
  children,
  maxWidthClass = "md:max-w-3xl",
  description,
  bodyClassName,
  footer,
  footerClassName,
  panelClassName,
  overlayClassName,
  closeOnBackdrop,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  maxWidthClass?: string;
  description?: string;
  bodyClassName?: string;
  footer?: ReactNode;
  footerClassName?: string;
  panelClassName?: string;
  overlayClassName?: string;
  closeOnBackdrop?: boolean;
}) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const titleId = useId();

  useModalEnvironment({ open, dialogRef, onClose });

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      dialogRef={dialogRef}
      titleId={titleId}
      maxWidthClassName={maxWidthClass}
      panelClassName={panelClassName}
      overlayClassName={overlayClassName}
      closeOnBackdrop={closeOnBackdrop}
    >
      <ModalHeader titleId={titleId} title={title} description={description} onClose={onClose} />
      <ModalBody className={bodyClassName}>{children}</ModalBody>
      {footer ? <ModalFooter className={footerClassName}>{footer}</ModalFooter> : null}
    </BaseModal>
  );
}
