declare module 'stremio-api-client' {
  export interface StremioAPIStoreOptions {
    storage: {
      getJSON: (key: string) => Promise<any>;
      setJSON: (key: string, val: any) => Promise<void>;
    };
  }

  export interface StremioUser {
    _id: string;
    email: string;
    authKey: string;
  }

  export interface AddonCollection {
    addons: any[];
  }

  export class StremioAPIStore {
    constructor(options: StremioAPIStoreOptions);
    user: StremioUser | null;
    addons: AddonCollection | null;
    login: (credentials: { email: string; password: string }) => Promise<StremioUser>;
    pullAddonCollection: () => Promise<AddonCollection>;
  }
} 
