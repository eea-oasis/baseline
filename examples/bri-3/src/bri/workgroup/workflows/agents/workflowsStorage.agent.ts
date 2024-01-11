import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import { Injectable, NotFoundException } from '@nestjs/common';
import { WORKFLOW_NOT_FOUND_ERR_MESSAGE } from '../api/err.messages';
import { Workflow } from '../models/workflow';
import { BpiAccount, Workflow as WorkflowModel } from '@prisma/client';
import { PrismaService } from '../../../../shared/prisma/prisma.service';
import { PrismaPromise } from '@prisma/client';
import { BpiAccountStorageAgent } from '../../../state/bpiAccounts/agents/bpiAccountsStorage.agent';

@Injectable()
export class WorkflowStorageAgent {
  constructor(
    @InjectMapper() private mapper: Mapper,
    private readonly prisma: PrismaService,
    private readonly bpiAccountStorageAgent: BpiAccountStorageAgent,
  ) {}

  async getWorkflowById(id: string): Promise<Workflow | undefined> {
    const workflowModel = await this.prisma.workflow.findUnique({
      where: { id: id },
      include: {
        worksteps: true,
        bpiAccount: true,
      },
    });

    if (!workflowModel) {
      throw new NotFoundException(WORKFLOW_NOT_FOUND_ERR_MESSAGE);
    }

    return this.mapper.map(workflowModel, Workflow, Workflow);
  }

  async getAllWorkflows(): Promise<Workflow[]> {
    const workflowModels = await this.prisma.workflow.findMany({
      include: { worksteps: true },
    });
    return workflowModels.map((w) => {
      return this.mapper.map(w, Workflow, Workflow);
    });
  }

  async getWorkflowsByIds(ids: string[]): Promise<Workflow[]> {
    const workflowModels = await this.prisma.workflow.findMany({
      where: {
        id: { in: ids },
      },
      include: { worksteps: true },
    });
    return workflowModels.map((w) => {
      return this.mapper.map(w, Workflow, Workflow);
    });
  }

  storeNewWorkflow(workflow: Workflow): PrismaPromise<WorkflowModel> {
    const workstepIds = workflow.worksteps.map((w) => {
      return {
        id: w.id,
      };
    });

    return this.prisma.workflow.create({
      data: {
        id: workflow.id,
        name: workflow.name,
        worksteps: {
          connect: workstepIds,
        },
        workgroupId: workflow.workgroupId,
        bpiAccountId: workflow.bpiAccountId,
      },
      include: {
        worksteps: true,
        bpiAccount: true,
      },
    });
  }

  async updateWorkflow(workflow: Workflow): Promise<Workflow> {
    const workstepIds = workflow.worksteps.map((w) => {
      return {
        id: w.id,
      };
    });

    const updatedWorkflowModel = await this.prisma.workflow.update({
      where: { id: workflow.id },
      data: {
        name: workflow.name,
        worksteps: {
          set: workstepIds,
        },
        workgroupId: workflow.workgroupId,
      },
      include: {
        worksteps: true,
      },
    });

    return this.mapper.map(updatedWorkflowModel, Workflow, Workflow);
  }

  async deleteWorkflow(workflow: Workflow): Promise<void> {
    await this.prisma.workflow.delete({
      where: { id: workflow.id },
    });
  }

  async storeWorkflowTransaction(
    bpiAccountCandidate: BpiAccount,
    workflowCandidate: Workflow,
  ): Promise<any> {
    const boundStoreNewWorkflow = this.storeNewWorkflow.bind(this);
    const boundStoreNewBpiAccount =
      this.bpiAccountStorageAgent.storeNewBpiAccount.bind(
        this.bpiAccountStorageAgent,
      );
    const results = await this.prisma.executeTransaction(() => {
      return boundStoreNewBpiAccount(bpiAccountCandidate).then(
        (newBpiAccount: { id: string }) => {
          workflowCandidate.bpiAccountId = newBpiAccount.id;
          return boundStoreNewWorkflow(workflowCandidate);
        },
      );
    });
    return results;
  }
}
