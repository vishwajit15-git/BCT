// scripts/deploy.js — MedicalRecords Deployment Script (Phase 2)
const hre = require('hardhat')

async function main() {
  console.log('====================================================')
  console.log('  MediChain — MedicalRecords.sol Deployment')
  console.log('  Course: SPPU BE Computer Engineering (2019 Pattern)')
  console.log('====================================================\n')

  const [deployer] = await hre.ethers.getSigners()
  console.log('Deployer Wallet Address :', deployer.address)

  const balance = await hre.ethers.provider.getBalance(deployer.address)
  console.log('Deployer Balance        :', hre.ethers.formatEther(balance), 'ETH')
  console.log('Target Network          :', hre.network.name)

  console.log('\nDeploying MedicalRecords contract...')
  const MedicalRecordsFactory = await hre.ethers.getContractFactory('MedicalRecords')
  const contract = await MedicalRecordsFactory.deploy()

  await contract.waitForDeployment()
  const contractAddress = await contract.getAddress()

  console.log('\n====================================================')
  console.log('✅  MedicalRecords Successfully Deployed!')
  console.log('    Contract Address :', contractAddress)
  console.log('    Deployer Address :', deployer.address)
  console.log('    Chain ID         :', (await hre.ethers.provider.getNetwork()).chainId.toString())
  console.log('====================================================\n')

  console.log('⚠️  NOTE ON LOCAL DEPLOYMENT STATE:')
  console.log('   This deployment was performed on the local development network.')
  console.log('   The contract address and state are local to this node session.')
  console.log('   If your local Hardhat node is terminated or reset, this state will')
  console.log('   disappear and the contract will need to be redeployed.\n')

  console.log('📋  NEXT STEPS FOR CONFIGURATION:')
  console.log('   Update your environment files with the deployed address:')
  console.log(`   - client/.env: VITE_CONTRACT_ADDRESS=${contractAddress}`)
  console.log(`   - server/.env: CONTRACT_ADDRESS=${contractAddress}`)
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌  Deployment failed:', err)
    process.exit(1)
  })
