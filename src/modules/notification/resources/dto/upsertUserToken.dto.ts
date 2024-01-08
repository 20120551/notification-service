import { IsString } from 'class-validator';

export class UpsertUserTokenDto {
  @IsString()
  token: string;
}
