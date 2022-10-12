import { Injectable, NotFoundException } from '@nestjs/common';
import { v4 } from 'uuid';

import { NOT_FOUND_ERR_MESSAGE } from '../api/err.messages';
import { BpiSubjectAccountStorageAgent } from './bpiSubjectAccountsStorage.agent';
import { BpiSubjectAccount } from '../models/bpiSubjectAccount';
import { BpiSubject } from '../../bpiSubjects/models/bpiSubject';
import { BpiSubjectStorageAgent } from '../../bpiSubjects/agents/bpiSubjectsStorage.agent';

// Agent methods have extremely declarative names and perform a single task
@Injectable()
export class BpiSubjectAccountAgent {
  constructor(
    private storageAgent: BpiSubjectAccountStorageAgent,
    private storageSubjectAgent: BpiSubjectStorageAgent,
  ) {}

  public async getCreatorAndOwnerSubjectsAndThrowIfNotExist(
    creatorBpiSubjectId: string,
    ownerBpiSubjectId: string,
  ) {
    const creatorBpiSubject = await this.storageSubjectAgent.getBpiSubjectById(
      creatorBpiSubjectId,
    );
    const ownerBpiSubject = await this.storageSubjectAgent.getBpiSubjectById(
      ownerBpiSubjectId,
    );
    return {
      creatorBpiSubject,
      ownerBpiSubject,
    };
  }

  public throwIfCreateBpiSubjectAccountInputInvalid() {
    // This is just an example, these fields will be validated on the DTO validation layer
    // This validation would check internal business rules (i.e. bpiSubject must have public key in the format defined by the participants..)
  }

  public createNewBpiSubjectAccount(
    creatorBpiSubject: BpiSubject,
    ownerBpiSubject: BpiSubject,
  ): BpiSubjectAccount {
    return new BpiSubjectAccount(v4(), creatorBpiSubject, ownerBpiSubject);
  }

  public async fetchUpdateCandidateAndThrowIfUpdateValidationFails(
    id: string,
  ): Promise<BpiSubjectAccount> {
    const bpiSubjectAccountToUpdate =
      await this.storageAgent.getBpiSubjectAccountById(id);

    if (!bpiSubjectAccountToUpdate) {
      throw new NotFoundException(NOT_FOUND_ERR_MESSAGE);
    }

    return bpiSubjectAccountToUpdate;
  }

  public updateBpiSubjectAccount() {
    return;
  }

  public async fetchDeleteCandidateAndThrowIfDeleteValidationFails(
    id: string,
  ): Promise<BpiSubjectAccount> {
    const bpiSubjectAccountToDelete =
      await this.storageAgent.getBpiSubjectAccountById(id);

    if (!bpiSubjectAccountToDelete) {
      throw new NotFoundException(NOT_FOUND_ERR_MESSAGE);
    }

    return bpiSubjectAccountToDelete;
  }
}