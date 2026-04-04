const Task = require('../models/Task')
const Team = require('../models/Team')

/** Assignee must be self or share at least one team with the assigner (enforced server-side). */
const assigneeSharesTeamWith = async (assignerId, assigneeId) => {
  if (String(assignerId) === String(assigneeId)) return true
  const team = await Team.findOne({
    $and: [
      { 'members.user': assignerId },
      { 'members.user': assigneeId }
    ]
  })
    .select('_id')
    .lean()
  return !!team
}

const createTask = async (req, res) => {
  const { title, description, status, assignedTo, dueDate } = req.body

  try {
    if (assignedTo) {
      const allowed = await assigneeSharesTeamWith(req.user._id, assignedTo)
      if (!allowed) {
        return res.status(400).json({
          message:
            'You can only assign tasks to yourself or people who are in a team with you.'
        })
      }
    }

    const task = await Task.create({
      title,
      description,
      status,
      assignedTo,
      dueDate,
      createdBy: req.user._id
    })

    res.status(201).json(task)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const getTasks = async (req, res) => {
  try {
    const { status, assignedTo, search } = req.query

    const accessible = {
      $or: [
        { createdBy: req.user._id },
        { assignedTo: req.user._id }
      ]
    }

    const conditions = [accessible]
    if (status) conditions.push({ status })
    if (assignedTo) conditions.push({ assignedTo })
    if (search) conditions.push({ title: { $regex: search, $options: 'i' } })

    const filter = conditions.length === 1 ? conditions[0] : { $and: conditions }

    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })

    res.json(tasks)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('comments.createdBy', 'name email')

    if (!task) {
      return res.status(404).json({ message: 'Task not found' })
    }

    res.json(task)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const updateTask = async (req, res) => {
  const { title, description, status, assignedTo, dueDate } = req.body

  try {
    const task = await Task.findById(req.params.id)

    if (!task) {
      return res.status(404).json({ message: 'Task not found' })
    }

    if (task.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this task' })
    }

    task.title = title || task.title
    task.description = description || task.description
    task.status = status || task.status
    if (assignedTo !== undefined) {
      const nextAssignee =
        assignedTo === '' || assignedTo === null ? null : assignedTo
      if (nextAssignee) {
        const allowed = await assigneeSharesTeamWith(req.user._id, nextAssignee)
        if (!allowed) {
          return res.status(400).json({
            message:
              'You can only assign tasks to yourself or people who are in a team with you.'
          })
        }
      }
      task.assignedTo = nextAssignee
    }
    task.dueDate = dueDate || task.dueDate

    await task.save()
    const updatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
    res.json(updatedTask)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)

    if (!task) {
      return res.status(404).json({ message: 'Task not found' })
    }

    if (task.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this task' })
    }

    await task.deleteOne()
    res.json({ message: 'Task deleted successfully' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const addComment = async (req, res) => {
  const { text } = req.body

  try {
    const task = await Task.findById(req.params.id)

    if (!task) {
      return res.status(404).json({ message: 'Task not found' })
    }

    task.comments.push({
      text,
      createdBy: req.user._id
    })

    await task.save()
    res.status(201).json(task)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const uploadAttachment = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)

    if (!task) {
      return res.status(404).json({ message: 'Task not found' })
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' })
    }

    task.attachments.push({
      filename: req.file.originalname,
      path: req.file.path
    })

    await task.save()
    res.status(201).json(task)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

module.exports = {createTask,getTasks,getTaskById,updateTask,deleteTask,addComment,uploadAttachment}