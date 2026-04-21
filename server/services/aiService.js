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
    // Simple regex-based parsing for mock mode
    const title = text.replace(/create a task (for \w+ )?(in \w+ )?/i, '').split(' by ')[0] || text.substring(0, 50);
    const assignedMatch = text.match(/for (\w+)/i);
    const teamMatch = text.match(/in (\w+) team/i);
    const dateMatch = text.match(/by (tomorrow|next week|next month|\w+)/i);
    
    return {
      title: title.charAt(0).toUpperCase() + title.slice(1),
      description: text,
      priority: text.includes('urgent') || text.includes('asap') ? 'high' : 'medium',
      dueDate: dateMatch ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : null,
      dueDateText: dateMatch ? dateMatch[1] : null,
      tags: ['task', 'ai-generated'],
      assignedToName: assignedMatch ? assignedMatch[1] : null,
      teamName: teamMatch ? teamMatch[1] + ' team' : null,
      estimatedHours: null
    };
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

  // 💬 Natural Language Task Creation - Enhanced
  static async parseTaskFromText(naturalText) {
    if (USE_MOCK_AI) return this.parseMockTask(naturalText);
    try {
      const prompt = `
        Extract task details from this natural language: "${naturalText}"
        
        Extract and return as JSON:
        {
          "title": "Clear, concise task title (5-10 words)",
          "description": "Full task description with context",
          "priority": "high/medium/low based on urgency",
          "dueDate": "YYYY-MM-DD format or null if not specified",
          "dueDateText": "Original date mentioned (e.g., 'next month', 'Friday', 'Dec 25')",
          "tags": ["relevant", "tags", "based", "on", "content"],
          "assignedToName": "Person's name mentioned for assignment (e.g., 'Nayan', 'John') or null",
          "teamName": "Team/department mentioned (e.g., 'sales team', 'design team') or null",
          "estimatedHours": number or null
        }
        
        For dates like "next month", "tomorrow", "next Friday", calculate from today.
        For assignees, extract just the name - don't make up IDs.
        For teams, extract the team name mentioned.
        
        Example input: "create a task for nayan in sales team to increase sales by double by next month"
        Example output: {
          "title": "Increase sales by double",
          "description": "Sales team needs to double their sales performance",
          "priority": "high",
          "dueDate": "2024-02-19",
          "dueDateText": "next month",
          "tags": ["sales", "performance", "growth"],
          "assignedToName": "nayan",
          "teamName": "sales team",
          "estimatedHours": null
        }
      `;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const cleanText = cleanAIResponse(response.text());
      return JSON.parse(cleanText);
    } catch (error) {
      console.error('AI Text Parsing Error:', error);
      return { 
        title: naturalText, 
        description: '', 
        priority: 'medium', 
        dueDate: null, 
        dueDateText: null,
        tags: [], 
        assignedToName: null,
        teamName: null,
        estimatedHours: null
      };
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
