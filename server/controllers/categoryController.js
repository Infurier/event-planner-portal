const { Category } = require('../models');

exports.getAll = async (req, res) => {
  try {
    const categories = await Category.findAll({ order: [['name', 'ASC']] });
    res.json({ categories });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch categories.' });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, description, icon } = req.body;
    const existingCategory = await Category.findOne({ where: { name } });
    if (existingCategory) {
      return res.status(400).json({
        message: 'A category with this name already exists.',
        errors: { name: 'Category names must be unique.' }
      });
    }

    const category = await Category.create({ name, description, icon });
    res.status(201).json({ message: 'Category created.', category });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create category.' });
  }
};

exports.update = async (req, res) => {
  try {
    const { name } = req.body;
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found.' });
    if (name && name !== category.name) {
      const existingCategory = await Category.findOne({ where: { name } });
      if (existingCategory && existingCategory.id !== category.id) {
        return res.status(400).json({
          message: 'A category with this name already exists.',
          errors: { name: 'Category names must be unique.' }
        });
      }
    }

    await category.update(req.body);
    res.json({ message: 'Category updated.', category });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update category.' });
  }
};

exports.remove = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found.' });
    await category.destroy();
    res.json({ message: 'Category deleted.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete category.' });
  }
};
