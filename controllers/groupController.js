const Group = require('../models/Group');
const User = require('../models/User');

const createGroup = async (req, res) => {
  try {
    const { name, description } = req.body;
    const group = await Group.create({ name, description, members: [req.user.id] });
    res.json({ group });
  } catch (err) {
    res.status(500).json({ error: 'Create group failed', details: err.message });
  }
};

const updateGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const group = await Group.findByIdAndUpdate(id, { name, description }, { new: true });
    res.json({ group });
  } catch (err) {
    res.status(500).json({ error: 'Update group failed', details: err.message });
  }
};

const deleteGroup = async (req, res) => {
  try {
    const { id } = req.params;
    await Group.findByIdAndDelete(id);
    res.json({ message: 'Group deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Delete group failed', details: err.message });
  }
};

const inviteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, username } = req.body;
    const group = await Group.findById(id);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    group.invites.push({ email, username });
    await group.save();
    res.json({ message: 'User invited', group });
  } catch (err) {
    res.status(500).json({ error: 'Invite failed', details: err.message });
  }
};

const searchGroups = async (req, res) => {
  try {
    const { q } = req.query;
    const groups = await Group.find({ name: { $regex: q, $options: 'i' } });
    res.json({ groups });
  } catch (err) {
    res.status(500).json({ error: 'Search failed', details: err.message });
  }
};

module.exports = { createGroup, updateGroup, deleteGroup, inviteUser, searchGroups }; 