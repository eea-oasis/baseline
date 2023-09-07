import { HardhatUserConfig } from 'hardhat/config';
import '@nomiclabs/hardhat-ethers';
import '@nomicfoundation/hardhat-toolbox';
import 'dotenv/config';

const config: HardhatUserConfig = {
  defaultNetwork: process.env.CCSM_NETWORK,
  networks: {
    goerli: {
      url: `${process.env.ALCHEMY_URL}`,
      accounts: [`0x${process.env.ALCHEMY_GOERLI_PRIVATE_KEY}`],
    },
    ganache: {
      url: `${process.env.GANACHE_URL}`,
      accounts: [`0x${process.env.GANACHE_ACCOUNT_PRIVATE_KEY}`],
    },
  },
  solidity: {
    version: '0.8.17',
  },
  paths: {
    sources:
      './src/bri/zeroKnowledgeProof/services/blockchain/ethereum/contracts',
    artifacts:
      './zeroKnowledgeArtifacts/blockchain/ethereum/artifacts/artifacts',
  },
};

export default config;
