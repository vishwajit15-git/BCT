require('dotenv').config()
require('@nomicfoundation/hardhat-toolbox')

const PRIVATE_KEY =
  process.env.PRIVATE_KEY ||
  // Hardhat built-in test account #0 — safe to keep in config for local dev
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'

/** @type {import('hardhat/config').HardhatUserConfig} */
module.exports = {
  solidity: {
    version: '0.8.24',
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    hardhat: {
      chainId: 1337,
    },
    localhost: {
      url: process.env.RPC_URL || 'http://127.0.0.1:8545',
      chainId: 1337,
      accounts: [PRIVATE_KEY],
    },
  },
  paths: {
    sources:   './contracts',
    tests:     './test',
    cache:     './cache',
    artifacts: './artifacts',
  },
}
