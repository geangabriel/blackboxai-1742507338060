import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
  ActivityIndicator
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { useAuth } from '../contexts/AuthContext';

const MapScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [region, setRegion] = useState({
    latitude: -23.550520,  // São Paulo como localização padrão
    longitude: -46.633308,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permissão negada',
          'Precisamos da sua localização para funcionar corretamente'
        );
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);
      setRegion({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível obter sua localização');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestRide = () => {
    navigation.navigate('RideRequest', {
      currentLocation: {
        latitude: region.latitude,
        longitude: region.longitude,
      },
    });
  };

  const handleViewAvailableRides = () => {
    // Navegar para a tela de rotas disponíveis (para motoristas)
    navigation.navigate('DriverDashboard');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation
        showsMyLocationButton
      >
        {location && (
          <Marker
            coordinate={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            }}
            title="Sua localização"
          />
        )}
      </MapView>

      <View style={styles.buttonContainer}>
        {user?.type === 'driver' ? (
          <TouchableOpacity
            style={styles.button}
            onPress={handleViewAvailableRides}
          >
            <Text style={styles.buttonText}>Ver Rotas Disponíveis</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.button}
            onPress={handleRequestRide}
          >
            <Text style={styles.buttonText}>Solicitar Transporte</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity
        style={styles.profileButton}
        onPress={() => navigation.navigate('Profile')}
      >
        <Text style={styles.profileButtonText}>Perfil</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  map: {
    flex: 1,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
  },
  button: {
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  profileButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  profileButtonText: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default MapScreen;