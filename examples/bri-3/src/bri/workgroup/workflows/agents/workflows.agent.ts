import { Injectable, NotFoundException } from '@nestjs/common';
import { Workstep } from '../../worksteps/models/workstep';
import { Workflow } from '../models/workflow';
import { v4 } from 'uuid';
import {
  WORKFLOW_NOT_FOUND_ERR_MESSAGE,
  WORKSTEP_NOT_FOUND_ERR_MESSAGE,
} from '../api/err.messages';
import { WorkflowStorageAgent } from './workflowsStorage.agent';
import { WorkstepStorageAgent } from '../../worksteps/agents/workstepsStorage.agent';

@Injectable()
export class WorkflowAgent {
  constructor(
    private workflowStorageAgent: WorkflowStorageAgent,
    private workstepStorageAgent: WorkstepStorageAgent,
  ) {}

  public async fetchWorkstepCandidatesForWorkflowAndThrowIfExistenceValidationFails(
    workstepIds: string[],
  ): Promise<Workstep[]> {
    const worksteps = await this.workstepStorageAgent.getMatchingWorkstepsById(
      workstepIds,
    );

    if (Array.isArray(worksteps) && !worksteps.length) {
      throw new NotFoundException(WORKSTEP_NOT_FOUND_ERR_MESSAGE);
    }

    return worksteps;
  }

  public createNewWorkflow(
    name: string,
    worksteps: Workstep[],
    workgroupId: string,
  ): Workflow {
    return new Workflow(v4(), name, worksteps, workgroupId);
  }

  public async fetchUpdateCandidateAndThrowIfUpdateValidationFails(
    id: string,
  ): Promise<Workflow> {
    const workflowToUpdate = await this.workflowStorageAgent.getWorkflowById(
      id,
    );

    if (!workflowToUpdate) {
      throw new NotFoundException(WORKFLOW_NOT_FOUND_ERR_MESSAGE);
    }

    return workflowToUpdate;
  }

  public updateWorkflow(
    workflowToUpdate: Workflow,
    name: string,
    worksteps: Workstep[],
    workgroupId: string,
  ) {
    workflowToUpdate.updateName(name);
    workflowToUpdate.updateWorksteps(worksteps);
    workflowToUpdate.updateWorkgroupId(workgroupId);
  }

  public async fetchDeleteCandidateAndThrowIfDeleteValidationFails(
    id: string,
  ): Promise<Workflow> {
    const workflowToDelete = await this.workflowStorageAgent.getWorkflowById(
      id,
    );

    if (!workflowToDelete) {
      throw new NotFoundException(WORKFLOW_NOT_FOUND_ERR_MESSAGE);
    }

    return workflowToDelete;
  }
}
