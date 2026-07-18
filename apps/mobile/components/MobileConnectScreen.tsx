import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { MOBILE_APP_VERSION } from "@/constants/version";
import { WAFL_FONTS } from "@/constants/fonts";

type Props = {
  readonly connecting: boolean;
  readonly message?: string | null;
  readonly originError?: boolean;
  readonly onConnect: (code: string) => void;
};

function normalizeCode(value: string) {
  return value.toUpperCase().replace(/[\s-]/g, "").slice(0, 8);
}

export default function MobileConnectScreen({ connecting, message, originError = false, onConnect }: Props) {
  const [code, setCode] = useState("");
  const valid = /^[2-9A-HJ-NP-Z]{8}$/.test(code);

  return (
    <View style={styles.wrap}>
      <Text style={styles.brand}>WAFL</Text>
      <Text style={styles.title}>개발용 연결</Text>
      <Text style={styles.description}>PC의 로컬 WAFL 연결 화면에서 발급한 코드를 입력하세요.</Text>
      <TextInput
        accessibilityLabel="8자리 개발용 연결 코드"
        autoCapitalize="characters"
        autoCorrect={false}
        editable={!connecting && !originError}
        maxLength={8}
        onChangeText={(value) => setCode(normalizeCode(value))}
        placeholder="8자리 코드"
        placeholderTextColor="#9b9186"
        style={styles.input}
        value={code}
      />
      {message ? <Text accessibilityRole="alert" style={styles.error}>{message}</Text> : null}
      <Pressable
        accessibilityRole="button"
        disabled={!valid || connecting || originError}
        onPress={() => onConnect(code)}
        style={({ pressed }) => [styles.button, (!valid || connecting || originError) && styles.buttonDisabled, pressed && styles.buttonPressed]}
      >
        {connecting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>연결</Text>}
      </Pressable>
      <View style={styles.notice}>
        <Text style={styles.noticeText}>dev/test 읽기 전용 연결입니다. 실제 로그인이나 운영 계정 연결이 아닙니다.</Text>
        <Text style={styles.version}>내부 버전 {MOBILE_APP_VERSION}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: "center", backgroundColor: "#fffdf8", borderColor: "#ded3c6", borderRadius: 22, borderWidth: 1, gap: 14, maxWidth: 460, padding: 24, width: "100%" },
  brand: { color: "#9b4a27", fontFamily: WAFL_FONTS.black, fontSize: 13, letterSpacing: 2 },
  title: { color: "#17263d", fontFamily: WAFL_FONTS.black, fontSize: 28 },
  description: { color: "#5e554c", fontFamily: WAFL_FONTS.regular, fontSize: 15, lineHeight: 23 },
  input: { backgroundColor: "#fff", borderColor: "#cbbcab", borderRadius: 13, borderWidth: 1, color: "#17263d", fontFamily: WAFL_FONTS.bold, fontSize: 22, letterSpacing: 5, minHeight: 54, paddingHorizontal: 16, textAlign: "center" },
  error: { color: "#a2322b", fontFamily: WAFL_FONTS.semibold, fontSize: 13, lineHeight: 20 },
  button: { alignItems: "center", backgroundColor: "#9b4a27", borderRadius: 13, justifyContent: "center", minHeight: 52 },
  buttonDisabled: { opacity: 0.42 },
  buttonPressed: { opacity: 0.78 },
  buttonText: { color: "#fff", fontFamily: WAFL_FONTS.bold, fontSize: 16 },
  notice: { borderTopColor: "#eee4d8", borderTopWidth: 1, gap: 6, paddingTop: 13 },
  noticeText: { color: "#74695f", fontFamily: WAFL_FONTS.regular, fontSize: 12, lineHeight: 18 },
  version: { color: "#8c8177", fontFamily: WAFL_FONTS.medium, fontSize: 11 },
});
