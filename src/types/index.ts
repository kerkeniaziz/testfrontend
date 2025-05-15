export interface User {
  id: string;
  firstName: string;
  role: string;
}

export interface Subpocket {
  id: string;
  name: string;
  description: string;
  order: number;
  notes?: { description: string; user: User; }[];
}

export interface Pocket {
  id: string;
  name: string;
  description: string;
  order: number;
  subPockets: Subpocket[];
}