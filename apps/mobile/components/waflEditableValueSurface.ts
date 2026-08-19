import type { ViewStyle } from "react-native";

import { WAFL_THEME } from "@/constants/theme";

export const WAFL_EDITABLE_VALUE_SURFACE: ViewStyle = {
  backgroundColor: "#fffaf2",
  borderBottomColor: "#b98c5a",
  borderBottomWidth: WAFL_THEME.border.hairline,
  borderRadius: 5,
  minHeight: 36,
  paddingHorizontal: WAFL_THEME.spacing.xs,
  paddingVertical: 3,
};

/**
 * Live single-line inline inputs retain the exact same participating geometry
 * before and during focus. Focus is expressed only through semantic colour;
 * it must not turn a compact value into a larger field-shaped control.
 */
export const WAFL_EDITABLE_VALUE_FOCUSED_SURFACE: ViewStyle = {
  ...WAFL_EDITABLE_VALUE_SURFACE,
  backgroundColor: "#fff9ed",
  borderBottomColor: WAFL_THEME.color.editActive,
};

/**
 * Frozen-axis table cells must never change participating geometry when they
 * enter edit mode. The inactive and focused surfaces deliberately share every
 * size/spacing/border-width value; focus is communicated only through semantic
 * color and the existing thin underline.
 */
export const WAFL_TABLE_EDITABLE_CELL_SURFACE: ViewStyle = {
  alignItems: "stretch",
  backgroundColor: WAFL_THEME.color.paper,
  borderBottomColor: WAFL_THEME.color.editActive,
  borderBottomWidth: WAFL_THEME.border.hairline,
  borderRadius: 0,
  justifyContent: "center",
  minHeight: WAFL_THEME.layout.frozenTableEditableValueHeight,
  minWidth: 0,
  paddingHorizontal: WAFL_THEME.spacing.xs,
  paddingVertical: 0,
  width: WAFL_THEME.layout.frozenTableEditableValueWidth,
};

export const WAFL_TABLE_EDITABLE_CELL_FOCUSED_SURFACE: ViewStyle = {
  ...WAFL_TABLE_EDITABLE_CELL_SURFACE,
  backgroundColor: WAFL_THEME.color.fabricBeige,
  borderBottomColor: WAFL_THEME.color.editActive,
};
