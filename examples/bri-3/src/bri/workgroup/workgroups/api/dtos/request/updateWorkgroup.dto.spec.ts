import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateWorkgroupDto } from './updateWorkgroup.dto';

describe('CreateWorkgroupDto', () => {
  it('should return error in case name not provided.', async () => {
    // Arrange
    const dto = {
      administratorIds: ['1'],
      securityPolicy: 'sec',
      privacyPolicy: 'priv',
      participantIds: ['subject'],
    };
    const updateWorkgroupDto = plainToInstance(UpdateWorkgroupDto, dto);

    // Act
    const errors = await validate(updateWorkgroupDto);

    // Assert
    expect(errors.length).toBe(1);
    expect(errors[0].property).toEqual('name');
    expect(errors[0].constraints?.isNotEmpty).toContain(
      'name should not be empty',
    );
  });

  it('should return error in case administrators not provided.', async () => {
    // Arrange
    const dto = {
      name: ['name'],
      securityPolicy: 'sec',
      privacyPolicy: 'priv',
      participantIds: ['subject'],
    };
    const updateWorkgroupDto = plainToInstance(UpdateWorkgroupDto, dto);

    // Act
    const errors = await validate(updateWorkgroupDto);

    // Assert
    expect(errors.length).toBe(1);
    expect(errors[0].property).toEqual('administratorIds');
    expect(errors[0].constraints?.isNotEmpty).toContain(
      'administratorIds should not be empty',
    );
  });

  it('should return error in case securityPolicy not provided.', async () => {
    // Arrange
    const dto = {
      name: ['name'],
      administratorIds: ['1'],
      privacyPolicy: 'priv',
      participantIds: ['subject'],
    };
    const updateWorkgroupDto = plainToInstance(UpdateWorkgroupDto, dto);

    // Act
    const errors = await validate(updateWorkgroupDto);

    // Assert
    expect(errors.length).toBe(1);
    expect(errors[0].property).toEqual('securityPolicy');
    expect(errors[0].constraints?.isNotEmpty).toContain(
      'securityPolicy should not be empty',
    );
  });

  it('should return error in case privacyPolicy not provided.', async () => {
    // Arrange
    const dto = {
      name: ['name'],
      administratorIds: ['1'],
      securityPolicy: 'sec',
      participantIds: ['subject'],
    };
    const updateWorkgroupDto = plainToInstance(UpdateWorkgroupDto, dto);

    // Act
    const errors = await validate(updateWorkgroupDto);

    // Assert
    expect(errors.length).toBe(1);
    expect(errors[0].property).toEqual('privacyPolicy');
    expect(errors[0].constraints?.isNotEmpty).toContain(
      'privacyPolicy should not be empty',
    );
  });

  it('should return error in case participantIds not provided.', async () => {
    // Arrange
    const dto = {
      name: ['name'],
      administratorIds: ['1'],
      privacyPolicy: 'priv',
      securityPolicy: 'sec',
    };
    const updateWorkgroupDto = plainToInstance(UpdateWorkgroupDto, dto);

    // Act
    const errors = await validate(updateWorkgroupDto);

    // Assert
    expect(errors.length).toBe(1);
    expect(errors[0].property).toEqual('participantIds');
    expect(errors[0].constraints?.isNotEmpty).toContain(
      'participantIds should not be empty',
    );
  });

  it('should return error in case an empty administratorIds array is provided.', async () => {
    // Arrange
    const dto = {
      name: ['name'],
      administratorIds: [],
      privacyPolicy: 'priv',
      securityPolicy: 'sec',
      participantIds: ['1'],
    };
    const updateWorkgroupDto = plainToInstance(UpdateWorkgroupDto, dto);

    // Act
    const errors = await validate(updateWorkgroupDto);

    // Assert
    expect(errors.length).toBe(1);
    expect(errors[0].property).toEqual('administratorIds');
    expect(errors[0].constraints?.arrayNotEmpty).toContain(
      'administratorIds should not be empty',
    );
  });

  it('should return error in case an empty participantIds array is provided.', async () => {
    // Arrange
    const dto = {
      name: ['name'],
      administratorIds: ['1'],
      privacyPolicy: 'priv',
      securityPolicy: 'sec',
      participantIds: [],
    };
    const updateWorkgroupDto = plainToInstance(UpdateWorkgroupDto, dto);

    // Act
    const errors = await validate(updateWorkgroupDto);

    // Assert
    expect(errors.length).toBe(1);
    expect(errors[0].property).toEqual('participantIds');
    expect(errors[0].constraints?.arrayNotEmpty).toContain(
      'participantIds should not be empty',
    );
  });

  it('should return no error if all required properties provided.', async () => {
    // Arrange
    const dto = {
      name: ['name'],
      administratorIds: ['1'],
      privacyPolicy: 'priv',
      securityPolicy: 'sec',
      participantIds: ['1'],
    };
    const updateWorkgroupDto = plainToInstance(UpdateWorkgroupDto, dto);

    // Act
    const errors = await validate(updateWorkgroupDto);

    // Assert
    expect(errors.length).toBe(0);
  });
});
