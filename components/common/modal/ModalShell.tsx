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
  lockBodyPosition,
  lockDocumentScroll,
  useNativeTouchInteractions,
  rootClassName,
  centerWithoutTransform,
  isolateBackground,
  blockBackdropScroll,
  useSimpleInteractionLayer,
  syncVisualViewport,
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
  lockBodyPosition?: boolean;
  lockDocumentScroll?: boolean;
  useNativeTouchInteractions?: boolean;
  rootClassName?: string;
  centerWithoutTransform?: boolean;
  isolateBackground?: boolean;
  blockBackdropScroll?: boolean;
  useSimpleInteractionLayer?: boolean;
  syncVisualViewport?: boolean;
}) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();
  const resolvedDescriptionId = description ? descriptionId : undefined;

  useModalEnvironment({ open, dialogRef, onClose, lockBodyPosition, lockDocumentScroll, isolateBackground });

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      dialogRef={dialogRef}
      titleId={titleId}
      descriptionId={resolvedDescriptionId}
      maxWidthClassName={maxWidthClass}
      panelClassName={panelClassName}
      overlayClassName={overlayClassName}
      closeOnBackdrop={closeOnBackdrop}
      useNativeTouchInteractions={useNativeTouchInteractions}
      rootClassName={rootClassName}
      centerWithoutTransform={centerWithoutTransform}
      blockBackdropScroll={blockBackdropScroll}
      useSimpleInteractionLayer={useSimpleInteractionLayer}
      syncVisualViewport={syncVisualViewport}
    >
      <ModalHeader titleId={titleId} title={title} description={description} descriptionId={resolvedDescriptionId} onClose={onClose} />
      <ModalBody className={bodyClassName}>{children}</ModalBody>
      {footer ? <ModalFooter className={footerClassName}>{footer}</ModalFooter> : null}
    </BaseModal>
  );
}
