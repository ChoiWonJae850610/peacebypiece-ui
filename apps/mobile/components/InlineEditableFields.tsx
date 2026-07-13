import { useRef, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type NativeSyntheticEvent,
  type TextInputKeyPressEventData,
} from "react-native";

import {
  COMPACT_FIELD_LABEL_TEXT,
  COMPACT_FIELD_ROW_HEIGHT,
  COMPACT_FIELD_VALUE_TEXT,
} from "@/constants/compactFieldTypography";

type InlineFieldProps = {
  readonly label: string;
  readonly value?: string;
  readonly editable: boolean;
  readonly placeholder: string;
  readonly accessibilityLabel: string;
  readonly onCommit?: (value: string) => void;
};

type CompactInlineFieldProps = {
  readonly label: string;
  readonly value: string;
  readonly displayValue?: string;
  readonly editable: boolean;
  readonly placeholder: string;
  readonly accessibilityLabel: string;
  readonly invalid?: boolean;
  readonly keyboardType?: "default" | "numeric";
  readonly onChange: (value: string) => void;
  readonly onCommit?: (value: string) => void;
};

export function ReadOnlyInlineValue({ label, value }: Pick<InlineFieldProps, "label" | "value">) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text numberOfLines={1} style={styles.value}>{value?.trim() || "-"}</Text>
    </View>
  );
}

export function InlineEditableValue(props: InlineFieldProps) {
  const [value, setValue] = useState(props.value ?? "");
  const [draft, setDraft] = useState(value);
  const [editing, setEditing] = useState(false);
  const cancelledRef = useRef(false);
  const completedRef = useRef(false);

  if (!props.editable) return <ReadOnlyInlineValue label={props.label} value={value} />;

  const beginEditing = () => {
    cancelledRef.current = false;
    completedRef.current = false;
    setDraft(value);
    setEditing(true);
  };
  const finish = () => {
    if (cancelledRef.current || completedRef.current) return;
    completedRef.current = true;
    const nextValue = draft.trim();
    if (nextValue !== value) {
      setValue(nextValue);
      props.onCommit?.(nextValue);
    }
    setEditing(false);
  };
  const cancel = () => {
    cancelledRef.current = true;
    completedRef.current = true;
    setDraft(value);
    setEditing(false);
  };
  const handleKeyPress = (event: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    if (event.nativeEvent.key === "Escape") cancel();
  };

  return (
    <View style={styles.row}>
      <Text style={styles.label}>{props.label}</Text>
      {editing ? (
        <TextInput
          accessibilityLabel={props.accessibilityLabel}
          autoFocus
          onBlur={finish}
          onChangeText={setDraft}
          onKeyPress={handleKeyPress}
          onSubmitEditing={finish}
          placeholder={props.placeholder}
          returnKeyType="done"
          selectTextOnFocus
          multiline={false}
          style={[styles.value, styles.inlineInput]}
          value={draft}
        />
      ) : (
        <Pressable accessibilityLabel={`${props.accessibilityLabel} 편집`} accessibilityRole="button" hitSlop={10} onPress={beginEditing} style={styles.pressableValue}>
          <Text numberOfLines={1} style={[styles.value, styles.editableValue, !value && styles.placeholder]}>
            {value || props.placeholder}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

export function CompactInlineEditableField(props: CompactInlineFieldProps) {
  const [draft, setDraft] = useState(props.value);
  const [editing, setEditing] = useState(false);
  const startValueRef = useRef(props.value);
  const cancelledRef = useRef(false);
  const completedRef = useRef(false);

  const beginEditing = () => {
    if (!props.editable) return;
    startValueRef.current = props.value;
    cancelledRef.current = false;
    completedRef.current = false;
    setDraft(props.value);
    setEditing(true);
  };
  const changeDraft = (nextValue: string) => {
    setDraft(nextValue);
    props.onChange(nextValue);
  };
  const finish = () => {
    if (cancelledRef.current || completedRef.current) return;
    completedRef.current = true;
    const nextValue = draft.trim();
    props.onChange(nextValue);
    if (nextValue !== startValueRef.current.trim()) props.onCommit?.(nextValue);
    setEditing(false);
  };
  const cancel = () => {
    cancelledRef.current = true;
    completedRef.current = true;
    props.onChange(startValueRef.current);
    setDraft(startValueRef.current);
    setEditing(false);
  };
  const handleKeyPress = (event: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    if (event.nativeEvent.key === "Escape") cancel();
  };
  const visibleValue = props.displayValue ?? props.value;

  return (
    <View testID="material-core-field" style={styles.compactCell}>
      <Text numberOfLines={1} style={[styles.compactLabel, props.invalid && styles.invalidLabel]}>{props.label}</Text>
      {editing ? (
        <TextInput
          accessibilityLabel={props.accessibilityLabel}
          autoFocus
          keyboardType={props.keyboardType}
          multiline={false}
          onBlur={finish}
          onChangeText={changeDraft}
          onKeyPress={handleKeyPress}
          onSubmitEditing={finish}
          placeholder={props.placeholder}
          returnKeyType="done"
          selectTextOnFocus
          style={[styles.compactValue, styles.compactInput, props.invalid && styles.invalidUnderline]}
          value={draft}
        />
      ) : props.editable ? (
        <Pressable
          accessibilityLabel={`${props.accessibilityLabel} 편집`}
          accessibilityRole="button"
          hitSlop={8}
          onPress={beginEditing}
          style={styles.compactPressable}
        >
          <Text
            numberOfLines={1}
            style={[
              styles.compactValue,
              styles.compactEditableValue,
              props.invalid && styles.invalidUnderline,
              !visibleValue && styles.placeholder,
            ]}
          >
            {visibleValue || props.placeholder}
          </Text>
        </Pressable>
      ) : (
        <Text numberOfLines={1} style={styles.compactValue}>{visibleValue || "-"}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: "center", flexDirection: "row", gap: 8, height: COMPACT_FIELD_ROW_HEIGHT },
  label: { ...COMPACT_FIELD_LABEL_TEXT, width: 82 },
  pressableValue: { flex: 1, height: COMPACT_FIELD_ROW_HEIGHT, justifyContent: "center", minWidth: 0 },
  value: { ...COMPACT_FIELD_VALUE_TEXT, flex: 1, minWidth: 0 },
  editableValue: { borderBottomColor: "#b98c5a", borderBottomWidth: 1, borderStyle: "dotted", paddingBottom: 1 },
  placeholder: { color: "#9b9288" },
  inlineInput: { borderBottomColor: "#23375a", borderBottomWidth: 1, height: COMPACT_FIELD_ROW_HEIGHT, paddingHorizontal: 0, paddingVertical: 0 },
  compactCell: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 4,
    height: COMPACT_FIELD_ROW_HEIGHT,
    minWidth: 0,
  },
  compactLabel: { ...COMPACT_FIELD_LABEL_TEXT, flexShrink: 0 },
  compactPressable: { flex: 1, height: COMPACT_FIELD_ROW_HEIGHT, justifyContent: "center", minWidth: 0 },
  compactValue: { ...COMPACT_FIELD_VALUE_TEXT, flex: 1, minWidth: 0 },
  compactEditableValue: { borderBottomColor: "#b98c5a", borderBottomWidth: 1, borderStyle: "dotted", paddingBottom: 1 },
  compactInput: { borderBottomColor: "#23375a", borderBottomWidth: 1, height: COMPACT_FIELD_ROW_HEIGHT, paddingHorizontal: 0, paddingVertical: 0 },
  invalidLabel: { color: "#963d34" },
  invalidUnderline: { borderBottomColor: "#c96d5f" },
});
