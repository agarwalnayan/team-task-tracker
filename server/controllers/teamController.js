const Team = require('../models/Team')
const User = require('../models/User')
const Task = require('../models/Task')

const createTeam = async (req, res) => {
  const { name, description, company } = req.body

  try {
    const teamCompany =
      (company && String(company).trim()) ||
      (req.user.company && String(req.user.company).trim()) ||
      undefined

    if (req.user.company && teamCompany && teamCompany !== req.user.company) {
      return res.status(400).json({
        message: 'Team company must match your profile company'
      })
    }

    const team = await Team.create({
      name,
      description,
      company: teamCompany,
      createdBy: req.user._id,
      members: [
        {
          user: req.user._id,
          role: 'admin'
        }
      ]
    })

    const populated = await Team.findById(team._id)
      .populate('createdBy', 'name email company')
      .populate('members.user', 'name email company')

    res.status(201).json(populated)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const getMyTeams = async (req, res) => {
  try {
    const teams = await Team.find({
      'members.user': req.user._id
    })
      .populate('createdBy', 'name email company')
      .populate('members.user', 'name email company')

    res.json(teams)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const getTeamById = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('createdBy', 'name email company')
      .populate('members.user', 'name email company')

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

    if (
      team.company &&
      userToAdd.company &&
      team.company !== userToAdd.company
    ) {
      return res.status(400).json({
        message: 'That user belongs to a different company than this team'
      })
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
    const populated = await Team.findById(team._id)
      .populate('createdBy', 'name email company')
      .populate('members.user', 'name email company')
    res.json(populated)
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
    const populated = await Team.findById(team._id)
      .populate('createdBy', 'name email company')
      .populate('members.user', 'name email company')
    res.json(populated)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const joinByRoomCode = async (req, res) => {
  const { roomCode } = req.body

  try {
    if (!roomCode) {
      return res.status(400).json({ message: 'Room code is required' })
    }

    const team = await Team.findOne({ 
      roomCode: roomCode.toUpperCase(),
      allowJoinByCode: true 
    })
      .populate('createdBy', 'name email')
      .populate('members.user', 'name email')

    if (!team) {
      return res.status(404).json({ message: 'Invalid room code or team not accepting joins' })
    }

    // Check if user is already a member
    const isAlreadyMember = team.members.some(
      m => m.user._id.toString() === req.user._id.toString()
    )

    if (isAlreadyMember) {
      return res.status(400).json({ message: 'You are already a member of this team' })
    }

    // Add user as member
    team.members.push({
      user: req.user._id,
      role: 'member',
      canManageRoles: false
    })

    await team.save()

    // Return updated team
    const updatedTeam = await Team.findById(team._id)
      .populate('createdBy', 'name email')
      .populate('members.user', 'name email')

    res.status(200).json({
      message: 'Successfully joined team',
      team: updatedTeam
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const updateMemberRole = async (req, res) => {
  const { role, canManageRoles } = req.body

  try {
    const team = await Team.findById(req.params.id)

    if (!team) {
      return res.status(404).json({ message: 'Team not found' })
    }

    // Check if current user is admin and can manage roles
    const currentUserMember = team.members.find(
      m => m.user.toString() === req.user._id.toString()
    )

    if (!currentUserMember || currentUserMember.role !== 'admin' || !currentUserMember.canManageRoles) {
      return res.status(403).json({ 
        message: 'Only admins with role management permission can update roles' 
      })
    }

    // Find the member to update
    const memberToUpdate = team.members.find(
      m => m.user.toString() === req.params.userId
    )

    if (!memberToUpdate) {
      return res.status(404).json({ message: 'Member not found' })
    }

    // Don't allow changing the role of the team creator
    if (memberToUpdate.user.toString() === team.createdBy.toString()) {
      return res.status(400).json({ 
        message: 'Cannot change the role of the team creator' 
      })
    }

    // Update the member's role
    memberToUpdate.role = role
    memberToUpdate.canManageRoles = canManageRoles || false

    await team.save()

    const updatedTeam = await Team.findById(team._id)
      .populate('createdBy', 'name email')
      .populate('members.user', 'name email')

    res.json({
      message: 'Member role updated successfully',
      team: updatedTeam
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const regenerateRoomCode = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)

    if (!team) {
      return res.status(404).json({ message: 'Team not found' })
    }

    // Check if user is admin
    const isAdmin = team.members.some(
      m => m.user.toString() === req.user._id.toString() && m.role === 'admin'
    )

    if (!isAdmin) {
      return res.status(403).json({ message: 'Only admins can regenerate room code' })
    }

    // Generate new room code
    let newRoomCode
    do {
      newRoomCode = Math.random().toString(36).substring(2, 8).toUpperCase()
    } while (newRoomCode.includes('O') || newRoomCode.includes('0'))

    team.roomCode = newRoomCode
    await team.save()

    const updatedTeam = await Team.findById(team._id)
      .populate('createdBy', 'name email')
      .populate('members.user', 'name email')

    res.json({
      message: 'Room code regenerated successfully',
      team: updatedTeam
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const updateTeamSettings = async (req, res) => {
  const { allowJoinByCode } = req.body

  try {
    const team = await Team.findById(req.params.id)

    if (!team) {
      return res.status(404).json({ message: 'Team not found' })
    }

    // Check if user is admin
    const isAdmin = team.members.some(
      m => m.user.toString() === req.user._id.toString() && m.role === 'admin'
    )

    if (!isAdmin) {
      return res.status(403).json({ message: 'Only admins can update team settings' })
    }

    team.allowJoinByCode = allowJoinByCode
    await team.save()

    const updatedTeam = await Team.findById(team._id)
      .populate('createdBy', 'name email')
      .populate('members.user', 'name email')

    res.json({
      message: 'Team settings updated successfully',
      team: updatedTeam
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const deleteTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)

    if (!team) {
      return res.status(404).json({ message: 'Team not found' })
    }

    // Check if user is admin and is the team creator
    const isAdmin = team.members.some(
      m => m.user.toString() === req.user._id.toString() && m.role === 'admin'
    )

    if (!isAdmin || team.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only team creators can delete teams' })
    }

    // Delete all tasks associated with this team
    await Task.deleteMany({ team: team._id })

    // Delete the team
    await Team.findByIdAndDelete(team._id)

    res.json({
      message: 'Team deleted successfully'
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

module.exports = {createTeam,getMyTeams,getTeamById,addMember,removeMember,joinByRoomCode,updateMemberRole,regenerateRoomCode,updateTeamSettings,deleteTeam}