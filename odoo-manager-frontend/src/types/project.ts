export interface Project {
  id: number;
  name: string;
  client_id: number;
  users: {
    id: number;
    email: string;
  }[];
}
