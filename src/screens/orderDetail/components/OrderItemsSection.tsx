import React, { useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Text from '../../../components/Text';
import { RiderOrderDetail } from '../../../api/riderOrderDetailTypes';
import { useAppTheme } from '../../../theme/ThemeProvider';
import { useTranslations } from '../../../localization/LocalizationProvider';

type Props = {
  order: RiderOrderDetail;
};

export default function OrderItemsSection({ order }: Props) {
  const { theme } = useAppTheme();
  const { t } = useTranslations('app');
  const [expanded, setExpanded] = useState(false);

  const total = useMemo(
    () => order.items.reduce((acc, item) => acc + Number(item.totalPrice ?? 0), 0),
    [order.items],
  );

  return (
    <View style={[styles.wrapper, { borderTopColor: theme.colors.gray200 }]}> 
      <Pressable style={styles.titleRow} onPress={() => setExpanded((v) => !v)}>
        <Text weight="medium" color={theme.colors.gray600}>{t('order_details_title')}</Text>
        <ChevronIcon up={expanded} color={theme.colors.gray900} />
      </Pressable>

      {expanded ? (
        <>
          <View style={styles.headerRow}>
            <Text variant="caption" weight="semiBold" color={theme.colors.gray500}>{t('order_items_and_quantity')}</Text>
            <Text variant="caption" weight="semiBold" color={theme.colors.gray500}>{t('order_price')}</Text>
          </View>

          <View style={styles.itemsWrap}>
            {order.items.map((item, index) => (
              <View style={styles.itemRow} key={`${item.productId ?? 'product'}-${index}`}>
                <View style={styles.itemLeft}>
                  {item.image ? (
                    <Image source={{ uri: item.image }} style={[styles.itemImage, { borderColor: theme.colors.gray200 }]} />
                  ) : (
                    <View style={[styles.itemImage, { borderColor: theme.colors.gray200, backgroundColor: theme.colors.gray100 }]} />
                  )}
                  <View style={styles.itemTextWrap}>
                    <Text variant="caption" weight="semiBold" color={theme.colors.gray900}>{item.name ?? '—'}</Text>
                    <Text variant="caption" color={theme.colors.gray600}>{item.selectedOptions ?? ''}</Text>
                    <Text variant="caption" weight="semiBold" color={theme.colors.gray900}>x{Number(item.quantity ?? 0)}</Text>
                  </View>
                </View>
                <Text variant="caption" weight="semiBold" color={theme.colors.gray900}>${Number(item.unitPrice ?? 0).toFixed(0)}</Text>
              </View>
            ))}
          </View>

          <View style={[styles.totalRow, { borderTopColor: theme.colors.gray200 }]}> 
            <Text weight="semiBold" color={theme.colors.gray900}>{t('order_total')}</Text>
            <Text weight="semiBold" color={theme.colors.gray900}>${total.toFixed(0)}</Text>
          </View>
        </>
      ) : null}
    </View>
  );
}

function ChevronIcon({ up, color }: { up: boolean; color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" style={up ? undefined : styles.chevronDown}>
      <Path
        d="M6 15L12 9L18 15"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderTopWidth: 1,
    paddingTop: 16,
    gap: 14,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chevronDown: {
    transform: [{ rotate: '180deg' }],
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemsWrap: {
    gap: 12,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  itemLeft: {
    flexDirection: 'row',
    gap: 8,
    flex: 1,
  },
  itemImage: {
    width: 48,
    height: 64,
    borderRadius: 8,
    borderWidth: 1,
  },
  itemTextWrap: {
    flex: 1,
    gap: 4,
  },
  totalRow: {
    borderTopWidth: 1,
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
