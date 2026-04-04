const express = require('express')
const router = express.Router()
const {createTask,getTasks,getTask,updateTask,deleteTask} = require('../controllers/taskController')
const { protect } = require('../middleware/auth')

router.use(protect)

router.route('/')
  .get(getTasks)
  .post(createTask)

router.route('/:id')
  .get(getTask)
  .put(updateTask)
  .delete(deleteTask)

module.exports = router