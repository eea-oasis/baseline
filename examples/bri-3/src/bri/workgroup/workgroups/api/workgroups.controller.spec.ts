import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import { validate as uuidValidate, version as uuidVersion } from 'uuid';
import { WorkgroupAgent } from '../agents/workgroups.agent';
import { WorkgroupStorageAgent } from '../agents/workgroupStorage.agent';
import { CreateWorkgroupCommandHandler } from '../capabilities/createWorkgroup/createWorkgroupCommand.handler';
import { DeleteWorkgroupCommandHandler } from '../capabilities/deleteWorkgroup/deleteWorkgroupCommand.handler';
import { GetWorkgroupByIdQueryHandler } from '../capabilities/getWorkgroupById/getWorkgroupByIdQuery.handler';
import { UpdateWorkgroupCommandHandler } from '../capabilities/updateWorkgroup/updateWorkgroupCommand.handler';
import { CreateWorkgroupDto } from './dtos/request/createWorkgroup.dto';
import { UpdateWorkgroupDto } from './dtos/request/updateWorkgroup.dto';
import { WorkgroupController } from './workgroups.controller';
import { BpiSubject } from '../../../identity/bpiSubjects/models/bpiSubject';
import { BpiSubjectStorageAgent } from '../../../identity/bpiSubjects/agents/bpiSubjectsStorage.agent';
import {
  WORKGROUP_NOT_FOUND_ERR_MESSAGE,
  WORKGROUP_STATUS_NOT_ACTIVE_ERR_MESSAGE,
} from './err.messages';
import { SubjectModule } from '../../../identity/bpiSubjects/subjects.module';
import { AutomapperModule } from '@automapper/nestjs';
import { classes } from '@automapper/classes';
import { BpiSubjectAgent } from '../../../identity/bpiSubjects/agents/bpiSubjects.agent';
import { ArchiveWorkgroupCommandHandler } from '../capabilities/archiveWorkgroup/archiveWorkgroupCommand.handler';
import { Workgroup, WorkgroupStatus } from '../models/workgroup';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { uuid } from 'uuidv4';
import { WorkgroupProfile } from '../workgroups.profile';
import { PrismaService } from '../../../../shared/prisma/prisma.service';
import { PrismaClient } from '@prisma/client';
import {
  PublicKey,
  PublicKeyType,
} from '../../../identity/bpiSubjects/models/publicKey';

describe('WorkgroupsController', () => {
  let workgroupController: WorkgroupController;
  let workgroupStorageAgentMock: DeepMockProxy<WorkgroupStorageAgent>;
  let subjectStorageAgentMock: DeepMockProxy<BpiSubjectStorageAgent>;

  const publicKeys = [
    new PublicKey('111', PublicKeyType.ECDSA, 'ecdsaPk', '123'),
    new PublicKey('112', PublicKeyType.EDDSA, 'eddsaPk', '123'),
  ];
  const createTestBpiSubject = () => {
    return new BpiSubject('123', 'name', 'desc', publicKeys, []);
  };

  const createTestWorkgroup = (): Workgroup => {
    const bpiSubject = createTestBpiSubject();
    const workgroup = new Workgroup(
      uuid(),
      'name',
      [bpiSubject],
      'sec',
      'priv',
      [bpiSubject],
      [],
      [],
    );

    workgroup.updateStatus(WorkgroupStatus.ACTIVE);
    return workgroup;
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      imports: [
        CqrsModule,
        SubjectModule,
        AutomapperModule.forRoot({
          strategyInitializer: classes(),
        }),
      ],
      controllers: [WorkgroupController],
      providers: [
        WorkgroupAgent,
        BpiSubjectAgent,
        CreateWorkgroupCommandHandler,
        UpdateWorkgroupCommandHandler,
        ArchiveWorkgroupCommandHandler,
        DeleteWorkgroupCommandHandler,
        GetWorkgroupByIdQueryHandler,
        WorkgroupStorageAgent,
        WorkgroupProfile,
        PrismaService,
      ],
    })
      .overrideProvider(WorkgroupStorageAgent)
      .useValue(mockDeep<WorkgroupStorageAgent>())
      .overrideProvider(BpiSubjectStorageAgent)
      .useValue(mockDeep<BpiSubjectStorageAgent>())
      .overrideProvider(PrismaService)
      .useValue(mockDeep<PrismaClient>())
      .compile();

    workgroupController = app.get<WorkgroupController>(WorkgroupController);
    workgroupStorageAgentMock = app.get(WorkgroupStorageAgent);
    subjectStorageAgentMock = app.get(BpiSubjectStorageAgent);

    await app.init();
  });

  describe('getWorkgroupById', () => {
    it('should throw NotFound if non existent id passed', () => {
      // Arrange
      const nonExistentId = '123';
      workgroupStorageAgentMock.getWorkgroupById.mockRejectedValueOnce(
        new NotFoundException(WORKGROUP_NOT_FOUND_ERR_MESSAGE),
      );

      // Act and assert
      expect(async () => {
        await workgroupController.getWorkgroupById(nonExistentId);
      }).rejects.toThrow(
        new NotFoundException(WORKGROUP_NOT_FOUND_ERR_MESSAGE),
      );
    });

    it('should return the correct workgroup if proper id passed ', async () => {
      // Arrange
      const existingWorkgroup = createTestWorkgroup();
      workgroupStorageAgentMock.getWorkgroupById.mockResolvedValueOnce(
        existingWorkgroup,
      );

      // Act
      const createdWorkgroup = await workgroupController.getWorkgroupById(
        existingWorkgroup.id,
      );

      // Assert
      expect(createdWorkgroup.id).toEqual(existingWorkgroup.id);
    });
  });

  describe('createWorkgroup', () => {
    it('should return new uuid from the created workgroup when all necessary params provided', async () => {
      // Arrange
      const workgroup = createTestWorkgroup();
      workgroupStorageAgentMock.createNewWorkgroup.mockResolvedValueOnce(
        workgroup,
      );
      const workgroupRequestDto = {
        name: 'name',
        securityPolicy: 'sec',
        privacyPolicy: 'priv',
        workstepIds: [],
        workflowIds: [],
      } as CreateWorkgroupDto;

      // Act
      const response = await workgroupController.createWorkgroup(
        { bpiSubject: workgroup.administrators[0] },
        workgroupRequestDto,
      );
      // Assert
      expect(response).toEqual(workgroup.id);
      expect(uuidValidate(response));
      expect(uuidVersion(response)).toEqual(4);
    });
  });

  describe('updateWorkgroup', () => {
    it('should throw NotFound if non existent id passed', async () => {
      // Arrange
      const nonExistentId = '123';
      const newBpiSubject = createTestBpiSubject();

      const requestDto: UpdateWorkgroupDto = {
        name: 'name',
        administratorIds: [newBpiSubject.id],
        securityPolicy: 'sec',
        privacyPolicy: 'priv',
        participantIds: [newBpiSubject.id],
      };
      workgroupStorageAgentMock.getWorkgroupById.mockRejectedValueOnce(
        new NotFoundException(WORKGROUP_NOT_FOUND_ERR_MESSAGE),
      );
      subjectStorageAgentMock.getBpiSubjectsById.mockResolvedValueOnce([
        newBpiSubject,
      ]);
      subjectStorageAgentMock.getBpiSubjectsById.mockResolvedValueOnce([
        newBpiSubject,
      ]);

      // Act and assert
      expect(async () => {
        await workgroupController.updateWorkgroup(nonExistentId, requestDto);
      }).rejects.toThrow(
        new NotFoundException(WORKGROUP_NOT_FOUND_ERR_MESSAGE),
      );
    });

    it('should perform the update if existing id passed', async () => {
      // Arrange
      const newBpiSubject = createTestBpiSubject();
      const existingWorkgroup = createTestWorkgroup();
      workgroupStorageAgentMock.getWorkgroupById.mockResolvedValueOnce(
        existingWorkgroup,
      );

      const updateRequestDto: UpdateWorkgroupDto = {
        name: 'name',
        administratorIds: [newBpiSubject.id],
        securityPolicy: 'sec',
        privacyPolicy: 'priv',
        participantIds: [newBpiSubject.id],
      };
      workgroupStorageAgentMock.updateWorkgroup.mockResolvedValueOnce({
        ...existingWorkgroup,
        administrators: [newBpiSubject],
        participants: [newBpiSubject],
      } as Workgroup);
      subjectStorageAgentMock.getBpiSubjectsById.mockResolvedValueOnce([
        newBpiSubject,
      ]);
      subjectStorageAgentMock.getBpiSubjectsById.mockResolvedValueOnce([
        newBpiSubject,
      ]);

      // Act
      const updatedWorkgroup = await workgroupController.updateWorkgroup(
        existingWorkgroup.id,
        updateRequestDto,
      );

      // Assert
      expect(updatedWorkgroup.id).toEqual(existingWorkgroup.id);
      expect(updatedWorkgroup.administrators.map((ws) => ws.id)).toEqual(
        updateRequestDto.administratorIds,
      );
      expect(updatedWorkgroup.participants.map((p) => p.id)).toEqual(
        updateRequestDto.participantIds,
      );
      expect(updatedWorkgroup.name).toEqual(updateRequestDto.name);
    });
  });

  describe('archiveWorkgroup', () => {
    it('should throw NotFound if non existent id passed', async () => {
      // Arrange
      const nonExistentId = '123';
      workgroupStorageAgentMock.getWorkgroupById.mockRejectedValueOnce(
        new NotFoundException(WORKGROUP_NOT_FOUND_ERR_MESSAGE),
      );

      // Act and assert
      expect(async () => {
        await workgroupController.archiveWorkgroup(nonExistentId);
      }).rejects.toThrow(
        new NotFoundException(WORKGROUP_NOT_FOUND_ERR_MESSAGE),
      );
    });

    it('should throw BadRequest if workgroupToArchive status is not active', async () => {
      // Arrange
      const existingWorkgroup = createTestWorkgroup();
      existingWorkgroup.updateStatus(WorkgroupStatus.ARCHIVED);
      workgroupStorageAgentMock.getWorkgroupById.mockResolvedValueOnce(
        existingWorkgroup,
      );

      // Act and assert
      expect(async () => {
        await workgroupController.archiveWorkgroup(existingWorkgroup.id);
      }).rejects.toThrow(
        new BadRequestException(WORKGROUP_STATUS_NOT_ACTIVE_ERR_MESSAGE),
      );
    });

    it('should perform the archive if existing id passed', async () => {
      // Arrange
      const existingWorkgroup = createTestWorkgroup();
      workgroupStorageAgentMock.getWorkgroupById.mockResolvedValueOnce(
        existingWorkgroup,
      );

      workgroupStorageAgentMock.updateWorkgroup.mockResolvedValueOnce({
        ...existingWorkgroup,
        status: WorkgroupStatus.ARCHIVED,
      } as Workgroup);

      // Act
      const archivedWorkgroup = await workgroupController.archiveWorkgroup(
        existingWorkgroup.id,
      );

      // Assert
      expect(archivedWorkgroup.id).toEqual(existingWorkgroup.id);
      expect(archivedWorkgroup.status).toEqual(WorkgroupStatus.ARCHIVED);
    });
  });

  describe('deleteWorkgroup', () => {
    it('should throw NotFound if non existent id passed', () => {
      // Arrange
      const nonExistentId = '123';
      workgroupStorageAgentMock.getWorkgroupById.mockRejectedValueOnce(
        new NotFoundException(WORKGROUP_NOT_FOUND_ERR_MESSAGE),
      );

      // Act and assert
      expect(async () => {
        await workgroupController.deleteWorkgroup(nonExistentId);
      }).rejects.toThrow(
        new NotFoundException(WORKGROUP_NOT_FOUND_ERR_MESSAGE),
      );
    });

    it('should perform the delete if existing id passed', async () => {
      // Arrange
      const existingWorkgroup = createTestWorkgroup();
      workgroupStorageAgentMock.getWorkgroupById.mockResolvedValueOnce(
        existingWorkgroup,
      );

      // Act
      await workgroupController.deleteWorkgroup(existingWorkgroup.id);
    });
  });
});
