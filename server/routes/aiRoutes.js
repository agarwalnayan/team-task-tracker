const express = require('express');
const router = express.Router();
const AIService = require('../services/aiService');
const Task = require('../models/Task');
const Team = require('../models/Team');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { 
  aiRateLimiter, 
  circuitBreaker, 
  aiCacheMiddleware,
  aiQueueMiddleware 
} = require('../middleware/aiRateLimiter');

// Apply protection to all AI routes
router.use(protect);
router.use(aiRateLimiter);

// 🎯 Get AI Task Suggestions with cache
router.get('/suggestions', 
  circuitBreaker('suggestions'),
  aiCacheMiddleware((req) => `suggestions:${req.user._id}`),
  asyncHandler(async (req, res) => {
    const userTasks = await Task.find({ createdBy: req.user._id }).populate('team');
    const userTeams = await Team.find({ 'members.user': req.user._id }).populate('members.user');
    
    const userContext = {
      name: req.user.name,
      company: req.user.company,
      totalTasks: userTasks.length,
      completedTasks: userTasks.filter(t => t.status === 'completed').length,
      teams: userTeams.map(t => t.name)
    };

    try {
      const suggestions = await req.aiQueue?.enqueue(async () => {
        return await AIService.getTaskSuggestions(userContext, userTasks);
      }) || await AIService.getTaskSuggestions(userContext, userTasks);
      
      req.circuitBreaker?.recordSuccess();
      res.json({ success: true, data: suggestions });
    } catch (error) {
      req.circuitBreaker?.recordFailure();
      // Fallback: return basic suggestions
      res.json({
        success: true,
        data: {
          suggestions: [
            { title: 'Review pending tasks', priority: 'medium', reason: 'Based on your workload' },
            { title: 'Complete high priority tasks first', priority: 'high', reason: 'Priority-based suggestion' }
          ],
          fallback: true
        },
        warning: 'AI service temporarily unavailable. Showing basic suggestions.'
      });
    }
  }));

// 🚀 Prioritize Tasks with queue
router.post('/prioritize', 
  circuitBreaker('prioritize'),
  aiQueueMiddleware(1),
  asyncHandler(async (req, res) => {
    const { taskIds, userGoals } = req.body;
    
    const tasks = await Task.find({ 
      _id: { $in: taskIds },
      $or: [{ createdBy: req.user._id }, { team: { $in: await Team.find({ 'members.user': req.user._id }).distinct('_id') } }]
    });

    if (tasks.length === 0) {
      return res.status(400).json({ success: false, message: 'No tasks found' });
    }

    try {
      const prioritizedTasks = await req.aiQueue.enqueue(async () => {
        return await AIService.prioritizeTasks(tasks, userGoals);
      });
      
      req.circuitBreaker?.recordSuccess();
      res.json({ success: true, data: prioritizedTasks });
    } catch (error) {
      req.circuitBreaker?.recordFailure();
      // Fallback: return tasks sorted by due date and priority
      const sortedTasks = tasks.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        if (priorityOrder[b.priority] !== priorityOrder[a.priority]) {
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        return new Date(a.dueDate || '9999') - new Date(b.dueDate || '9999');
      }).map(task => ({
        ...task.toObject(),
        priorityScore: task.priority === 'high' ? 9 : task.priority === 'medium' ? 6 : 3,
        reasoning: 'Fallback: Sorted by priority and due date'
      }));
      
      res.json({
        success: true,
        data: sortedTasks,
        fallback: true,
        warning: 'AI service temporarily unavailable. Using basic prioritization.'
      });
    }
  }));

// 💬 Parse Natural Language Task with circuit breaker
router.post('/parse-task',
  circuitBreaker('parse-task'),
  aiQueueMiddleware(2), // Higher priority for parsing
  asyncHandler(async (req, res) => {
    const { text } = req.body;
    
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Text is required' });
    }
    
    if (text.length > 1000) {
      return res.status(400).json({ success: false, message: 'Text too long (max 1000 characters)' });
    }

    try {
      const parsedTask = await req.aiQueue.enqueue(async () => {
        return await AIService.parseTaskFromText(text);
      });
      
      req.circuitBreaker?.recordSuccess();
      res.json({ success: true, data: parsedTask });
    } catch (error) {
      req.circuitBreaker?.recordFailure();
      
      // Fallback: basic parsing
      const fallbackParsed = {
        title: text.slice(0, 50) + (text.length > 50 ? '...' : ''),
        description: text,
        priority: 'medium',
        dueDate: null,
        dueDateText: null,
        tags: [],
        assignedToName: null,
        teamName: null,
        estimatedHours: null,
        fallback: true
      };
      
      // Try to extract basic info with regex
      const priorityMatch = text.match(/\b(high|medium|low)\s+priority\b/i);
      if (priorityMatch) fallbackParsed.priority = priorityMatch[1].toLowerCase();
      
      const nameMatch = text.match(/\b(assign|give|to)\s+(?:task\s+)?(?:to\s+)?([A-Z][a-z]+)\b/i);
      if (nameMatch) fallbackParsed.assignedToName = nameMatch[2];
      
      res.json({
        success: true,
        data: fallbackParsed,
        warning: 'AI service temporarily unavailable. Using basic parsing.',
        fallback: true
      });
    }
  }));

// Get Team Member Recommendations with circuit breaker
router.post('/recommend-members',
  circuitBreaker('recommend-members'),
  aiQueueMiddleware(1),
  asyncHandler(async (req, res) => {
    const { taskId } = req.body;
    
    if (!taskId) {
      return res.status(400).json({ success: false, message: 'Task ID is required' });
    }
    
    const task = await Task.findById(taskId).populate('team');
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Verify user has access to this task
    const userTeams = await Team.find({ 'members.user': req.user._id });
    if (!userTeams.some(t => t._id.toString() === task.team._id.toString()) && 
        task.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    try {
      const teamMembers = task.team.members;
      const validMembers = teamMembers.filter(m => m.user);
      
      const recommendations = await req.aiQueue.enqueue(async () => {
        return await AIService.recommendTeamMembers(task, validMembers);
      });
      
      req.circuitBreaker?.recordSuccess();
      res.json({ success: true, data: recommendations });
    } catch (error) {
      req.circuitBreaker?.recordFailure();
      // Fallback: return all valid members with default scores
      const fallbackRecommendations = task.team.members
        .filter(m => m.user)
        .slice(0, 3)
        .map(m => ({
          memberId: m.user._id,
          score: 70,
          reason: 'Team member (fallback mode)'
        }));
      
      res.json({
        success: true,
        data: fallbackRecommendations,
        fallback: true,
        warning: 'AI service temporarily unavailable. Showing all team members.'
      });
    }
  }));

// 🏷️ Auto-categorize Task
router.post('/categorize', asyncHandler(async (req, res) => {
  const { taskId } = req.body;
  
  const task = await Task.findById(taskId);
  if (!task) {
    return res.status(404).json({ message: 'Task not found' });
  }

  // Verify access
  const userTeams = await Team.find({ 'members.user': req.user._id }).distinct('_id');
  if (!userTeams.includes(task.team) && task.createdBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Access denied' });
  }

  const categorization = await AIService.categorizeTask(task);
  
  // Update task with AI suggestions
  task.category = categorization.category;
  task.tags = [...(task.tags || []), ...categorization.tags];
  task.complexity = categorization.estimatedComplexity;
  await task.save();

  res.json(categorization);
}));

// 📊 Get Progress Summary
router.get('/summary/:timeRange', asyncHandler(async (req, res) => {
  const timeRange = req.params.timeRange || 'week';
  
  const userTeams = await Team.find({ 'members.user': req.user._id }).distinct('_id');
  const tasks = await Task.find({
    $or: [
      { createdBy: req.user._id },
      { team: { $in: userTeams } },
      { assignedTo: req.user._id }
    ],
    createdAt: {
      $gte: timeRange === 'week' ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) :
             timeRange === 'month' ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) :
             new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    }
  });

  const summary = await AIService.generateProgressSummary(tasks, timeRange);
  res.json(summary);
}));

// 📊 Get Progress Summary (default)
router.get('/summary', asyncHandler(async (req, res) => {
  const timeRange = 'week';
  
  const userTeams = await Team.find({ 'members.user': req.user._id }).distinct('_id');
  const tasks = await Task.find({
    $or: [
      { createdBy: req.user._id },
      { team: { $in: userTeams } },
      { assignedTo: req.user._id }
    ],
    createdAt: {
      $gte: timeRange === 'week' ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) :
             timeRange === 'month' ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) :
             new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    }
  });

  const summary = await AIService.generateProgressSummary(tasks, timeRange);
  res.json(summary);
}));

// ⚡ Get Quick Insights
router.get('/insights', asyncHandler(async (req, res) => {
  const userTeams = await Team.find({ 'members.user': req.user._id }).distinct('_id');
  
  const userTasks = await Task.find({
    $or: [
      { createdBy: req.user._id },
      { assignedTo: req.user._id }
    ]
  });

  const teamTasks = await Task.find({
    team: { $in: userTeams }
  });

  const insights = await AIService.getQuickInsights(userTasks, teamTasks);
  res.json(insights);
}));

// 🎯 Create AI-Enhanced Task with full protection
router.post('/create-task',
  circuitBreaker('create-task'),
  aiQueueMiddleware(3), // Highest priority for task creation
  asyncHandler(async (req, res) => {
    const { text, teamId: providedTeamId, assignedTo: providedAssignedTo } = req.body;
  
    // Parse natural language with queue
    let parsedTask;
    try {
      parsedTask = await req.aiQueue.enqueue(async () => {
        return await AIService.parseTaskFromText(text);
      });
    } catch (parseError) {
      req.circuitBreaker?.recordFailure();
      console.error('AI Parse Error:', parseError);
      // Use fallback parsing
      parsedTask = {
        title: text.slice(0, 50),
        description: text,
        priority: 'medium',
        dueDate: null,
        dueDateText: null,
        tags: [],
        assignedToName: null,
        teamName: null,
        estimatedHours: null,
        fallback: true
      };
    }
    
    // Smart user lookup by name
    let assignedTo = null;
    let assigneeFound = false;
    
    if (parsedTask.assignedToName) {
      const searchName = parsedTask.assignedToName.trim().toLowerCase();
      const allUsers = await User.find({}, 'name email');
      
      // Smart matching: exact match
      let assignee = allUsers.find(u => u.name.trim().toLowerCase() === searchName);
      
      // First name match (e.g., "ashish" matches "Ashish Sha")
      if (!assignee) {
        assignee = allUsers.find(u => {
          const userNameLower = u.name.trim().toLowerCase();
          const firstName = userNameLower.split(' ')[0];
          return firstName === searchName;
        });
      }
      
      // Partial match: starts with or contains
      if (!assignee) {
        assignee = allUsers.find(u => {
          const userNameLower = u.name.trim().toLowerCase();
          return userNameLower.startsWith(searchName + ' ') ||
                 userNameLower.includes(searchName);
        });
      }
      
      if (assignee) {
        assignedTo = assignee._id;
        assigneeFound = true;
        console.log(`✅ Found assignee: ${assignee.name} (ID: ${assignee._id}) for search: "${searchName}"`);
      } else {
        console.log(`❌ User not found for: "${searchName}"`);
        return res.status(400).json({
          success: false,
          message: `User "${parsedTask.assignedToName}" not found. Available users: ${allUsers.map(u => u.name).join(', ')}`,
          error: 'USER_NOT_FOUND',
          aiParsed: { assignedToName: parsedTask.assignedToName }
        });
      }
    }
    
    // Smart team lookup by name
    let finalTeamId = null;
    if (parsedTask.teamName) {
      const team = await Team.findOne({
        name: { $regex: new RegExp(parsedTask.teamName.replace('team', '').trim(), 'i') }
      });
      if (team) {
        finalTeamId = team._id;
      }
    }
    
    // If still no assignee, require explicit assignment
    if (!assignedTo && !finalTeamId) {
      return res.status(400).json({
        success: false,
        message: 'Please mention who to assign this task to. Example: "Ask Nayan to..." or "Assign to the Sales team..."',
        error: 'ASSIGNEE_REQUIRED',
        aiParsed: parsedTask
      });
    }
    
    // If team but no assignee, assign to creator
    if (!assignedTo && finalTeamId) {
      assignedTo = req.user._id;
    }
    
    // Validate and set due date
    let dueDate = null;
    if (parsedTask.dueDate && parsedTask.dueDate !== 'Invalid Date') {
      const dateObj = new Date(parsedTask.dueDate);
      if (!isNaN(dateObj.getTime())) {
        dueDate = dateObj;
      }
    }
    
    // Get AI categorization
    let categorization;
    try {
      categorization = await req.aiQueue.enqueue(async () => {
        return await AIService.categorizeTask(parsedTask);
      });
      req.circuitBreaker?.recordSuccess();
    } catch (catError) {
      console.error('AI Categorization Error:', catError);
      // Fallback categorization
      categorization = {
        category: 'general',
        tags: parsedTask.fallback ? ['ai-fallback'] : ['general'],
        estimatedComplexity: 'medium'
      };
    }
    
    // Create the task with AI analysis
    const task = await Task.create({
      title: parsedTask.title,
      description: parsedTask.description || text,
      priority: parsedTask.priority || 'medium',
      category: categorization.category,
      tags: categorization.tags,
      complexity: categorization.estimatedComplexity,
      dueDate: dueDate,
      assignedTo: assignedTo,
      createdBy: req.user._id,
      team: finalTeamId || undefined,
      aiGenerated: true,
      aiFallback: parsedTask.fallback || req.circuitBreaker?.state === 'OPEN',
      aiAnalysis: parsedTask.aiAnalysis || null,
      estimatedHours: parsedTask.estimatedHours || null
    });

    // Get AI recommendations for team members if team task
    let recommendations = [];
    if (finalTeamId) {
      const team = await Team.findById(finalTeamId).populate('members.user');
      // Filter out members with null users
      const validMembers = team.members.filter(m => m.user);
      recommendations = await AIService.recommendTeamMembers(task, validMembers);
    }

    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('team', 'name');

    res.json({
      success: true,
      task: populatedTask,
      aiInsights: {
        parsedFrom: text,
        detectedAssignee: parsedTask.assignedToName,
        detectedTeam: parsedTask.teamName,
        aiAnalysis: parsedTask.aiAnalysis,
        category: categorization.category,
        complexity: categorization.estimatedComplexity,
        recommendations
      }
    });
  }));

// 🔍 Smart Search with circuit breaker
router.post('/search',
  circuitBreaker('search'),
  aiQueueMiddleware(1),
  asyncHandler(async (req, res) => {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({ success: false, message: 'Search query is required' });
    }

    try {
      // Get user's accessible tasks
      const userTeams = await Team.find({ 'members.user': req.user._id }).distinct('_id');
      const allTasks = await Task.find({
        $or: [
          { createdBy: req.user._id },
          { team: { $in: userTeams } },
          { assignedTo: req.user._id }
        ]
      }).populate('team assignedTo');

      const searchResults = await req.aiQueue.enqueue(async () => {
        return await AIService.smartSearch(query, allTasks);
      });
      
      req.circuitBreaker?.recordSuccess();
      res.json({ success: true, data: searchResults });
    } catch (error) {
      req.circuitBreaker?.recordFailure();
      // Fallback: basic text search
      const userTeams = await Team.find({ 'members.user': req.user._id }).distinct('_id');
      const allTasks = await Task.find({
        $or: [
          { createdBy: req.user._id },
          { team: { $in: userTeams } },
          { assignedTo: req.user._id }
        ]
      }).populate('team assignedTo');
      
      const fallbackResults = allTasks.filter(task => 
        task.title.toLowerCase().includes(query.toLowerCase()) ||
        task.description?.toLowerCase().includes(query.toLowerCase())
      ).map(task => ({ ...task.toObject(), relevanceScore: 0.8 }));
      
      res.json({
        success: true,
        data: fallbackResults,
        fallback: true,
        warning: 'AI service temporarily unavailable. Using basic search.'
      });
    }
  }));

// 📊 AI Rate Limit Status
router.get('/status', (req, res) => {
  const { getRateLimitStatus } = require('../middleware/aiRateLimiter');
  const status = getRateLimitStatus(req.user?._id?.toString() || req.ip);
  
  res.json({
    success: true,
    rateLimit: status,
    aiService: 'available'
  });
});

module.exports = router;
