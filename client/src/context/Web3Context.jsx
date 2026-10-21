import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { ethers } from 'ethers'
import MedicalRecordsArtifact from '../contracts/MedicalRecords.json'

const Web3Context = createContext(null)

const EXPECTED_CHAIN_ID_DECIMAL = Number(import.meta.env.VITE_CHAIN_ID || 1337)
const EXPECTED_CHAIN_ID_HEX = '0x' + EXPECTED_CHAIN_ID_DECIMAL.toString(16)
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS

export function Web3Provider({ children }) {
  const [account, setAccount] = useState(null)
  const [chainId, setChainId] = useState(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState(null)

  const isCorrectNetwork =
    chainId === EXPECTED_CHAIN_ID_DECIMAL ||
    chainId === 1337 ||
    chainId === 31337 // Accept Hardhat default or custom 1337

  // Update account and chainId on state changes
  const updateWeb3State = useCallback(async () => {
    if (typeof window.ethereum === 'undefined') return

    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const network = await provider.getNetwork()
      setChainId(Number(network.chainId))

      const accounts = await provider.listAccounts()
      if (accounts.length > 0) {
        setAccount(accounts[0].address.toLowerCase())
      } else {
        setAccount(null)
      }
    } catch (err) {
      console.warn('Web3 detection note:', err.message)
    }
  }, [])

  useEffect(() => {
    updateWeb3State()

    if (window.ethereum) {
      const handleAccountsChanged = (accs) => {
        if (accs.length > 0) {
          setAccount(accs[0].toLowerCase())
        } else {
          setAccount(null)
        }
      }

      const handleChainChanged = (hexChainId) => {
        setChainId(Number(hexChainId))
        window.location.reload()
      }

      window.ethereum.on('accountsChanged', handleAccountsChanged)
      window.ethereum.on('chainChanged', handleChainChanged)

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
        window.ethereum.removeListener('chainChanged', handleChainChanged)
      }
    }
  }, [updateWeb3State])

  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      const errMsg = 'A digital wallet (like MetaMask) is required to secure your records. Please install MetaMask to continue.'
      setError(errMsg)
      alert(errMsg)
      return null
    }

    setIsConnecting(true)
    setError(null)

    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const accounts = await provider.send('eth_requestAccounts', [])
      const selectedAccount = accounts[0].toLowerCase()
      setAccount(selectedAccount)

      const network = await provider.getNetwork()
      setChainId(Number(network.chainId))
      return selectedAccount
    } catch (err) {
      if (err.code === 4001) {
        setError('Connection was cancelled in your wallet.')
      } else {
        setError(err.message || 'Could not connect wallet. Please try again.')
      }
      return null
    } finally {
      setIsConnecting(false)
    }
  }

  const switchNetwork = async () => {
    if (!window.ethereum) return

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: EXPECTED_CHAIN_ID_HEX }],
      })
    } catch (switchError) {
      // Error code 4902 indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: EXPECTED_CHAIN_ID_HEX,
                chainName: 'MediChain Network',
                rpcUrls: [import.meta.env.VITE_RPC_URL || 'http://127.0.0.1:8545'],
                nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
              },
            ],
          })
        } catch (addError) {
          setError(addError.message)
        }
      } else {
        setError(switchError.message)
      }
    }
  }

  // Get connected contract instance with signer
  const getSignerContract = async () => {
    if (!window.ethereum) throw new Error('MetaMask is not available.')
    if (!CONTRACT_ADDRESS || CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000') {
      throw new Error('Contract address is not configured. Please deploy the contract and update .env.')
    }

    const provider = new ethers.BrowserProvider(window.ethereum)
    const signer = await provider.getSigner()
    return new ethers.Contract(CONTRACT_ADDRESS, MedicalRecordsArtifact.abi, signer)
  }

  // Contract actions
  const registerRecordOnChain = async (recordId, documentHash) => {
    const contract = await getSignerContract()
    const tx = await contract.registerRecord(recordId, documentHash)
    const receipt = await tx.wait()
    return {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      receipt,
    }
  }

  const grantAccessOnChain = async (recordId, doctorWallet) => {
    const contract = await getSignerContract()
    const cleanAddress = ethers.getAddress(doctorWallet.trim())
    const tx = await contract.grantAccess(recordId, cleanAddress)
    const receipt = await tx.wait()
    return {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      receipt,
    }
  }

  const revokeAccessOnChain = async (recordId, doctorWallet) => {
    const contract = await getSignerContract()
    const cleanAddress = ethers.getAddress(doctorWallet.trim())
    const tx = await contract.revokeAccess(recordId, cleanAddress)
    const receipt = await tx.wait()
    return {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      receipt,
    }
  }

  return (
    <Web3Context.Provider
      value={{
        account,
        chainId,
        isCorrectNetwork,
        expectedChainId: EXPECTED_CHAIN_ID_DECIMAL,
        isConnecting,
        error,
        contractAddress: CONTRACT_ADDRESS,
        connectWallet,
        switchNetwork,
        registerRecordOnChain,
        grantAccessOnChain,
        revokeAccessOnChain,
      }}
    >
      {children}
    </Web3Context.Provider>
  )
}

export function useWeb3() {
  const ctx = useContext(Web3Context)
  if (!ctx) {
    throw new Error('useWeb3 must be used within a Web3Provider')
  }
  return ctx
}
