import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Workstep } from '../models/workstep';

import { v4 } from 'uuid';
import { CircuitInputsParserService } from '../../../zeroKnowledgeProof/services/circuit/circuitInputsParser/circuitInputParser.service';
import { NOT_FOUND_ERR_MESSAGE } from '../api/err.messages';
import { WorkstepStorageAgent } from './workstepsStorage.agent';

@Injectable()
export class WorkstepAgent {
  constructor(
    private storageAgent: WorkstepStorageAgent,
    private cips: CircuitInputsParserService,
  ) {}

  public createNewWorkstep(
    name: string,
    version: string,
    status: string,
    workgroupId: string,
    securityPolicy: string,
    privacyPolicy: string,
  ): Workstep {
    return new Workstep(
      v4(),
      name,
      version,
      status,
      workgroupId,
      securityPolicy,
      privacyPolicy,
    );
  }

  public async fetchUpdateCandidateAndThrowIfUpdateValidationFails(
    id: string,
  ): Promise<Workstep> {
    const workstepToUpdate = await this.storageAgent.getWorkstepById(id);

    if (!workstepToUpdate) {
      throw new NotFoundException(NOT_FOUND_ERR_MESSAGE);
    }

    return workstepToUpdate;
  }

  public updateWorkstep(
    workstepToUpdate: Workstep,
    name: string,
    version: string,
    status: string,
    workgroupId: string,
    securityPolicy: string,
    privacyPolicy: string,
  ) {
    workstepToUpdate.updateName(name);
    workstepToUpdate.updateVersion(version);
    workstepToUpdate.updateStatus(status);
    workstepToUpdate.updateWorkgroupId(workgroupId);
    workstepToUpdate.updateSecurityPolicy(securityPolicy);
    workstepToUpdate.updatePrivacyPolicy(privacyPolicy);
  }

  public throwIfCircuitInputTranslationSchemaInvalid(schema): void {
    if (!this.cips.validateCircuitInputTranslationSchema(schema)) {
      throw new BadRequestException('TODO: Exact error');
    }
  }

  public updateCircuitInputTranslationSchema(
    workstepToUpdate: Workstep,
    schema: string,
  ): void {
    workstepToUpdate.updateCircuitInputTranslationSchema(schema);
  }

  public async fetchDeleteCandidateAndThrowIfDeleteValidationFails(
    id: string,
  ): Promise<Workstep> {
    const workstepToDelete = await this.storageAgent.getWorkstepById(id);

    if (!workstepToDelete) {
      throw new NotFoundException(NOT_FOUND_ERR_MESSAGE);
    }

    return workstepToDelete;
  }
}
