import React from 'react';
import { NativeSyntheticEvent, StyleProp, Text as RNText, TextLayoutEventData, TextStyle } from 'react-native';
import { useAppTheme } from '../theme/ThemeProvider';

export type TextVariant = 'title' | 'subtitle' | 'body' | 'label' | 'caption';

type Props = Omit<React.ComponentProps<typeof RNText>, 'children' | 'style'> & {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
  variant?: TextVariant;
  weight?: 'regular' | 'medium' | 'semiBold' | 'bold' | 'extraBold';
  color?: string;
  numberOfLines?: number;
  onTextLayout?: (event: NativeSyntheticEvent<TextLayoutEventData>) => void;
};

export default function Text({
  children,
  style,
  variant = 'body',
  weight = 'regular',
  color,
  numberOfLines,
  onTextLayout,
  ...nativeProps
}: Props) {
  const { theme } = useAppTheme();

  const variantStyle: TextStyle = (() => {
    switch (variant) {
      case 'title':
        return {
          fontSize: theme.typography.size.xxl,
          lineHeight: theme.typography.lineHeight.xxl,
        };
      case 'subtitle':
        return {
          fontSize: theme.typography.size.lg,
          lineHeight: theme.typography.lineHeight.lg,
        };
      case 'caption':
        return {
          fontSize: theme.typography.size.xs,
          lineHeight: theme.typography.lineHeight.xs,
        };
      case 'label':
        return {
          fontSize: theme.typography.size.sm,
          lineHeight: theme.typography.lineHeight.sm,
        };
      default:
        return {
          fontSize: theme.typography.size.md,
          lineHeight: theme.typography.lineHeight.md,
        };
    }
  })();

  return (
    <RNText
      {...nativeProps}
      style={[
        {
          color: color ?? theme.colors.text,
          fontFamily: theme.typography.fontFamily.regular,
          fontWeight: theme.typography.fontWeight[weight] as TextStyle['fontWeight'],
        },
        variantStyle,
        style,
      ]}
      numberOfLines={numberOfLines}
      onTextLayout={onTextLayout}
    >
      {children}
    </RNText>
  );
}
