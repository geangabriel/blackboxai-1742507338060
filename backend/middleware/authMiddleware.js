const admin = require('firebase-admin');

const authMiddleware = async (req, res, next) => {
  try {
    // Verifica se o token está presente no header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token de autenticação não fornecido'
      });
    }

    // Extrai o token do header
    const token = authHeader.split('Bearer ')[1];

    try {
      // Verifica e decodifica o token
      const decodedToken = await admin.auth().verifyIdToken(token);
      
      // Busca informações adicionais do usuário no Firestore
      const userDoc = await admin.firestore()
        .collection('users')
        .doc(decodedToken.uid)
        .get();

      if (!userDoc.exists) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }

      // Adiciona as informações do usuário ao objeto da requisição
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        ...userDoc.data()
      };

      // Verifica se o usuário está ativo
      if (req.user.status === 'inactive') {
        return res.status(403).json({
          success: false,
          message: 'Usuário inativo'
        });
      }

      next();
    } catch (error) {
      console.error('Erro ao verificar token:', error);
      
      if (error.code === 'auth/id-token-expired') {
        return res.status(401).json({
          success: false,
          message: 'Token expirado'
        });
      }

      if (error.code === 'auth/id-token-revoked') {
        return res.status(401).json({
          success: false,
          message: 'Token revogado'
        });
      }

      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }
  } catch (error) {
    console.error('Erro no middleware de autenticação:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Middleware para verificar se o usuário é motorista
const isDriver = (req, res, next) => {
  if (!req.user || req.user.type !== 'driver') {
    return res.status(403).json({
      success: false,
      message: 'Acesso permitido apenas para motoristas'
    });
  }
  next();
};

// Middleware para verificar se o usuário é um usuário comum
const isUser = (req, res, next) => {
  if (!req.user || req.user.type !== 'user') {
    return res.status(403).json({
      success: false,
      message: 'Acesso permitido apenas para usuários'
    });
  }
  next();
};

// Middleware para verificar se o usuário é o proprietário do recurso
const isOwner = (resourcePath) => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params.id;
      if (!resourceId) {
        return res.status(400).json({
          success: false,
          message: 'ID do recurso não fornecido'
        });
      }

      const resourceDoc = await admin.firestore()
        .collection(resourcePath)
        .doc(resourceId)
        .get();

      if (!resourceDoc.exists) {
        return res.status(404).json({
          success: false,
          message: 'Recurso não encontrado'
        });
      }

      if (resourceDoc.data().userId !== req.user.uid) {
        return res.status(403).json({
          success: false,
          message: 'Acesso não autorizado a este recurso'
        });
      }

      req.resource = resourceDoc.data();
      next();
    } catch (error) {
      console.error('Erro ao verificar propriedade do recurso:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  };
};

// Middleware para validar campos obrigatórios
const validateRequiredFields = (requiredFields) => {
  return (req, res, next) => {
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Campos obrigatórios não fornecidos',
        missingFields
      });
    }
    
    next();
  };
};

// Middleware para limitar requisições
const rateLimit = {
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // limite de 100 requisições por windowMs
};

// Middleware para logging
const requestLogger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
};

// Middleware para tratamento de erros assíncrono
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  authMiddleware,
  isDriver,
  isUser,
  isOwner,
  validateRequiredFields,
  rateLimit,
  requestLogger,
  asyncHandler
};