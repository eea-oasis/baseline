import { AutoMap } from '@automapper/classes';
import { BpiSubjectRoleDto } from './bpiSubjectRole.dto';
import { PublicKey } from '../../../models/publicKey';

export class BpiSubjectDto {
  @AutoMap()
  id: string;

  @AutoMap()
  name: string;

  @AutoMap()
  description: string;

  @AutoMap()
  publicKeys: PublicKey[];

  @AutoMap(() => [BpiSubjectRoleDto])
  roles: BpiSubjectRoleDto[];
}
