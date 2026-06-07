const path = require('path');
const fs = require('fs');
const { Contract, Booking, Event, Service, Vendor, User, Category } = require('../models');
const { generateContractPDF } = require('../utils/contractGenerator');

exports.generateContract = async (bookingId) => {
  try {
    
    const existing = await Contract.findOne({ where: { bookingId } });
    if (existing) return existing;

    const booking = await Booking.findByPk(bookingId, {
      include: [
        { model: Event, as: 'event' },
        { model: Service, as: 'service' },
        { model: Vendor, as: 'vendor', include: [
          { model: User, as: 'user', attributes: ['name', 'email', 'phone'] },
          { model: Category, as: 'category' }
        ]},
        { model: User, as: 'user', attributes: ['name', 'email', 'phone'] }
      ]
    });

    if (!booking) throw new Error('Booking not found');

    const contractNumber = `EP-${new Date().getFullYear()}-${String(bookingId).padStart(5, '0')}`;
    const total = Number(booking.amount);
    const advance = Math.round(total * 0.5);

    const contractData = {
      contractNumber,
      bookingId: booking.id,
      bookingDate: booking.bookingDate,
      clientName: booking.user.name,
      clientEmail: booking.user.email,
      vendorName: booking.vendor.user.name,
      vendorPhone: booking.vendor.phone || booking.vendor.user.phone,
      businessName: booking.vendor.businessName,
      eventName: booking.event.name,
      eventDate: booking.event.date,
      eventLocation: booking.event.location,
      guestCount: booking.event.guestCount,
      serviceCategory: booking.vendor.category?.name,
      serviceName: booking.service.name,
      serviceDescription: booking.service.description,
      packageTier: booking.service.packageTier,
      totalCost: total,
      createdAt: new Date()
    };

    const filePath = await generateContractPDF(contractData);

    const contract = await Contract.create({
      bookingId: booking.id,
      contractNumber,
      filePath,
      clientName: booking.user.name,
      vendorName: booking.vendor.user.name,
      businessName: booking.vendor.businessName,
      eventName: booking.event.name,
      eventDate: booking.event.date,
      eventLocation: booking.event.location,
      serviceCategory: booking.vendor.category?.name,
      serviceName: booking.service.name,
      serviceDescription: booking.service.description,
      totalCost: total,
      advanceAmount: advance,
      remainingAmount: total - advance
    });

    return contract;
  } catch (error) {
    console.error('Contract generation failed:', error);
    throw error;
  }
};


const findOrCreateContract = async (bookingId, userId, userRole) => {
  let contract = await Contract.findOne({ where: { bookingId } });

  
  if (!contract || !fs.existsSync(contract.filePath)) {
    
    if (contract) await contract.destroy();
    const booking = await Booking.findByPk(bookingId);
    if (!booking) return { error: 'Booking not found.', status: 404 };
    if (booking.status !== 'confirmed' && booking.status !== 'completed') {
      return { error: 'Contract is only available for confirmed or completed bookings.', status: 400 };
    }
    contract = await exports.generateContract(bookingId);
  }

  
  const booking = await Booking.findByPk(contract.bookingId);
  const vendor = await Vendor.findOne({ where: { userId } });
  const isClient = booking.userId === userId;
  const isVendor = vendor && booking.vendorId === vendor.id;
  if (!isClient && !isVendor && userRole !== 'admin') {
    return { error: 'Not authorized.', status: 403 };
  }

  return { contract };
};

exports.getContract = async (req, res) => {
  try {
    const result = await findOrCreateContract(req.params.bookingId, req.user.id, req.user.role);
    if (result.error) return res.status(result.status).json({ message: result.error });
    res.json({ contract: result.contract });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch contract.' });
  }
};

exports.downloadContract = async (req, res) => {
  try {
    const result = await findOrCreateContract(req.params.bookingId, req.user.id, req.user.role);
    if (result.error) return res.status(result.status).json({ message: result.error });

    if (!fs.existsSync(result.contract.filePath)) {
      return res.status(404).json({ message: 'Contract file not found on server.' });
    }

    res.download(result.contract.filePath, `Contract_${result.contract.contractNumber}.pdf`);
  } catch (error) {
    res.status(500).json({ message: 'Failed to download contract.' });
  }
};

exports.viewContractPDF = async (req, res) => {
  try {
    const result = await findOrCreateContract(req.params.bookingId, req.user.id, req.user.role);
    if (result.error) return res.status(result.status).json({ message: result.error });

    if (!fs.existsSync(result.contract.filePath)) {
      return res.status(404).json({ message: 'Contract file not found.' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=Contract_${result.contract.contractNumber}.pdf`);
    fs.createReadStream(result.contract.filePath).pipe(res);
  } catch (error) {
    res.status(500).json({ message: 'Failed to view contract.' });
  }
};
