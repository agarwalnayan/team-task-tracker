const express = require('express')
const router = express.Router()
const {createTask,getTasks,getTaskById,updateTask,deleteTask,addComment} = require('../controllers/taskController')
const { protect } = require('../middleware/authMiddleware')

router.use(protect)

router.route('/')
  .get(getTasks)
  .post(createTask)

router.route('/:id')
  .get(getTaskById)
  .put(updateTask)
  .delete(deleteTask)

router.post('/:id/comments', addComment)

module.exports = router