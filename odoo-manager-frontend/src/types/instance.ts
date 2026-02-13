export type OdooInstanceType = "PRODUCTION" | "STAGING" | "DEVELOPMENT";

export interface Instance {
  id: number;
  name: string;
  url: string;
  instance_type: OdooInstanceType;
  is_active: boolean;
}
