import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";

import {
  getWaflButtonClassName,
  WaflButton,
  WaflLinkButton,
  type WaflButtonSize,
  type WaflButtonVariant,
  type WaflButtonWidth,
} from "./WaflButton";

export type AppButtonVariant = WaflButtonVariant;
export type AppButtonSize = WaflButtonSize;
export type AppButtonWidth = WaflButtonWidth;

export function getAppButtonClassName(options?: {
  className?: string;
  variant?: AppButtonVariant;
  size?: AppButtonSize;
  width?: AppButtonWidth;
}) {
  return getWaflButtonClassName(options);
}

type AppButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: AppButtonVariant;
  size?: AppButtonSize;
  width?: AppButtonWidth;
};

export default function AppButton(props: AppButtonProps) {
  return <WaflButton {...props} />;
}

type AppLinkButtonProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  variant?: AppButtonVariant;
  size?: AppButtonSize;
  width?: AppButtonWidth;
};

export function AppLinkButton(props: AppLinkButtonProps) {
  return <WaflLinkButton {...props} />;
}
