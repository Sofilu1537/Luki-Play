import { SetMetadata } from '@nestjs/common';

export const AUDIENCE_KEY = 'audience';
export const RequireAudience = (...audiences: string[]) =>
  SetMetadata(AUDIENCE_KEY, audiences);
