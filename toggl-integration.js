/**
 * Toggl Integration Module
 * Centralized functions for interacting with Toggl Track API
 */

(function(window) {
  'use strict';

  const TOGGL_API_BASE = 'https://api.track.toggl.com/api/v9';

  const TogglIntegration = {
    /**
     * Make a request to Toggl API
     */
    async request(t, endpoint, options = {}) {
      const apiKey = await t.get('board', 'shared', 'togglApiKey');
      
      if (!apiKey) {
        throw new Error('Toggl API key not configured');
      }

      const auth = btoa(`${apiKey}:api_token`);
      
      const response = await fetch(`${TOGGL_API_BASE}${endpoint}`, {
        ...options,
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
          ...options.headers
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Toggl API error (${response.status}): ${errorText}`);
      }

      return response.json();
    },

    /**
     * Get user's workspaces
     */
    async getWorkspaces(t) {
      return this.request(t, '/me/workspaces');
    },

    /**
     * Get first workspace (default)
     */
    async getWorkspace(t) {
      const workspaces = await this.getWorkspaces(t);
      if (!workspaces || workspaces.length === 0) {
        throw new Error('No Toggl workspaces found');
      }
      return workspaces[0];
    },

    /**
     * Get clients in a workspace
     */
    async getClients(t, workspaceId) {
      return this.request(t, `/workspaces/${workspaceId}/clients`);
    },

    /**
     * Get or create a client
     */
    async getOrCreateClient(t, workspaceId, clientName) {
      const clients = await this.getClients(t, workspaceId);
      
      let client = clients.find(c => c.name === clientName);
      
      if (!client) {
        client = await this.request(t, `/workspaces/${workspaceId}/clients`, {
          method: 'POST',
          body: JSON.stringify({ name: clientName })
        });
      }
      
      return client;
    },

    /**
     * Get projects in a workspace
     */
    async getProjects(t, workspaceId) {
      return this.request(t, `/workspaces/${workspaceId}/projects`);
    },

    /**
     * Get or create a project
     */
    async getOrCreateProject(t, workspaceId, projectName, clientId, hourlyRate) {
      const projects = await this.getProjects(t, workspaceId);
      
      let project = projects.find(p => p.name === projectName);
      
      if (!project) {
        project = await this.request(t, `/workspaces/${workspaceId}/projects`, {
          method: 'POST',
          body: JSON.stringify({
            name: projectName,
            client_id: clientId,
            rate: hourlyRate,
            billable: true,
            active: true
          })
        });
      }
      
      return project;
    },

    /**
     * Get time entries for a date range
     */
    async getTimeEntriesInRange(t, startDate, endDate) {
      return this.request(
        t, 
        `/me/time_entries?start_date=${startDate}&end_date=${endDate}`
      );
    },

    /**
     * Get time entries for a specific project
     */
    async getTimeEntries(t, projectName) {
      const workspace = await this.getWorkspace(t);
      const projects = await this.getProjects(t, workspace.id);
      
      const project = projects.find(p => p.name === projectName);
      
      if (!project) {
        return { entries: [], project: null };
      }
      
      // Get last year of entries
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];
      
      const allEntries = await this.getTimeEntriesInRange(t, startDate, endDate);
      const projectEntries = allEntries.filter(e => e.project_id === project.id);
      
      return {
        entries: projectEntries,
        project: project
      };
    },

    /**
     * Calculate totals from time entries
     */
    calculateTotals(entries, hourlyRate) {
      const totalSeconds = entries.reduce((sum, entry) => {
        return sum + (entry.duration || 0);
      }, 0);
      
      const totalHours = totalSeconds / 3600;
      const billableAmount = totalHours * hourlyRate;
      
      return {
        totalSeconds,
        totalHours: totalHours.toFixed(2),
        billableAmount: billableAmount.toFixed(2)
      };
    },

    /**
     * Create a complete Toggl setup for a card
     */
    async createProjectForCard(t, cardName, labelName, hourlyRate) {
      const workspace = await this.getWorkspace(t);
      
      // Get or create client
      const client = await this.getOrCreateClient(t, workspace.id, labelName);
      
      // Create project
      const project = await this.getOrCreateProject(
        t, 
        workspace.id, 
        cardName, 
        client.id, 
        hourlyRate
      );
      
      return {
        workspace,
        client,
        project
      };
    },

    /**
     * Get summary for a project
     */
    async getProjectSummary(t, projectName, hourlyRate) {
      const result = await this.getTimeEntries(t, projectName);
      
      if (!result.project) {
        return null;
      }
      
      const totals = this.calculateTotals(result.entries, hourlyRate);
      
      return {
        project: result.project,
        entries: result.entries,
        totalHours: totals.totalHours,
        billableAmount: totals.billableAmount,
        hourlyRate
      };
    },

    /**
     * Bulk sync multiple projects
     */
    async bulkSync(t, projects) {
      const results = [];
      
      for (const proj of projects) {
        try {
          const summary = await this.getProjectSummary(
            t, 
            proj.name, 
            proj.hourlyRate
          );
          
          if (summary) {
            results.push({
              success: true,
              project: proj.name,
              summary
            });
          } else {
            results.push({
              success: false,
              project: proj.name,
              error: 'Project not found'
            });
          }
        } catch (error) {
          results.push({
            success: false,
            project: proj.name,
            error: error.message
          });
        }
      }
      
      return results;
    },

    /**
     * Validate API key
     */
    async validateApiKey(t) {
      try {
        await this.request(t, '/me');
        return { valid: true };
      } catch (error) {
        return { 
          valid: false, 
          error: error.message 
        };
      }
    },

    /**
     * Get current user info
     */
    async getCurrentUser(t) {
      return this.request(t, '/me');
    },

    /**
     * Format duration in human-readable format
     */
    formatDuration(seconds) {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      
      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      }
      return `${minutes}m`;
    },

    /**
     * Get entries grouped by date
     */
    groupEntriesByDate(entries) {
      const grouped = {};
      
      entries.forEach(entry => {
        const date = entry.start.split('T')[0];
        if (!grouped[date]) {
          grouped[date] = [];
        }
        grouped[date].push(entry);
      });
      
      return grouped;
    },

    /**
     * Get recent projects (last 30 days)
     */
    async getRecentProjects(t) {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];
      
      const entries = await this.getTimeEntriesInRange(t, startDate, endDate);
      
      // Get unique project IDs
      const projectIds = [...new Set(entries.map(e => e.project_id))];
      
      const workspace = await this.getWorkspace(t);
      const allProjects = await this.getProjects(t, workspace.id);
      
      // Filter to only projects with recent entries
      return allProjects.filter(p => projectIds.includes(p.id));
    }
  };

  // Export to global scope
  window.TogglIntegration = TogglIntegration;

})(window);
