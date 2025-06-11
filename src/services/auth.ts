// Authentication service for GitHub integration
import { AuthUser } from '../types';

export interface AuthResult {
  success: boolean;
  user?: AuthUser;
  token?: string;
  error?: string;
  needsAuth?: boolean;
}

class AuthService {
  private readonly GITHUB_API_BASE = 'https://api.github.com';
  private readonly REPO_OWNER = process.env.REACT_APP_GITHUB_OWNER || 'rasilab';
  private readonly REPO_NAME = process.env.REACT_APP_GITHUB_DATA_REPO || 'lab-database-data';

  // Check if repository is publicly accessible
  async checkPublicAccess(): Promise<boolean> {
    try {
      const response = await fetch(`${this.GITHUB_API_BASE}/repos/${this.REPO_OWNER}/${this.REPO_NAME}`);
      return response.ok;
    } catch {
      return false;
    }
  }

  // Try to authenticate with existing GitHub session (if user is logged into GitHub)
  async tryAutoAuth(): Promise<AuthResult> {
    try {
      console.log('🔍 tryAutoAuth: Starting authentication check...');
      
      // First check if repository is public
      console.log('🔍 tryAutoAuth: Checking if repository is public...');
      const isPublic = await this.checkPublicAccess();
      console.log('🔍 tryAutoAuth: Repository is public:', isPublic);
      
      if (isPublic) {
        console.log('✅ tryAutoAuth: Repository is public, creating anonymous user');
        // Repository is public, create anonymous user
        return {
          success: true,
          user: {
            username: 'anonymous',
            name: 'Public Access',
            avatar_url: '',
            isAdmin: false,
            isActiveMember: false,
          },
          needsAuth: false
        };
      }

      // Check if we have a stored token
      console.log('🔍 tryAutoAuth: Repository is private, checking stored credentials...');
      const storedToken = localStorage.getItem('github_token');
      const storedUser = localStorage.getItem('github_user');
      console.log('🔍 tryAutoAuth: Has stored token:', !!storedToken, 'Has stored user:', !!storedUser);

      if (storedToken && storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          console.log('🔍 tryAutoAuth: Validating stored token for user:', userData.username);
          const isValid = await this.validateToken(storedToken);
          
          if (isValid) {
            console.log('✅ tryAutoAuth: Stored token is valid, authenticating user');
            return {
              success: true,
              user: userData,
              token: storedToken,
              needsAuth: false
            };
          } else {
            console.log('❌ tryAutoAuth: Stored token is invalid, clearing it');
            // Token expired, clear it
            localStorage.removeItem('github_token');
            localStorage.removeItem('github_user');
          }
        } catch (error) {
          console.log('❌ tryAutoAuth: Error parsing stored data:', error);
          // Invalid stored data
          localStorage.removeItem('github_token');
          localStorage.removeItem('github_user');
        }
      }

      // Try to detect if user is already signed into GitHub
      // This is a limitation of browser security - we can't directly access GitHub cookies
      // But we can check if they have access to the repository
      console.log('❌ tryAutoAuth: No valid credentials found, authentication required');
      return {
        success: false,
        needsAuth: true,
        error: 'Authentication required to access private repository'
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication check failed',
        needsAuth: true
      };
    }
  }

  // Validate GitHub token
  async validateToken(token: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.GITHUB_API_BASE}/user`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  // Get user data from GitHub API
  async getUserData(token: string): Promise<AuthUser | null> {
    try {
      // If no token provided, check if repository is public
      if (!token) {
        const isPublic = await this.checkPublicAccess();
        if (isPublic) {
          return {
            username: 'anonymous',
            name: 'Public Access',
            avatar_url: '',
            isAdmin: false,
            isActiveMember: false,
          };
        }
        return null;
      }

      const [userResponse, orgResponse] = await Promise.all([
        fetch(`${this.GITHUB_API_BASE}/user`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        }),
        fetch(`${this.GITHUB_API_BASE}/user/memberships/orgs/${this.REPO_OWNER}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        }),
      ]);

      if (!userResponse.ok) {
        throw new Error('Failed to fetch user data');
      }

      const userData = await userResponse.json();
      const isActiveMember = orgResponse.ok;

      return {
        username: userData.login,
        name: userData.name || userData.login,
        avatar_url: userData.avatar_url,
        isAdmin: userData.login === this.REPO_OWNER || userData.site_admin,
        isActiveMember: isActiveMember,
      };
    } catch (error) {
      console.error('Failed to get user data:', error);
      return null;
    }
  }

  // Check if user has access to the specific repository
  async checkRepositoryAccess(token?: string): Promise<boolean> {
    try {
      const headers: Record<string, string> = {
        'Accept': 'application/vnd.github.v3+json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.GITHUB_API_BASE}/repos/${this.REPO_OWNER}/${this.REPO_NAME}`, {
        headers,
      });

      return response.ok;
    } catch {
      return false;
    }
  }

  // Store authentication data
  storeAuth(token: string, user: AuthUser): void {
    localStorage.setItem('github_token', token);
    localStorage.setItem('github_user', JSON.stringify(user));
  }

  // Clear authentication data
  clearAuth(): void {
    localStorage.removeItem('github_token');
    localStorage.removeItem('github_user');
  }

  // Get current authentication state
  getCurrentAuth(): { token?: string; user?: AuthUser } {
    const token = localStorage.getItem('github_token');
    const userStr = localStorage.getItem('github_user');
    
    let user: AuthUser | undefined;
    if (userStr) {
      try {
        user = JSON.parse(userStr);
      } catch {
        // Invalid user data
        this.clearAuth();
      }
    }

    return { token: token || undefined, user };
  }
}

export const authService = new AuthService();