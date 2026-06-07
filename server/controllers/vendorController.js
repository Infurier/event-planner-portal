const { Vendor, User, Category, Service, Review, Booking } = require('../models');
const { Op } = require('sequelize');

exports.getAllVendors = async (req, res) => {
  try {
    const { category, city, search, minPrice, maxPrice, minRating, availabilityDate } = req.query;
    const where = { isApproved: true };

    if (category) where.categoryId = category;
    if (city) where.city = { [Op.like]: `%${city}%` };
    if (search) where.businessName = { [Op.like]: `%${search}%` };
    if (minRating) where.rating = { [Op.gte]: parseFloat(minRating) };

    
    const serviceWhere = {};
    if (minPrice) serviceWhere.price = { ...serviceWhere.price, [Op.gte]: minPrice };
    if (maxPrice) serviceWhere.price = { ...serviceWhere.price, [Op.lte]: maxPrice };
    const hasServiceFilter = Object.keys(serviceWhere).length > 0;

    let vendors = await Vendor.findAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['name', 'email', 'avatar'] },
        { model: Category, as: 'category' },
        { model: Service, as: 'services', where: hasServiceFilter ? serviceWhere : undefined, required: hasServiceFilter }
      ],
      order: [['rating', 'DESC']]
    });

    
    if (availabilityDate) {
      const busyVendorIds = (await Booking.findAll({
        where: { bookingDate: availabilityDate, status: 'confirmed' },
        attributes: ['vendorId']
      })).map(b => b.vendorId);
      vendors = vendors.filter(v => !busyVendorIds.includes(v.id));
    }

    res.json({ vendors });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch vendors.' });
  }
};

exports.getVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findByPk(req.params.id, {
      include: [
        { model: User, as: 'user', attributes: ['name', 'email', 'avatar'] },
        { model: Category, as: 'category' },
        { model: Service, as: 'services' },
        { model: Review, as: 'reviews', include: [{ model: User, as: 'user', attributes: ['name', 'avatar'] }] }
      ]
    });
    if (!vendor) return res.status(404).json({ message: 'Vendor not found.' });
    res.json({ vendor });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch vendor.' });
  }
};

exports.checkAvailability = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ message: 'Date is required.' });

    const conflicting = await Booking.findOne({
      where: { vendorId: req.params.id, bookingDate: date, status: 'confirmed' }
    });

    if (conflicting) {
      
      return res.json({ available: false, message: 'Vendor is unavailable on this date.' });
    }

    res.json({ available: true });
  } catch (error) {
    res.status(500).json({ message: 'Failed to check availability.' });
  }
};

exports.getSimilarVendors = async (req, res) => {
  try {
    const vendor = await Vendor.findByPk(req.params.id);
    if (!vendor) return res.status(404).json({ message: 'Vendor not found.' });

    const similar = await Vendor.findAll({
      where: { categoryId: vendor.categoryId, id: { [Op.ne]: vendor.id }, isApproved: true },
      include: [
        { model: User, as: 'user', attributes: ['name'] },
        { model: Category, as: 'category' },
        { model: Service, as: 'services' }
      ],
      order: [['rating', 'DESC']],
      limit: 5
    });

    res.json({ vendors: similar });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch similar vendors.' });
  }
};

exports.updateVendorProfile = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ where: { userId: req.user.id } });
    if (!vendor) return res.status(404).json({ message: 'Vendor profile not found.' });
    await vendor.update(req.body);
    res.json({ message: 'Vendor profile updated.', vendor });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update profile.' });
  }
};

exports.getMyVendorProfile = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({
      where: { userId: req.user.id },
      include: [
        { model: Category, as: 'category' },
        { model: Service, as: 'services' },
        { model: Review, as: 'reviews', include: [{ model: User, as: 'user', attributes: ['name', 'avatar'] }] }
      ]
    });
    if (!vendor) return res.status(404).json({ message: 'Vendor profile not found.' });
    res.json({ vendor });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch profile.' });
  }
};

exports.uploadPortfolioImages = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ where: { userId: req.user.id } });
    if (!vendor) return res.status(404).json({ message: 'Vendor profile not found.' });

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded.' });
    }

    const currentImages = vendor.portfolioImages || [];
    const maxTotal = 10;

    if (currentImages.length + req.files.length > maxTotal) {
      return res.status(400).json({
        message: `You can have up to ${maxTotal} portfolio images. You currently have ${currentImages.length}.`
      });
    }

    const newPaths = req.files.map(f => `/uploads/portfolio/${f.filename}`);
    const updatedImages = [...currentImages, ...newPaths];

    await vendor.update({ portfolioImages: updatedImages });

    res.json({ message: 'Images uploaded.', portfolioImages: updatedImages });
  } catch (error) {
    res.status(500).json({ message: 'Failed to upload images.', error: error.message });
  }
};

exports.deletePortfolioImage = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ where: { userId: req.user.id } });
    if (!vendor) return res.status(404).json({ message: 'Vendor profile not found.' });

    const index = parseInt(req.params.index, 10);
    const currentImages = vendor.portfolioImages || [];

    if (isNaN(index) || index < 0 || index >= currentImages.length) {
      return res.status(400).json({ message: 'Invalid image index.' });
    }

    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(__dirname, '..', currentImages[index]);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    currentImages.splice(index, 1);
    await vendor.update({ portfolioImages: currentImages });

    res.json({ message: 'Image deleted.', portfolioImages: currentImages });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete image.', error: error.message });
  }
};
