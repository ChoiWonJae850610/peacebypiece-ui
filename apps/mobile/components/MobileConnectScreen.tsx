import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { MOBILE_APP_VERSION } from "@/constants/version";
import { WAFL_FONTS } from "@/constants/fonts";

type Props = {
  readonly autoConnecting: boolean;
  readonly manualConnecting: boolean;
  readonly manualEntry: boolean;
  readonly message?: string | null;
  readonly originError?: boolean;
  readonly onAutoConnect: () => void;
  readonly onConnect: (code: string) => void;
  readonly onUseCode: () => void;
};

function normalizeCode(value: string) {
  return value.toUpperCase().replace(/[\s-]/g, "").slice(0, 8);
}

export default function MobileConnectScreen({ autoConnecting, manualConnecting, manualEntry, message, originError = false, onAutoConnect, onConnect, onUseCode }: Props) {
  const [code, setCode] = useState("");
  const valid = /^[2-9A-HJ-NP-Z]{8}$/.test(code);
  const connecting = autoConnecting || manualConnecting;

  return (
    <View style={styles.wrap}>
      <Text style={styles.brand}>WAFL</Text>
      <Text style={styles.title}>개발용 연결</Text>
      <Text style={styles.description}>{autoConnecting ? "Tailscale 개발자 신원을 확인하고 있습니다." : manualEntry ? "PC의 로컬 WAFL 연결 화면에서 발급한 코드를 입력하세요." : "개발자 자동 연결을 사용할 수 없습니다."}</Text>
      {manualEntry ? <TextInput
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
        /> : null}
      {message ? <Text accessibilityRole="alert" style={styles.error}>{message}</Text> : null}
      {autoConnecting ? <View style={styles.autoProgress}><ActivityIndicator color="#9b4a27" /><Text style={styles.progressText}>자동 연결 중</Text></View> : manualEntry ? <Pressable
        accessibilityRole="button"
        disabled={!valid || manualConnecting || originError}
        onPress={() => onConnect(code)}
        style={({ pressed }) => [styles.button, (!valid || manualConnecting || originError) && styles.buttonDisabled, pressed && styles.buttonPressed]}
      >
        {manualConnecting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>연결</Text>}
      </Pressable> : <Pressable accessibilityRole="button" disabled={originError} onPress={onAutoConnect} style={({ pressed }) => [styles.button, originError && styles.buttonDisabled, pressed && styles.buttonPressed]}><Text style={styles.buttonText}>자동 연결</Text></Pressable>}
      {!autoConnecting ? <Pressable accessibilityRole="button" onPress={manualEntry ? onAutoConnect : onUseCode} style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}><Text style={styles.secondaryText}>{manualEntry ? "자동 연결 다시 시도" : "연결 코드 사용"}</Text></Pressable> : null}
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
  autoProgress: { alignItems: "center", flexDirection: "row", gap: 9, justifyContent: "center", minHeight: 52 },
  progressText: { color: "#67584c", fontFamily: WAFL_FONTS.semibold, fontSize: 14 },
  error: { color: "#a2322b", fontFamily: WAFL_FONTS.semibold, fontSize: 13, lineHeight: 20 },
  button: { alignItems: "center", backgroundColor: "#9b4a27", borderRadius: 13, justifyContent: "center", minHeight: 52 },
  buttonDisabled: { opacity: 0.42 },
  buttonPressed: { opacity: 0.78 },
  buttonText: { color: "#fff", fontFamily: WAFL_FONTS.bold, fontSize: 16 },
  secondaryButton: { alignItems: "center", borderColor: "#b9aa9a", borderRadius: 13, borderWidth: 1, justifyContent: "center", minHeight: 48 },
  secondaryText: { color: "#3f352d", fontFamily: WAFL_FONTS.bold, fontSize: 14 },
  notice: { borderTopColor: "#eee4d8", borderTopWidth: 1, gap: 6, paddingTop: 13 },
  noticeText: { color: "#74695f", fontFamily: WAFL_FONTS.regular, fontSize: 12, lineHeight: 18 },
  version: { color: "#8c8177", fontFamily: WAFL_FONTS.medium, fontSize: 11 },
});
