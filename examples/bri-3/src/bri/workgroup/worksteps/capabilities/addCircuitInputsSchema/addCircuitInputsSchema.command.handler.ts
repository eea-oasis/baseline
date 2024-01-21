import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { WorkstepAgent } from '../../agents/worksteps.agent';
import { WorkstepStorageAgent } from '../../agents/workstepsStorage.agent';
import { AddCircuitInputsSchemaCommand } from './addCircuitInputsSchema.command';
import { InjectMapper } from '@automapper/nestjs';
import { Mapper } from '@automapper/core';
import { Workstep } from '../../models/workstep';
import { WorkstepDto } from '../../api/dtos/response/workstep.dto';

@CommandHandler(AddCircuitInputsSchemaCommand)
export class AddCircuitInputsSchemaCommandHandler
  implements ICommandHandler<AddCircuitInputsSchemaCommand>
{
  constructor(
    @InjectMapper() private readonly mapper: Mapper,
    private agent: WorkstepAgent,
    private storageAgent: WorkstepStorageAgent,
  ) {}

  async execute(command: AddCircuitInputsSchemaCommand) {
    const workstepToUpdate =
      await this.agent.fetchUpdateCandidateAndThrowIfUpdateValidationFails(
        command.workstepId,
      );

    this.agent.throwIfCircuitInputTranslationSchemaInvalid(
      command.schema
    );

    this.agent.updateCircuitInputTranslationSchema(
      workstepToUpdate,
      command.schema,
    );

    const updatedWorkstep = await this.storageAgent.updateWorkstep(
      workstepToUpdate,
    );

    return this.mapper.map(updatedWorkstep, Workstep, WorkstepDto);
  }
}
