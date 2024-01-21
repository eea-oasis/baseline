import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { LoggingModule } from '../../shared/logging/logging.module';
import { CcsmStorageAgent } from './agents/ccsmStorage.agent';
import { EthereumService } from './services/blockchain/ethereum/ethereum.service';
import { CircuitInputsParserService } from './services/circuit/circuitInputsParser/circuitInputParser.service';
import { SnarkjsCircuitService } from './services/circuit/snarkjs/snarkjs.service';

@Module({
  imports: [CqrsModule, LoggingModule],

  providers: [
    CcsmStorageAgent,
    CircuitInputsParserService,
    {
      provide: 'ICircuitService',
      useClass: SnarkjsCircuitService,
    },
    {
      provide: 'IBlockchainService',
      useClass: EthereumService,
    },
  ],
  exports: ['ICircuitService', 'IBlockchainService', CcsmStorageAgent, CircuitInputsParserService],
})
export class ZeroKnowledgeProofModule {}
