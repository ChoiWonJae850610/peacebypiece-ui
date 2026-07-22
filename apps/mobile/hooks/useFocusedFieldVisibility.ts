import { useCallback, useEffect, useRef, type RefObject } from "react";
import {
  Keyboard,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollView,
  type TextInput,
} from "react-native";

const FIELD_GAP = 12;

export function useFocusedFieldVisibility(scrollRef: RefObject<ScrollView | null>) {
  const focusedFieldRef = useRef<TextInput | null>(null);
  const keyboardTopRef = useRef<number | null>(null);
  const scrollOffsetRef = useRef(0);
  const scheduledFrameRef = useRef<number | null>(null);

  const ensureVisible = useCallback((target = focusedFieldRef.current) => {
    if (!target || keyboardTopRef.current === null) return;
    target.measureInWindow((_x, y, _width, height) => {
      const keyboardTop = keyboardTopRef.current;
      if (keyboardTop === null) return;
      const fieldBottom = y + height;
      if (fieldBottom <= keyboardTop - FIELD_GAP) return;
      const delta = fieldBottom - keyboardTop + FIELD_GAP;
      scrollRef.current?.scrollTo({
        animated: true,
        y: Math.max(0, scrollOffsetRef.current + delta),
      });
    });
  }, [scrollRef]);

  const scheduleVisibility = useCallback((target?: TextInput | null) => {
    if (target) focusedFieldRef.current = target;
    if (scheduledFrameRef.current !== null) cancelAnimationFrame(scheduledFrameRef.current);
    scheduledFrameRef.current = requestAnimationFrame(() => {
      scheduledFrameRef.current = null;
      ensureVisible(target ?? focusedFieldRef.current);
    });
  }, [ensureVisible]);

  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", (event) => {
      keyboardTopRef.current = event.endCoordinates.screenY;
      scheduleVisibility();
    });
    const change = Keyboard.addListener("keyboardDidChangeFrame", (event) => {
      keyboardTopRef.current = event.endCoordinates.screenY;
      scheduleVisibility();
    });
    const hide = Keyboard.addListener("keyboardDidHide", () => {
      keyboardTopRef.current = null;
      focusedFieldRef.current = null;
    });
    return () => {
      show.remove();
      change.remove();
      hide.remove();
      if (scheduledFrameRef.current !== null) cancelAnimationFrame(scheduledFrameRef.current);
    };
  }, [scheduleVisibility]);

  const onFieldFocus = useCallback((target: TextInput) => {
    focusedFieldRef.current = target;
    scheduleVisibility(target);
  }, [scheduleVisibility]);

  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollOffsetRef.current = event.nativeEvent.contentOffset.y;
  }, []);

  return { onFieldFocus, onScroll } as const;
}
