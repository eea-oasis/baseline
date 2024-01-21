import { AutoMap } from '@automapper/classes';

export class WorkstepDto {
  @AutoMap()
  id: string;

  @AutoMap()
  name: string;

  @AutoMap()
  version: string;

  @AutoMap()
  status: string;

  @AutoMap()
  workgroupId: string;

  @AutoMap()
  securityPolicy: string;

  @AutoMap()
  privacyPolicy: string;

  @AutoMap()
  circuitInputsTranslationSchema: string;
}
