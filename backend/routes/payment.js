const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const { isDriver, validateRequiredFields, asyncHandler } = require('../middleware/authMiddleware');

// Buscar saldo da carteira
router.get('/wallet',
  isDriver,
  asyncHandler(async (req, res) => {
    try {
      const walletDoc = await admin.firestore()
        .collection('wallets')
        .doc(req.user.uid)
        .get();

      const balance = walletDoc.exists ? walletDoc.data().balance : 0;

      res.json({
        success: true,
        data: {
          balance
        }
      });
    } catch (error) {
      console.error('Erro ao buscar saldo:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar saldo'
      });
    }
  })
);

// Solicitar saque
router.post('/withdraw',
  isDriver,
  validateRequiredFields(['amount', 'bankAccount']),
  asyncHandler(async (req, res) => {
    try {
      const { amount, bankAccount } = req.body;

      // Validar valor do saque
      if (isNaN(amount) || amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Valor inválido'
        });
      }

      // Validar dados bancários
      if (!bankAccount.bank || !bankAccount.agency || !bankAccount.account) {
        return res.status(400).json({
          success: false,
          message: 'Dados bancários incompletos'
        });
      }

      // Buscar saldo atual
      const walletRef = admin.firestore().collection('wallets').doc(req.user.uid);
      const walletDoc = await walletRef.get();

      if (!walletDoc.exists || walletDoc.data().balance < amount) {
        return res.status(400).json({
          success: false,
          message: 'Saldo insuficiente'
        });
      }

      // Iniciar transação
      await admin.firestore().runTransaction(async (transaction) => {
        // Criar solicitação de saque
        const withdrawalRef = admin.firestore()
          .collection('withdrawals')
          .doc();

        const withdrawalData = {
          userId: req.user.uid,
          userName: req.user.name,
          amount,
          bankAccount,
          status: 'pending',
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        };

        // Atualizar saldo da carteira
        const currentBalance = walletDoc.data().balance;
        const newBalance = currentBalance - amount;

        // Registrar transação
        const transactionRef = admin.firestore()
          .collection('transactions')
          .doc();

        const transactionData = {
          userId: req.user.uid,
          type: 'withdrawal',
          amount: -amount,
          balance: newBalance,
          description: 'Solicitação de saque',
          status: 'pending',
          withdrawalId: withdrawalRef.id,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        };

        // Executar operações na transação
        transaction.set(withdrawalRef, withdrawalData);
        transaction.set(transactionRef, transactionData);
        transaction.update(walletRef, {
          balance: newBalance,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      });

      res.json({
        success: true,
        message: 'Solicitação de saque realizada com sucesso'
      });
    } catch (error) {
      console.error('Erro ao solicitar saque:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao solicitar saque'
      });
    }
  })
);

// Listar histórico de transações
router.get('/transactions',
  isDriver,
  asyncHandler(async (req, res) => {
    try {
      const { startDate, endDate, type } = req.query;
      
      let query = admin.firestore()
        .collection('transactions')
        .where('userId', '==', req.user.uid);

      // Filtrar por tipo
      if (type) {
        query = query.where('type', '==', type);
      }

      // Filtrar por data
      if (startDate) {
        query = query.where('createdAt', '>=', new Date(startDate));
      }
      if (endDate) {
        query = query.where('createdAt', '<=', new Date(endDate));
      }

      const snapshot = await query
        .orderBy('createdAt', 'desc')
        .limit(50)
        .get();

      const transactions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      res.json({
        success: true,
        data: transactions
      });
    } catch (error) {
      console.error('Erro ao listar transações:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao listar transações'
      });
    }
  })
);

// Buscar status de uma solicitação de saque
router.get('/withdraw/:id',
  isDriver,
  asyncHandler(async (req, res) => {
    try {
      const { id } = req.params;

      const withdrawalDoc = await admin.firestore()
        .collection('withdrawals')
        .doc(id)
        .get();

      if (!withdrawalDoc.exists) {
        return res.status(404).json({
          success: false,
          message: 'Solicitação não encontrada'
        });
      }

      const withdrawalData = withdrawalDoc.data();

      // Verificar se a solicitação pertence ao motorista
      if (withdrawalData.userId !== req.user.uid) {
        return res.status(403).json({
          success: false,
          message: 'Não autorizado'
        });
      }

      res.json({
        success: true,
        data: {
          id: withdrawalDoc.id,
          ...withdrawalData
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

// Cancelar solicitação de saque (apenas se ainda estiver pendente)
router.post('/withdraw/:id/cancel',
  isDriver,
  asyncHandler(async (req, res) => {
    try {
      const { id } = req.params;

      const withdrawalRef = admin.firestore()
        .collection('withdrawals')
        .doc(id);

      const withdrawalDoc = await withdrawalRef.get();

      if (!withdrawalDoc.exists) {
        return res.status(404).json({
          success: false,
          message: 'Solicitação não encontrada'
        });
      }

      const withdrawalData = withdrawalDoc.data();

      // Verificar se a solicitação pertence ao motorista
      if (withdrawalData.userId !== req.user.uid) {
        return res.status(403).json({
          success: false,
          message: 'Não autorizado'
        });
      }

      // Verificar se ainda está pendente
      if (withdrawalData.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Solicitação não pode mais ser cancelada'
        });
      }

      // Iniciar transação para cancelar o saque
      await admin.firestore().runTransaction(async (transaction) => {
        // Atualizar status da solicitação
        transaction.update(withdrawalRef, {
          status: 'cancelled',
          cancelledAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Devolver o valor para a carteira
        const walletRef = admin.firestore()
          .collection('wallets')
          .doc(req.user.uid);
        
        const walletDoc = await transaction.get(walletRef);
        const currentBalance = walletDoc.data().balance;
        
        transaction.update(walletRef, {
          balance: currentBalance + withdrawalData.amount,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Registrar transação de estorno
        const transactionRef = admin.firestore()
          .collection('transactions')
          .doc();

        transaction.set(transactionRef, {
          userId: req.user.uid,
          type: 'withdrawal_cancellation',
          amount: withdrawalData.amount,
          balance: currentBalance + withdrawalData.amount,
          description: 'Cancelamento de solicitação de saque',
          withdrawalId: id,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      });

      res.json({
        success: true,
        message: 'Solicitação cancelada com sucesso'
      });
    } catch (error) {
      console.error('Erro ao cancelar solicitação:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao cancelar solicitação'
      });
    }
  })
);

module.exports = router;