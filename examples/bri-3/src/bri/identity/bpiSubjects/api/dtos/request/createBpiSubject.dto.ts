import { IsNotEmpty } from 'class-validator';

export class CreateBpiSubjectDto {
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
