import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { LoggingService } from '../../../../../shared/logging/logging.service';
import { CircuitInputsParserService } from './circuitInputParser.service';

let cips: CircuitInputsParserService;
const loggingServiceMock: DeepMockProxy<LoggingService> =
  mockDeep<LoggingService>();

beforeAll(async () => {
  cips = new CircuitInputsParserService(loggingServiceMock);
});

describe('validateCircuitInputTranslationSchema', () => {
  it('Should return [false, "Missing mapping array"] if mapping array is missing', () => {
    // Arrange
    const schema = '{}';

    // Act
    const result = cips.validateCircuitInputTranslationSchema(schema);

    // Assert
    expect(result).toEqual([false, 'Missing mapping array']);
  });

  it('Should return [false, "{circuitInput}"] if any required property has incorrect type', () => {
    // Arrange
    const schema =
      '{"mapping": [{"circuitInput": 123, "description": "desc1", "payloadJsonPath": "path1", "dataType": "string"}]}';

    // Act
    const result = cips.validateCircuitInputTranslationSchema(schema);

    // Assert
    expect(result).toEqual([false, '123 not of type string']);
  });

  it('Should return [false, "{description}"] if any required property has incorrect type', () => {
    // Arrange
    const schema =
      '{"mapping": [{"circuitInput": "123", "description": false, "payloadJsonPath": "path1", "dataType": "string"}]}';

    // Act
    const result = cips.validateCircuitInputTranslationSchema(schema);

    // Assert
    expect(result).toEqual([false, 'false not of type string']);
  });

  it('Should return [false, "{payloadJsonPath}"] if any required property has incorrect type', () => {
    // Arrange
    const schema =
      '{"mapping": [{"circuitInput": "123", "description": "desc", "payloadJsonPath": 12, "dataType": "string"}]}';

    // Act
    const result = cips.validateCircuitInputTranslationSchema(schema);

    // Assert
    expect(result).toEqual([false, '12 not of type string']);
  });

  it('Should return [false, "{dataType}"] if any required property has incorrect type', () => {
    // Arrange
    const schema =
      '{"mapping": [{"circuitInput": "123", "description": "desc", "payloadJsonPath": "path1", "dataType": 232}]}';

    // Act
    const result = cips.validateCircuitInputTranslationSchema(schema);

    // Assert
    expect(result).toEqual([false, '232 not of type string']);
  });

  it('Should return [false, "arrayType not defined properly for {circuitInput}"] if dataType is array and arrayType is not defined properly', () => {
    // Arrange
    const schema =
      '{"mapping": [{"circuitInput": "input1", "description": "desc1", "payloadJsonPath": "path1", "dataType": "array", "arrayType": 123}]}';

    // Act
    const result = cips.validateCircuitInputTranslationSchema(schema);

    // Assert
    expect(result).toEqual([
      false,
      'arrayType not defined properly for input1',
    ]);
  });

  it('Should return [false, "defaultValue not of type {dataType} for {circuitInput}"] if defaultValue type does not match dataType', () => {
    // Arrange
    const schema =
      '{"mapping": [{"circuitInput": "input1", "description": "desc1", "payloadJsonPath": "path1", "dataType": "string", "defaultValue": 123}]}';

    // Act
    const result = cips.validateCircuitInputTranslationSchema(schema);

    // Assert
    expect(result).toEqual([
      false,
      'defaultValue not of type string for input1',
    ]);
  });

  it('Should return [false, error] if an error occurs during schema parsing', () => {
    // Arrange
    const schema = 'invalid JSON';

    // Act
    const result = cips.validateCircuitInputTranslationSchema(schema);

    // Assert
    expect(result).toEqual([
      false,
      'Unexpected token \'i\', "invalid JSON" is not valid JSON',
    ]);
  });

  it('Should return [true, ""] if basic valid schema passed in', () => {
    // Arrange
    const schema =
      '{"mapping": [{"circuitInput": "input1", "description": "desc1", "payloadJsonPath": "path1", "dataType": "string"}]}';

    // Act
    const result = cips.validateCircuitInputTranslationSchema(schema);

    // Assert
    expect(result).toEqual([true, '']);
  });

  it('Should return [true, ""] if valid schema with default value passed in', () => {
    // Arrange
    const schema =
      '{"mapping": [{"circuitInput": "input1", "description": "desc1", "payloadJsonPath": "path1", "dataType": "string", "defaultValue": "123"}]}';

    // Act
    const result = cips.validateCircuitInputTranslationSchema(schema);

    // Assert
    expect(result).toEqual([true, '']);
  });

  it('Should return [true, ""] if valid schema with arrayType in', () => {
    // Arrange
    const schema =
      '{"mapping": [{"circuitInput": "input1", "description": "desc1", "payloadJsonPath": "path1", "dataType": "array", "arrayType": "string"}]}';

    // Act
    const result = cips.validateCircuitInputTranslationSchema(schema);

    // Assert
    expect(result).toEqual([true, '']);
  });
});

describe('CircuitInputsParserService', () => {
  it('Should return null if empty CircuitInputsMapping passed in', () => {
    // Arrange
    const payload = 'test';
    const schema = {} as CircuitInputsMapping;

    // Act
    const circuitInputs = cips.applyMappingToJSONPayload(payload, schema);

    // Assert
    expect(circuitInputs).toBeNull();
  });

  it('Should generate a single circuit input param with charcode sum based on a single string param at root level', () => {
    // Arrange
    const payload = `{
        "supplierInvoiceID": "INV123"
       }`;

    const schema = {
      mapping: [
        {
          circuitInput: 'dascircuitinput',
          description: 'desc',
          payloadJsonPath: 'supplierInvoiceID',
          dataType: 'string',
        } as CircuitInputMapping,
      ],
    } as CircuitInputsMapping;

    // Act
    const circuitInputs = cips.applyMappingToJSONPayload(payload, schema);

    // Assert
    expect(circuitInputs).toStrictEqual({ dascircuitinput: 387 });
  });

  it('Should generate a single circuit input param with charcode sum based on a default value for a missing string param at root level', () => {
    // Arrange
    const payload = `{
        "somethingElse": ""
       }`;

    const defaultParamValue = '555333';

    const schema = {
      mapping: [
        {
          circuitInput: 'dascircuitinput',
          description: 'desc',
          payloadJsonPath: 'supplierInvoiceID',
          dataType: 'string',
          defaultValue: defaultParamValue,
        } as CircuitInputMapping,
      ],
    } as CircuitInputsMapping;

    // Act
    const circuitInputs = cips.applyMappingToJSONPayload(payload, schema);

    // Assert
    expect(circuitInputs).toStrictEqual({ dascircuitinput: 312 });
  });

  it('Should return null based on a missing default value for a missing string param at root level', () => {
    // Arrange
    const payload = `{
        "somethingElse": ""
       }`;

    const schema = {
      mapping: [
        {
          circuitInput: 'dascircuitinput',
          description: 'desc',
          payloadJsonPath: 'supplierInvoiceID',
          dataType: 'string',
        } as CircuitInputMapping,
      ],
    } as CircuitInputsMapping;

    // Act
    const circuitInputs = cips.applyMappingToJSONPayload(payload, schema);

    // Assert
    expect(circuitInputs).toBeNull();
  });

  it('Should generate a single circuit input param with charcode sum based on a single string param at root + 1 level', () => {
    // Arrange
    const payload = `{
        "supplierInvoice": {
          "ID": "INV123"
        } 
       }`;

    const schema = {
      mapping: [
        {
          circuitInput: 'dascircuitinput',
          description: 'desc',
          payloadJsonPath: 'supplierInvoice.ID',
          dataType: 'string',
        } as CircuitInputMapping,
      ],
    } as CircuitInputsMapping;

    // Act
    const circuitInputs = cips.applyMappingToJSONPayload(payload, schema);

    // Assert
    expect(circuitInputs).toStrictEqual({ dascircuitinput: 387 });
  });

  it('Should generate a single circuit input param based on a single integer param at root level', () => {
    // Arrange
    const payload = `{
        "supplierInvoiceID": 123
       }`;

    const schema = {
      mapping: [
        {
          circuitInput: 'dascircuitinput',
          description: 'desc',
          payloadJsonPath: 'supplierInvoiceID',
          dataType: 'integer',
        } as CircuitInputMapping,
      ],
    } as CircuitInputsMapping;

    // Act
    const circuitInputs = cips.applyMappingToJSONPayload(payload, schema);

    // Assert
    expect(circuitInputs).toStrictEqual({ dascircuitinput: 123 });
  });

  it('Should generate a single circuit input param based on a default value for a missing integer param at root level', () => {
    // Arrange
    const payload = `{
        "somethingElse": ""
       }`;

    const defaultValue = 555333;

    const schema = {
      mapping: [
        {
          circuitInput: 'dascircuitinput',
          description: 'desc',
          payloadJsonPath: 'supplierInvoiceID',
          dataType: 'integer',
          defaultValue: defaultValue,
        } as CircuitInputMapping,
      ],
    } as CircuitInputsMapping;

    // Act
    const circuitInputs = cips.applyMappingToJSONPayload(payload, schema);

    // Assert
    expect(circuitInputs).toStrictEqual({ dascircuitinput: defaultValue });
  });

  it('Should return null based on a missing default value for a missing integer param at root level', () => {
    // Arrange
    const payload = `{
        "somethingElse": ""
       }`;

    const schema = {
      mapping: [
        {
          circuitInput: 'dascircuitinput',
          description: 'desc',
          payloadJsonPath: 'supplierInvoiceID',
          dataType: 'integer',
        } as CircuitInputMapping,
      ],
    } as CircuitInputsMapping;

    // Act
    const circuitInputs = cips.applyMappingToJSONPayload(payload, schema);

    // Assert
    expect(circuitInputs).toBeNull();
  });

  it('Should generate a single circuit input param based on a single integer array param at root level', () => {
    // Arrange
    const payload = `{
        "supplierInvoiceIDs": [
          123,
          321,
          454
        ]
       }`;

    const schema = {
      mapping: [
        {
          circuitInput: 'dascircuitinput',
          description: 'desc',
          payloadJsonPath: 'supplierInvoiceIDs',
          dataType: 'array',
          arrayType: 'integer',
        } as CircuitInputMapping,
      ],
    } as CircuitInputsMapping;

    // Act
    const circuitInputs = cips.applyMappingToJSONPayload(payload, schema);

    // Assert
    expect(circuitInputs).toStrictEqual({ dascircuitinput: [123, 321, 454] });
  });

  it('Should generate a single circuit input param with charcode sums based on a single string array param at root level', () => {
    // Arrange
    const payload = `{
        "supplierInvoiceIDs": [
          "INV123",
          "INV124",
          "INV125"
        ]
       }`;

    const schema = {
      mapping: [
        {
          circuitInput: 'dascircuitinput',
          description: 'desc',
          payloadJsonPath: 'supplierInvoiceIDs',
          dataType: 'array',
          arrayType: 'string',
        } as CircuitInputMapping,
      ],
    } as CircuitInputsMapping;

    // Act
    const circuitInputs = cips.applyMappingToJSONPayload(payload, schema);

    // Assert
    expect(circuitInputs).toStrictEqual({ dascircuitinput: [387, 388, 389] });
  });
});
