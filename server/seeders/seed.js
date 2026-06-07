const { User, Category } = require('../models');
const bcrypt = require('bcryptjs');

const seed = async () => {
  try {
    
    const adminExists = await User.findOne({ where: { email: 'admin@eventplanner.com' } });
    if (!adminExists) {
      await User.create({
        name: 'Admin',
        email: 'admin@eventplanner.com',
        password: 'admin123',
        phone: '9999999999',
        role: 'admin'
      });
      console.log('✅ Admin user created (admin@eventplanner.com / admin123)');
    }

    
    const categories = [
      { name: 'Venue', description: 'Event venues and halls', icon: '🏛️' },
      { name: 'Catering', description: 'Food and beverage services', icon: '🍽️' },
      { name: 'Photography', description: 'Photography and videography', icon: '📸' },
      { name: 'Decoration', description: 'Event decoration services', icon: '🎨' },
      { name: 'Music', description: 'DJ and music entertainment', icon: '🎵' },
      { name: 'Makeup', description: 'Makeup and styling artists', icon: '💄' },
      { name: 'Transportation', description: 'Transport and logistics', icon: '🚗' },
      { name: 'Planning', description: 'Full event planning services', icon: '📋' }
    ];

    for (const cat of categories) {
      await Category.findOrCreate({ where: { name: cat.name }, defaults: cat });
    }
    console.log('✅ Categories seeded');

    console.log('🎉 Seeding completed!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  }
};

module.exports = seed;


if (require.main === module) {
  const { sequelize } = require('../models');
  sequelize.sync().then(() => seed()).then(() => process.exit(0));
}
