import { Injectable } from "@nestjs/common";
import { LoggingService } from "../../../../../shared/logging/logging.service";

@Injectable()
export class CircuitInputsParserService {

  constructor(private readonly logger: LoggingService) { }

  public applyMappingToJSONPayload(payload: string, cim: CircuitInputsMapping) {
    const result: any = {};

    try {
      const jsonPayload = JSON.parse(payload);

      for (let mapping of cim.mapping) {
        const value = this.getJsonValueByPath(jsonPayload, mapping.payloadJsonPath);
  
        if (!value && !mapping.defaultValue) {
          this.logger.logError(`Missing value and default value for mapping ${cim.mapping} while mapping circuit inputs for payload ${payload}`);
          return null;
        }
  
        switch (mapping.dataType) {

        case "string":
            result[mapping.circuitInput] = value ?? mapping.defaultValue;
            break;

        case "integer":
            result[mapping.circuitInput] = value ?? mapping.defaultValue;
            break;
            
        case "array":
            if (mapping.arrayType === "string") {
                // TODO
            }

            if (mapping.arrayType === "integer") {
              // TODO
            }

            if (mapping.arrayType === "object") {
              // TODO
            }
            break;
        default:
            this.logger.logError(`Unknown datatype '${mapping.dataType}' while mapping circuit inputs for payload ${payload}`);
            return null;
        }

      }
    } catch (error) {
      this.logger.logError(`Error '${error}' while mapping circuit inputs for payload ${payload}`);
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
  };
}