export interface PublicUser {
  alias: string;
  bio: string | null;
  skillTags: string[];
  externalLinks: { label: string; url: string }[];
  createdAt: string;
}

export interface MeUser extends PublicUser {
  id: string;
  email: string | null;
  authProvider: 'github' | 'magic-link';
}
