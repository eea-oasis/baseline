import { BadRequestException } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import { BpiSubjectAgent } from '../agents/bpiSubjects.agent';
import { CreateBpiSubjectCommandHandler } from '../capabilities/createBpiSubject/createBpiSubjectCommand.handler';
import { CreateBpiSubjectDto } from './dtos/request/createBpiSubject.dto';
import { SubjectController } from './subjects.controller';

describe('SubjectController', () => {
  let sController: SubjectController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      imports: [CqrsModule],
      controllers: [SubjectController],
      providers: [BpiSubjectAgent, CreateBpiSubjectCommandHandler],
    }).compile();

    sController = app.get<SubjectController>(SubjectController);

    await app.init();
  });

  describe('CRUD', () => {
    it('should throw BadRequest if name not provided', () => {
      // Arrange
      const requestDto = { desc: "desc", publicKey: "publicKey"} as CreateBpiSubjectDto;

      // Act and assert
      expect(async () => {
        await sController.CreateBpiSubject(requestDto);
      }).rejects.toThrow(new BadRequestException("Name cannot be empty."));
    });
  });
});
