// Clerk 類型定義
interface ClerkInstance {
  // 基本屬性
  version?: string;
  loaded?: boolean;
  
  // 認證相關方法
  load?: (options?: Record<string, unknown>) => Promise<void>;
  signIn?: () => void;
  signOut?: () => void;
  openSignIn?: () => void;
  openSignUp?: () => void;
  openUserProfile?: () => void;
  
  // 用戶相關
  user?: {
    id?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    fullName?: string;
    username?: string;
    profileImageUrl?: string;
    primaryEmailAddress?: {
      emailAddress: string;
      verified: boolean;
    };
    publicMetadata?: Record<string, unknown>;
    unsafeMetadata?: Record<string, unknown>;
  };
  
  // Session 相關
  session?: {
    id?: string;
    status?: string;
    lastActiveAt?: Date;
    expireAt?: Date;
    user?: {
      id: string;
      [key: string]: unknown;
    };
  };
  
  // 組織相關（如果有使用）
  organization?: {
    id?: string;
    name?: string;
    slug?: string;
    imageUrl?: string;
    membersCount?: number;
  };
  
  // 事件監聽
  addListener?: (event: string, callback: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, callback: (...args: unknown[]) => void) => void;
  
  // 其他方法
  authenticateWithMetamask?: () => Promise<void>;
  redirectToSignIn?: (options?: Record<string, unknown>) => void;
  redirectToSignUp?: (options?: Record<string, unknown>) => void;
  redirectToUserProfile?: () => void;
  redirectToOrganizationProfile?: () => void;
  redirectToCreateOrganization?: () => void;
  
  // 如果還有其他未知的屬性或方法
  [key: string]: unknown;
}

declare global {
  interface Window {
    Clerk: ClerkInstance;
  }
}

export {};