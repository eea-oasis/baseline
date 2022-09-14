import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { BpiSubjectAgent } from "../../agents/bpiSubjects.agent";
import { BpiSubjectRepository } from "../../persistence/bpiSubjects.repository";
import { UpdateBpiSubjectCommand } from "./updateBpiSubject.command";

@CommandHandler(UpdateBpiSubjectCommand)
export class UpdateBpiSubjectCommandHandler implements ICommandHandler<UpdateBpiSubjectCommand> {
  constructor(private agent: BpiSubjectAgent, private repo: BpiSubjectRepository) {}

  async execute(command: UpdateBpiSubjectCommand) {
    const bpiSubjectToUpdate = await this.agent.fetchUpdateCandidateAndThrowIfUpdateValidationFails(command.id, command.name, command.desc, command.publicKey);

    this.agent.updateBpiSubject(bpiSubjectToUpdate, command.name, command.desc, command.publicKey);

    await this.repo.updateBpiSubject(bpiSubjectToUpdate);
    
    return;
  }
}