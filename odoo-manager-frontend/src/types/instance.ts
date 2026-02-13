export interface Instance {
  id: number;
  name: string;
  url: string;
  instance_type: "PRODUCTION" | "STAGING" | "DEVELOPMENT";
  is_active: boolean;
}
