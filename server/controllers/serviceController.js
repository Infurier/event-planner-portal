const { Service, Vendor } = require('../models');

exports.addService = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ where: { userId: req.user.id } });
    if (!vendor) return res.status(404).json({ message: 'Vendor profile not found.' });

    const { name, description, price, images } = req.body;
    const service = await Service.create({
      vendorId: vendor.id, name, description, price, images
    });
    res.status(201).json({ message: 'Service added.', service });
  } catch (error) {
    res.status(500).json({ message: 'Failed to add service.', error: error.message });
  }
};

exports.getVendorServices = async (req, res) => {
  try {
    const services = await Service.findAll({
      where: { vendorId: req.params.vendorId },
      include: [{ model: Vendor, as: 'vendor' }]
    });
    res.json({ services });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch services.', error: error.message });
  }
};

exports.getMyServices = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ where: { userId: req.user.id } });
    if (!vendor) return res.status(404).json({ message: 'Vendor profile not found.' });

    const services = await Service.findAll({ where: { vendorId: vendor.id } });
    res.json({ services });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch services.', error: error.message });
  }
};

exports.updateService = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ where: { userId: req.user.id } });
    if (!vendor) return res.status(404).json({ message: 'Vendor profile not found.' });

    const service = await Service.findOne({ where: { id: req.params.id, vendorId: vendor.id } });
    if (!service) return res.status(404).json({ message: 'Service not found.' });

    await service.update(req.body);
    res.json({ message: 'Service updated.', service });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update service.', error: error.message });
  }
};

exports.deleteService = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ where: { userId: req.user.id } });
    if (!vendor) return res.status(404).json({ message: 'Vendor profile not found.' });

    const service = await Service.findOne({ where: { id: req.params.id, vendorId: vendor.id } });
    if (!service) return res.status(404).json({ message: 'Service not found.' });

    await service.destroy();
    res.json({ message: 'Service deleted.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete service.', error: error.message });
  }
};
