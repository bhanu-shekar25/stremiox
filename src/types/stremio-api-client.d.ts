// ✅ FIX: Updated to match the ACTUAL stremio-api-client v1.6.0 API.
// The old declaration had login() returning Promise<StremioUser> but it returns Promise<void>.
// User is accessible via APIStore.user AFTER login resolves.

declare module 'stremio-api-client' {
  export interface StremioAPIStoreOptions {
    endpoint?: string;
    storage: {
      // MUST be synchronous — stremio-api-client does NOT await these
      getJSON: (key: string) => any;
      setJSON: (key: string, val: any) => void;
    };
  }

  export interface StremioUser {
    _id: string;
    email: string;
    authKey: string;
    lastModified?: string;
    [key: string]: any;
  }

  export interface AddonCollection {
    addons?: any[];
    load: (addons: any[]) => void;
    save: () => any[];
    getAddons: () => any[];
  }

  export class StremioAPIStore {
    constructor(options: StremioAPIStoreOptions);

    // These are set AFTER login/hydration
    user: StremioUser | null;
    addons: AddonCollection;

    events: {
      on: (event: string, cb: (...args: any[]) => void) => void;
      emit: (event: string, ...args: any[]) => void;
    };

    // ✅ login() returns void — access user via APIStore.user after it resolves
    login: (params: { email: string; password: string }) => Promise<void>;
    register: (params: { email: string; password: string }) => Promise<void>;
    logout: () => Promise<void>;

    // Syncs addon collection from server → updates APIStore.addons
    pullAddonCollection: () => Promise<void>;

    // Pushes local addon collection to server
    pushAddonCollection: () => Promise<void>;

    // Syncs user profile from server → updates APIStore.user
    pullUser: () => Promise<void>;

    // Saves local user profile to server
    pushUser: () => Promise<void>;

    // Internal — exposed for manual session restoration
    userChange: (authKey: string | null, user: StremioUser | null) => void;

    // Make raw API requests
    request: (method: string, params?: any) => Promise<any>;
  }

  export function addonsDifferent(a: any[], b: any[]): boolean;
}
