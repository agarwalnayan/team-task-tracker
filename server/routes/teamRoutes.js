const express = require('express')
const router = express.Router()
const { createTeam,getMyTeams,getTeamById,addMember,removeMember} = require('../controllers/teamController')
const { protect } = require('../middleware/auth')

router.use(protect)

router.route('/')
  .get(getMyTeams)
  .post(createTeam)

router.route('/:id')
  .get(getTeamById)

router.post('/:id/members', addMember)
router.delete('/:id/members/:userId', removeMember)

module.exports = router