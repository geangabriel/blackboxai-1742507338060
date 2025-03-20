import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredUser();
  }, []);

  async function loadStoredUser() {
    try {
      const storedUser = await AsyncStorage.getItem('@TransporteApp:user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Erro ao carregar usuário:', error);
    } finally {
      setLoading(false);
    }
  }

  async function signIn(userData) {
    try {
      await AsyncStorage.setItem('@TransporteApp:user', JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
      throw new Error('Erro ao fazer login');
    }
  }

  async function signOut() {
    try {
      await AsyncStorage.removeItem('@TransporteApp:user');
      setUser(null);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  }

  async function updateUser(userData) {
    try {
      const newUserData = { ...user, ...userData };
      await AsyncStorage.setItem('@TransporteApp:user', JSON.stringify(newUserData));
      setUser(newUserData);
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
    }
  }

  return (
    <AuthContext.Provider value={{ 
      signed: !!user, 
      user, 
      loading,
      signIn,
      signOut,
      updateUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}