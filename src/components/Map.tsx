import React, { memo, forwardRef, useMemo } from 'react';
import MapView, {
  Marker,
  Polyline,
  PROVIDER_GOOGLE,
  type LatLng,
  type MapMarkerProps,
  type MapPolylineProps,
  type MapViewProps,
} from 'react-native-maps';
import { StyleSheet } from 'react-native';

const HIDDEN_COORDINATE: LatLng = { latitude: 0, longitude: 0 };

export type AppMapMarker = {
  id: string;
  coordinate: LatLng;
  active?: boolean;
  opacity?: number;
  image?: MapMarkerProps['image'];
  title?: string;
  description?: string;
  anchor?: MapMarkerProps['anchor'];
  zIndex?: number;
  render?: React.ReactNode;
};

export type AppMapPolyline = {
  id: string;
  coordinates: LatLng[];
  strokeWidth?: number;
  strokeColor?: string;
  geodesic?: boolean;
  lineDashPattern?: number[];
  lineCap?: MapPolylineProps['lineCap'];
  lineJoin?: MapPolylineProps['lineJoin'];
  zIndex?: number;
};

type Props = Omit<MapViewProps, 'children'> & {
  markers?: AppMapMarker[];
  polylines?: AppMapPolyline[];
  useGoogleProvider?: boolean;
  children?: React.ReactNode;
};

const Map = forwardRef<MapView, Props>(function Map(
  { markers, polylines, style, provider, useGoogleProvider = true, children, ...rest },
  ref,
) {
  const resolvedProvider = provider ?? (useGoogleProvider ? PROVIDER_GOOGLE : undefined);
  const sortedPolylines = useMemo(
    () => [...(polylines ?? [])].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0)),
    [polylines],
  );

  return (
    <MapView ref={ref} style={[styles.map, style]} provider={resolvedProvider} {...rest}>
      {markers?.map((marker) => {
        const isActive = marker.active !== false;
        const coordinate = isActive ? marker.coordinate : HIDDEN_COORDINATE;
        const opacity = isActive ? marker.opacity ?? 1 : 0;

        return (
          <Marker
            key={marker.id}
            coordinate={coordinate}
            opacity={opacity}
            title={marker.title}
            description={marker.description}
            anchor={marker.anchor}
            zIndex={marker.zIndex}
            image={marker.render ? undefined : marker.image}
          >
            {marker.render}
          </Marker>
        );
      })}
      {sortedPolylines.map((polyline) => (
        <Polyline
          key={polyline.id}
          coordinates={polyline.coordinates}
          strokeWidth={polyline.strokeWidth}
          strokeColor={polyline.strokeColor}
          geodesic={polyline.geodesic}
          lineDashPattern={polyline.lineDashPattern}
          lineCap={polyline.lineCap}
          lineJoin={polyline.lineJoin}
          zIndex={polyline.zIndex}
        />
      ))}
      {children}
    </MapView>
  );
});

export default memo(Map);

const styles = StyleSheet.create({
  map: {
    ...StyleSheet.absoluteFillObject,
  },
});
