import { IsNotEmpty } from 'class-validator';

export class UpdateBpiSubjectDto {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  desc: string;

  @IsNotEmpty()
  publicKeys: {
    type: string;
    value: string;
  }[];
}
