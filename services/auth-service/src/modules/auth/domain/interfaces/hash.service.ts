export const HASH_SERVICE = Symbol('HASH_SERVICE');

export interface HashService {
  hash(plain: string): Promise<string>;
  compare(plain: string, hashed: string): Promise<boolean>;
}
