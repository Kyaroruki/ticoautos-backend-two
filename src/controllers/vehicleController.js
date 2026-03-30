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

// Este endpoint devuelve el detalle de un solo vehiculo.
const getVehicleDetail = async (req, res) => {
	try {
		const vehicle = await Vehicle.findByIdWithOwner(req.params.id);
		if (!vehicle) {
			return res.status(404).end();
		}
		res.json(vehicle);
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

const listVehicles = async (req, res) => {
	try {
		// Leemos filtros y parametros de pagina desde la query string.
		const { brand, model, minYear, maxYear, minPrice, maxPrice, status, page = 1, limit = 6 } = req.query;

		// Arrancamos con un filtro vacio y lo vamos armando segun lo que venga.
		const filter = {};
		// Si viene marca, filtramos por marca exacta.
		if (brand) filter.brand = brand;
		// Si viene modelo, filtramos por modelo exacto.
		if (model) filter.model = model;
		// Si viene status, filtramos por estado.
		if (status) filter.status = status;
		// Si viene rango de anio, construimos el objeto year.
		if (minYear || maxYear) {
			filter.year = {};
			// $gte significa mayor o igual.
			if (minYear) filter.year.$gte = Number(minYear);
			// $lte significa menor o igual.
			if (maxYear) filter.year.$lte = Number(maxYear);
		}
		// Si viene rango de precio, construimos el objeto price.
		if (minPrice || maxPrice) {
			filter.price = {};
			// Precio minimo.
			if (minPrice) filter.price.$gte = Number(minPrice);
			// Precio maximo.
			if (maxPrice) filter.price.$lte = Number(maxPrice);
		}

		// skip calcula cuantos documentos brincar antes de devolver la pagina actual.
		const skip = (Number(page) - 1) * Number(limit);

		// Contamos cuantos vehiculos cumplen el filtro para saber el total real.
		const total = await Vehicle.countWithFilters(filter);

		// Traemos la pagina de vehiculos aplicando filtro, skip, limit y orden.
		const vehicles = await Vehicle.listWithFilters(filter, skip, Number(limit));

		// Respondemos con datos y metadatos de paginacion.
		res.json({
			vehicles,
			total,
			page: Number(page),
			pages: Math.ceil(total / Number(limit))
		});
	} catch (error) {
		// Error interno si algo falla en el listado.
		res.status(500).end();
	}
};

// Este endpoint trae solo los vehiculos del usuario autenticado.
const getMyVehicles = async (req, res) => {
	try {
		// Filtramos por owner igual al usuario actual y populamos nombre del dueño.
		const vehicles = await Vehicle.find({ owner: req.user._id }).populate('owner', 'name');
		// Mandamos el arreglo de vehiculos.
		res.json(vehicles);
	} catch (error) {
		// Error interno si la consulta falla.
		res.status(500).end();
	}
};

// Exportamos todas las funciones para que las rutas puedan usarlas.
module.exports = {
	listVehicles,
	getVehicleDetail,
	createVehicle,
	updateVehicle,
	deleteVehicle,
	markAsSold,
	getMyVehicles
};
