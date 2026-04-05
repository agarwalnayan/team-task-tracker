const express = require('express')
const router = express.Router()
const { createTeam,getMyTeams,getTeamById,addMember,removeMember,joinByRoomCode,updateMemberRole,regenerateRoomCode,updateTeamSettings,deleteTeam} = require('../controllers/teamController')
const { protect } = require('../middleware/auth')

router.use(protect)

// Specific routes first
router.post('/join-by-code', joinByRoomCode)

router.route('/')
  .get(getMyTeams)
  .post(createTeam)

// Team-specific routes
router.route('/:id')
  .get(getTeamById)
  .put(updateTeamSettings)
  .delete(deleteTeam)

// Member management routes
router.post('/:id/members', addMember)
router.put('/:id/members/:userId', updateMemberRole)
router.delete('/:id/members/:userId', removeMember)

// Team-specific actions
router.post('/:id/regenerate-code', regenerateRoomCode)

module.exports = router