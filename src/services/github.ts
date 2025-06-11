// GitHub API integration for data repository management

interface GitHubConfig {
  owner: string;
  repo: string;
  token?: string;
}

interface GitHubFile {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string;
  type: string;
  content?: string;
  encoding?: string;
}

class GitHubService {
  private config: GitHubConfig;
  private baseUrl = 'https://api.github.com';

  constructor(config: GitHubConfig) {
    this.config = config;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}/repos/${this.config.owner}/${this.config.repo}${endpoint}`;
    
    // Get current token from localStorage (OAuth token)
    const currentToken = localStorage.getItem('github_token') || this.config.token;
    
    if (!currentToken) {
      throw new Error('GitHub authentication required. Please sign in.');
    }
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${currentToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token is invalid, clear it
        localStorage.removeItem('github_token');
        localStorage.removeItem('github_user');
        throw new Error('GitHub authentication expired. Please sign in again.');
      }
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Get file content from the repository
  async getFile(path: string): Promise<GitHubFile> {
    // Add timestamp for cache busting
    const timestamp = new Date().getTime();
    return this.request(`/contents/${path}?t=${timestamp}`);
  }

  // Update or create a file
  async updateFile(
    path: string, 
    content: string, 
    message: string, 
    sha?: string
  ): Promise<GitHubFile> {
    const body = {
      message,
      content: btoa(unescape(encodeURIComponent(content))), // Base64 encode
      ...(sha && { sha }) // Include SHA if updating existing file
    };

    return this.request(`/contents/${path}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  // Get CSV data directly (for reading)
  async getCSVContent(filename: string): Promise<string> {
    console.log(`📡 Fetching ${filename} from GitHub...`);
    const file = await this.getFile(`data/${filename}`);
    console.log(`📄 File info:`, { 
      name: file.name, 
      size: file.size, 
      encoding: file.encoding,
      hasContent: !!file.content,
      hasDownloadUrl: !!file.download_url,
      contentPreview: file.content ? file.content.substring(0, 100) + '...' : 'no content'
    });
    
    if (file.content) {
      let decoded: string;
      
      if (file.encoding === 'base64') {
        // Standard base64 decoding for GitHub API
        decoded = atob(file.content);
      } else {
        // If no encoding specified, treat as plain text
        decoded = file.content;
      }
      
      console.log(`✅ Decoded ${decoded.length} characters`);
      console.log(`📝 Content preview:`, decoded.substring(0, 200) + '...');
      return decoded;
    }
    
    // Fallback: Use download_url for large files (>1MB)
    if (file.download_url) {
      console.log(`📥 File too large, using download_url...`);
      const response = await fetch(file.download_url);
      if (!response.ok) {
        throw new Error(`Failed to fetch file via download_url: ${response.statusText}`);
      }
      const content = await response.text();
      console.log(`✅ Downloaded ${content.length} characters via download_url`);
      console.log(`📝 Content preview:`, content.substring(0, 200) + '...');
      return content;
    }
    
    throw new Error(`Unable to decode content for ${filename} - no content or download_url received`);
  }

  // Update CSV data
  async updateCSV(filename: string, csvContent: string, message: string): Promise<void> {
    try {
      // Get current file to get SHA
      const currentFile = await this.getFile(`data/${filename}`);
      await this.updateFile(`data/${filename}`, csvContent, message, currentFile.sha);
    } catch (error: any) {
      if (error.message.includes('404')) {
        // File doesn't exist, create it
        await this.updateFile(`data/${filename}`, csvContent, message);
      } else {
        throw error;
      }
    }
  }

  // Create a pull request for data changes
  async createPullRequest(
    title: string,
    body: string,
    head: string,
    base: string = 'main'
  ) {
    return this.request('/pulls', {
      method: 'POST',
      body: JSON.stringify({
        title,
        body,
        head,
        base,
      }),
    });
  }

  // Trigger a workflow (for validation)
  async triggerWorkflow(workflowId: string, ref: string = 'main') {
    return this.request(`/actions/workflows/${workflowId}/dispatches`, {
      method: 'POST',
      body: JSON.stringify({ ref }),
    });
  }
}

// Export singleton instance
export const createGitHubService = (config: GitHubConfig) => new GitHubService(config);

// Environment-specific configuration
export const getGitHubConfig = (): GitHubConfig => {
  const owner = process.env.REACT_APP_GITHUB_OWNER || 'rasilab';
  const repo = process.env.REACT_APP_GITHUB_DATA_REPO || 'lab-database-data';

  if (!owner || !repo) {
    throw new Error('GitHub configuration incomplete. Set REACT_APP_GITHUB_OWNER and REACT_APP_GITHUB_DATA_REPO environment variables.');
  }

  // Token is now optional - will be provided by OAuth
  const token = localStorage.getItem('github_token') || undefined;

  return { owner, repo, token };
};

export default GitHubService;