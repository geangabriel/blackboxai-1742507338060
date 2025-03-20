const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
const dotenv = require('dotenv');

// Configuração das variáveis de ambiente
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Inicialização do Firebase Admin
const serviceAccount = require('./config/serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET
});

// Importação das rotas
const authRoutes = require('./routes/auth');
const ridesRoutes = require('./routes/rides');
const driverRoutes = require('./routes/driver');
const paymentRoutes = require('./routes/payment');

// Middleware de autenticação
const authMiddleware = require('./middleware/authMiddleware');

// Configuração das rotas
app.use('/api/auth', authRoutes);
app.use('/api/rides', authMiddleware, ridesRoutes);
app.use('/api/driver', authMiddleware, driverRoutes);
app.use('/api/payment', authMiddleware, paymentRoutes);

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Erro interno do servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Rota padrão
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API do Transporte App está funcionando!'
  });
});

// Inicialização do servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});