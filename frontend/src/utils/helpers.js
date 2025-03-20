import { REGEX, ERROR_MESSAGES } from './constants';

// Formatação de moeda
export const formatCurrency = (value) => {
  if (!value && value !== 0) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

// Formatação de data
export const formatDate = (date, format = 'default') => {
  if (!date) return '';
  
  const d = new Date(date);
  
  switch (format) {
    case 'short':
      return d.toLocaleDateString('pt-BR');
    case 'long':
      return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
    case 'withTime':
      return d.toLocaleString('pt-BR');
    default:
      return d.toLocaleDateString('pt-BR');
  }
};

// Formatação de telefone
export const formatPhone = (phone) => {
  if (!phone) return '';
  
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  
  return cleaned;
};

// Validações
export const validateEmail = (email) => {
  if (!email) return ERROR_MESSAGES.REQUIRED_FIELD;
  if (!REGEX.EMAIL.test(email)) return ERROR_MESSAGES.INVALID_EMAIL;
  return '';
};

export const validatePassword = (password) => {
  if (!password) return ERROR_MESSAGES.REQUIRED_FIELD;
  if (!REGEX.PASSWORD.test(password)) return ERROR_MESSAGES.INVALID_PASSWORD;
  return '';
};

export const validatePhone = (phone) => {
  if (!phone) return ERROR_MESSAGES.REQUIRED_FIELD;
  const cleaned = phone.replace(/\D/g, '');
  if (!REGEX.PHONE.test(cleaned)) return ERROR_MESSAGES.INVALID_PHONE;
  return '';
};

export const validateRequired = (value, fieldName) => {
  if (!value || (typeof value === 'string' && !value.trim())) {
    return `${fieldName} é obrigatório`;
  }
  return '';
};

// Cálculo de distância entre coordenadas
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Raio da Terra em km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return d; // Retorna a distância em km
};

const toRad = (value) => {
  return (value * Math.PI) / 180;
};

// Manipulação de erros
export const handleError = (error) => {
  console.error('Error:', error);
  
  if (error.response) {
    // Erro da resposta do servidor
    return error.response.data.message || ERROR_MESSAGES.GENERIC_ERROR;
  } else if (error.request) {
    // Erro de conexão
    return ERROR_MESSAGES.NETWORK_ERROR;
  } else {
    // Outros erros
    return error.message || ERROR_MESSAGES.GENERIC_ERROR;
  }
};

// Geração de ID único
export const generateUniqueId = () => {
  return Math.random().toString(36).substr(2, 9);
};

// Debounce para otimizar chamadas de função
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Throttle para limitar chamadas de função
export const throttle = (func, limit) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Ordenação de arrays
export const sortArrayByKey = (array, key, order = 'asc') => {
  return array.sort((a, b) => {
    if (order === 'asc') {
      return a[key] > b[key] ? 1 : -1;
    } else {
      return a[key] < b[key] ? 1 : -1;
    }
  });
};

// Filtrar array por texto
export const filterArrayByText = (array, searchText, keys) => {
  if (!searchText) return array;
  
  const lowercaseText = searchText.toLowerCase();
  
  return array.filter(item =>
    keys.some(key =>
      String(item[key]).toLowerCase().includes(lowercaseText)
    )
  );
};

// Agrupar array por chave
export const groupArrayByKey = (array, key) => {
  return array.reduce((acc, item) => {
    const groupKey = item[key];
    if (!acc[groupKey]) {
      acc[groupKey] = [];
    }
    acc[groupKey].push(item);
    return acc;
  }, {});
};

// Truncar texto
export const truncateText = (text, maxLength) => {
  if (!text || text.length <= maxLength) return text;
  return text.substr(0, maxLength) + '...';
};

// Validar tamanho de arquivo
export const validateFileSize = (file, maxSize) => {
  return file.size <= maxSize;
};

// Validar tipo de arquivo
export const validateFileType = (file, allowedTypes) => {
  return allowedTypes.includes(file.type);
};

// Converter base64 para blob
export const base64ToBlob = (base64, type = 'application/octet-stream') => {
  const byteCharacters = atob(base64.split(',')[1]);
  const byteNumbers = new Array(byteCharacters.length);
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type });
};

// Converter blob para base64
export const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// Gerar cor aleatória
export const generateRandomColor = () => {
  return '#' + Math.floor(Math.random()*16777215).toString(16);
};

export default {
  formatCurrency,
  formatDate,
  formatPhone,
  validateEmail,
  validatePassword,
  validatePhone,
  validateRequired,
  calculateDistance,
  handleError,
  generateUniqueId,
  debounce,
  throttle,
  sortArrayByKey,
  filterArrayByText,
  groupArrayByKey,
  truncateText,
  validateFileSize,
  validateFileType,
  base64ToBlob,
  blobToBase64,
  generateRandomColor
};