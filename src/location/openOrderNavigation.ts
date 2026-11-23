import { Linking, Platform } from 'react-native';
type Coordinate = { latitude: number; longitude: number };
export async function openOrderNavigation(destination: Coordinate, origin?: Coordinate | null) {
  if (!Number.isFinite(destination.latitude) || !Number.isFinite(destination.longitude) || Math.abs(destination.latitude) > 90 || Math.abs(destination.longitude) > 180) throw new Error('Invalid destination');
  const point = `${destination.latitude},${destination.longitude}`;
  const native = Platform.OS === 'ios' ? `maps://?daddr=${point}&dirflg=d` : `google.navigation:q=${point}&mode=d`;
  try { await Linking.openURL(native); return; } catch { /* A maps application might not be installed. */ }
  const from = origin && Number.isFinite(origin.latitude) && Number.isFinite(origin.longitude) ? `&origin=${origin.latitude},${origin.longitude}` : '';
  await Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${point}${from}&travelmode=driving`);
}

export function openAddressOnMap(address: string) {
  const query = encodeURIComponent(address);
  return Linking.openURL(Platform.OS === 'ios' ? `maps://?q=${query}` : `https://www.google.com/maps/search/?api=1&query=${query}`);
}
