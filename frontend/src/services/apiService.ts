// frontend/src/services/apiService.ts
import { toast } from "sonner";

// 1. Use environment variable for API_BASE_URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'; // Your FastAPI /api/v1 prefix
// If your backend API routes are not prefixed with /api/v1 by Uvicorn/FastAPI,
// and you want your fetch calls to be like `apiService.get('/users')` directly
// then API_BASE_URL should be 'http://127.0.0.1:8000'
// and your endpoints in methods below should include the /api/v1 prefix e.g. `/api/v1/users`.
// I'll assume API_BASE_URL already includes /api/v1 if present at backend level.

interface ApiCallOptions extends Omit<RequestInit, 'body'> {
  body?: any; // Allow any body type, will be stringified if JSON
  isPublic?: boolean; // To indicate if the endpoint needs auth token
  isFormData?: boolean; // To indicate if the body is FormData
}

// 2. Generic fetch function throws error on failure, returns data directly on success
async function fetchCore<T>(endpoint: string, options: ApiCallOptions = {}): Promise<T> {
  const { isPublic = false, isFormData = false, body, ...fetchOptions } = options;
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = new Headers(fetchOptions.headers || {});

  // 3. Handle Auth Token
  if (!isPublic) {
    const token = localStorage.getItem('authToken');
    if (token) {
      headers.append('Authorization', `Bearer ${token}`);
    } else {
      // Optional: If no token for a protected route, you could throw an error early
      // or let the backend return a 401, which will be handled below.
      console.warn(`No auth token found for protected route: ${endpoint}`);
    }
  }

  let requestBody: BodyInit | undefined;
  if (body !== undefined) {
    if (isFormData) {
      // For FormData, Content-Type is set by the browser; don't set it manually
      requestBody = body as FormData;
    } else {
      if (!headers.has('Content-Type')) {
        headers.append('Content-Type', 'application/json');
      }
      requestBody = JSON.stringify(body);
    }
  }


  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      body: requestBody,
    });

    if (!response.ok) {
      let errorData;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        errorData = await response.json();
      } else {
        errorData = { detail: await response.text() || `HTTP error ${response.status}` };
      }
      // 4. Improved error message, prefer FastAPI's `detail` field
      const errorMessage = errorData.detail || (typeof errorData === 'string' ? errorData : errorData.message) || `Request failed with status ${response.status}`;
      toast.error(`API Error: ${errorMessage}`); // 5. Integrate toast notifications
      throw new Error(errorMessage);
    }

    // Handle 204 No Content (e.g., for DELETE requests)
    if (response.status === 204) {
      return undefined as T; // Or {} as T if preferred
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
        return await response.json();
    } else {
        // Handle non-JSON responses if necessary, e.g., plain text or files
        // For this generic service, we primarily expect JSON or no content
        console.warn(`Received non-JSON response from ${endpoint}`);
        return undefined as T; // Or handle as plain text if expected: await response.text() as unknown as T;
    }

  } catch (error) {
    console.error(`API request to ${endpoint} failed:`, error);
    // Avoid double-toasting if already toasted by HTTP error check
    if (!(error instanceof Error && error.message.startsWith("API Error:"))) {
        const displayError = error instanceof Error ? error.message : 'A network or unknown error occurred.';
        toast.error(displayError);
    }
    throw error; // Re-throw to be caught by calling function (e.g., in AuthContext or component)
  }
}

// --- Schema Types (for better type safety, should match your Pydantic schemas) ---
// These are illustrative. Define them based on your backend schemas.py
interface TokenResponse {
  access_token: string;
  token_type: string;
  user?: UserData; // If login/register returns user data
}

interface UserData {
  id: number;
  email: string;
  full_name?: string;
  role: 'user' | 'admin';
  is_active?: boolean;
  // Add other fields as per your User model
}

interface DocumentData {
    id: number;
    original_filename: string;
    // ... other document fields
}


// HTTP methods wrappers
export const apiService = {
  get: <T>(endpoint: string, options?: Omit<ApiCallOptions, 'body' | 'isFormData'>) =>
    fetchCore<T>(endpoint, { method: 'GET', ...options }),

  post: <T_Response, T_Body = any>(endpoint: string, data: T_Body, options?: Omit<ApiCallOptions, 'body' | 'isFormData'>) =>
    fetchCore<T_Response>(endpoint, {
      method: 'POST',
      body: data,
      ...options,
    }),

  put: <T_Response, T_Body = any>(endpoint: string, data: T_Body, options?: Omit<ApiCallOptions, 'body' | 'isFormData'>) =>
    fetchCore<T_Response>(endpoint, {
      method: 'PUT',
      body: data,
      ...options,
    }),

  delete: <T>(endpoint: string, options?: Omit<ApiCallOptions, 'body' | 'isFormData'>) =>
    fetchCore<T>(endpoint, { method: 'DELETE', ...options }),

  // Special method for file uploads (FormData)
  uploadFile: <T_Response>(endpoint: string, file: File, additionalData?: Record<string, string>, options?: Omit<ApiCallOptions, 'body' | 'isFormData' | 'isPublic'>) => {
    const formData = new FormData();
    formData.append('file', file);

    if (additionalData) {
        for (const key in additionalData) {
            formData.append(key, additionalData[key]);
        }
    }
    
    return fetchCore<T_Response>(endpoint, {
      method: 'POST',
      body: formData,
      isFormData: true, // Signal that body is FormData
      ...options, // Note: if options contains `isPublic`, it will be respected
    });
  },

  // --- Specific Auth Service Methods (examples, adapt to your actual AuthContext needs) ---
  login: async (email_username: string, password_str: string): Promise<TokenResponse> => {
    const formData = new URLSearchParams(); // FastAPI token endpoint expects form data
    formData.append('username', email_username);
    formData.append('password', password_str);

    // Directly using fetch for form data, or adapt fetchCore if preferred for x-www-form-urlencoded
    const response = await fetch(`${API_BASE_URL}/auth/token`, {
        method: 'POST',
        body: formData,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.detail || "Login failed";
        toast.error(errorMessage);
        throw new Error(errorMessage);
    }
    return response.json();
  },

  // Self-registration requires a *public* backend endpoint.
  // POST /api/v1/users (from your docs) requires Admin.
  // Assuming you add a new POST /api/v1/auth/register
  register: async (fullName: string, email: string, password_str: string): Promise<UserData> => {
    return apiService.post<UserData>('/auth/register', // The new public endpoint
      { full_name: fullName, email: email, password: password_str },
      { isPublic: true }
    );
  },

  getCurrentUser: async (): Promise<UserData> => {
    return apiService.get<UserData>('/auth/me'); // This endpoint needs Authorization header
  },

  // --- Example Methods for Python Integration page ---
  checkPythonBackendStatus: async (): Promise<{ status: string; message: string }> => {
    return apiService.get<{ status: string; message: string }>('/utils/status', { isPublic: true }); // Hypothetical
  },

  calculateSum: async (numbers: number[], operation: string): Promise<{ result: number }> => {
    return apiService.post<{ result: number }>('/utils/calculate', { numbers, operation }); // Hypothetical
  },

  // --- Example for InsureDocs Document related calls ---
  getDocuments: async (params?: { skip?: number; limit?: number; }): Promise<DocumentData[]> => {
    const queryParams = new URLSearchParams();
    if (params?.skip !== undefined) queryParams.append('skip', String(params.skip));
    if (params?.limit !== undefined) queryParams.append('limit', String(params.limit));
    return apiService.get<DocumentData[]>(`/documents?${queryParams.toString()}`);
  },

  uploadInsureDocument: async (file: File): Promise<DocumentData> => {
    return apiService.uploadFile<DocumentData>('/documents/', file);
  },

};

// ... other code
export default apiService;

// Ensure VITE_API_BASE_URL is set in your .env file for Vite projects
// Example frontend/.env:
// VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1