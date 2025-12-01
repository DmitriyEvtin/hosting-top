export interface Site {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSiteData {
  name: string;
}

export interface UpdateSiteData {
  name?: string;
}

