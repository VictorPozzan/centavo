export interface Category {
    id: string;
    name: string;
    color: string;
    icon: string | null;
    createdAt: string;
    updatedAt: string;
  }
  
  export interface CreateCategoryPayload {
    name: string;
    color?: string;
    icon?: string;
  }
  
  export type UpdateCategoryPayload = Partial<CreateCategoryPayload>;