const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicleController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/upload');

// Ruta protegida para crear un vehiculo con una imagen en el campo image.
router.post('/', authMiddleware, upload.single('image'), vehicleController.createVehicle);
// Ruta protegida para editar un vehiculo existente.
router.put('/:id', authMiddleware, upload.single('image'), vehicleController.updateVehicle);
// Ruta protegida para eliminar un vehiculo.
router.delete('/:id', authMiddleware, vehicleController.deleteVehicle);
// Ruta protegida para marcar un vehiculo como vendido.
router.patch('/:id/sold', authMiddleware, vehicleController.markAsSold);

module.exports = router;
