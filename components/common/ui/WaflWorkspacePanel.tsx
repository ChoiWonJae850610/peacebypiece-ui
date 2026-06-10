import { forwardRef, type ElementType, type HTMLAttributes, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export type WaflWorkspacePanelRole = "shell" | "sidebar" | "detail" | "side" | "content" | "toolbar";

type WaflWorkspacePanelProps = HTMLAttributes<HTMLElement> & {
  as?: ElementType;
  panelRole?: WaflWorkspacePanelRole;
  children: ReactNode;
};

const roleClassMap: Record<WaflWorkspacePanelRole, string> = {
  shell: "wafl-shape-surface border border-[var(--pbp-border)] bg-[var(--pbp-surface)]",
  sidebar: "wafl-shape-surface border border-[var(--pbp-border)] bg-[var(--pbp-surface)]",
  detail:
    "wafl-shape-surface border border-[var(--pbp-border)] bg-[color-mix(in_srgb,var(--pbp-surface)_96%,var(--pbp-surface-muted))]",
  side:
    "wafl-shape-surface border border-[var(--pbp-border)] bg-[color-mix(in_srgb,var(--pbp-surface)_96%,var(--pbp-surface-muted))]",
  content: "wafl-shape-surface border border-[var(--pbp-border)] bg-[var(--pbp-surface)]",
  toolbar: "wafl-shape-surface border border-[var(--pbp-border)] bg-[var(--pbp-surface)]/95",
};

const WaflWorkspacePanel = forwardRef<HTMLElement, WaflWorkspacePanelProps>(function WaflWorkspacePanel(
  { as: Component = "section", panelRole = "content", className, children, ...props },
  ref,
) {
  const Panel = Component as ElementType;
  return (
    <Panel
      ref={ref}
      data-wafl-component="workspace-panel"
      data-wafl-panel-role={panelRole}
      className={cn("min-w-0 shadow-none", roleClassMap[panelRole], className)}
      {...props}
    >
      {children}
    </Panel>
  );
});

export default WaflWorkspacePanel;
