import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';

import { NOT_FOUND_ERR_MESSAGE } from './err.messages';
import { NOT_FOUND_ERR_MESSAGE as SUBJECT_ACCOUNT_NOT_FOUND_ERR_MESSAGE } from '../../bpiSubjectAccounts/api/err.messages';
import { AccountController } from './accounts.controller';
import { BpiAccountStorageAgent } from '../agents/bpiAccountsStorage.agent';
import { BpiAccountAgent } from '../agents/bpiAccounts.agent';
import { CreateBpiAccountCommandHandler } from '../capabilities/createBpiAccount/createBpiAccountCommand.handler';
import { DeleteBpiAccountCommandHandler } from '../capabilities/deleteBpiAccount/deleteBpiAccountCommand.handler';
import { GetAllBpiAccountsQueryHandler } from '../capabilities/getAllBpiAccounts/getAllBpiAccountQuery.handler';
import { GetBpiAccountByIdQueryHandler } from '../capabilities/getBpiAccountById/getBpiAccountByIdQuery.handler';
import { UpdateBpiAccountCommandHandler } from '../capabilities/updateBpiAccount/updateBpiAccountCommand.handler';
import { BpiSubjectAccountAgent } from '../../bpiSubjectAccounts/agents/bpiSubjectAccounts.agent';
import { BpiSubjectAccountStorageAgent } from '../../bpiSubjectAccounts/agents/bpiSubjectAccountsStorage.agent';
import { CreateBpiAccountDto } from './dtos/request/createBpiAccount.dto';
import { validate as uuidValidate, version as uuidVersion } from 'uuid';
import { BpiSubjectStorageAgent } from '../../bpiSubjects/agents/bpiSubjectsStorage.agent';
import { BpiSubject } from '../../bpiSubjects/models/bpiSubject';
import { BpiSubjectAccount } from '../../bpiSubjectAccounts/models/bpiSubjectAccount';
import { AccountsProfile } from '../accounts.profile';
import { AutomapperModule } from '@automapper/nestjs';
import { classes } from '@automapper/classes';
import { SubjectsProfile } from '../../bpiSubjects/subjects.profile';
import { SubjectAccountsProfile } from '../../bpiSubjectAccounts/subjectAccounts.profile';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { BpiAccount } from '../models/bpiAccount';
import { uuid } from 'uuidv4';

describe('AccountController', () => {
  let accountController: AccountController;
  let accountStorageAgentMock: DeepMockProxy<BpiAccountStorageAgent>;
  let subjectAccountStorageAgentMock: DeepMockProxy<BpiSubjectAccountStorageAgent>;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      imports: [
        CqrsModule,
        AutomapperModule.forRoot({
          strategyInitializer: classes(),
        }),
      ],
      controllers: [AccountController],
      providers: [
        CreateBpiAccountCommandHandler,
        UpdateBpiAccountCommandHandler,
        DeleteBpiAccountCommandHandler,
        GetBpiAccountByIdQueryHandler,
        GetAllBpiAccountsQueryHandler,
        BpiAccountAgent,
        BpiAccountStorageAgent,
        BpiSubjectStorageAgent,
        BpiSubjectAccountAgent,
        BpiSubjectAccountStorageAgent,
        SubjectsProfile,
        SubjectAccountsProfile,
        AccountsProfile,
      ],
    })
      .overrideProvider(BpiAccountStorageAgent)
      .useValue(mockDeep<BpiAccountStorageAgent>())
      .overrideProvider(BpiSubjectAccountStorageAgent)
      .useValue(mockDeep<BpiSubjectAccountStorageAgent>())
      .overrideProvider(BpiSubjectStorageAgent)
      .useValue(mockDeep<BpiSubjectStorageAgent>())
      .compile();

    accountController = app.get<AccountController>(AccountController);
    accountStorageAgentMock = app.get(BpiAccountStorageAgent);
    subjectAccountStorageAgentMock = app.get(BpiSubjectAccountStorageAgent);

    await app.init();
  });

  const createBpiSubjectAccount = () => {
    const ownerBpiSubject = new BpiSubject(
      '123',
      'owner',
      'desc',
      'publicKey',
      [],
    );
    const creatorBpiSubject = new BpiSubject(
      '321',
      'creator',
      'desc',
      'publicKey',
      [],
    );
    return new BpiSubjectAccount(
      '123',
      creatorBpiSubject,
      ownerBpiSubject,
      'sample policy',
      'sample policy',
      'sample key',
      'sample vc',
    );
  };

  const createBpiAccount = (ownerBpiSubjectAccounts: BpiSubjectAccount[]) => {
    return new BpiAccount(uuid(), ownerBpiSubjectAccounts, '', '', '');
  };

  describe('getBpiAccountById', () => {
    it('should throw NotFound if non existent id passed', () => {
      // Arrange
      const nonExistentId = '123';
      accountStorageAgentMock.getAccountById.mockRejectedValueOnce(
        new NotFoundException(NOT_FOUND_ERR_MESSAGE),
      );

      // Act and assert
      expect(async () => {
        await accountController.getBpiAccountById(nonExistentId);
      }).rejects.toThrow(new NotFoundException(NOT_FOUND_ERR_MESSAGE));
    });

    it('should return the correct bpi account if proper id passed ', async () => {
      // Arrange
      const bpiSubjectAccount = createBpiSubjectAccount();
      const newBpiAccount = createBpiAccount([bpiSubjectAccount]);
      accountStorageAgentMock.getAccountById.mockResolvedValueOnce(
        newBpiAccount,
      );

      // Act
      const createdBpiAccount = await accountController.getBpiAccountById(
        newBpiAccount.id,
      );

      // Assert
      expect(createdBpiAccount.id).toEqual(newBpiAccount.id);
      expect(createdBpiAccount.nonce).toEqual(0);
      expect(createdBpiAccount.ownerBpiSubjectAccounts.length).toEqual(1);
      const ownerBpiSubjectAccount =
        createdBpiAccount.ownerBpiSubjectAccounts[0];
      expect(ownerBpiSubjectAccount.id).toEqual(bpiSubjectAccount.id);

      const ownerBpiSubject = ownerBpiSubjectAccount.ownerBpiSubject;
      const creatorBpiSubject = ownerBpiSubjectAccount.creatorBpiSubject;
      expect(ownerBpiSubject.id).toEqual(bpiSubjectAccount.ownerBpiSubject.id);
      expect(creatorBpiSubject.id).toEqual(
        bpiSubjectAccount.creatorBpiSubject.id,
      );
    });
  });

  describe('getAllBpiAccounts', () => {
    it('should return empty array if no bpi accounts ', async () => {
      // Arrange
      accountStorageAgentMock.getAllBpiAccounts.mockResolvedValueOnce([]);
      // Act
      const bpiAccounts = await accountController.getAllBpiAccounts();

      // Assert
      expect(bpiAccounts.length).toEqual(0);
    });

    it('should return 2 bpi accounts if 2 exists ', async () => {
      // Arrange
      const bpiSubjectAccount = createBpiSubjectAccount();
      const firstBpiAccount = createBpiAccount([bpiSubjectAccount]);
      const secondBpiAccount = createBpiAccount([bpiSubjectAccount]);
      accountStorageAgentMock.getAllBpiAccounts.mockResolvedValueOnce([
        firstBpiAccount,
        secondBpiAccount,
      ]);

      // Act
      const bpiAccounts = await accountController.getAllBpiAccounts();

      // Assert
      expect(bpiAccounts.length).toEqual(2);
      expect(bpiAccounts[0].id).toEqual(firstBpiAccount.id);
      expect(bpiAccounts[0].nonce).toEqual(0);
      expect(bpiAccounts[0].ownerBpiSubjectAccounts.length).toEqual(1);
      const firstOwnerBpiSubjectAccount =
        bpiAccounts[0].ownerBpiSubjectAccounts[0];
      expect(firstOwnerBpiSubjectAccount.id).toEqual(bpiSubjectAccount.id);
      expect(firstOwnerBpiSubjectAccount.creatorBpiSubject.id).toEqual(
        bpiSubjectAccount.creatorBpiSubject.id,
      );
      expect(firstOwnerBpiSubjectAccount.ownerBpiSubject.id).toEqual(
        bpiSubjectAccount.ownerBpiSubject.id,
      );

      expect(bpiAccounts[1].id).toEqual(secondBpiAccount.id);
      expect(bpiAccounts[1].nonce).toEqual(0);
      expect(bpiAccounts[1].ownerBpiSubjectAccounts.length).toEqual(1);
      const secondOwnerBpiSubjectAccount =
        bpiAccounts[0].ownerBpiSubjectAccounts[0];
      expect(secondOwnerBpiSubjectAccount.id).toEqual(bpiSubjectAccount.id);
      expect(secondOwnerBpiSubjectAccount.creatorBpiSubject.id).toEqual(
        bpiSubjectAccount.creatorBpiSubject.id,
      );
      expect(secondOwnerBpiSubjectAccount.ownerBpiSubject.id).toEqual(
        bpiSubjectAccount.ownerBpiSubject.id,
      );
    });
  });

  describe('createBpiAccount', () => {
    it('should throw BadRequest if non existent owner provided', async () => {
      // Arrange
      const requestDto = {
        ownerBpiSubjectAccountsIds: ['123'],
      } as CreateBpiAccountDto;
      subjectAccountStorageAgentMock.getBpiSubjectAccountById.mockRejectedValueOnce(
        new NotFoundException(SUBJECT_ACCOUNT_NOT_FOUND_ERR_MESSAGE),
      );

      // Act and assert
      expect(async () => {
        await accountController.createBpiAccount(requestDto);
      }).rejects.toThrow(
        new BadRequestException(SUBJECT_ACCOUNT_NOT_FOUND_ERR_MESSAGE),
      );
    });

    it('should return new uuid from the created bpi account when all params provided', async () => {
      // Arrange
      const bpiSubjectAccount = createBpiSubjectAccount();

      subjectAccountStorageAgentMock.getBpiSubjectAccountById.mockResolvedValueOnce(
        bpiSubjectAccount,
      );

      const requestDto = {
        ownerBpiSubjectAccountsIds: [bpiSubjectAccount.id],
      } as CreateBpiAccountDto;

      const expectedBpiAcount = createBpiAccount([bpiSubjectAccount]);
      accountStorageAgentMock.storeNewBpiAccount.mockResolvedValueOnce(
        expectedBpiAcount,
      );

      // Act
      const newBpiAccount = await accountController.createBpiAccount(
        requestDto,
      );

      // Assert
      expect(uuidValidate(newBpiAccount));
      expect(uuidVersion(newBpiAccount)).toEqual(4);
    });
  });

  describe('deleteBpiAccount', () => {
    it('should throw NotFound if non existent id passed', () => {
      // Arrange
      const nonExistentId = '123';
      accountStorageAgentMock.getAccountById.mockRejectedValueOnce(
        new NotFoundException(NOT_FOUND_ERR_MESSAGE),
      );

      // Act and assert
      expect(async () => {
        await accountController.deleteBpiAccount(nonExistentId);
      }).rejects.toThrow(new NotFoundException(NOT_FOUND_ERR_MESSAGE));
    });

    it('should perform the delete if existing id passed', async () => {
      // Arrange
      const bpiSubjectAccount = createBpiSubjectAccount();
      const newBpiAccount = createBpiAccount([bpiSubjectAccount]);
      accountStorageAgentMock.getAccountById.mockResolvedValueOnce(
        newBpiAccount,
      );

      // Act
      await accountController.deleteBpiAccount(newBpiAccount.id);
    });
  });
});
