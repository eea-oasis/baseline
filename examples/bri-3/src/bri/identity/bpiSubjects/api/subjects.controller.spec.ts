import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import { BpiSubjectAgent } from '../agents/bpiSubjects.agent';
import { CreateBpiSubjectCommandHandler } from '../capabilities/createBpiSubject/createBpiSubjectCommand.handler';
import { DeleteBpiSubjectCommandHandler } from '../capabilities/deleteBpiSubject/deleteBpiSubjectCommand.handler';
import { GetAllBpiSubjectsQueryHandler } from '../capabilities/getAllBpiSubjects/getAllBpiSubjectsQuery.handler';
import { GetBpiSubjectByIdQueryHandler } from '../capabilities/getBpiSubjectById/getBpiSubjectByIdQuery.handler';
import { UpdateBpiSubjectCommandHandler } from '../capabilities/updateBpiSubject/updateBpiSubjectCommand.handler';
import { BpiSubjectStorageAgent } from '../agents/bpiSubjectsStorage.agent';
import { CreateBpiSubjectDto } from './dtos/request/createBpiSubject.dto';
import { UpdateBpiSubjectDto } from './dtos/request/updateBpiSubject.dto';
import { NAME_EMPTY_ERR_MESSAGE, NOT_FOUND_ERR_MESSAGE } from './err.messages';
import { SubjectController } from './subjects.controller';
import { SubjectsProfile } from '../subjects.profile';
import { AutomapperModule } from '@automapper/nestjs';
import { classes } from '@automapper/classes';
import { validate as uuidValidate, version as uuidVersion } from 'uuid';
import { AuthzFactory } from '../../../authz/authz.factory';
import { AuthzModule } from '../../../authz/authz.module';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { BpiSubject } from '../models/bpiSubject';
import { uuid } from 'uuidv4';

describe('SubjectController', () => {
  let sController: SubjectController;
  let subjectStorageAgentMock: DeepMockProxy<BpiSubjectStorageAgent>;
  const existingBpiSubject1 = new BpiSubject(
    uuid(),
    'name',
    'description',
    [],
    [],
  );
  const existingBpiSubject2 = new BpiSubject(
    uuid(),
    'name2',
    'description2',
    [],
    [],
  );

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      imports: [
        CqrsModule,
        AutomapperModule.forRoot({
          strategyInitializer: classes(),
        }),
        AuthzModule,
      ],
      controllers: [SubjectController],
      providers: [
        BpiSubjectAgent,
        CreateBpiSubjectCommandHandler,
        UpdateBpiSubjectCommandHandler,
        DeleteBpiSubjectCommandHandler,
        GetBpiSubjectByIdQueryHandler,
        GetAllBpiSubjectsQueryHandler,
        BpiSubjectStorageAgent,
        SubjectsProfile,
        AuthzFactory,
      ],
    })
      .overrideProvider(BpiSubjectStorageAgent)
      .useValue(mockDeep<BpiSubjectStorageAgent>())
      .compile();

    sController = app.get<SubjectController>(SubjectController);
    subjectStorageAgentMock = app.get(BpiSubjectStorageAgent);

    await app.init();
  });

  describe('getBpiSubjectById', () => {
    it('should throw NotFound if non existent id passed', () => {
      // Arrange
      const nonExistentId = '123';

      // Act and assert
      expect(async () => {
        await sController.getBpiSubjectById(nonExistentId);
      }).rejects.toThrow(new NotFoundException(NOT_FOUND_ERR_MESSAGE));
    });

    it('should return the correct bpi subject if proper id passed ', async () => {
      // Arrange
      subjectStorageAgentMock.getBpiSubjectById.mockResolvedValueOnce(
        existingBpiSubject1,
      );

      // Act
      const fetchedBpiSubject = await sController.getBpiSubjectById(
        existingBpiSubject1.id,
      );

      // Assert
      expect(fetchedBpiSubject.id).toEqual(existingBpiSubject1.id);
      expect(fetchedBpiSubject.name).toEqual(existingBpiSubject1.name);
      expect(fetchedBpiSubject.description).toEqual(
        existingBpiSubject1.description,
      );
      expect(fetchedBpiSubject.publicKeys).toEqual(
        existingBpiSubject1.publicKeys,
      );
    });
  });

  describe('getAllBpiSubjects', () => {
    it('should return empty array if no bpi subjects ', async () => {
      // Arrange
      subjectStorageAgentMock.getAllBpiSubjects.mockResolvedValueOnce([]);

      // Act
      const bpiSubjects = await sController.getAllBpiSubjects();

      // Assert
      expect(bpiSubjects.length).toEqual(0);
    });

    it('should return 2 bpi subjects if 2 exists ', async () => {
      // Arrange
      subjectStorageAgentMock.getAllBpiSubjects.mockResolvedValueOnce([
        existingBpiSubject1,
        existingBpiSubject2,
      ]);

      // Act
      const bpiSubjects = await sController.getAllBpiSubjects();

      //Assert
      expect(bpiSubjects.length).toEqual(2);
      expect(bpiSubjects[0].id).toEqual(existingBpiSubject1.id);
      expect(bpiSubjects[0].name).toEqual(existingBpiSubject1.name);
      expect(bpiSubjects[0].description).toEqual(
        existingBpiSubject1.description,
      );
      expect(bpiSubjects[0].publicKeys).toEqual(existingBpiSubject1.publicKeys);
      expect(bpiSubjects[1].id).toEqual(existingBpiSubject2.id);
      expect(bpiSubjects[1].name).toEqual(existingBpiSubject2.name);
      expect(bpiSubjects[1].description).toEqual(
        existingBpiSubject2.description,
      );
      expect(bpiSubjects[1].publicKeys).toEqual(existingBpiSubject2.publicKeys);
    });
  });

  describe('createBpiSubject', () => {
    it('should throw BadRequest if name not provided', () => {
      // Arrange
      const requestDto = {
        name: 'BpiSubject',
        desc: 'desc',
        publicKeys: [
          { type: 'ecdsa', value: 'ecdsaPk' },
          { type: 'ecdsa', value: 'ecdsaPk' },
        ],
      } as CreateBpiSubjectDto;

      // Act and assert
      expect(async () => {
        await sController.createBpiSubject(requestDto);
      }).rejects.toThrow(new BadRequestException(NAME_EMPTY_ERR_MESSAGE));
    });

    it('should return new uuid from the created bpi subject when all params provided', async () => {
      // Arrange
      const requestDto = {
        name: 'name',
        desc: 'desc',
        publicKeys: [
          { type: 'ecdsa', value: 'ecdsaPk' },
          { type: 'ecdsa', value: 'ecdsaPk' },
        ],
      } as CreateBpiSubjectDto;
      subjectStorageAgentMock.storeNewBpiSubject.mockResolvedValueOnce(
        existingBpiSubject1,
      );

      // Act
      const response = await sController.createBpiSubject(requestDto);

      // Assert
      expect(uuidValidate(response));
      expect(uuidVersion(response)).toEqual(4);
    });
  });

  describe('updateBpiSubject', () => {
    it('should throw NotFound if non existent id passed', () => {
      // Arrange
      const nonExistentId = '123';
      const requestDto = {
        name: 'name',
        desc: 'desc',
        publicKeys: [
          { type: 'ecdsa', value: 'ecdsaPk' },
          { type: 'ecdsa', value: 'ecdsaPk' },
        ],
      } as UpdateBpiSubjectDto;

      // Act and assert
      expect(async () => {
        await sController.updateBpiSubject(nonExistentId, requestDto);
      }).rejects.toThrow(new NotFoundException(NOT_FOUND_ERR_MESSAGE));
    });

    it('should perform the update if existing id passed', async () => {
      // Arrange
      subjectStorageAgentMock.getBpiSubjectById.mockResolvedValueOnce(
        existingBpiSubject1,
      );
      const updateRequestDto = {
        name: 'name2',
        desc: 'desc2',
        publicKeys: [
          { type: 'ecdsa', value: 'ecdsaPk' },
          { type: 'ecdsa', value: 'ecdsaPk' },
        ],
      } as UpdateBpiSubjectDto;
      subjectStorageAgentMock.updateBpiSubject.mockResolvedValueOnce({
        ...existingBpiSubject1,
        name: updateRequestDto.name,
        description: updateRequestDto.desc,
        publicKeys: updateRequestDto.publicKeys,
      } as BpiSubject);

      // Act
      const updatedBpiSubject = await sController.updateBpiSubject(
        existingBpiSubject1.id,
        updateRequestDto,
      );

      // Assert
      expect(updatedBpiSubject.id).toEqual(existingBpiSubject1.id);
      expect(updatedBpiSubject.name).toEqual(updateRequestDto.name);
      expect(updatedBpiSubject.description).toEqual(updateRequestDto.desc);
      expect(updatedBpiSubject.publicKeys).toEqual(updateRequestDto.publicKeys);
    });
  });

  describe('deleteBpiSubject', () => {
    it('should throw NotFound if non existent id passed', () => {
      // Arrange
      const nonExistentId = '123';
      // Act and assert
      expect(async () => {
        await sController.deleteBpiSubject(nonExistentId);
      }).rejects.toThrow(new NotFoundException(NOT_FOUND_ERR_MESSAGE));
    });

    it('should perform the delete if existing id passed', async () => {
      // Arrange
      subjectStorageAgentMock.getBpiSubjectById.mockResolvedValueOnce(
        existingBpiSubject1,
      );

      // Act
      await sController.deleteBpiSubject(existingBpiSubject1.id);
    });
  });
});
