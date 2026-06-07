const { Event, Booking, Service, Vendor } = require('../models');

exports.createEvent = async (req, res) => {
  try {
    const { name, type, date, location, guestCount, budget, description } = req.body;
    const event = await Event.create({
      userId: req.user.id,
      name, type, date, location, guestCount, budget, description,
      checklist: [
        { task: 'Book Venue', completed: false },
        { task: 'Arrange Catering', completed: false },
        { task: 'Hire Photographer', completed: false },
        { task: 'Plan Decorations', completed: false },
        { task: 'Send Invitations', completed: false },
        { task: 'Arrange Music/DJ', completed: false },
        { task: 'Confirm Guest List', completed: false }
      ]
    });
    res.status(201).json({ message: 'Event created.', event });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create event.', error: error.message });
  }
};

exports.getMyEvents = async (req, res) => {
  try {
    const events = await Event.findAll({
      where: { userId: req.user.id },
      include: [{ model: Booking, as: 'bookings', include: [{ model: Service, as: 'service' }, { model: Vendor, as: 'vendor' }] }],
      order: [['date', 'ASC']]
    });
    res.json({ events });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch events.', error: error.message });
  }
};

exports.getEvent = async (req, res) => {
  try {
    const event = await Event.findOne({
      where: { id: req.params.id, userId: req.user.id },
      include: [{ model: Booking, as: 'bookings', include: [{ model: Service, as: 'service' }, { model: Vendor, as: 'vendor' }] }]
    });
    if (!event) return res.status(404).json({ message: 'Event not found.' });
    res.json({ event });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch event.', error: error.message });
  }
};

exports.updateEvent = async (req, res) => {
  try {
    const event = await Event.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!event) return res.status(404).json({ message: 'Event not found.' });
    await event.update(req.body);
    res.json({ message: 'Event updated.', event });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update event.', error: error.message });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!event) return res.status(404).json({ message: 'Event not found.' });
    await event.destroy();
    res.json({ message: 'Event deleted.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete event.', error: error.message });
  }
};

exports.updateChecklist = async (req, res) => {
  try {
    const event = await Event.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!event) return res.status(404).json({ message: 'Event not found.' });
    await event.update({ checklist: req.body.checklist });
    res.json({ message: 'Checklist updated.', event });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update checklist.', error: error.message });
  }
};

const CATEGORY_CHECKLIST_TEMPLATES = {
  1: [
    'Confirm venue booking with {vendor}',
    'Visit venue for walkthrough',
    'Confirm seating arrangement with {vendor}'
  ],
  2: [
    'Finalize menu with {vendor}',
    'Confirm guest count for catering',
    'Arrange food tasting with {vendor}'
  ],
  3: [
    'Share shot list with {vendor}',
    'Confirm pre-event shoot date with {vendor}',
    'Discuss album design with {vendor}'
  ],
  4: [
    'Approve decoration theme with {vendor}',
    'Confirm flower and material selection with {vendor}'
  ],
  5: [
    'Share playlist/song preferences with {vendor}',
    'Confirm sound system setup time with {vendor}'
  ],
  6: [
    'Schedule trial makeup with {vendor}',
    'Confirm bridal look details with {vendor}'
  ],
  7: [
    'Confirm pickup schedule with {vendor}',
    'Confirm decorated car/vehicle details with {vendor}'
  ],
  8: [
    'Final review meeting with {vendor}',
    'Confirm day-of timeline with {vendor}'
  ]
};

exports.getSuggestedChecklist = async (req, res) => {
  try {
    const event = await Event.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!event) return res.status(404).json({ message: 'Event not found.' });

    const { Category } = require('../models');
    const bookings = await Booking.findAll({
      where: { eventId: event.id, status: 'confirmed' },
      include: [
        { model: Vendor, as: 'vendor', include: [{ model: Category, as: 'category' }] }
      ]
    });

    const suggestions = [];
    const existingTasks = (event.checklist || []).map(c => c.task?.toLowerCase().trim());

    for (const booking of bookings) {
      const vendor = booking.vendor;
      if (!vendor) continue;

      const categoryId = vendor.categoryId;
      const vendorName = vendor.businessName || 'Vendor';
      const templates = CATEGORY_CHECKLIST_TEMPLATES[categoryId] || [];

      for (const template of templates) {
        const task = template.replace('{vendor}', vendorName);
        if (!existingTasks.includes(task.toLowerCase().trim())) {
          suggestions.push({
            task,
            vendorName,
            categoryName: vendor.category?.name || 'General',
            categoryId
          });
        }
      }
    }

    res.json({ suggestions });
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate suggestions.', error: error.message });
  }
};
