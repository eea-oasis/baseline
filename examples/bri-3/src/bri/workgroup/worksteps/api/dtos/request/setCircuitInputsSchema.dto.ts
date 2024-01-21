import { IsNotEmpty } from 'class-validator';

export class SetCircuitInputsSchemaDto {
  @IsNotEmpty()
  schema: string;
}
