const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const { isDriver, validateRequiredFields, asyncHandler } = require('../middleware/authMiddleware');

// Atualizar status de disponibilidade do motorista
router.put('/availability',
  isDriver,
  validateRequiredFields(['isAvailable']),
  asyncHandler(async (req, res) => {
    try {
      const { isAvailable } = req.body;

      await admin.firestore()
        .collection('users')
        .doc(req.user.uid)
        .update({
          isAvailable,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

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

// Atualizar localização atual do motorista
router.put('/location',
  isDriver,
  validateRequiredFields(['latitude', 'longitude']),
  asyncHandler(async (req, res) => {
    try {
      const { latitude, longitude } = req.body;

      await admin.firestore()
        .collection('users')
        .doc(req.user.uid)
        .update({
          currentLocation: {
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          }
        });

      res.json({
        success: true,
        message: 'Localização atualizada com sucesso'
      });
    } catch (error) {
      console.error('Erro ao atualizar localização:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao atualizar localização'
      });
    }
  })
);

// Buscar estatísticas do motorista
router.get('/stats',
  isDriver,
  asyncHandler(async (req, res) => {
    try {
      const ridesSnapshot = await admin.firestore()
        .collection('rides')
        .where('driverId', '==', req.user.uid)
        .where('status', '==', 'completed')
        .get();

      const totalRides = ridesSnapshot.size;
      let totalEarnings = 0;

      ridesSnapshot.forEach(doc => {
        totalEarnings += doc.data().price;
      });

      // Calcular média de avaliações
      const ratingsSnapshot = await admin.firestore()
        .collection('ratings')
        .where('driverId', '==', req.user.uid)
        .get();

      let averageRating = 0;
      if (ratingsSnapshot.size > 0) {
        let totalRating = 0;
        ratingsSnapshot.forEach(doc => {
          totalRating += doc.data().rating;
        });
        averageRating = totalRating / ratingsSnapshot.size;
      }

      res.json({
        success: true,
        data: {
          totalRides,
          totalEarnings,
          averageRating,
          totalRatings: ratingsSnapshot.size
        }
      });
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar estatísticas'
      });
    }
  })
);

// Buscar avaliações do motorista
router.get('/ratings',
  isDriver,
  asyncHandler(async (req, res) => {
    try {
      const snapshot = await admin.firestore()
        .collection('ratings')
        .where('driverId', '==', req.user.uid)
        .orderBy('createdAt', 'desc')
        .limit(50)
        .get();

      const ratings = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      res.json({
        success: true,
        data: ratings
      });
    } catch (error) {
      console.error('Erro ao buscar avaliações:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar avaliações'
      });
    }
  })
);

// Atualizar preferências de notificação
router.put('/notification-preferences',
  isDriver,
  validateRequiredFields(['preferences']),
  asyncHandler(async (req, res) => {
    try {
      const { preferences } = req.body;

      await admin.firestore()
        .collection('users')
        .doc(req.user.uid)
        .update({
          notificationPreferences: preferences,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

      res.json({
        success: true,
        message: 'Preferências atualizadas com sucesso'
      });
    } catch (error) {
      console.error('Erro ao atualizar preferências:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao atualizar preferências'
      });
    }
  })
);

// Atualizar área de atuação
router.put('/service-area',
  isDriver,
  validateRequiredFields(['cities']),
  asyncHandler(async (req, res) => {
    try {
      const { cities } = req.body;

      if (!Array.isArray(cities) || cities.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Forneça pelo menos uma cidade'
        });
      }

      await admin.firestore()
        .collection('users')
        .doc(req.user.uid)
        .update({
          serviceCities: cities,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

      res.json({
        success: true,
        message: 'Área de atuação atualizada com sucesso'
      });
    } catch (error) {
      console.error('Erro ao atualizar área de atuação:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao atualizar área de atuação'
      });
    }
  })
);

// Buscar corridas próximas baseadas na localização atual
router.get('/nearby-rides',
  isDriver,
  asyncHandler(async (req, res) => {
    try {
      const { maxDistance } = req.query;
      const distance = parseInt(maxDistance) || 10; // distância em km

      // Buscar localização atual do motorista
      const driverDoc = await admin.firestore()
        .collection('users')
        .doc(req.user.uid)
        .get();

      const driverLocation = driverDoc.data().currentLocation;

      if (!driverLocation) {
        return res.status(400).json({
          success: false,
          message: 'Localização atual não disponível'
        });
      }

      // Buscar corridas pendentes
      const ridesSnapshot = await admin.firestore()
        .collection('rides')
        .where('status', '==', 'pending')
        .get();

      // Filtrar corridas por distância
      const nearbyRides = [];
      ridesSnapshot.forEach(doc => {
        const ride = doc.data();
        if (ride.originLocation) {
          const rideDistance = calculateDistance(
            driverLocation.latitude,
            driverLocation.longitude,
            ride.originLocation.latitude,
            ride.originLocation.longitude
          );

          if (rideDistance <= distance) {
            nearbyRides.push({
              id: doc.id,
              distance: rideDistance,
              ...ride
            });
          }
        }
      });

      // Ordenar por distância
      nearbyRides.sort((a, b) => a.distance - b.distance);

      res.json({
        success: true,
        data: nearbyRides
      });
    } catch (error) {
      console.error('Erro ao buscar corridas próximas:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar corridas próximas'
      });
    }
  })
);

// Função auxiliar para calcular distância entre coordenadas
function calculateDistance(lat1, lon1, lat2, lon2) {
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
  return R * c;
}

function toRad(value) {
  return (value * Math.PI) / 180;
}

module.exports = router;