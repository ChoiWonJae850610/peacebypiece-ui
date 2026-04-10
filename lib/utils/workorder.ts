import {
  getCategoryPath as getCategoryPathFromPresentation,
  getInventoryLabel as getInventoryLabelFromPresentation,
  getWorkOrderCardTone as getWorkOrderCardToneFromPresentation,
  getWorkOrderDisplayTitle as getWorkOrderDisplayTitleFromPresentation,
  getWorkOrderState as getWorkOrderStateFromPresentation,
} from "@/lib/workorder/presentation/workOrderPresentation";

export function getCategoryPath(...args: Parameters<typeof getCategoryPathFromPresentation>) {
  return getCategoryPathFromPresentation(...args);
}

export function getInventoryLabel(...args: Parameters<typeof getInventoryLabelFromPresentation>) {
  return getInventoryLabelFromPresentation(...args);
}

export function getWorkOrderStateLabel(...args: Parameters<typeof getWorkOrderStateFromPresentation>) {
  return getWorkOrderStateFromPresentation(...args);
}

export function getWorkOrderCardTone(...args: Parameters<typeof getWorkOrderCardToneFromPresentation>) {
  return getWorkOrderCardToneFromPresentation(...args);
}

export function getWorkOrderDisplayTitle(...args: Parameters<typeof getWorkOrderDisplayTitleFromPresentation>) {
  return getWorkOrderDisplayTitleFromPresentation(...args);
}
