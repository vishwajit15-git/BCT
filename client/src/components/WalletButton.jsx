import { useWeb3 } from '../context/Web3Context.jsx'
import { Wallet, AlertTriangle, CheckCircle2 } from 'lucide-react'

export default function WalletButton() {
  const {
    account,
    connectWallet,
    isConnecting,
    isCorrectNetwork,
    switchNetwork,
    expectedChainId,
    chainId,
  } = useWeb3()

  if (!account) {
    return (
      <button
        onClick={connectWallet}
        disabled={isConnecting}
        className="mayo-btn-outline text-xs px-3.5 py-1.5 flex items-center gap-1.5 font-bold shadow-sm"
      >
        <Wallet className="w-3.5 h-3.5" />
        <span>{isConnecting ? 'Connecting…' : 'Connect Wallet'}</span>
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {!isCorrectNetwork ? (
        <button
          onClick={switchNetwork}
          className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-700 border border-red-300 hover:bg-red-200 transition"
          title={`Click to switch to MediChain network`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
          <span>Switch Network</span>
        </button>
      ) : (
        <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          Connected & Ready
        </span>
      )}

      <div
        className="inline-flex items-center gap-1.5 bg-[#eef4fa] text-[#00205b] font-mono text-xs px-3 py-1 rounded-full border border-[#d1dbe5]"
        title={account}
      >
        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
        <span>
          {account.slice(0, 6)}…{account.slice(-4)}
        </span>
      </div>
    </div>
  )
}
