const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const { validateRequiredFields, asyncHandler } = require('../middleware/authMiddleware');

// Registro de novo usuário
router.post('/register', 
  validateRequiredFields(['email', 'password', 'name', 'phone', 'city', 'type']),
  asyncHandler(async (req, res) => {
    try {
      const { email, password, name, phone, city, type, photo } = req.body;

      // Verifica se o tipo de usuário é válido
      if (!['user', 'driver'].includes(type)) {
        return res.status(400).json({
          success: false,
          message: 'Tipo de usuário inválido'
        });
      }

      // Verifica se o e-mail já está em uso
      const existingUser = await admin.auth().getUserByEmail(email)
        .catch(() => null);

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'E-mail já está em uso'
        });
      }

      // Cria o usuário no Authentication
      const userRecord = await admin.auth().createUser({
        email,
        password,
        displayName: name,
        photoURL: photo,
        disabled: false
      });

      // Prepara os dados do usuário para o Firestore
      const userData = {
        uid: userRecord.uid,
        email,
        name,
        phone,
        city,
        type,
        photo,
        status: 'active',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      // Se for motorista, adiciona campos específicos
      if (type === 'driver') {
        userData.rating = 5.0;
        userData.totalRides = 0;
        userData.wallet = {
          balance: 0,
          totalEarnings: 0
        };
      }

      // Salva os dados do usuário no Firestore
      await admin.firestore()
        .collection('users')
        .doc(userRecord.uid)
        .set(userData);

      // Cria um token personalizado
      const token = await admin.auth().createCustomToken(userRecord.uid);

      res.status(201).json({
        success: true,
        message: 'Usuário registrado com sucesso',
        data: {
          user: userData,
          token
        }
      });
    } catch (error) {
      console.error('Erro no registro:', error);

      if (error.code === 'auth/email-already-exists') {
        return res.status(400).json({
          success: false,
          message: 'E-mail já está em uso'
        });
      }

      if (error.code === 'auth/invalid-email') {
        return res.status(400).json({
          success: false,
          message: 'E-mail inválido'
        });
      }

      if (error.code === 'auth/weak-password') {
        return res.status(400).json({
          success: false,
          message: 'Senha muito fraca'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erro ao registrar usuário'
      });
    }
  })
);

// Login
router.post('/login',
  validateRequiredFields(['email', 'password']),
  asyncHandler(async (req, res) => {
    try {
      const { email, password } = req.body;

      // Busca o usuário pelo e-mail
      const userRecord = await admin.auth().getUserByEmail(email);

      // Busca dados adicionais do usuário no Firestore
      const userDoc = await admin.firestore()
        .collection('users')
        .doc(userRecord.uid)
        .get();

      if (!userDoc.exists) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }

      const userData = userDoc.data();

      // Verifica se o usuário está ativo
      if (userData.status === 'inactive') {
        return res.status(403).json({
          success: false,
          message: 'Usuário inativo'
        });
      }

      // Cria um token personalizado
      const token = await admin.auth().createCustomToken(userRecord.uid);

      // Atualiza último login
      await userDoc.ref.update({
        lastLoginAt: admin.firestore.FieldValue.serverTimestamp()
      });

      res.json({
        success: true,
        message: 'Login realizado com sucesso',
        data: {
          user: {
            uid: userRecord.uid,
            ...userData
          },
          token
        }
      });
    } catch (error) {
      console.error('Erro no login:', error);

      if (error.code === 'auth/user-not-found') {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }

      if (error.code === 'auth/wrong-password') {
        return res.status(401).json({
          success: false,
          message: 'Senha incorreta'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erro ao realizar login'
      });
    }
  })
);

// Recuperação de senha
router.post('/forgot-password',
  validateRequiredFields(['email']),
  asyncHandler(async (req, res) => {
    try {
      const { email } = req.body;

      // Verifica se o usuário existe
      await admin.auth().getUserByEmail(email);

      // Envia e-mail de recuperação de senha
      await admin.auth().generatePasswordResetLink(email);

      res.json({
        success: true,
        message: 'E-mail de recuperação de senha enviado'
      });
    } catch (error) {
      console.error('Erro na recuperação de senha:', error);

      if (error.code === 'auth/user-not-found') {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erro ao enviar e-mail de recuperação'
      });
    }
  })
);

// Verificação de token
router.post('/verify-token',
  validateRequiredFields(['token']),
  asyncHandler(async (req, res) => {
    try {
      const { token } = req.body;

      // Verifica o token
      const decodedToken = await admin.auth().verifyIdToken(token);

      // Busca dados do usuário
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

      res.json({
        success: true,
        message: 'Token válido',
        data: {
          user: {
            uid: decodedToken.uid,
            ...userDoc.data()
          }
        }
      });
    } catch (error) {
      console.error('Erro na verificação do token:', error);

      if (error.code === 'auth/id-token-expired') {
        return res.status(401).json({
          success: false,
          message: 'Token expirado'
        });
      }

      res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }
  })
);

module.exports = router;