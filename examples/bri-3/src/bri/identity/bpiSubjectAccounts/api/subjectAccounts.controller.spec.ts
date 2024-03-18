import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import { NOT_FOUND_ERR_MESSAGE } from './err.messages';
import { NOT_FOUND_ERR_MESSAGE as SUBJECT_NOT_FOUND_ERR_MESSAGE } from '../../bpiSubjects/api/err.messages';
import { validate as uuidValidate, version as uuidVersion } from 'uuid';
import { SubjectAccountController } from './subjectAccounts.controller';
import { BpiSubjectAccountAgent } from '../agents/bpiSubjectAccounts.agent';
import { BpiSubjectAccountStorageAgent } from '../agents/bpiSubjectAccountsStorage.agent';
import { CreateBpiSubjectAccountCommandHandler } from '../capabilities/createBpiSubjectAccount/createBpiSubjectAccountCommand.handler';
import { DeleteBpiSubjectAccountCommandHandler } from '../capabilities/deleteBpiSubjectAccount/deleteBpiSubjectAccountCommand.handler';
import { GetAllBpiSubjectAccountsQueryHandler } from '../capabilities/getAllBpiSubjectAccounts/getAllBpiSubjectAccountsQuery.handler';
import { GetBpiSubjectAccountByIdQueryHandler } from '../capabilities/getBpiSubjectAccountById/getBpiSubjectAccountByIdQuery.handler';
import { UpdateBpiSubjectAccountCommandHandler } from '../capabilities/updateBpiSubjectAccount/updateBpiSubjectAccountCommand.handler';
import { CreateBpiSubjectAccountDto } from './dtos/request/createBpiSubjectAccount.dto';
import { BpiSubjectStorageAgent } from '../../bpiSubjects/agents/bpiSubjectsStorage.agent';
import { BpiSubject } from '../../bpiSubjects/models/bpiSubject';
import { SubjectAccountsProfile } from '../subjectAccounts.profile';
import { AutomapperModule } from '@automapper/nestjs';
import { classes } from '@automapper/classes';
import { SubjectsProfile } from '../../bpiSubjects/subjects.profile';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { BpiSubjectAccount } from '../models/bpiSubjectAccount';
import { uuid } from 'uuidv4';
import { PublicKey, PublicKeyType } from '../../bpiSubjects/models/publicKey';

describe('SubjectAccountController', () => {
  let subjectAccountController: SubjectAccountController;
  let subjectAccountStorageAgentMock: DeepMockProxy<BpiSubjectAccountStorageAgent>;
  let subjectStorageAgentMock: DeepMockProxy<BpiSubjectStorageAgent>;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      imports: [
        CqrsModule,
        AutomapperModule.forRoot({
          strategyInitializer: classes(),
        }),
      ],
      controllers: [SubjectAccountController],
      providers: [
        BpiSubjectAccountAgent,
        BpiSubjectAccountStorageAgent,
        BpiSubjectStorageAgent,
        CreateBpiSubjectAccountCommandHandler,
        UpdateBpiSubjectAccountCommandHandler,
        DeleteBpiSubjectAccountCommandHandler,
        GetBpiSubjectAccountByIdQueryHandler,
        GetAllBpiSubjectAccountsQueryHandler,
        SubjectsProfile,
        SubjectAccountsProfile,
      ],
    })
      .overrideProvider(BpiSubjectAccountStorageAgent)
      .useValue(mockDeep<BpiSubjectAccountStorageAgent>())
      .overrideProvider(BpiSubjectStorageAgent)
      .useValue(mockDeep<BpiSubjectStorageAgent>())
      .compile();

    subjectAccountController = app.get<SubjectAccountController>(
      SubjectAccountController,
    );
    subjectAccountStorageAgentMock = app.get(BpiSubjectAccountStorageAgent);
    subjectStorageAgentMock = app.get(BpiSubjectStorageAgent);

    await app.init();
  });

  const createBpiSubjectAccount = async () => {
    const publicKeys = [
      new PublicKey('111', PublicKeyType.ECDSA, 'ecdsaPk', '123'),
      new PublicKey('112', PublicKeyType.EDDSA, 'eddsaPk', '123'),
    ];
    const ownerBpiSubject = new BpiSubject(
      '123',
      'owner',
      'desc',
      publicKeys,
      [],
    );
    const creatorBpiSubject = new BpiSubject(
      '321',
      'creator',
      'desc',
      publicKeys,
      [],
    );

    const bpiSubjectAccount = new BpiSubjectAccount(
      uuid(),
      creatorBpiSubject,
      ownerBpiSubject,
      'sample',
      'sample',
      'sample',
      'sample',
    );
    return {
      bpiSubjectAccount,
      ownerBpiSubject,
      creatorBpiSubject,
    };
  };

  describe('getBpiSubjectAccountById', () => {
    it('should throw NotFound if non existent id passed', () => {
      // Arrange
      const nonExistentId = '123';
      subjectAccountStorageAgentMock.getBpiSubjectAccountById.mockResolvedValueOnce(
        undefined,
      );

      // Act and assert
      expect(async () => {
        await subjectAccountController.getBpiSubjectAccountById(nonExistentId);
      }).rejects.toThrow(new NotFoundException(NOT_FOUND_ERR_MESSAGE));
    });

    it('should return the correct bpi subject account if proper id passed ', async () => {
      // Arrange
      const { bpiSubjectAccount, ownerBpiSubject, creatorBpiSubject } =
        await createBpiSubjectAccount();
      subjectAccountStorageAgentMock.getBpiSubjectAccountById.mockResolvedValueOnce(
        bpiSubjectAccount,
      );

      // Act
      const createdBpiAccount =
        await subjectAccountController.getBpiSubjectAccountById(
          bpiSubjectAccount.id,
        );

      // Assert
      expect(createdBpiAccount.id).toEqual(bpiSubjectAccount.id);
      expect(createdBpiAccount.creatorBpiSubject.id).toEqual(
        creatorBpiSubject.id,
      );
      expect(createdBpiAccount.ownerBpiSubject.id).toEqual(ownerBpiSubject.id);
    });
  });

  describe('getAllBpiSubjectAccounts', () => {
    it('should return empty array if no bpi accounts ', async () => {
      // Arrange
      subjectAccountStorageAgentMock.getAllBpiSubjectAccounts.mockResolvedValueOnce(
        [],
      );

      // Act
      const bpiSubjectAccounts =
        await subjectAccountController.getAllBpiSubjectAccounts();

      // Assert
      expect(bpiSubjectAccounts.length).toEqual(0);
    });

    it('should return 2 bpi subject accounts if 2 exists ', async () => {
      // Arrange
      const firstSubjectAccount = await createBpiSubjectAccount();
      const secondSubjectAccount = await createBpiSubjectAccount();
      subjectAccountStorageAgentMock.getAllBpiSubjectAccounts.mockResolvedValueOnce(
        [
          firstSubjectAccount.bpiSubjectAccount,
          secondSubjectAccount.bpiSubjectAccount,
        ],
      );

      // Act
      const bpiSubjectAccounts =
        await subjectAccountController.getAllBpiSubjectAccounts();

      // Assert
      expect(bpiSubjectAccounts.length).toEqual(2);
      expect(bpiSubjectAccounts[0].id).toEqual(
        firstSubjectAccount.bpiSubjectAccount.id,
      );
      expect(bpiSubjectAccounts[0].ownerBpiSubject.id).toEqual(
        firstSubjectAccount.ownerBpiSubject.id,
      );
      expect(bpiSubjectAccounts[0].creatorBpiSubject.id).toEqual(
        firstSubjectAccount.creatorBpiSubject.id,
      );

      expect(bpiSubjectAccounts[1].id).toEqual(
        secondSubjectAccount.bpiSubjectAccount.id,
      );
      expect(bpiSubjectAccounts[1].ownerBpiSubject.id).toEqual(
        secondSubjectAccount.ownerBpiSubject.id,
      );
      expect(bpiSubjectAccounts[1].creatorBpiSubject.id).toEqual(
        secondSubjectAccount.creatorBpiSubject.id,
      );
    });
  });

  describe('createBpiSubjectAccount', () => {
    it('should throw BadRequest if non existent creator provided', async () => {
      // Arrange
      const publicKeys = [
        new PublicKey('111', PublicKeyType.ECDSA, 'ecdsaPk', '123'),
        new PublicKey('112', PublicKeyType.EDDSA, 'eddsaPk', '123'),
      ];
      const ownerBpiSubject = new BpiSubject(
        '123',
        'owner',
        'desc',
        publicKeys,
        [],
      );
      const creatorBpiSubjectId = 'not-existing-id';

      const requestDto = {
        creatorBpiSubjectId: creatorBpiSubjectId,
        ownerBpiSubjectId: ownerBpiSubject.id,
      } as CreateBpiSubjectAccountDto;

      // Act and assert
      expect(async () => {
        await subjectAccountController.createBpiSubjectAccount(requestDto);
      }).rejects.toThrow(
        new BadRequestException(SUBJECT_NOT_FOUND_ERR_MESSAGE),
      );
    });

    it('should throw BadRequest if non existent owner provided', async () => {
      // Arrange
      const publicKeys = [
        new PublicKey('111', PublicKeyType.ECDSA, 'ecdsaPk', '123'),
        new PublicKey('112', PublicKeyType.EDDSA, 'eddsaPk', '123'),
      ];
      const creatorBpiSubject = new BpiSubject(
        '123',
        'creator',
        'desc',
        publicKeys,
        [],
      );
      const ownerBpiSubjectId = 'not-existing-id';

      //Sample data provided
      const requestDto = {
        creatorBpiSubjectId: creatorBpiSubject.id,
        ownerBpiSubjectId: ownerBpiSubjectId,
        authenticationPoliy: 'sample',
        authorizationPolicy: 'sample',
        verifiableCredential: 'sample',
        recoveryKey: 'sample',
      } as CreateBpiSubjectAccountDto;

      // Act and assert
      expect(async () => {
        await subjectAccountController.createBpiSubjectAccount(requestDto);
      }).rejects.toThrow(
        new BadRequestException(SUBJECT_NOT_FOUND_ERR_MESSAGE),
      );
    });

    it('should return new uuid from the created bpi subject account when all params provided', async () => {
      // Arrange
      const { bpiSubjectAccount: expectedBpiSubjectAccount } =
        await createBpiSubjectAccount();

      const subjectAccountDto = {
        creatorBpiSubjectId: expectedBpiSubjectAccount.creatorBpiSubject.id,
        ownerBpiSubjectId: expectedBpiSubjectAccount.ownerBpiSubject.id,
        authenticationPoliy: 'sample',
        authorizationPolicy: 'sample',
        verifiableCredential: 'sample',
        recoveryKey: 'sample',
      } as CreateBpiSubjectAccountDto;
      subjectStorageAgentMock.getBpiSubjectById.mockResolvedValueOnce(
        expectedBpiSubjectAccount.creatorBpiSubject,
      );
      subjectStorageAgentMock.getBpiSubjectById.mockResolvedValueOnce(
        expectedBpiSubjectAccount.ownerBpiSubject,
      );

      subjectAccountStorageAgentMock.storeNewBpiSubjectAccount.mockResolvedValueOnce(
        expectedBpiSubjectAccount,
      );

      // Act
      const bpiSubjectAccountId =
        await subjectAccountController.createBpiSubjectAccount(
          subjectAccountDto,
        );

      // Assert
      expect(uuidValidate(bpiSubjectAccountId));
      expect(uuidVersion(bpiSubjectAccountId)).toEqual(4);
    });
  });

  describe('deleteBpiSubjectAccount', () => {
    it('should throw NotFound if non existent id passed', () => {
      // Arrange
      const nonExistentId = '123';
      subjectAccountStorageAgentMock.getBpiSubjectAccountById.mockResolvedValueOnce(
        undefined,
      );

      // Act and assert
      expect(async () => {
        await subjectAccountController.deleteBpiSubjectAccount(nonExistentId);
      }).rejects.toThrow(new NotFoundException(NOT_FOUND_ERR_MESSAGE));
    });

    it('should perform the delete if existing id passed', async () => {
      // Arrange and act
      const { bpiSubjectAccount } = await createBpiSubjectAccount();
      subjectAccountStorageAgentMock.getBpiSubjectAccountById.mockResolvedValueOnce(
        bpiSubjectAccount,
      );

      // Act
      await subjectAccountController.deleteBpiSubjectAccount(
        bpiSubjectAccount.id,
      );

      // Assert
      expect(async () => {
        await subjectAccountController.getBpiSubjectAccountById(
          bpiSubjectAccount.id,
        );
      }).rejects.toThrow(new NotFoundException(NOT_FOUND_ERR_MESSAGE));
    });
  });
});
