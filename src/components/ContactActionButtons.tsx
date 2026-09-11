import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useAppTheme } from '../theme/ThemeProvider';

type Props = {
  onPressCall: () => void;
  onPressChat: () => void;
  callDisabled?: boolean;
  chatDisabled?: boolean;
};

export default function ContactActionButtons({
  onPressCall,
  onPressChat,
  callDisabled = false,
  chatDisabled = false,
}: Props) {
  const { theme } = useAppTheme();

  return (
    <View style={styles.container}>
      <Pressable
        onPress={onPressCall}
        disabled={callDisabled}
        style={({ pressed }) => [
          styles.iconWrap,
          { backgroundColor: theme.colors.primary, opacity: callDisabled ? 0.5 : (pressed ? 0.85 : 1) },
        ]}
      >
        <CallIcon color={theme.colors.white} />
      </Pressable>
      <Pressable
        onPress={onPressChat}
        disabled={chatDisabled}
        style={({ pressed }) => [
          styles.iconWrap,
          { backgroundColor: theme.colors.primary, opacity: chatDisabled ? 0.5 : (pressed ? 0.85 : 1) },
        ]}
      >
        <ChatIcon color={theme.colors.white} />
      </Pressable>
    </View>
  );
}

function CallIcon({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6.62 10.79a15.06 15.06 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.02-.24 11.31 11.31 0 0 0 3.57.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.3 21 3 13.7 3 4a1 1 0 0 1 1-1h3.49a1 1 0 0 1 1 1 11.31 11.31 0 0 0 .57 3.57 1 1 0 0 1-.24 1.02l-2.2 2.2Z"
        fill={color}
      />
    </Svg>
  );
}

function ChatIcon({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 5a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3H9l-4.5 4v-4H7a3 3 0 0 1-3-3V5Z"
        fill={color}
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
