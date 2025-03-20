// Cores do tema
export const COLORS = {
  primary: {
    main: '#2563EB',
    light: '#60A5FA',
    dark: '#1E40AF',
    contrast: '#FFFFFF',
  },
  secondary: {
    main: '#6B7280',
    light: '#9CA3AF',
    dark: '#4B5563',
    contrast: '#FFFFFF',
  },
  success: {
    main: '#059669',
    light: '#34D399',
    dark: '#065F46',
    contrast: '#FFFFFF',
  },
  error: {
    main: '#DC2626',
    light: '#F87171',
    dark: '#991B1B',
    contrast: '#FFFFFF',
  },
  warning: {
    main: '#D97706',
    light: '#FBBF24',
    dark: '#92400E',
    contrast: '#FFFFFF',
  },
  info: {
    main: '#2563EB',
    light: '#60A5FA',
    dark: '#1E40AF',
    contrast: '#FFFFFF',
  },
  background: {
    default: '#F3F4F6',
    paper: '#FFFFFF',
  },
  text: {
    primary: '#1F2937',
    secondary: '#4B5563',
    disabled: '#9CA3AF',
  },
  divider: '#E5E7EB',
};

// Status das solicitações
export const RIDE_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

// Tipos de usuário
export const USER_TYPES = {
  DRIVER: 'driver',
  USER: 'user',
};

// Tipos de transporte
export const TRANSPORT_TYPES = {
  PERSON: 'person',
  PRODUCT: 'product',
};

// Mensagens de erro
export const ERROR_MESSAGES = {
  REQUIRED_FIELD: 'Este campo é obrigatório',
  INVALID_EMAIL: 'E-mail inválido',
  INVALID_PASSWORD: 'A senha deve ter pelo menos 6 caracteres',
  PASSWORDS_DONT_MATCH: 'As senhas não coincidem',
  INVALID_PHONE: 'Telefone inválido',
  INVALID_AMOUNT: 'Valor inválido',
  INSUFFICIENT_BALANCE: 'Saldo insuficiente',
  LOCATION_PERMISSION_DENIED: 'Permissão de localização negada',
  GENERIC_ERROR: 'Ocorreu um erro. Tente novamente.',
  NETWORK_ERROR: 'Erro de conexão. Verifique sua internet.',
};

// Mensagens de sucesso
export const SUCCESS_MESSAGES = {
  PROFILE_UPDATED: 'Perfil atualizado com sucesso',
  RIDE_REQUESTED: 'Solicitação enviada com sucesso',
  RIDE_ACCEPTED: 'Solicitação aceita com sucesso',
  RIDE_COMPLETED: 'Corrida finalizada com sucesso',
  WITHDRAWAL_REQUESTED: 'Solicitação de saque realizada com sucesso',
};

// Configurações do mapa
export const MAP_CONFIG = {
  DEFAULT_LATITUDE: -23.550520, // São Paulo
  DEFAULT_LONGITUDE: -46.633308,
  DEFAULT_LATITUDE_DELTA: 0.0922,
  DEFAULT_LONGITUDE_DELTA: 0.0421,
  DEFAULT_ZOOM: 15,
};

// Configurações de paginação
export const PAGINATION = {
  ITEMS_PER_PAGE: 10,
};

// Formatos de data
export const DATE_FORMATS = {
  DISPLAY: 'DD/MM/YYYY',
  DISPLAY_WITH_TIME: 'DD/MM/YYYY HH:mm',
  API: 'YYYY-MM-DD',
  API_WITH_TIME: 'YYYY-MM-DDTHH:mm:ss',
};

// Expressões regulares para validação
export const REGEX = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\d{10,11}$/,
  PASSWORD: /^.{6,}$/,
};

// Configurações de animação
export const ANIMATION = {
  DURATION: 300,
};

// Configurações de timeout
export const TIMEOUTS = {
  API_REQUEST: 30000, // 30 segundos
  LOCATION_REQUEST: 10000, // 10 segundos
};

// Configurações de armazenamento local
export const STORAGE_KEYS = {
  USER_DATA: '@TransporteApp:user',
  AUTH_TOKEN: '@TransporteApp:token',
  SETTINGS: '@TransporteApp:settings',
};

// Configurações de notificação
export const NOTIFICATION_CONFIG = {
  CHANNEL_ID: 'transport_app_channel',
  CHANNEL_NAME: 'Transporte App Notificações',
  CHANNEL_DESCRIPTION: 'Notificações do Transporte App',
};

// URLs da API
export const API_ENDPOINTS = {
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  PROFILE: '/user/profile',
  RIDES: '/rides',
  WALLET: '/wallet',
  TRANSACTIONS: '/transactions',
};

// Configurações de upload de imagem
export const IMAGE_CONFIG = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png'],
  COMPRESSION_QUALITY: 0.5,
};

// Configurações de geolocalização
export const GEOLOCATION_CONFIG = {
  ENABLE_HIGH_ACCURACY: true,
  TIMEOUT: 20000,
  MAXIMUM_AGE: 1000,
};

// Configurações de cache
export const CACHE_CONFIG = {
  MAX_AGE: 3600, // 1 hora
};

export default {
  COLORS,
  RIDE_STATUS,
  USER_TYPES,
  TRANSPORT_TYPES,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  MAP_CONFIG,
  PAGINATION,
  DATE_FORMATS,
  REGEX,
  ANIMATION,
  TIMEOUTS,
  STORAGE_KEYS,
  NOTIFICATION_CONFIG,
  API_ENDPOINTS,
  IMAGE_CONFIG,
  GEOLOCATION_CONFIG,
  CACHE_CONFIG,
};