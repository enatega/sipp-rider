import React from 'react';
import { StyleProp, Text as RNText, TextStyle } from 'react-native';
import { useAppTheme } from '../theme/ThemeProvider';

export type TextVariant = 'title' | 'subtitle' | 'body' | 'label' | 'caption';

type Props = {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
  variant?: TextVariant;
  weight?: 'regular' | 'medium' | 'semiBold' | 'bold' | 'extraBold';
  color?: string;
  numberOfLines?: number;
};

export default function Text({
  children,
  style,
  variant = 'body',
  weight = 'regular',
  color,
  numberOfLines,
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
    >
      {children}
    </RNText>
  );
}
