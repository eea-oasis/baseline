import { classes } from '@automapper/classes';
import { AutomapperModule } from '@automapper/nestjs';
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import { EncryptionModule } from '../../../shared/encryption/encryption.module';
import { LoggingModule } from '../../../shared/logging/logging.module';
import { INVALID_SIGNATURE } from '../../auth/api/err.messages';
import { AuthModule } from '../../auth/auth.module';
import { BpiSubjectStorageAgent } from '../../identity/bpiSubjects/agents/bpiSubjectsStorage.agent';
import { NOT_FOUND_ERR_MESSAGE as BPI_SUBJECT_NOT_FOUND_ERR_MESSAGE } from '../../identity/bpiSubjects/api/err.messages';
import { BpiSubject } from '../../identity/bpiSubjects/models/bpiSubject';
import { SubjectsProfile } from '../../identity/bpiSubjects/subjects.profile';
import { BpiMessageAgent } from '../agents/bpiMessages.agent';
import { BpiMessageStorageAgent } from '../agents/bpiMessagesStorage.agent';
import { MessagingAgent } from '../agents/messaging.agent';
import { CreateBpiMessageCommandHandler } from '../capabilities/createBpiMessage/createBpiMessageCommand.handler';
import { DeleteBpiMessageCommandHandler } from '../capabilities/deleteBpiMessage/deleteBpiMessageCommand.handler';
import { GetBpiMessageByIdQueryHandler } from '../capabilities/getBpiMessageById/getBpiMessageByIdQuery.handler';
import { UpdateBpiMessageCommandHandler } from '../capabilities/updateBpiMessage/updateBpiMessageCommand.handler';
import { CommunicationModule } from '../communication.module';
import { CommunicationProfile } from '../communicaton.profile';
import { NatsMessagingClient } from '../messagingClients/natsMessagingClient';
import { BpiMessage } from '../models/bpiMessage';
import { CreateBpiMessageDto } from './dtos/request/createBpiMessage.dto';
import { UpdateBpiMessageDto } from './dtos/request/updateBpiMessage.dto';
import {
  BPI_MESSAGE_ALREADY_EXISTS,
  NOT_FOUND_ERR_MESSAGE,
} from './err.messages';
import { MessageController } from './messages.controller';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { PrismaClient } from '@prisma/client';
import {
  PublicKey,
  PublicKeyType,
} from '../../identity/bpiSubjects/models/publicKey';

describe('MessageController', () => {
  let mController: MessageController;
  let messageStorageAgentMock: DeepMockProxy<BpiMessageStorageAgent>;
  let subjectStorageAgentMock: DeepMockProxy<BpiSubjectStorageAgent>;
  let existingBpiSubject1: BpiSubject;
  let existingBpiSubject2: BpiSubject;
  let existingBpiMessage: BpiMessage;

  beforeAll(() => {
    process.env.BPI_ENCRYPTION_KEY_K_PARAM =
      'yzkXp3vY_AZQ3YfLv9GMRTYkjUOpn9x18gPkoFvoUxQ';
    process.env.BPI_ENCRYPTION_KEY_KTY_PARAM = 'oct';
  });

  beforeEach(async () => {
    const publicKeys1 = [
      new PublicKey(
        '111',
        PublicKeyType.ECDSA,
        '0x047a197a795a747c154dd92b217a048d315ef9ca1bfa9c15bfefe4e02fb338a70af23e7683b565a8dece5104a85ed24a50d791d8c5cb09ee21aabc927c98516539',
        '123',
      ),
      new PublicKey(
        '112',
        PublicKeyType.EDDSA,
        '0x047a197a795a747c154dd92b217a048d315ef9ca1bfa9c15bfefe4e02fb338a70af23e7683b565a8dece5104a85ed24a50d791d8c5cb09ee21aabc927c98516539',
        '123',
      ),
    ];
    existingBpiSubject1 = new BpiSubject('', 'name', 'desc', publicKeys1, []);

    const publicKeys2 = [
      new PublicKey(
        '111',
        PublicKeyType.ECDSA,
        '0x04203db7d27bab8d711acc52479efcfa9d7846e4e176d82389689f95cf06a51818b0b9ab1c2c8d72f1a32e236e6296c91c922a0dc3d0cb9afc269834fc5646b980',
        '123',
      ),
      new PublicKey(
        '112',
        PublicKeyType.EDDSA,
        '0x04203db7d27bab8d711acc52479efcfa9d7846e4e176d82389689f95cf06a51818b0b9ab1c2c8d72f1a32e236e6296c91c922a0dc3d0cb9afc269834fc5646b980',
        '123',
      ),
    ];
    existingBpiSubject2 = new BpiSubject('', 'name2', 'desc2', publicKeys2, []);

    existingBpiMessage = new BpiMessage(
      'f3e4295d-6a2a-4f04-8477-02f781eb93f8',
      existingBpiSubject1.id,
      existingBpiSubject2.id,
      'hello world',
      'xyz',
      0,
    );

    const app: TestingModule = await Test.createTestingModule({
      imports: [
        CqrsModule,
        AuthModule,
        CommunicationModule,
        LoggingModule,
        EncryptionModule,
        AutomapperModule.forRoot({
          strategyInitializer: classes(),
        }),
      ],
      controllers: [MessageController],
      providers: [
        BpiMessageAgent,
        CreateBpiMessageCommandHandler,
        UpdateBpiMessageCommandHandler,
        DeleteBpiMessageCommandHandler,
        GetBpiMessageByIdQueryHandler,
        BpiMessageStorageAgent,
        BpiSubjectStorageAgent,
        MessagingAgent,
        {
          provide: 'IMessagingClient',
          useClass: NatsMessagingClient,
        },
        SubjectsProfile,
        CommunicationProfile,
      ],
    })
      .overrideProvider(BpiMessageStorageAgent)
      .useValue(mockDeep<BpiMessageStorageAgent>())
      .overrideProvider(BpiSubjectStorageAgent)
      .useValue(mockDeep<BpiSubjectStorageAgent>())
      .overrideProvider(PrismaService)
      .useValue(mockDeep<PrismaClient>())
      .compile();

    mController = app.get<MessageController>(MessageController);
    messageStorageAgentMock = app.get(BpiMessageStorageAgent);
    subjectStorageAgentMock = app.get(BpiSubjectStorageAgent);

    await app.init();
  });

  describe('getBpiMessageById', () => {
    it('should throw NotFound if non existent id passed', () => {
      // Arrange
      const nonExistentId = '123';
      messageStorageAgentMock.getBpiMessageById.mockResolvedValueOnce(
        undefined,
      );

      // Act and assert
      expect(async () => {
        await mController.getBpiMessageById(nonExistentId);
      }).rejects.toThrow(new NotFoundException(NOT_FOUND_ERR_MESSAGE));
    });

    it('should return the correct bpi message if proper id passed ', async () => {
      // Arrange
      messageStorageAgentMock.getBpiMessageById.mockResolvedValueOnce(
        existingBpiMessage,
      );

      // Act
      const fetchedBpiMessage = await mController.getBpiMessageById(
        existingBpiMessage.id,
      );

      // Assert
      expect(fetchedBpiMessage.id).toEqual(existingBpiMessage.id);
    });
  });

  describe('createBpiMessage', () => {
    it('should throw BadRequest if existing bpi message id provided in id field', () => {
      // Arrange
      const requestDto = {
        id: existingBpiMessage.id,
        from: existingBpiSubject1.id,
        to: existingBpiSubject2.id,
        content: 'hello world',
        signature: 'xyz',
        type: 1,
      } as CreateBpiMessageDto;
      messageStorageAgentMock.getBpiMessageById.mockResolvedValueOnce(
        existingBpiMessage,
      );

      // Act and assert
      expect(async () => {
        await mController.createBpiMessage(requestDto);
      }).rejects.toThrow(
        new BadRequestException(BPI_MESSAGE_ALREADY_EXISTS(requestDto.id)),
      );
    });

    it('should throw BadRequest non existent bpi subject id provided in from field', () => {
      // Arrange
      const requestDto = {
        id: '123',
        from: 'nonexistent',
        to: existingBpiSubject2.id,
        content: 'hello world',
        signature: 'xyz',
        type: 1,
      } as CreateBpiMessageDto;
      subjectStorageAgentMock.getBpiSubjectById.mockResolvedValue(undefined);

      // Act and assert
      expect(async () => {
        await mController.createBpiMessage(requestDto);
      }).rejects.toThrow(
        new BadRequestException(BPI_SUBJECT_NOT_FOUND_ERR_MESSAGE),
      );
    });

    it('should throw Unauthorized if signature with invalid format provided', () => {
      // Arrange
      const requestDto = {
        id: '123',
        from: existingBpiSubject1.id,
        to: existingBpiSubject2.id,
        content: 'hello world',
        signature: 'invalid format signature',
        type: 1,
      } as CreateBpiMessageDto;
      subjectStorageAgentMock.getBpiSubjectById.mockResolvedValueOnce(
        existingBpiSubject1,
      );
      subjectStorageAgentMock.getBpiSubjectById.mockResolvedValueOnce(
        existingBpiSubject2,
      );

      // Act and assert
      expect(async () => {
        await mController.createBpiMessage(requestDto);
      }).rejects.toThrow(new UnauthorizedException(INVALID_SIGNATURE));
    });

    it('should throw Unauthorized if signature with valid format that does not fit with the public key of the sender is provided', () => {
      // Arrange
      const requestDto = {
        id: '123',
        from: existingBpiSubject1.id,
        to: existingBpiSubject2.id,
        content: 'hello world',
        signature:
          '0xb377f459b07873ed407c3d1a4904051f3384e02906a7ca0abd5bfe7b3349ee71194179801ad449c118281bd4772cfe3f272455f86ae8dfae59a5c00c1d762d2b1b',
        type: 1,
      } as CreateBpiMessageDto;
      subjectStorageAgentMock.getBpiSubjectById.mockResolvedValueOnce(
        existingBpiSubject1,
      );
      subjectStorageAgentMock.getBpiSubjectById.mockResolvedValueOnce(
        existingBpiSubject2,
      );

      // Act and assert
      expect(async () => {
        await mController.createBpiMessage(requestDto);
      }).rejects.toThrow(new UnauthorizedException(INVALID_SIGNATURE));
    });

    it('should return new uuid from the created bpi message when all params provided', async () => {
      // Arrange
      const requestDto = {
        id: '123',
        from: existingBpiSubject1.id,
        to: existingBpiSubject2.id,
        content: 'hello world',
        signature:
          '0xfa6069e94f62a4bbf519d5ce9e367357804a5d933da6aeccfd69d9a4ffe9df40560d285e13a3408fe03e3934a3b9f309f5e22b3ebe5b21e4b73834a1ed8495ab1c',
        type: 1,
      } as CreateBpiMessageDto;
      subjectStorageAgentMock.getBpiSubjectById.mockResolvedValueOnce(
        existingBpiSubject1,
      );
      subjectStorageAgentMock.getBpiSubjectById.mockResolvedValueOnce(
        existingBpiSubject2,
      );

      const expectedBpiMessage = new BpiMessage(
        requestDto.id,
        existingBpiSubject1.id,
        existingBpiSubject2.id,
        requestDto.content,
        requestDto.signature,
        requestDto.type,
      );
      messageStorageAgentMock.storeNewBpiMessage.mockResolvedValueOnce(
        expectedBpiMessage,
      );

      // Act
      const response = await mController.createBpiMessage(requestDto);

      // Assert
      expect(response).toEqual(requestDto.id);
    });
  });

  describe('updateBpiMessage', () => {
    it('should throw NotFound if non existent id passed', async () => {
      // Arrange
      const nonExistentId = '123';
      messageStorageAgentMock.getBpiMessageById.mockResolvedValueOnce(
        undefined,
      );

      const requestDto = {
        content: 'this is content',
        signature: 'xyz',
      } as UpdateBpiMessageDto;

      // Act and assert
      expect(async () => {
        await mController.updateBpiMessage(nonExistentId, requestDto);
      }).rejects.toThrow(new NotFoundException(NOT_FOUND_ERR_MESSAGE));
    });

    it('should perform the update if existing id passed', async () => {
      // Arrange
      messageStorageAgentMock.getBpiMessageById.mockResolvedValueOnce(
        existingBpiMessage,
      );

      const updateRequestDto = {
        content: 'this is content2',
        signature: 'xyz2',
      } as UpdateBpiMessageDto;
      messageStorageAgentMock.updateBpiMessage.mockResolvedValueOnce({
        ...existingBpiMessage,
        content: updateRequestDto.content,
        signature: updateRequestDto.signature,
      } as BpiMessage);

      // Act
      const updatedBpiMessage = await mController.updateBpiMessage(
        existingBpiMessage.id,
        updateRequestDto,
      );

      // Assert
      expect(updatedBpiMessage.id).toEqual(existingBpiMessage.id);
      expect(updatedBpiMessage.content).toEqual(updateRequestDto.content);
      expect(updatedBpiMessage.signature).toEqual(updateRequestDto.signature);
    });
  });

  describe('deleteBpiMessage', () => {
    it('should throw NotFound if non existent id passed', async () => {
      // Arrange
      const nonExistentId = '123';
      messageStorageAgentMock.getBpiMessageById.mockResolvedValueOnce(
        undefined,
      );

      // Act and assert
      expect(async () => {
        await mController.deleteBpiMessage(nonExistentId);
      }).rejects.toThrow(new NotFoundException(NOT_FOUND_ERR_MESSAGE));
    });

    it('should perform the delete if existing id passed', async () => {
      // Arrange
      messageStorageAgentMock.getBpiMessageById.mockResolvedValueOnce(
        existingBpiMessage,
      );

      // Act
      await mController.deleteBpiMessage(existingBpiMessage.id);
    });
  });
});
