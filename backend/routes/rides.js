const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const { isDriver, isUser, isOwner, validateRequiredFields, asyncHandler } = require('../middleware/authMiddleware');

// Criar nova solicitação de transporte
router.post('/',
  isUser,
  validateRequiredFields(['originAddress', 'destinationAddress', 'price', 'isProduct']),
  asyncHandler(async (req, res) => {
    try {
      const {
        originAddress,
        destinationAddress,
        price,
        isProduct,
        description,
        size,
        weight
      } = req.body;

      // Validações específicas para produto
      if (isProduct && (!description || !size || !weight)) {
        return res.status(400).json({
          success: false,
          message: 'Detalhes do produto são obrigatórios'
        });
      }

      // Cria a solicitação no Firestore
      const rideData = {
        userId: req.user.uid,
        userName: req.user.name,
        userPhone: req.user.phone,
        originAddress,
        destinationAddress,
        price: parseFloat(price),
        isProduct,
        status: 'pending',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      // Adiciona detalhes do produto se necessário
      if (isProduct) {
        rideData.product = {
          description,
          size,
          weight: parseFloat(weight)
        };
      }

      const rideRef = await admin.firestore()
        .collection('rides')
        .add(rideData);

      res.status(201).json({
        success: true,
        message: 'Solicitação criada com sucesso',
        data: {
          id: rideRef.id,
          ...rideData
        }
      });
    } catch (error) {
      console.error('Erro ao criar solicitação:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao criar solicitação'
      });
    }
  })
);

// Listar solicitações disponíveis (para motoristas)
router.get('/available',
  isDriver,
  asyncHandler(async (req, res) => {
    try {
      const { city } = req.query;

      let query = admin.firestore()
        .collection('rides')
        .where('status', '==', 'pending');

      if (city) {
        query = query.where('city', '==', city);
      }

      const snapshot = await query
        .orderBy('createdAt', 'desc')
        .limit(50)
        .get();

      const rides = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      res.json({
        success: true,
        data: rides
      });
    } catch (error) {
      console.error('Erro ao listar solicitações:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao listar solicitações'
      });
    }
  })
);

// Aceitar uma solicitação (motorista)
router.post('/:id/accept',
  isDriver,
  asyncHandler(async (req, res) => {
    try {
      const { id } = req.params;

      const rideRef = admin.firestore().collection('rides').doc(id);
      const rideDoc = await rideRef.get();

      if (!rideDoc.exists) {
        return res.status(404).json({
          success: false,
          message: 'Solicitação não encontrada'
        });
      }

      const rideData = rideDoc.data();

      if (rideData.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Solicitação não está mais disponível'
        });
      }

      // Atualiza o status da solicitação
      await rideRef.update({
        status: 'accepted',
        driverId: req.user.uid,
        driverName: req.user.name,
        driverPhone: req.user.phone,
        acceptedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      res.json({
        success: true,
        message: 'Solicitação aceita com sucesso'
      });
    } catch (error) {
      console.error('Erro ao aceitar solicitação:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao aceitar solicitação'
      });
    }
  })
);

// Atualizar status da solicitação
router.put('/:id/status',
  asyncHandler(async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['in_progress', 'completed', 'cancelled'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Status inválido'
        });
      }

      const rideRef = admin.firestore().collection('rides').doc(id);
      const rideDoc = await rideRef.get();

      if (!rideDoc.exists) {
        return res.status(404).json({
          success: false,
          message: 'Solicitação não encontrada'
        });
      }

      const rideData = rideDoc.data();

      // Verifica permissões
      if (req.user.type === 'driver' && rideData.driverId !== req.user.uid) {
        return res.status(403).json({
          success: false,
          message: 'Não autorizado'
        });
      }

      if (req.user.type === 'user' && rideData.userId !== req.user.uid) {
        return res.status(403).json({
          success: false,
          message: 'Não autorizado'
        });
      }

      // Atualiza o status
      const updateData = {
        status,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      if (status === 'completed') {
        updateData.completedAt = admin.firestore.FieldValue.serverTimestamp();
        
        // Atualiza a carteira do motorista
        const driverWalletRef = admin.firestore()
          .collection('wallets')
          .doc(rideData.driverId);

        await admin.firestore().runTransaction(async (transaction) => {
          const walletDoc = await transaction.get(driverWalletRef);
          const currentBalance = walletDoc.exists ? walletDoc.data().balance : 0;
          
          transaction.set(driverWalletRef, {
            balance: currentBalance + rideData.price,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          }, { merge: true });
        });
      }

      await rideRef.update(updateData);

      res.json({
        success: true,
        message: 'Status atualizado com sucesso'
      });
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao atualizar status'
      });
    }
  })
);

// Buscar detalhes de uma solicitação
router.get('/:id',
  asyncHandler(async (req, res) => {
    try {
      const { id } = req.params;

      const rideDoc = await admin.firestore()
        .collection('rides')
        .doc(id)
        .get();

      if (!rideDoc.exists) {
        return res.status(404).json({
          success: false,
          message: 'Solicitação não encontrada'
        });
      }

      const rideData = rideDoc.data();

      // Verifica permissões
      if (req.user.type === 'user' && rideData.userId !== req.user.uid) {
        return res.status(403).json({
          success: false,
          message: 'Não autorizado'
        });
      }

      res.json({
        success: true,
        data: {
          id: rideDoc.id,
          ...rideData
        }
      });
    } catch (error) {
      console.error('Erro ao buscar solicitação:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar solicitação'
      });
    }
  })
);

// Listar histórico de solicitações do usuário
router.get('/history/user',
  isUser,
  asyncHandler(async (req, res) => {
    try {
      const snapshot = await admin.firestore()
        .collection('rides')
        .where('userId', '==', req.user.uid)
        .orderBy('createdAt', 'desc')
        .limit(50)
        .get();

      const rides = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      res.json({
        success: true,
        data: rides
      });
    } catch (error) {
      console.error('Erro ao listar histórico:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao listar histórico'
      });
    }
  })
);

// Listar histórico de corridas do motorista
router.get('/history/driver',
  isDriver,
  asyncHandler(async (req, res) => {
    try {
      const snapshot = await admin.firestore()
        .collection('rides')
        .where('driverId', '==', req.user.uid)
        .orderBy('createdAt', 'desc')
        .limit(50)
        .get();

      const rides = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      res.json({
        success: true,
        data: rides
      });
    } catch (error) {
      console.error('Erro ao listar histórico:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao listar histórico'
      });
    }
  })
);

module.exports = router;