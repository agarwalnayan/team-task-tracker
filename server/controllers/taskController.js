const Task = require('../models/Task')

const createTask = async (req, res) => {
  const { title, description, status, assignedTo, dueDate } = req.body

  try {
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

    let filter = { createdBy: req.user._id }

    if (status) {
      filter.status = status
    }

    if (assignedTo) {
      filter.assignedTo = assignedTo
    }

    if (search) {
      filter.title = { $regex: search, $options: 'i' }
    }

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
    task.assignedTo = assignedTo || task.assignedTo
    task.dueDate = dueDate || task.dueDate

    const updatedTask = await task.save()
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

module.exports = {createTask,getTasks,getTaskById,updateTask,deleteTask,addComment}