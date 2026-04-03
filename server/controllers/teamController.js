const Team = require('../models/Team')
const User = require('../models/User')

const createTeam = async (req, res) => {
  const { name, description } = req.body

  try {
    const team = await Team.create({
      name,
      description,
      createdBy: req.user._id,
      members: [
        {
          user: req.user._id,
          role: 'admin'
        }
      ]
    })

    res.status(201).json(team)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const getMyTeams = async (req, res) => {
  try {
    const teams = await Team.find({
      'members.user': req.user._id
    })
      .populate('createdBy', 'name email')
      .populate('members.user', 'name email')

    res.json(teams)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const getTeamById = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('members.user', 'name email')

    if (!team) {
      return res.status(404).json({ message: 'Team not found' })
    }

    const isMember = team.members.some(
      m => m.user._id.toString() === req.user._id.toString()
    )

    if (!isMember) {
      return res.status(403).json({ message: 'Not authorized to view this team' })
    }

    res.json(team)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const addMember = async (req, res) => {
  const { email } = req.body

  try {
    const team = await Team.findById(req.params.id)

    if (!team) {
      return res.status(404).json({ message: 'Team not found' })
    }

    const isAdmin = team.members.some(
      m => m.user.toString() === req.user._id.toString() && m.role === 'admin'
    )

    if (!isAdmin) {
      return res.status(403).json({ message: 'Only admins can add members' })
    }

    const userToAdd = await User.findOne({ email })

    if (!userToAdd) {
      return res.status(404).json({ message: 'User not found' })
    }

    const alreadyMember = team.members.some(
      m => m.user.toString() === userToAdd._id.toString()
    )

    if (alreadyMember) {
      return res.status(400).json({ message: 'User is already a member' })
    }

    team.members.push({
      user: userToAdd._id,
      role: 'member'
    })

    await team.save()
    res.json(team)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const removeMember = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)

    if (!team) {
      return res.status(404).json({ message: 'Team not found' })
    }

    const isAdmin = team.members.some(
      m => m.user.toString() === req.user._id.toString() && m.role === 'admin'
    )

    if (!isAdmin) {
      return res.status(403).json({ message: 'Only admins can remove members' })
    }

    team.members = team.members.filter(
      m => m.user.toString() !== req.params.userId
    )

    await team.save()
    res.json(team)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

module.exports = {createTeam,getMyTeams,getTeamById,addMember,removeMember}