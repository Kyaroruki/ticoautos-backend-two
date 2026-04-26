const Vehicle = require('../models/Vehicle');

// Este endpoint crea un vehiculo nuevo.
const createVehicle = async (req, res) => {
	try {
		const { brand, model, year, price, description, status } = req.body;
		if (!brand || !model || !year || !price || !description) {
			return res.status(400).end();
		}
		const image = req.file ? req.file.filename : '';

		const vehicle = new Vehicle({
			brand,
			model,
			year,
			price,
			description,
			status: status || 'available',
			owner: req.user._id,
			date: new Date(),
			image
		});
		await vehicle.save();
		res.status(201).json(vehicle);
	} catch (error) {
		res.status(500).end();
	}
};

// Este endpoint edita un vehiculo existente.
const updateVehicle = async (req, res) => {
	try {
		const vehicle = await Vehicle.findByIdWithOwner(req.params.id);
		if (!vehicle) {
			return res.status(404).end();
		}
		if (vehicle.owner._id.toString() !== req.user.id) {
			return res.status(403).end();
		}
		const { brand, model, year, price, description, status } = req.body;
		
		vehicle.brand = brand || vehicle.brand;
		vehicle.model = model || vehicle.model;
		vehicle.year = year || vehicle.year;
		vehicle.price = price || vehicle.price;
		vehicle.description = description !== undefined ? description : vehicle.description;
		vehicle.status = 'available';
		void status;
		// Si suben una nueva imagen, reemplazamos el nombre del archivo.
		if (req.file) vehicle.image = req.file.filename;

		await vehicle.save();

		res.json(vehicle);
	} catch (error) {
		console.error('Error al editar vehiculo:', error);
		res.status(500).end();
	}
};

// Este endpoint elimina un vehiculo.
const deleteVehicle = async (req, res) => {
	try {

		const vehicle = await Vehicle.findByIdWithOwner(req.params.id);

		if (!vehicle) {
			return res.status(404).end();
		}
		if (vehicle.owner._id.toString() !== req.user.id) {
			return res.status(403).end();
		}
		await vehicle.deleteOne();

		res.status(204).end();
	} catch (error) {
		res.status(500).end();
	}
};

// Este endpoint marca un vehiculo como vendido.
const markAsSold = async (req, res) => {
	try {

		const vehicle = await Vehicle.findByIdWithOwner(req.params.id);

		if (!vehicle) {
			return res.status(404).end();
		}

		if (vehicle.owner._id.toString() !== req.user._id.toString()) {
			return res.status(403).end();
		}

		vehicle.status = 'sold';

		await vehicle.save();

		res.status(204).end();
	} catch (error) {
		res.status(500).end();
	}
};

// Exportamos todas las funciones para que las rutas puedan usarlas.
module.exports = {
	createVehicle,
	updateVehicle,
	deleteVehicle,
	markAsSold
};
