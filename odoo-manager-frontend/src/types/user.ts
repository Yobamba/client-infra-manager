export interface User {
  id: number;
  email: string;
  role: "ADMIN" | "STANDARD";
}

export interface UserWithProjects {
  id: number;
  email: string;
  role: "ADMIN" | "STANDARD";
  projects: {
    id: number;
    name: string;
  }[];
}
