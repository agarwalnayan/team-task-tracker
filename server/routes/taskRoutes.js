const express = require('express')
const router = express.Router()
const {createTask,getTasks,getTaskById,updateTask,deleteTask,addComment,uploadAttachment} = require('../controllers/taskController')
const { protect } = require('../middleware/authMiddleware')
const upload = require('../config/multer')

router.use(protect)

router.route('/')
  .get(getTasks)
  .post(createTask)

router.route('/:id')
  .get(getTaskById)
  .put(updateTask)
  .delete(deleteTask)

router.post('/:id/comments', addComment)

router.post('/:id/upload', upload.single('file'), uploadAttachment)

module.exports = router