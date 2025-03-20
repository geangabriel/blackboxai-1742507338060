import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';

const RideRequestScreen = ({ route, navigation }) => {
  const { currentLocation } = route.params;
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    originAddress: '',
    destinationAddress: '',
    isProduct: false, // false para pessoa, true para produto
    description: '',
    size: '',
    weight: '',
    price: '',
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    if (!formData.originAddress || !formData.destinationAddress) {
      Alert.alert('Erro', 'Por favor, preencha os endereços de origem e destino');
      return false;
    }

    if (formData.isProduct) {
      if (!formData.description || !formData.size || !formData.weight) {
        Alert.alert('Erro', 'Por favor, preencha todos os detalhes do produto');
        return false;
      }
    }

    if (!formData.price || isNaN(formData.price) || parseFloat(formData.price) <= 0) {
      Alert.alert('Erro', 'Por favor, insira um valor válido');
      return false;
    }

    return true;
  };

  const handleSubmitRequest = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      // Aqui será implementada a lógica de envio da solicitação para o backend
      const requestData = {
        ...formData,
        userId: user.id,
        currentLocation,
        price: parseFloat(formData.price),
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      // Simular envio para o backend
      setTimeout(() => {
        Alert.alert(
          'Sucesso',
          'Sua solicitação foi enviada com sucesso!',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Map')
            }
          ]
        );
      }, 2000);

    } catch (error) {
      Alert.alert('Erro', 'Não foi possível enviar sua solicitação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tipo de Transporte</Text>
          <View style={styles.typeSelector}>
            <Text style={styles.typeText}>
              {formData.isProduct ? 'Produto' : 'Pessoa'}
            </Text>
            <Switch
              value={formData.isProduct}
              onValueChange={(value) => handleInputChange('isProduct', value)}
              trackColor={{ false: '#767577', true: '#2563EB' }}
              thumbColor={formData.isProduct ? '#FFFFFF' : '#FFFFFF'}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Endereços</Text>
          <TextInput
            style={styles.input}
            placeholder="Endereço de origem"
            value={formData.originAddress}
            onChangeText={(value) => handleInputChange('originAddress', value)}
          />

          <TextInput
            style={styles.input}
            placeholder="Endereço de destino"
            value={formData.destinationAddress}
            onChangeText={(value) => handleInputChange('destinationAddress', value)}
          />
        </View>

        {formData.isProduct && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Detalhes do Produto</Text>
            <TextInput
              style={styles.input}
              placeholder="Descrição do produto"
              value={formData.description}
              onChangeText={(value) => handleInputChange('description', value)}
              multiline
            />

            <TextInput
              style={styles.input}
              placeholder="Tamanho (ex: 30x40x50 cm)"
              value={formData.size}
              onChangeText={(value) => handleInputChange('size', value)}
            />

            <TextInput
              style={styles.input}
              placeholder="Peso aproximado (kg)"
              value={formData.weight}
              onChangeText={(value) => handleInputChange('weight', value)}
              keyboardType="numeric"
            />
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Valor Oferecido</Text>
          <TextInput
            style={styles.input}
            placeholder="R$ 0,00"
            value={formData.price}
            onChangeText={(value) => handleInputChange('price', value)}
            keyboardType="numeric"
          />
        </View>

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmitRequest}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>Solicitar Transporte</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  typeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  typeText: {
    fontSize: 16,
    color: '#4B5563',
  },
  input: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  submitButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RideRequestScreen;