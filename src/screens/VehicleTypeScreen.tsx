import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Button from '../components/Button';
import Text from '../components/Text';
import VerticalList from '../components/VerticalList';
import { useUpdateVehicleTypeMutation } from '../hooks/useVehicleTypesMutations';
import { useVehicleTypesQuery } from '../hooks/useVehicleTypesQuery';
import { useTranslations } from '../localization/LocalizationProvider';
import { useAppTheme } from '../theme/ThemeProvider';
import { MainStackParamList } from '../navigation/types';
import { VehicleTypeItem } from '../api/vehicleTypesTypes';

export default function VehicleTypeScreen() {
  const { theme } = useAppTheme();
  const { t } = useTranslations('app');
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const vehicleTypesQuery = useVehicleTypesQuery();
  const updateVehicleTypeMutation = useUpdateVehicleTypeMutation();
  const [selectedVehicleTypeId, setSelectedVehicleTypeId] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState('');
  const vehicleTypes = vehicleTypesQuery.data?.vehicleTypes ?? [];

  useEffect(() => {
    if (selectedVehicleTypeId || !vehicleTypes.length) return;

    const selectedByApi = vehicleTypesQuery.data?.selectedVehicleType?.vehicleTypeId;
    if (selectedByApi) {
      setSelectedVehicleTypeId(selectedByApi);
      return;
    }

    const selectedByFlag = vehicleTypes.find((item) => item.isSelected);
    if (selectedByFlag) {
      setSelectedVehicleTypeId(selectedByFlag.id);
      return;
    }

    setSelectedVehicleTypeId(vehicleTypes[0].id);
  }, [selectedVehicleTypeId, vehicleTypes, vehicleTypesQuery.data?.selectedVehicleType?.vehicleTypeId]);

  const onSelectVehicleType = (vehicleTypeId: string) => {
    setSelectedVehicleTypeId(vehicleTypeId);
    setSuccessMessage('');
  };

  const onConfirmVehicleType = async () => {
    if (!selectedVehicleTypeId || updateVehicleTypeMutation.isPending) return;
    try {
      const response = await updateVehicleTypeMutation.mutateAsync({
        vehicleTypeId: selectedVehicleTypeId,
      });
      setSuccessMessage(response.message);
      navigation.goBack();
    } catch {
      // Mutation error is displayed from hook state.
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top', 'bottom']}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.menuButton}>
          <BackIcon color={theme.colors.gray900} />
        </Pressable>
        <Text
          weight="semiBold"
          style={{ fontSize: theme.typography.size.md, lineHeight: theme.typography.lineHeight.md }}
        >
          {t('menu_vehicle_type')}
        </Text>
        <View style={styles.menuButton} />
      </View>

      <View style={styles.optionsSection}>
        {vehicleTypesQuery.isLoading ? (
          <View style={styles.centerState}>
            <ActivityIndicator color={theme.colors.primary} />
          </View>
        ) : vehicleTypesQuery.isError ? (
          <View style={styles.centerState}>
            <Text style={{ color: theme.colors.gray600, textAlign: 'center' }}>{vehicleTypesQuery.errorMessage}</Text>
          </View>
        ) : (
          <VerticalList
            data={vehicleTypes}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <VehicleTypeRow
                item={item}
                label={item.name}
                selected={selectedVehicleTypeId === item.id}
                onPress={() => onSelectVehicleType(item.id)}
              />
            )}
          />
        )}
      </View>

      <View style={styles.footer}>
        <Button
          label={
            updateVehicleTypeMutation.isPending
              ? t('vehicle_type_updating_button')
              : t('vehicle_type_update_button')
          }
          onPress={onConfirmVehicleType}
          disabled={
            updateVehicleTypeMutation.isPending ||
            vehicleTypesQuery.isLoading ||
            !selectedVehicleTypeId
          }
          textColor={theme.colors.gray900}
          containerStyle={styles.updateButton}
        />
        {updateVehicleTypeMutation.error?.message ? (
          <Text variant="caption" color={theme.colors.red500} style={styles.feedbackText}>
            {updateVehicleTypeMutation.error.message}
          </Text>
        ) : null}
        {successMessage ? (
          <Text variant="caption" color={theme.colors.emerald900} style={styles.feedbackText}>
            {successMessage}
          </Text>
        ) : null}
      </View>

    </SafeAreaView>
  );
}

function VehicleTypeRow({
  item,
  label,
  selected,
  onPress,
}: {
  item: VehicleTypeItem;
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { theme } = useAppTheme();
  return (
    <Pressable onPress={onPress} style={[styles.row, { borderBottomColor: theme.colors.gray300 }]}>
      <View style={styles.rowLeft}>
        <VehicleImage imageUrl={item.imageUrl} />
        <Text
          weight="semiBold"
          style={[
            styles.rowLabel,
            {
              color: theme.colors.gray900,
              fontSize: theme.typography.size.sm,
              lineHeight: 20,
            },
          ]}
        >
          {label}
        </Text>
      </View>
      <SelectionCircle selected={selected} />
    </Pressable>
  );
}

function SelectionCircle({ selected }: { selected: boolean }) {
  const { theme } = useAppTheme();
  return (
    <View
      style={[
        styles.selectionOuter,
        { borderColor: selected ? theme.colors.primary : theme.colors.gray300 },
      ]}
    >
      {selected ? <View style={[styles.selectionInner, { backgroundColor: theme.colors.primary }]} /> : null}
    </View>
  );
}

function BackIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M15 6L9 12L15 18" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function VehicleIcon({ color }: { color: string }) {
  return (
    <Svg width={28} height={28} viewBox="0 0 28 28" fill="none">
      <Circle cx={8} cy={20.5} r={3.75} stroke={color} strokeWidth={1.8} />
      <Circle cx={21} cy={20.5} r={3.75} stroke={color} strokeWidth={1.8} />
      <Path d="M8 20.5L12.5 15H17L20 20.5M13 13.5H16.5L18 16.5M12 15L9.5 15" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Rect x={3} y={10} width={4} height={4} stroke={color} strokeWidth={1.8} />
    </Svg>
  );
}

function VehicleImage({ imageUrl }: { imageUrl: string }) {
  return (
    <View style={styles.imageWrap}>
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
      ) : (
        <VehicleIcon color="#6B7280" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    minHeight: 56,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuButton: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  optionsSection: {
    marginTop: 39,
    marginHorizontal: 21,
    flex: 1,
  },
  row: {
    minHeight: 62,
    borderBottomWidth: 1,
    justifyContent: 'center',
    paddingVertical: 8,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 36,
    gap: 16,
  },
  imageWrap: {
    width: 28,
    height: 28,
    borderRadius: 4,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: 28,
    height: 28,
  },
  rowLabel: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  selectionOuter: {
    position: 'absolute',
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectionInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  footer: {
    marginTop: 'auto',
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 12,
  },
  updateButton: {
    height: 54,
    borderRadius: 40,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackText: {
    marginTop: 8,
  },
});
