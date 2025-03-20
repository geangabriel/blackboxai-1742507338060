import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';

const RideCard = ({ ride, onAccept }) => {
  const getTypeIcon = () => {
    return ride.isProduct ? '📦' : '👤';
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardType}>{getTypeIcon()} {ride.isProduct ? 'Produto' : 'Passageiro'}</Text>
        <Text style={styles.cardPrice}>R$ {ride.price.toFixed(2)}</Text>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.addressContainer}>
          <Text style={styles.addressLabel}>Origem:</Text>
          <Text style={styles.addressText}>{ride.originAddress}</Text>
        </View>

        <View style={styles.addressContainer}>
          <Text style={styles.addressLabel}>Destino:</Text>
          <Text style={styles.addressText}>{ride.destinationAddress}</Text>
        </View>

        {ride.isProduct && (
          <View style={styles.productDetails}>
            <Text style={styles.detailText}>Descrição: {ride.description}</Text>
            <Text style={styles.detailText}>Tamanho: {ride.size}</Text>
            <Text style={styles.detailText}>Peso: {ride.weight}kg</Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={styles.acceptButton}
        onPress={() => onAccept(ride)}
      >
        <Text style={styles.acceptButtonText}>Aceitar Solicitação</Text>
      </TouchableOpacity>
    </View>
  );
};

const DriverDashboardScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rides, setRides] = useState([]);
  const [cityFilter, setCityFilter] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Dados mockados para exemplo
  const mockRides = [
    {
      id: '1',
      isProduct: false,
      originAddress: 'Rua A, 123 - Centro',
      destinationAddress: 'Rua B, 456 - Jardins',
      price: 50.0,
      city: 'São Paulo',
    },
    {
      id: '2',
      isProduct: true,
      originAddress: 'Av X, 789 - Vila Nova',
      destinationAddress: 'Av Y, 321 - Morumbi',
      price: 35.0,
      description: 'Caixa de papelão',
      size: '30x40x50 cm',
      weight: '5',
      city: 'São Paulo',
    },
  ];

  useEffect(() => {
    loadRides();
  }, []);

  const loadRides = async () => {
    try {
      // Aqui será implementada a lógica de carregamento das solicitações do backend
      // Por enquanto, usando dados mockados
      setTimeout(() => {
        setRides(mockRides);
        setLoading(false);
        setRefreshing(false);
      }, 1000);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar as solicitações');
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleAcceptRide = async (ride) => {
    try {
      // Aqui será implementada a lógica de aceitar a solicitação
      Alert.alert(
        'Confirmar',
        `Deseja aceitar esta solicitação de ${ride.isProduct ? 'transporte de produto' : 'passageiro'}?`,
        [
          {
            text: 'Cancelar',
            style: 'cancel',
          },
          {
            text: 'Aceitar',
            onPress: async () => {
              // Simular aceite da solicitação
              Alert.alert(
                'Sucesso',
                'Solicitação aceita com sucesso!',
                [
                  {
                    text: 'OK',
                    onPress: () => navigation.navigate('Map')
                  }
                ]
              );
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível aceitar a solicitação');
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadRides();
  };

  const filteredRides = cityFilter
    ? rides.filter(ride => 
        ride.city.toLowerCase().includes(cityFilter.toLowerCase())
      )
    : rides;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.filterContainer}>
        <TextInput
          style={styles.filterInput}
          placeholder="Filtrar por cidade"
          value={cityFilter}
          onChangeText={setCityFilter}
        />
      </View>

      <FlatList
        data={filteredRides}
        renderItem={({ item }) => (
          <RideCard
            ride={item}
            onAccept={handleAcceptRide}
          />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              Nenhuma solicitação encontrada
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.walletButton}
        onPress={() => navigation.navigate('Payment')}
      >
        <Text style={styles.walletButtonText}>Minha Carteira</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterInput: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  listContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardType: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  cardPrice: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2563EB',
  },
  cardBody: {
    marginBottom: 16,
  },
  addressContainer: {
    marginBottom: 8,
  },
  addressLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 16,
    color: '#1F2937',
  },
  productDetails: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 4,
  },
  acceptButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
  },
  walletButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  walletButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DriverDashboardScreen;