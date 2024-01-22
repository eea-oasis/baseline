import { Injectable } from '@nestjs/common';
import { LoggingService } from '../../../../../shared/logging/logging.service';

@Injectable()
export class CircuitInputsParserService {
  constructor(private readonly logger: LoggingService) {}

  public validateCircuitInputTranslationSchema(
    schema: string,
  ): [boolean, string] {
    try {
      const parsedData: CircuitInputsMapping = JSON.parse(schema);

      if (!parsedData.mapping || !Array.isArray(parsedData.mapping)) {
        return [false, `Missing mapping array`];
      }

      for (const mapping of parsedData.mapping) {
        if (typeof mapping.circuitInput !== 'string') {
          return [false, `${mapping.circuitInput} not of type string`];
        }

        if (typeof mapping.description !== 'string') {
          return [false, `${mapping.description} not of type string`];
        }

        if (typeof mapping.payloadJsonPath !== 'string') {
          return [false, `${mapping.payloadJsonPath} not of type string`];
        }

        if (typeof mapping.dataType !== 'string') {
          return [false, `${mapping.dataType} not of type string`];
        }

        if (mapping.dataType === 'array') {
          if (!mapping.arrayType || typeof mapping.arrayType !== 'string') {
            return [
              false,
              `arrayType not defined properly for ${mapping.circuitInput}`,
            ];
          }
        }

        if (
          mapping.defaultValue &&
          typeof mapping.defaultValue !== mapping.dataType
        ) {
          return [
            false,
            `defaultValue not of type ${mapping.dataType} for ${mapping.circuitInput}`,
          ];
        }
      }

      return [true, ''];
    } catch (error) {
      return [false, error.message];
    }
  }

  public applyMappingToJSONPayload(payload: string, cim: CircuitInputsMapping) {
    const result: any = {};

    try {
      const jsonPayload = JSON.parse(payload);

      for (let mapping of cim.mapping) {
        const value = this.getJsonValueByPath(
          jsonPayload,
          mapping.payloadJsonPath,
        );

        if (value === undefined && mapping.defaultValue === undefined) {
          this.logger.logError(
            `Missing value and default value for mapping ${cim.mapping} while mapping circuit inputs for payload ${payload}`,
          );
          return null;
        }

        switch (mapping.dataType) {
          case 'string':
            result[mapping.circuitInput] = this.calculateStringCharCodeSum(
              value || mapping.defaultValue,
            );
            break;

          case 'integer':
            result[mapping.circuitInput] = value ?? mapping.defaultValue;
            break;

          case 'array':
            if (mapping.arrayType === 'string') {
              result[mapping.circuitInput] = value
                ? value.map((val) => this.calculateStringCharCodeSum(val))
                : mapping.defaultValue.map((val) =>
                    this.calculateStringCharCodeSum(val),
                  );
            }

            if (mapping.arrayType === 'integer') {
              result[mapping.circuitInput] = value ?? mapping.defaultValue;
            }

            if (mapping.arrayType === 'object') {
              // TODO
            }
            break;
          default:
            this.logger.logError(
              `Unknown datatype '${mapping.dataType}' while mapping circuit inputs for payload ${payload}`,
            );
            return null;
        }
      }
    } catch (error) {
      this.logger.logError(
        `Error '${error}' while mapping circuit inputs for payload ${payload}`,
      );
      return null;
    }

    return result;
  }

  private getJsonValueByPath(json: any, path: string) {
    const parts = path.split('.');
    let currentValue = json;

    for (const part of parts) {
      if (currentValue[part] === undefined) {
        return undefined;
      }
      currentValue = currentValue[part];
    }

    return currentValue;
  }

  private calculateStringCharCodeSum(text: string): number {
    let sum = 0;

    for (let i = 0; i < text.length; i++) {
      sum += text.charCodeAt(i);
    }

    return sum;
  }
}
