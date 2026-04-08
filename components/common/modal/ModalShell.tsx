"use client";

import { useId, useRef, type ReactNode } from "react";
import BaseModal from "@/components/common/modal/BaseModal";
import ModalBody from "@/components/common/modal/ModalBody";
import ModalHeader from "@/components/common/modal/ModalHeader";
import { useModalEnvironment } from "@/components/common/modal/modalUtils";

export default function ModalShell({
  open,
  title,
  onClose,
  children,
  maxWidthClass = "md:max-w-3xl",
  description,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  maxWidthClass?: string;
  description?: string;
}) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const titleId = useId();

  useModalEnvironment({ open, dialogRef, onClose });

  return (
    <BaseModal open={open} onClose={onClose} dialogRef={dialogRef} titleId={titleId} maxWidthClassName={maxWidthClass}>
      <ModalHeader titleId={titleId} title={title} description={description} onClose={onClose} />
      <ModalBody>{children}</ModalBody>
    </BaseModal>
  );
}
