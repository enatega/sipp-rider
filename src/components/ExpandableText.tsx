import React, { useState } from 'react';
import { Pressable, StyleSheet, View, type NativeSyntheticEvent, type StyleProp, type TextLayoutEventData, type TextStyle } from 'react-native';
import Text, { type TextVariant } from './Text';

const MAX_LINES = 2;

interface Props {
  text: string;
  moreLabel: string;
  lessLabel: string;
  textColor: string;
  linkColor: string;
  textStyle?: StyleProp<TextStyle>;
  variant?: TextVariant;
  weight?: 'regular' | 'medium' | 'semiBold' | 'bold' | 'extraBold';
}

/** Clamps long text to two lines and shows a toggle only when the text is actually cut off. */
export default function ExpandableText({ text, moreLabel, lessLabel, textColor, linkColor, textStyle, variant = 'body', weight = 'regular' }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  // Measured once per text value on an unclamped render, so line counts are reliable on iOS and Android.
  const [measurement, setMeasurement] = useState<{ text: string; isLong: boolean } | null>(null);
  const isMeasured = measurement?.text === text;

  const handleTextLayout = (event: NativeSyntheticEvent<TextLayoutEventData>) => {
    if (isMeasured) return;
    setMeasurement({ text, isLong: event.nativeEvent.lines.length > MAX_LINES });
  };

  return (
    <View>
      <Text
        variant={variant}
        weight={weight}
        color={textColor}
        style={[styles.text, textStyle]}
        numberOfLines={isMeasured && !isExpanded ? MAX_LINES : undefined}
        onTextLayout={handleTextLayout}
      >
        {text}
      </Text>
      {measurement?.isLong && isMeasured ? (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: isExpanded }}
          hitSlop={8}
          onPress={event => {
            event.stopPropagation();
            setIsExpanded(value => !value);
          }}
          style={styles.toggle}
        >
          <Text variant="caption" weight="semiBold" color={linkColor}>{isExpanded ? lessLabel : moreLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  text: { flexShrink: 1 },
  toggle: { alignSelf: 'flex-start', paddingTop: 4 },
});
