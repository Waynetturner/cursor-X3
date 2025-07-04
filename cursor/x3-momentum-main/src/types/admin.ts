
export interface UserProfile {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  created_at: string;
  demographics?: {
    age?: number;
    gender?: string;
    location?: string;
    fitness_level?: string;
  };
}

export interface DeleteUserResponse {
  success: boolean;
  message: string;
  deleted_user_id?: string;
}
