import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateWorkgroupDto } from './createWorkgroup.dto';

describe('CreateWorkgroupDto', () => {
  it('should return error in case name not provided.', async () => {
    // Arrange
    const dto = {
      securityPolicy: 'sec',
      privacyPolicy: 'priv',
      worksteps: [],
      workflows: [],
    };
    const createWorkgroupDto = plainToInstance(CreateWorkgroupDto, dto);

    // Act
    const errors = await validate(createWorkgroupDto);

    // Assert
    expect(errors.length).toBe(1);
    expect(errors[0].property).toEqual('name');
    expect(errors[0].constraints?.isNotEmpty).toContain(
      'name should not be empty',
    );
  });

  it('should return error in case securityPolicy not provided.', async () => {
    // Arrange
    const dto = {
      name: ['name'],
      privacyPolicy: 'priv',
      worksteps: [],
      workflows: [],
    };
    const createWorkgroupDto = plainToInstance(CreateWorkgroupDto, dto);

    // Act
    const errors = await validate(createWorkgroupDto);

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
      securityPolicy: 'sec',
      worksteps: [],
      workflows: [],
    };
    const createWorkgroupDto = plainToInstance(CreateWorkgroupDto, dto);

    // Act
    const errors = await validate(createWorkgroupDto);

    // Assert
    expect(errors.length).toBe(1);
    expect(errors[0].property).toEqual('privacyPolicy');
    expect(errors[0].constraints?.isNotEmpty).toContain(
      'privacyPolicy should not be empty',
    );
  });

  it('should return no error if all required properties provided.', async () => {
    // Arrange
    const dto = {
      name: ['name'],
      privacyPolicy: 'priv',
      securityPolicy: 'sec',
      worksteps: [],
      workflows: [],
    };
    const createWorkgroupDto = plainToInstance(CreateWorkgroupDto, dto);

    // Act
    const errors = await validate(createWorkgroupDto);

    // Assert
    expect(errors.length).toBe(0);
  });
});
