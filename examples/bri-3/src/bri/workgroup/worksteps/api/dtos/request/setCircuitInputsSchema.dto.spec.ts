import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { SHOULD_NOT_BE_EMPTY_VALIDATION_MESSAGE } from '../../../../../shared/constants';
import { SetCircuitInputsSchemaDto } from './setCircuitInputsSchema.dto';

describe('SetCircuitInputsSchemaDto', () => {
  it('should return error in case schema not provided.', async () => {
    // Arrange
    const dto = { wrong: '1' };
    const setCircuitInputsSchemaDto = plainToInstance(
      SetCircuitInputsSchemaDto,
      dto,
    );

    // Act
    const errors = await validate(setCircuitInputsSchemaDto);

    // Assert
    expect(errors.length).toBe(1);
    expect(errors[0].property).toEqual('schema');
    expect(errors[0].constraints?.isNotEmpty).toContain(
      'schema ' + SHOULD_NOT_BE_EMPTY_VALIDATION_MESSAGE,
    );
  });

  it('should return no error if all required properties provided.', async () => {
    // Arrange
    const dto = { schema: 'test' };
    const setCircuitInputsSchemaDto = plainToInstance(
      SetCircuitInputsSchemaDto,
      dto,
    );

    // Act
    const errors = await validate(setCircuitInputsSchemaDto);

    // Assert
    expect(errors.length).toBe(0);
  });
});
