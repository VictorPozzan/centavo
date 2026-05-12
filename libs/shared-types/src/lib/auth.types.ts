export interface AuthUser {
    id: string;
    email: string;
    name: string;
  }
  
  export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
  }
  
  export interface AuthResponse extends AuthTokens {
    user: AuthUser;
  }
  
  export interface LoginPayload {
    email: string;
    password: string;
  }
  
  export interface RegisterPayload {
    email: string;
    password: string;
    name: string;
  }
  
  export interface RefreshPayload {
    refreshToken: string;
  }