const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'AIzaSyDemoKey');

const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
const model = genAI.getGenerativeModel({ model: MODEL_NAME });

console.log(`🤖 Using Gemini model: ${MODEL_NAME}`);

// Helper to clean AI response (remove markdown code blocks)
const cleanAIResponse = (text) => {
  return text
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();
};

// MOCK MODE: Set USE_MOCK_AI=true in .env to test without using API tokens
const USE_MOCK_AI = process.env.USE_MOCK_AI === 'true';
if (USE_MOCK_AI) {
  console.log('🧪 MOCK AI MODE ENABLED - No API calls will be made');
}

class AIService {
  // 🧪 Mock data generators for testing without API tokens
  static getMockSuggestions() {
    return [
      { title: 'Review team progress', description: 'Check current task completion status', priority: 'high', estimatedHours: 2 },
      { title: 'Update documentation', description: 'Update project docs with recent changes', priority: 'medium', estimatedHours: 3 },
      { title: 'Plan next sprint', description: 'Schedule and plan upcoming work', priority: 'high', estimatedHours: 4 }
    ];
  }

  static getMockInsights() {
    return [
      { type: 'productivity', title: 'Productivity Tip', message: 'Try time-blocking to improve focus', priority: 'medium' },
      { type: 'workload', title: 'Workload Balance', message: 'Consider delegating tasks to team members', priority: 'high' },
      { type: 'deadline', title: 'Upcoming Deadlines', message: 'Review tasks due this week', priority: 'high' }
    ];
  }

  static getMockSummary() {
    return {
      overview: 'Good progress this week with steady task completion.',
      completed: 5,
      inProgress: 3,
      insights: ['Maintain current pace', 'Focus on high-priority items']
    };
  }

  static parseMockTask(text) {
    // Enhanced regex-based parsing for mock mode with AI analysis
    const title = text.replace(/(create|assign|ask)( a task)? (for|to) \w+/i, '').replace(/by .+/i, '').trim() || text.substring(0, 50);
    
    // Skip common articles (a, an, the, task, this) and capture the actual name
    // Matches: "assign to ashish...", "ask nayan to...", "for john..."
    const assignedMatch = text.match(/(?:for|to|assign|ask)\s+(?:a\s+|an\s+|the\s+|task\s+|this\s+)?(\w+)/i);
    
    // Try alternative pattern: "assign a task to [name]"
    let assignedToName = assignedMatch ? assignedMatch[1] : null;
    if (!assignedToName || ['a', 'an', 'the', 'task', 'this'].includes(assignedToName.toLowerCase())) {
      const altMatch = text.match(/(?:task\s+)?(?:to|for)\s+(\w+)(?:\s+to\s+|\s+for\s+|\s+by\s+|\s+in\s+|$)/i);
      if (altMatch) {
        assignedToName = altMatch[1];
      }
    }
    
    const teamMatch = text.match(/in\s+(\w+)\s+(?:team|department)/i);
    const dateMatch = text.match(/by\s+(tomorrow|next week|next month|monday|tuesday|wednesday|thursday|friday|saturday|sunday|\w+)/i);
    
    // Smart priority detection
    let priority = 'medium';
    if (text.match(/\b(urgent|asap|critical|emergency|immediately)\b/i)) priority = 'high';
    else if (text.match(/\b(low|minor|whenever|someday)\b/i)) priority = 'low';
    
    // AI Analysis - smart insights
    const urgencyFactors = [];
    if (text.match(/\b(deadline|due|by)\b/i)) urgencyFactors.push('time-sensitive');
    if (text.match(/\b(meeting|presentation|review|board)\b/i)) urgencyFactors.push('meeting dependent');
    if (text.match(/\b(client|customer|vip)\b/i)) urgencyFactors.push('client facing');
    
    // Estimate hours based on task complexity keywords
    let estimatedHours = null;
    if (text.match(/\b(quick|small|simple|fix|update)\b/i)) estimatedHours = 1;
    else if (text.match(/\b(report|analysis|review|documentation)\b/i)) estimatedHours = 4;
    else if (text.match(/\b(project|develop|build|implement|complete)\b/i)) estimatedHours = 8;
    else if (text.match(/\b(research|investigation|complex)\b/i)) estimatedHours = 16;
    
    // Importance analysis
    let importance = 'normal';
    if (text.match(/\b(board meeting|ceo|executive|critical|revenue|client)\b/i)) importance = 'critical';
    else if (text.match(/\b(urgent|important|high priority|asap)\b/i)) importance = 'high';
    else if (text.match(/\b(routine|maintenance|cleanup)\b/i)) importance = 'low';
    
    // Generate reasoning
    let reasoning = '';
    if (importance === 'critical') reasoning = 'High business impact detected - board/executive level task';
    else if (urgencyFactors.length > 0) reasoning = `Urgency factors: ${urgencyFactors.join(', ')}`;
    else if (estimatedHours) reasoning = `Estimated ${estimatedHours} hours based on task complexity`;
    else reasoning = 'Standard task priority';
    
    const result = {
      title: title.charAt(0).toUpperCase() + title.slice(1),
      description: text,
      priority: priority,
      dueDate: dateMatch ? this.calculateDueDate(dateMatch[1]) : null,
      dueDateText: dateMatch ? dateMatch[1] : null,
      tags: this.extractTags(text),
      assignedToName: assignedToName,
      teamName: teamMatch ? teamMatch[1] + ' team' : null,
      estimatedHours: estimatedHours,
      aiAnalysis: {
        estimatedHours: estimatedHours,
        importance: importance,
        urgencyFactors: urgencyFactors,
        reasoning: reasoning,
        suggestedApproach: this.getSuggestedApproach(text)
      }
    };
    
    console.log('🤖 Mock AI parsed:', text, '→', { assignee: assignedToName, title: result.title });
    return result;
  }

  static calculateDueDate(dateText) {
    const today = new Date();
    const lowerText = dateText.toLowerCase();
    
    if (lowerText === 'tomorrow') {
      return new Date(today.setDate(today.getDate() + 1)).toISOString().split('T')[0];
    } else if (lowerText === 'next week') {
      return new Date(today.setDate(today.getDate() + 7)).toISOString().split('T')[0];
    } else if (lowerText === 'next month') {
      return new Date(today.setMonth(today.getMonth() + 1)).toISOString().split('T')[0];
    }
    
    // Try to find day of week
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const targetDay = days.indexOf(lowerText);
    if (targetDay !== -1) {
      const currentDay = today.getDay();
      const daysUntil = (targetDay - currentDay + 7) % 7 || 7;
      return new Date(today.setDate(today.getDate() + daysUntil)).toISOString().split('T')[0];
    }
    
    return null;
  }

  static extractTags(text) {
    const keywords = ['bug', 'feature', 'design', 'marketing', 'sales', 'report', 'meeting', 'client', 'documentation', 'review'];
    const found = keywords.filter(kw => text.toLowerCase().includes(kw));
    return found.length > 0 ? found : ['task', 'ai-generated'];
  }

  static getSuggestedApproach(text) {
    if (text.match(/\b(report|analysis)\b/i)) return 'Start with data gathering, then analysis';
    if (text.match(/\b(fix|bug|issue)\b/i)) return 'Reproduce first, then implement fix';
    if (text.match(/\b(meeting|presentation)\b/i)) return 'Prepare outline, then build slides';
    if (text.match(/\b(research|investigate)\b/i)) return 'Define scope, gather sources, synthesize';
    return 'Break into subtasks and tackle systematically';
  }

  // 🎯 Smart Task Suggestions
  static async getTaskSuggestions(userContext, teamTasks) {
    if (USE_MOCK_AI) return this.getMockSuggestions();
    try {
      const prompt = `
        Based on this user's context and team tasks, suggest 5 relevant tasks:
        
        User Context: ${JSON.stringify(userContext)}
        Recent Team Tasks: ${JSON.stringify(teamTasks.slice(0, 10))}
        
        Return as JSON array with: { title, description, priority, estimatedHours }
      `;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const cleanText = cleanAIResponse(response.text());
      return JSON.parse(cleanText);
    } catch (error) {
      console.error('AI Task Suggestions Error:', error);
      return [];
    }
  }

  // 🚀 Smart Task Prioritization
  static async prioritizeTasks(tasks, userGoals) {
    if (USE_MOCK_AI) return tasks.map((task, i) => ({ ...task, priorityScore: 8 - i, reasoning: 'Mock priority for testing' }));
    try {
      const prompt = `
        Prioritize these tasks based on urgency, importance, and user goals:
        
        Tasks: ${JSON.stringify(tasks)}
        User Goals: ${userGoals || 'Complete work efficiently'}
        
        Return as JSON array with original task + priorityScore (1-10) + reasoning
      `;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const cleanText = cleanAIResponse(response.text());
      return JSON.parse(cleanText);
    } catch (error) {
      console.error('AI Prioritization Error:', error);
      return tasks.map(task => ({ ...task, priorityScore: 5, reasoning: 'Default priority' }));
    }
  }

  // 💬 Natural Language Task Creation - Enhanced with AI Analysis
  static async parseTaskFromText(naturalText) {
    if (USE_MOCK_AI) return this.parseMockTask(naturalText);
    try {
      const prompt = `
        Extract task details and provide AI analysis from this natural language: "${naturalText}"
        
        Today's date: ${new Date().toISOString().split('T')[0]}
        
        Extract and return as JSON:
        {
          "title": "Clear, concise task title (5-10 words)",
          "description": "Full task description with context",
          "priority": "high/medium/low based on urgency and importance",
          "dueDate": "YYYY-MM-DD format or null if not specified",
          "dueDateText": "Original date mentioned (e.g., 'next month', 'Friday')",
          "tags": ["relevant", "tags"],
          "assignedToName": "Person's name mentioned or null",
          "teamName": "Team/department mentioned or null",
          "estimatedHours": number or null,
          "aiAnalysis": {
            "estimatedHours": "Estimate based on task complexity (1-40 hours)",
            "importance": "critical/high/normal/low",
            "urgencyFactors": ["list of urgency indicators found"],
            "reasoning": "Explain why this priority/importance was assigned",
            "suggestedApproach": "Brief strategy for completing this task efficiently"
          }
        }
        
        Analyze carefully:
        - Look for urgency words: urgent, asap, critical, deadline, due
        - Look for importance indicators: board meeting, client, executive, revenue
        - Estimate hours based on: quick(1-2h), report(3-4h), project(8-16h), research(20-40h)
        - Calculate exact dates for "tomorrow", "next Monday", "end of week"
        
        Example: "Ask Nayan to fix the login bug by Friday - it's critical for the demo"
        Output: {
          "title": "Fix login bug",
          "description": "Critical login bug needs fixing before demo",
          "priority": "high",
          "dueDate": "2024-04-26",
          "dueDateText": "Friday",
          "tags": ["bug", "login", "critical"],
          "assignedToName": "Nayan",
          "teamName": null,
          "estimatedHours": 2,
          "aiAnalysis": {
            "estimatedHours": 2,
            "importance": "critical",
            "urgencyFactors": ["demo deadline", "critical bug"],
            "reasoning": "Login bug blocks demo - critical business impact",
            "suggestedApproach": "Reproduce bug locally, implement fix, test thoroughly"
          }
        }
      `;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const cleanText = cleanAIResponse(response.text());
      return JSON.parse(cleanText);
    } catch (error) {
      console.error('AI Text Parsing Error:', error);
      return this.parseMockTask(naturalText); // Fallback to smart mock parsing
    }
  }

  // 🔍 Smart Task Search
  static async smartSearch(query, allTasks) {
    if (USE_MOCK_AI) return allTasks.filter(t => t.title.toLowerCase().includes(query.toLowerCase())).slice(0, 5);
    try {
      const prompt = `
        Search for tasks matching this query: "${query}"
        
        Available Tasks: ${JSON.stringify(allTasks)}
        
        Return as JSON array of matching tasks with relevance score (0-1)
      `;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const cleanText = cleanAIResponse(response.text());
      return JSON.parse(cleanText);
    } catch (error) {
      console.error('AI Search Error:', error);
      // Fallback to basic text search
      return allTasks.filter(task => 
        task.title.toLowerCase().includes(query.toLowerCase()) ||
        task.description?.toLowerCase().includes(query.toLowerCase())
      ).map(task => ({ ...task, relevanceScore: 0.8 }));
    }
  }

  // 👥 Team Member Recommendations
  static async recommendTeamMembers(task, teamMembers) {
    if (USE_MOCK_AI) {
      // Filter valid members and return mock recommendations
      const validMembers = teamMembers.filter(m => m && m.user);
      return validMembers.slice(0, 2).map(m => ({ 
        memberId: m.user?._id || m.user, 
        score: 85, 
        reason: 'Good fit for task' 
      }));
    }
    try {
      const prompt = `
        Recommend the best team members for this task:
        
        Task: ${JSON.stringify(task)}
        Team Members: ${JSON.stringify(teamMembers)}
        
        Consider skills, workload, and past performance.
        Return as JSON array with: { memberId, recommendationReason, fitScore (1-10) }
      `;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const cleanText = cleanAIResponse(response.text());
      return JSON.parse(cleanText);
    } catch (error) {
      console.error('AI Team Recommendation Error:', error);
      return [];
    }
  }

  // 🏷️ Auto-categorize Tasks
  static async categorizeTask(task) {
    if (USE_MOCK_AI) return { category: 'General', tags: ['task', 'ai-generated'], estimatedComplexity: 3 };
    try {
      const prompt = `
        Categorize this task and suggest tags:
        
        Task: ${JSON.stringify(task)}
        
        Return as JSON with: { category, tags, estimatedComplexity (1-5) }
        Categories: Development, Design, Marketing, Sales, Support, Management, Research
      `;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const cleanText = cleanAIResponse(response.text());
      return JSON.parse(cleanText);
    } catch (error) {
      console.error('AI Categorization Error:', error);
      return { category: 'General', tags: [], estimatedComplexity: 3 };
    }
  }

  // 📊 Generate Progress Summary
  static async generateProgressSummary(tasks, timeRange = 'week') {
    if (USE_MOCK_AI) return this.getMockSummary();
    try {
      const prompt = `
        Generate an insightful progress summary for this ${timeRange}:
        
        Tasks Data: ${JSON.stringify(tasks)}
        
        Return as JSON with: { summary, achievements, recommendations, productivityScore (1-100) }
        Make it motivating and actionable.
      `;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const cleanText = cleanAIResponse(response.text());
      return JSON.parse(cleanText);
    } catch (error) {
      console.error('AI Summary Error:', error);
      return {
        summary: `Completed ${tasks.filter(t => t.status === 'completed').length} tasks this ${timeRange}.`,
        achievements: ['Consistent task completion'],
        recommendations: ['Continue current productivity'],
        productivityScore: 75
      };
    }
  }

  // ⚡ Quick AI Insights
  static async getQuickInsights(userTasks, teamTasks) {
    if (USE_MOCK_AI) return this.getMockInsights();
    try {
      const prompt = `
        Provide 3 quick insights about productivity:
        
        User Tasks: ${JSON.stringify(userTasks.slice(0, 20))}
        Team Tasks: ${JSON.stringify(teamTasks.slice(0, 20))}
        
        Return as JSON array with: { type, message, actionable }
        Types: productivity_tip, bottleneck_alert, opportunity
      `;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const cleanText = cleanAIResponse(response.text());
      return JSON.parse(cleanText);
    } catch (error) {
      console.error('AI Insights Error:', error);
      return [
        { type: 'productivity_tip', message: 'Focus on high-priority tasks first', actionable: true }
      ];
    }
  }
}

module.exports = AIService;
