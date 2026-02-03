"use client"
import React, { useState, useEffect } from "react"
import { ArrowDownLeft, ArrowUpRight, DollarSign, Zap } from "lucide-react"
import { ethers } from "ethers"
import { getContracts } from "@/config/contracts"

export default function TransactionHistory() {
    const [transactions, setTransactions] = useState([])
    const [currentTime, setCurrentTime] = useState(new Date())
    const [loading, setLoading] = useState(true)
    const [account, setAccount] = useState(null)
    const [mounted, setMounted] = useState(false)

    // Check component is mounted
    useEffect(() => {
        setMounted(true)
    }, [])

    // Update time with correct timezone
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000)
        return () => clearInterval(timer)
    }, [])

    // Fetch transactions from blockchain events
    useEffect(() => {
        if (!mounted || !account) {
            setLoading(false)
            return
        }

        const fetchTransactionsFromBlockchain = async () => {
            try {
                setLoading(true)

                if (typeof window.ethereum === "undefined") {
                    console.log("Ethereum provider not found")
                    setLoading(false)
                    return
                }

                const provider = new ethers.BrowserProvider(window.ethereum)
                const network = await provider.getNetwork()
                const chainId = Number(network.chainId)
                const contracts = getContracts(chainId)

                // Create contract instances
                const dscEngine = new ethers.Contract(
                    contracts.DSCEngine.address,
                    contracts.DSCEngine.abi,
                    provider,
                )

                const dscToken = new ethers.Contract(
                    contracts.DSC.address,
                    contracts.DSC.abi,
                    provider,
                )

                // Complete WETH9 ABI with all events
                const WETH_ABI = [
                    "event Deposit(address indexed dst, uint256 wad)",
                    "event Withdrawal(address indexed src, uint256 wad)",
                    "event Transfer(address indexed from, address indexed to, uint256 value)",
                    "event Approval(address indexed src, address indexed guy, uint256 wad)",
                ]

                const weth = new ethers.Contract(contracts.WETH.address, WETH_ABI, provider)

                const allTransactions = []

                // ✅ 1. Fetch Native ETH Deposits from DSCEngine (CollateralDeposited events with address(0))
                try {
                    // Filter for CollateralDeposited events where token is address(0) and user is account
                    const depositFilter = dscEngine.filters.CollateralDeposited(
                        account,
                        ethers.ZeroAddress,
                    )
                    const depositEvents = await dscEngine.queryFilter(depositFilter, -10000)

                    console.log("📥 Native ETH Deposits found:", depositEvents.length)

                    for (const event of depositEvents) {
                        const block = await provider.getBlock(event.blockNumber)
                        allTransactions.push({
                            id: `deposit-${event.transactionHash}-${event.logIndex}`,
                            type: "deposit",
                            amount: parseFloat(ethers.formatEther(event.args.amount)).toFixed(4),
                            description: "ETH Deposited",
                            timestamp: new Date(block.timestamp * 1000),
                            txHash: event.transactionHash,
                            status: "completed",
                        })
                    }
                } catch (err) {
                    console.log("Error fetching native ETH deposits:", err.message)
                }

                // ✅ 2. Fetch DSC Mint Events (DSC Minted) - FROM zero address TO account
                try {
                    const mintFilter = dscToken.filters.Transfer(ethers.ZeroAddress, account)
                    const mintEvents = await dscToken.queryFilter(mintFilter, -10000)

                    console.log("🔥 DSC Mints found:", mintEvents.length)

                    for (const event of mintEvents) {
                        const block = await provider.getBlock(event.blockNumber)
                        allTransactions.push({
                            id: `mint-${event.transactionHash}-${event.logIndex}`,
                            type: "deposit",
                            amount: parseFloat(ethers.formatEther(event.args.value)).toFixed(2),
                            description: "DSC Minted", // ✅ Clear label
                            timestamp: new Date(block.timestamp * 1000),
                            txHash: event.transactionHash,
                            status: "completed",
                        })
                    }
                } catch (err) {
                    console.log("Error fetching DSC mints:", err.message)
                }

                // ✅ Remove repay events section completely
                // Only show: Deposits (ETH + DSC Minting) and Withdrawals

                // ✅ 4. Fetch Collateral Redeemed Events (ETH Withdrawals)
                try {
                    const withdrawFilter = dscEngine.filters.CollateralRedeemed(null, account)
                    const withdrawEvents = await dscEngine.queryFilter(withdrawFilter, -10000)

                    console.log("📤 Collateral Redemption events found:", withdrawEvents.length)

                    for (const event of withdrawEvents) {
                        // Only show native ETH withdrawals (token address is 0x0)
                        if (event.args.token === ethers.ZeroAddress) {
                            const block = await provider.getBlock(event.blockNumber)
                            allTransactions.push({
                                id: `redeem-${event.transactionHash}-${event.logIndex}`,
                                type: "withdrawal",
                                amount: parseFloat(ethers.formatEther(event.args.amount)).toFixed(
                                    4,
                                ),
                                description: "ETH Withdrawn",
                                timestamp: new Date(block.timestamp * 1000),
                                txHash: event.transactionHash,
                                status: "completed",
                            })
                        }
                    }
                } catch (err) {
                    console.log("Error fetching collateral redemptions:", err.message)
                }

                // Sort by timestamp (newest first)
                allTransactions.sort((a, b) => b.timestamp - a.timestamp)

                console.log("📊 Total transactions found:", allTransactions.length)
                setTransactions(allTransactions)
            } catch (error) {
                console.error("❌ Error fetching transactions:", error)
                setTransactions([])
            } finally {
                setLoading(false)
            }
        }

        fetchTransactionsFromBlockchain()
    }, [account, mounted])

    // Check wallet connection
    useEffect(() => {
        const checkWallet = async () => {
            if (typeof window.ethereum !== "undefined") {
                try {
                    const accounts = await window.ethereum.request({
                        method: "eth_accounts",
                    })
                    if (accounts.length > 0) {
                        setAccount(accounts[0])
                    }
                } catch (error) {
                    console.error("Error checking wallet:", error)
                }
            }
        }

        checkWallet()

        if (window.ethereum) {
            window.ethereum.on("accountsChanged", (accounts) => {
                setAccount(accounts.length > 0 ? accounts[0] : null)
            })
        }

        return () => {
            if (window.ethereum) {
                window.ethereum.removeListener("accountsChanged", () => {})
            }
        }
    }, [])

    const formatTime = (date) => {
        const now = currentTime
        const diff = now - date
        const seconds = Math.floor(diff / 1000)
        const minutes = Math.floor(seconds / 60)
        const hours = Math.floor(minutes / 60)
        const days = Math.floor(hours / 24)

        if (seconds < 60) return "Just now"
        if (minutes < 60) return `${minutes}m ago`
        if (hours < 24) return `${hours}h ago`
        if (days < 7) return `${days}d ago`

        return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    }

    const formatFullTime = (date) => {
        return date.toLocaleString("en-IN", {
            month: "2-digit",
            day: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
            timeZone: "Asia/Kolkata",
        })
    }

    const getTypeIcon = (type) => {
        switch (type) {
            case "deposit":
                return <ArrowDownLeft className="w-5 h-5 text-green-600" />
            case "withdrawal":
                return <ArrowUpRight className="w-5 h-5 text-red-600" />
            case "repay":
                return <DollarSign className="w-5 h-5 text-blue-600" />
            case "minimum":
                return <Zap className="w-5 h-5 text-orange-600" />
            default:
                return null
        }
    }

    const getTypeColor = (type) => {
        switch (type) {
            case "deposit":
                return "bg-green-50 border-green-200"
            case "withdrawal":
                return "bg-red-50 border-red-200"
            case "repay":
                return "bg-blue-50 border-blue-200"
            case "minimum":
                return "bg-orange-50 border-orange-200"
            default:
                return "bg-gray-50 border-gray-200"
        }
    }

    const getAmountColor = (type) => {
        switch (type) {
            case "deposit":
                return "text-green-700 font-semibold"
            case "withdrawal":
                return "text-red-700 font-semibold"
            case "repay":
                return "text-blue-700 font-semibold"
            case "minimum":
                return "text-orange-700 font-semibold"
            default:
                return "text-gray-700"
        }
    }

    const getTypeLabel = (type) => {
        switch (type) {
            case "deposit":
                return "Deposit"
            case "withdrawal":
                return "Withdrawal"
            case "repay":
                return "Repayment"
            case "minimum":
                return "Min. Payment"
            default:
                return "Transaction"
        }
    }

    if (!mounted) {
        return (
            <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
                <p className="text-gray-600">Loading...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto flex gap-8">
                {/* LEFT SIDE - Stats (Fixed Sidebar) */}
                <div className="w-60 sticky top-40 h-fit -ml-30">
                    <div className="space-y-4">
                        <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                            <p className="text-sm text-gray-600 mb-1">Total ETH Deposited</p>
                            <p className="text-2xl font-bold text-green-700">
                                {transactions
                                    .filter(
                                        (t) =>
                                            t.type === "deposit" &&
                                            t.description === "ETH Deposited",
                                    )
                                    .reduce((sum, t) => sum + parseFloat(t.amount), 0)
                                    .toFixed(4)}
                                {" ETH"}
                            </p>
                        </div>
                        <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                            <p className="text-sm text-gray-600 mb-1">Total DSC Minted</p>
                            <p className="text-2xl font-bold text-blue-700">
                                {transactions
                                    .filter(
                                        (t) =>
                                            t.type === "deposit" && t.description === "DSC Minted",
                                    )
                                    .reduce((sum, t) => sum + parseFloat(t.amount), 0)
                                    .toFixed(2)}
                                {" USDC"}
                            </p>
                        </div>
                        <div className="p-4 bg-orange-50 border-2 border-orange-200 rounded-lg">
                            <p className="text-sm text-gray-600 mb-1">Total ETH Withdrawn</p>
                            <p className="text-2xl font-bold text-orange-700">
                                {transactions
                                    .filter((t) => t.type === "withdrawal")
                                    .reduce((sum, t) => sum + parseFloat(t.amount), 0)
                                    .toFixed(4)}
                                {" ETH"}
                            </p>
                        </div>
                        <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                            <p className="text-sm text-gray-600 mb-1">Total Transactions</p>
                            <p className="text-2xl font-bold text-red-700">
                                {transactions.length}
                            </p>
                        </div>
                    </div>
                </div>

                {/* RIGHT SIDE - Transactions (scrollable) */}
                <div className="flex-1 max-w-4xl">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            Transaction History
                        </h1>
                        <p className="text-gray-600">
                            Current Time:{" "}
                            {currentTime.toLocaleString("en-IN", {
                                month: "2-digit",
                                day: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                                hour12: true,
                                timeZone: "Asia/Kolkata",
                            })}
                        </p>
                        {account ? (
                            <p className="text-sm text-gray-500 mt-2">
                                Connected: {account.slice(0, 6)}...{account.slice(-4)}
                            </p>
                        ) : (
                            <p className="text-sm text-red-500 mt-2">
                                Please connect your wallet to view transactions
                            </p>
                        )}
                    </div>

                    {loading && (
                        <div className="text-center py-12">
                            <p className="text-gray-600">
                                Loading transactions from blockchain...
                            </p>
                        </div>
                    )}

                    <div className="space-y-3">
                        {!loading && transactions.length > 0 ? (
                            transactions.map((transaction) => (
                                <div
                                    key={transaction.id}
                                    className={`p-4 rounded-lg border-2 ${getTypeColor(
                                        transaction.type,
                                    )} transition-all hover:shadow-md`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-white rounded-lg border">
                                                {getTypeIcon(transaction.type)}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-semibold text-gray-900">
                                                        {transaction.description}
                                                    </h3>
                                                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-white border">
                                                        {getTypeLabel(transaction.type)}
                                                    </span>
                                                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-800">
                                                        Completed
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                                                    <span
                                                        title={formatFullTime(
                                                            transaction.timestamp,
                                                        )}
                                                    >
                                                        {formatTime(transaction.timestamp)}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        {formatFullTime(transaction.timestamp)}
                                                    </span>
                                                    <a
                                                        href={`https://sepolia.etherscan.io/tx/${transaction.txHash}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs text-blue-600 font-mono bg-gray-200 px-2 py-1 rounded hover:underline"
                                                    >
                                                        {transaction.txHash.slice(0, 10)}...
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                        <div
                                            className={`text-right ${getAmountColor(transaction.type)}`}
                                        >
                                            <div className="text-2xl">
                                                {transaction.type === "deposit" ||
                                                transaction.type === "minimum"
                                                    ? "+"
                                                    : "-"}
                                                {transaction.amount}{" "}
                                                {transaction.description.includes("ETH")
                                                    ? "ETH"
                                                    : "USDC"}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : !loading ? (
                            <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
                                <p className="text-gray-600 text-lg">
                                    {!account
                                        ? "Connect your wallet to view transactions"
                                        : "No transactions found"}
                                </p>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    )
}
