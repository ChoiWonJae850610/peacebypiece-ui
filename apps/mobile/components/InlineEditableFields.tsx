import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type NativeSyntheticEvent,
  type TextInputKeyPressEventData,
} from "react-native";

import { WAFL_FONTS } from "@/constants/fonts";

type InlineFieldProps = {
  readonly label: string;
  readonly value?: string;
  readonly editable: boolean;
  readonly placeholder: string;
  readonly accessibilityLabel: string;
};

export function ReadOnlyInlineValue({ label, value }: Pick<InlineFieldProps, "label" | "value">) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value?.trim() || "-"}</Text>
    </View>
  );
}

export function InlineEditableValue(props: InlineFieldProps) {
  const [value, setValue] = useState(props.value ?? "");
  const [draft, setDraft] = useState(value);
  const [editing, setEditing] = useState(false);

  if (!props.editable) return <ReadOnlyInlineValue label={props.label} value={value} />;

  const finish = () => {
    setValue(draft.trim());
    setEditing(false);
  };
  const cancel = () => {
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
          style={[styles.value, styles.inlineInput]}
          value={draft}
        />
      ) : (
        <Pressable accessibilityLabel={`${props.accessibilityLabel} 편집`} accessibilityRole="button" onPress={() => setEditing(true)} style={styles.pressableValue}>
          <Text numberOfLines={2} style={[styles.value, styles.editableValue, !value && styles.placeholder]}>
            {value || props.placeholder}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

export function ExpandableInlineNote(props: InlineFieldProps) {
  const [value, setValue] = useState(props.value ?? "");
  const [draft, setDraft] = useState(value);
  const [editing, setEditing] = useState(false);

  if (!props.editable) return <ReadOnlyInlineValue label={props.label} value={value} />;

  const finish = () => {
    setValue(draft.trim());
    setEditing(false);
  };
  const cancel = () => {
    setDraft(value);
    setEditing(false);
  };
  const handleKeyPress = (event: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    if (event.nativeEvent.key === "Escape") cancel();
  };

  return (
    <View style={[styles.row, editing && styles.noteEditingRow]}>
      <Text style={styles.label}>{props.label}</Text>
      {editing ? (
        <TextInput
          accessibilityLabel={props.accessibilityLabel}
          autoFocus
          multiline
          onBlur={finish}
          onChangeText={setDraft}
          onKeyPress={handleKeyPress}
          placeholder={props.placeholder}
          style={[styles.value, styles.inlineInput, styles.noteInput]}
          textAlignVertical="top"
          value={draft}
        />
      ) : (
        <Pressable accessibilityLabel={`${props.accessibilityLabel} 편집`} accessibilityRole="button" onPress={() => setEditing(true)} style={styles.pressableValue}>
          <Text numberOfLines={2} style={[styles.value, styles.editableValue, !value && styles.placeholder]}>
            {value || props.placeholder}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: "flex-start", flexDirection: "row", gap: 8, minHeight: 34, paddingVertical: 5 },
  noteEditingRow: { minHeight: 86 },
  label: { color: "#756b62", fontFamily: WAFL_FONTS.semibold, fontSize: 12, lineHeight: 20, width: 82 },
  pressableValue: { flex: 1, minHeight: 24, minWidth: 0 },
  value: { color: "#17263d", flex: 1, fontFamily: WAFL_FONTS.medium, fontSize: 14, lineHeight: 20, minWidth: 0 },
  editableValue: { borderBottomColor: "#9b8f80", borderBottomWidth: 1, borderStyle: "dotted", paddingBottom: 2 },
  placeholder: { color: "#9b9288" },
  inlineInput: { borderBottomColor: "#23375a", borderBottomWidth: 2, fontSize: 16, minHeight: 28, paddingHorizontal: 0, paddingVertical: 2 },
  noteInput: { minHeight: 74 },
});
