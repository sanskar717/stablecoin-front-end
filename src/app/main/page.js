"use client"
import { ethers } from "ethers"
import { getContracts, getNetworkConfig } from "@/config/contracts"
import { useState, useEffect, use } from "react"
import { useEthPrice } from "../../hooks/useEthPrice"
import HealthFactor from "@/components/HealthFactor"
import LiveETHTicker from "@/components/LiveETHTicker"
import MoreMenu from "@/components/MoreMenu"

export default function MainPage() {
    const [account, setAccount] = useState(null)
    const [ethBalance, setEthBalance] = useState(null)
    const [signer, setSigner] = useState(null)

    const [depositAmount, setDepositAmount] = useState("")
    const [dscEngine, setDscEngine] = useState(null)
    const { price: ethPrice, updatedAt: lastUpdated } = useEthPrice()
    const [maxMintAmount, setMaxMintAmount] = useState("0.00")
    const [pendingMintAmount, setPendingMintAmount] = useState(0)
    const [dscMinted, setDscMinted] = useState("0.00")

    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const [depositMap, setDepositMap] = useState(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("depositMap")
            return saved ? JSON.parse(saved) : {}
        }
        return {}
    })

    const normalizedAccount = account?.toLowerCase() || ""
    const depositedEth = Number(depositMap[normalizedAccount] || 0)

    useEffect(() => {
        try {
            const saved = localStorage.getItem("depositMap")
            if (saved) {
                const parsed = JSON.parse(saved)
                if (parsed && typeof parsed === "object") {
                    setDepositMap(parsed)
                }
            }
        } catch (e) {
            console.warn("Failed to hydrate depositMap:", e)
        }
    }, [])

    useEffect(() => {
        try {
            localStorage.setItem("depositMap", JSON.stringify(depositMap))
        } catch (er) {
            console.warn("Failed to persist depositMap:", er)
        }
    }, [depositMap])

  
    const connectWallet = async () => {
        if (account) {
            setAccount(null)
            setEthBalance(null)
            setDscMinted("0.00")
            localStorage.setItem("walletDisconnected", "true")
            return
        }

        if (typeof window.ethereum === "undefined") {
            alert("Metamask is not installed! Please install Metamask extension.")
            window.open("https://metamask.io/download/", "_blank")
            return
        }

        try {
            const wasDisconnected = localStorage.getItem("walletDisconnected")

            if (wasDisconnected === "true") {
                try {
                    await window.ethereum.request({
                        method: "wallet_requestPermissions",
                        params: [{ eth_accounts: {} }],
                    })
                } catch (permError) {
                    console.log("Permission request not supported, continuing...")
                }
                localStorage.removeItem("walletDisconnected")
            }

            const accounts = await window.ethereum.request({
                method: "eth_requestAccounts",
            })
            setAccount(accounts[0])
            const provider = new ethers.BrowserProvider(window.ethereum)
            const signerInstance = await provider.getSigner()
            setSigner(signerInstance)
            const network = await provider.getNetwork()
            const chainId = Number(network.chainId)

            const contarcts = getContracts(chainId)
            const DSCEngineInstance = new ethers.Contract(
                contarcts.DSCEngine.address,
                contarcts.DSCEngine.abi,
                signerInstance,
            )

            setDscEngine(DSCEngineInstance)
        } catch (error) {
            console.log("Error connecting wallet:", error)
            alert("Failed to connect wallet")
        }
    }

    const addDSCToMetaMask = async () => {
        try {
            const provider = new ethers.BrowserProvider(window.ethereum)
            const network = await provider.getNetwork()
            const chainId = Number(network.chainId)
            const contracts = getContracts(chainId)

            await window.ethereum.request({
                method: "wallet_watchAsset",
                params: {
                    type: "ERC20",
                    options: {
                        address: contracts.DSC.address,
                        symbol: "DSC",
                        decimals: 18,
                        image: "https://gateway.pinata.cloud/ipfs/QmZ1eSWdqUG6km7P7S846iu6bDmxy9LppZf3QY8cptdz8n",
                    },
                },
            })
            alert("DSC token added to Metamask~")
        } catch (error) {
            console.error("Failed to add token: ", error)
            alert("Failed to add token. Please add manually.")
        }
    }

    const calculateMaxMintAmount = async (ethAmount) => {
        if (!ethAmount || !ethPrice) return "0.00"

        try {
            const ethValue = parseFloat(ethAmount)
            const priceValue = parseFloat(ethPrice)

            const usdValue = ethValue * priceValue

            const maxMint = usdValue * 0.5

            return maxMint.toFixed(2)
        } catch (error) {
            console.error("Error calculating max mint:", error)
            return "0.00"
        }
    }

    const syncDepositFromChain = async () => {
        if (!account || !dscEngine) return

        try {
            const collateral = await dscEngine.getCollateralBalanceOfUser(
                account,
                "0x0000000000000000000000000000000000000000",
            )

            const eth = parseFloat(ethers.formatEther(collateral))

            setDepositMap((prev) => ({
                ...prev,
                [account.toLowerCase()]: eth,
            }))
        } catch (err) {
            console.error("Failed to sync deposit from chain:", err)
        }
    }

    const refreshBalances = async () => {
        if (!account || typeof window.ethereum === "undefined") return

        try {
            console.log("🔄 Starting balance refresh...")
            const provider = new ethers.BrowserProvider(window.ethereum)
            const network = await provider.getNetwork()
            const chainId = Number(network.chainId)
            const contracts = getContracts(chainId)

            const balance = await provider.getBalance(account)
            const ethBal = ethers.formatEther(balance)
            console.log("✅ ETH Balance:", ethBal)
            setEthBalance(ethBal)

            try {
                const dscEngineRead = new ethers.Contract(
                    contracts.DSCEngine.address,
                    contracts.DSCEngine.abi,
                    provider,
                )

                const accountInfo = await dscEngineRead.getAccountInfo(account)
                const mintedDsc = ethers.formatEther(accountInfo[0])
                console.log("🔥 Minted DSC from contract:", mintedDsc)

                if (mintedDsc && !isNaN(parseFloat(mintedDsc))) {
                    setDscMinted(mintedDsc)
                    console.log("✅ DSC Minted set to:", mintedDsc)
                } else {
                    console.warn("⚠️ Invalid minted DSC, setting to 0")
                    setDscMinted("0.00")
                }
            } catch (err) {
                console.error("❌ Error fetching minted DSC:", err)
                setDscMinted("0.00")
            }

            try {
                const dscEngineRead = new ethers.Contract(
                    contracts.DSCEngine.address,
                    contracts.DSCEngine.abi,
                    provider,
                )

                const collateralAmount = await dscEngineRead.getCollateralBalanceOfUser(
                    account,
                    "0x0000000000000000000000000000000000000000",
                )
                const ethDeposited = ethers.formatEther(collateralAmount)
                console.log("✅ Deposited ETH:", ethDeposited)

                setDepositMap((prev) => ({
                    ...prev,
                    [account.toLowerCase()]: parseFloat(ethDeposited),
                }))
            } catch (err) {
                console.error("❌ Error fetching collateral:", err)
            }

            console.log("✅ Balance refresh complete!")
        } catch (error) {
            console.error("❌ Error refreshing balances:", error)
        }
    }

    useEffect(() => {
        const restoreSignerAndContract = async () => {
            if (typeof window.ethereum !== "undefined") {
                const accounts = await window.ethereum.request({ method: "eth_accounts" })
                if (accounts.length > 0) {
                    setAccount(accounts[0])

                    const provider = new ethers.BrowserProvider(window.ethereum)
                    const signerInstance = await provider.getSigner()
                    setSigner(signerInstance)

                    const network = await provider.getNetwork()
                    const chainId = Number(network.chainId)

                    const contracts = getContracts(chainId)
                    const dscAddress = contracts?.DSCEngine?.address
                    const dscAbi = contracts?.DSCEngine?.abi

                    if (!dscAddress || dscAddress === "") {
                        console.error("Missing DSCEngine address for chain:", chainId)
                        return
                    }

                    const dscEngineInstance = new ethers.Contract(
                        dscAddress,
                        dscAbi,
                        signerInstance,
                    ) 
                    setDscEngine(dscEngineInstance)

                    const dscContract = new ethers.Contract(
                        contracts.DSC.address,
                        contracts.DSC.abi,
                        provider,
                    )
                }
            }
        }
        restoreSignerAndContract()
    }, [])

    useEffect(() => {
        const checkIfWalletConnected = async () => {
            if (typeof window.ethereum !== "undefined") {
                try {
                    const accounts = await window.ethereum.request({
                        method: "eth_accounts",
                    })
                    if (accounts.length > 0) {
                        const wasDisconnected = localStorage.getItem("walletDisconnected")
                        if (wasDisconnected !== "true") {
                            setAccount(accounts[0])
                        }
                    }
                } catch (error) {
                    console.error("Error checking wallet:", error)
                }
            }
        }

        checkIfWalletConnected()

        const handleAccountsChanged = async (accounts) => {
            if (accounts.length > 0) {
                setAccount(accounts[0])
                localStorage.removeItem("walletDisconnected")

                const provider = new ethers.BrowserProvider(window.ethereum)
                const signerInstance = await provider.getSigner()
                setSigner(signerInstance)

                const network = await provider.getNetwork()
                const chainId = Number(network.chainId)

                const contracts = getContracts(chainId)
                const dscEngineInstance = new ethers.Contract(
                    contracts.DSCEngine.address,
                    contracts.DSCEngine.abi,
                    signerInstance,
                )
                setDscEngine(dscEngineInstance)

                await refreshBalances()
            } else {
                setAccount(null)
                setEthBalance(null)
                setDscMinted("0.00")
            }
        }

        if (window.ethereum) {
            window.ethereum.on("accountsChanged", handleAccountsChanged)
        }

        return () => {
            if (window.ethereum) {
                window.ethereum.removeListener("accountsChanged", handleAccountsChanged)
            }
        }
    }, [])

    useEffect(() => {
        const fetchEthBalance = async () => {
            if (account && typeof window.ethereum !== "undefined") {
                try {
                    const provider = new ethers.BrowserProvider(window.ethereum)
                    const balance = await provider.getBalance(account)
                    setEthBalance(ethers.formatEther(balance))

                    const network = await provider.getNetwork()
                    const chainId = Number(network.chainId)
                    const contracts = getContracts(chainId)

                    try {
                        const dscEngineRead = new ethers.Contract(
                            contracts.DSCEngine.address,
                            contracts.DSCEngine.abi,
                            provider, 
                        )

                        const accountInfo = await dscEngineRead.getAccountInfo(account)
                        const mintedDsc = ethers.formatEther(accountInfo[0])
                        console.log("✅ Minted DSC on page load:", mintedDsc)
                        setDscMinted(mintedDsc)
                    } catch (err) {
                        console.error("Error getting minted DSC:", err)
                        setDscMinted("0.00")
                    }
                } catch (error) {
                    console.error("Error fetching balance:", error)
                    setEthBalance(null)
                    setDscMinted("0.00")
                }
            } else {
                setEthBalance(null)
                setDscMinted("0.00")
            }
        }

        fetchEthBalance()
    }, [account])

    useEffect(() => {
        const calculate = async () => {
            const amount = await calculateMaxMintAmount(depositAmount)
            setMaxMintAmount(amount)
        }
        calculate()
    }, [depositAmount, dscEngine])

    const handleManualMint = async () => {
        try {
            const mintInput = document.querySelector(
                'input[placeholder="Enter DSC amount to mint"]',
            )
            const mintAmount = mintInput?.value
            if (!mintAmount || isNaN(mintAmount) || parseFloat(mintAmount) <= 0) {
                alert("Please enter a valid mint amount")
                return
            }
            const amount = parseFloat(mintAmount)

            const deposited = Number(depositMap[normalizedAccount] || 0)
            const collateralValue = deposited * Number(ethPrice || 0)
            const maxAllowed = collateralValue * 0.33
            const alreadyMinted = parseFloat(dscMinted || "0")

            const canMint = Math.max(0, maxAllowed - alreadyMinted)

            if (canMint <= 0) {
                alert("❌ Cannot mint! Deposit more ETH first.")
                return
            }
            if (amount > canMint) {
                alert(
                    `❌ Max allowed: ${canMint.toFixed(2)} DSC only!\n\nHealth Factor would drop below 1.5`,
                )
                return
            }
            const amountWei = ethers.parseEther(amount.toString())

            console.log("🔄 Minting", amount, "DSC...")
            const tx = await dscEngine.mintDSC(amountWei)
            await tx.wait()

            alert(`✅ Mint successful! ${amount} DSC minted`)

            await new Promise((resolve) => setTimeout(resolve, 2000))
            await refreshBalances()

            mintInput.value = ""
            setPendingMintAmount(0)

            try {
                await addDSCToMetaMask()
            } catch (err) {
                console.warn("Could not add to metamask:", err)
            }
        } catch (error) {
            console.error("❌ Mint Failed:", error)
            if (error.message.includes("BreaksHealthFactor")) {
                alert(
                    "❌ Mint Failed: Health Factor too low!\n\nTry a smaller amount or deposit more collateral.",
                )
            } else if (error.message.includes("user rejected")) {
                alert("Transaction cancelled by user")
            } else {
                alert(`❌ Mint Failed: ${error.shortMessage || error.message}`)
            }
        }
    }

    useEffect(() => {
        if (account && dscEngine) {
            syncDepositFromChain()
        }
    }, [account, dscEngine])

    return (
        <div className="h-screen bg-gray-100 flex flex-col">
            {/* HEADER */}
            <header className="bg-white shadow-md px-6 py-3">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <h1 className="text-xl font-serif">Stablecoin DApp</h1>
                    <button
                        onClick={connectWallet}
                        className="bg-black text-white px-6 py-3 rounded-lg text-base font-serif hover:bg-gray-800 transition cursor-pointer"
                    >
                        {account
                            ? `Disconnect ${account.slice(0, 6)}...${account.slice(-4)}`
                            : "Connect Wallet"}
                    </button>
                </div>
            </header>

            <MoreMenu />

            {/* MAIN CONTENT */}
            <div className="flex-1 flex items-start justify-start px-4 gap-8 pt-12">
                {/* LEFT - ETH Ticker */}
                <div className="w-full max-w-md">
                    <LiveETHTicker />
                </div>
                <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-2xl">
                    <h2 className="text-3xl font-serif mb-6">Deposit-ETH</h2>
                    <input
                        type="number"
                        step="0.000001"
                        min="0"
                        placeholder="Amount in ETH"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        className="border-2 border-gray-300 p-3 rounded-lg w-full mb-4 text-lg"
                        disabled={!account}
                        onKeyDown={(e) => {
                            if (e.key === "e" || e.key === "E" || e.key === "-" || e.key === "+") {
                                e.preventDefault()
                            }
                        }}
                    />

                    <input
                        type="number"
                        step="0.000001"
                        min="0"
                        placeholder="Enter DSC amount to mint"
                        disabled={!account}
                        className="border-2 border-gray-300 p-3 rounded-lg w-full mb-4 text-lg"
                        onChange={(e) => setPendingMintAmount(parseFloat(e.target.value) || 0)}
                        onKeyDown={(e) => {
                            if (e.key === "e" || e.key === "E" || e.key === "-" || e.key === "+") {
                                e.preventDefault()
                            }
                        }}
                    />

                    <div className="flex flex-row items-start gap-4 -mt-1 mb-4">
                        {/* ✅ Mint Button (unchanged) */}
                        <button
                            onClick={handleManualMint}
                            disabled={!account || !dscEngine}
                            className={`group relative px-6 py-3 rounded-lg text-base font-semibold
                                    bg-green-500 text-white
                                      border-2 border-green-500
                                      overflow-hidden
                                      transition-all duration-300 ease-out
                                    hover:text-black
                                    hover:shadow-[0_0_25px_rgba(34,197,94,0.9)]
                                    cursor-pointer
                                    disabled:bg-gray-400 disabled:cursor-not-allowed disabled:border-gray-400`}
                        >
                            <span className="relative z-10 transition-colors duration-300">
                                Get Mint
                            </span>
                            <span
                                className="absolute inset-0
                                         bg-white
                                           opacity-0
                                           group-hover:opacity-20
                                           transition-opacity duration-300"
                            />
                        </button>

                        {/* ✅ HealthFactor box beside button */}
                        <HealthFactor
                            totalCollateralUSD={depositedEth * parseFloat(ethPrice || "0")}
                            totalDSCMinted={parseFloat(dscMinted || "0")}
                            pendingMint={pendingMintAmount}
                        />

                        {depositAmount && parseFloat(depositAmount) > 0 && (
                            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-400 rounded-lg p-3 min-w-[200px]">
                                <div className="text-xs text-gray-600 mb-1">
                                    After Depositing {parseFloat(depositAmount).toFixed(4)} ETH
                                </div>
                                <div className="text-lg font-serif text-gray-700">
                                    You get:{" "}
                                    <span className="text-blue-600">
                                        $
                                        {(
                                            parseFloat(depositAmount) *
                                            parseFloat(ethPrice || "0") *
                                            0.33
                                        ).toFixed(2)}
                                        DSC
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/**/}
                    <div className="bg-linear-to-r from-green-50 to-blue-50 border-2 border-green-300 rounded-lg p-4 mb-4">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-gray-700 font-semibold">Current ETH Price:</span>
                            <span className="text-xl font-bold text-yellow-500">
                                ${ethPrice} USD
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 mb-3">Last updated: {lastUpdated}</p>

                        <div className="flex justify-between items-center mb-2">
                            <span className="text-gray-700 font-semibold">You can mint:</span>
                            <span className="text-2xl font-bold text-green-600">
                                {(() => {
                                    const deposited = Number(depositMap[normalizedAccount] || 0)
                                    const livePrice = parseFloat(ethPrice || "0")
                                    const collateralValue = deposited * livePrice
                                    const maxAllowed = collateralValue * 0.33
                                    const alreadyMinted = parseFloat(dscMinted || "0")
                                    const canMint = Math.max(0, maxAllowed - alreadyMinted)
                                    return canMint.toFixed(2)
                                })()}
                                DSC
                            </span>
                        </div>
                        <p className="text-sm text-gray-500">
                            Max mint: 33% of collateral value (Health Factor: 1.5 minimum)
                        </p>
                    </div>
                    {/**/}

                    <button
                        className="bg-black text-white px-6 py-3 rounded-lg text-lg font-semibold hover:bg-gray-800 transition w-full disabled:bg-gray-400 disabled:cursor-not-allowed"
                        disabled={!account || !depositAmount || !dscEngine}
                        onClick={async () => {
                            try {
                                if (
                                    !depositAmount ||
                                    isNaN(depositAmount) ||
                                    parseFloat(depositAmount) <= 0
                                ) {
                                    alert("Please enter a valid ETH amount")
                                    return
                                }

                                const amountwei = ethers.parseEther(depositAmount)

                                console.log("🔄 Depositing...")
                                const tx = await dscEngine.depositETHOnly({ value: amountwei })
                                await tx.wait()

                                const collateralAmount =
                                    await dscEngine.getCollateralBalanceOfUser(
                                        account,
                                        "0x0000000000000000000000000000000000000000",
                                    )
                                const actualDeposited = parseFloat(
                                    ethers.formatEther(collateralAmount),
                                )

                                setDepositMap((prev) => ({
                                    ...prev,
                                    [account.toLowerCase()]: actualDeposited,
                                }))

                                alert(`✅ Deposited ${actualDeposited} ETH`)

                                await syncDepositFromChain()
                                await refreshBalances()
                                setDepositAmount("")
                            } catch (error) {
                                console.error("❌ Error:", error)
                                alert(`Failed: ${error.message}`)
                            }
                        }}
                    >
                        {account ? "Deposit" : "Connect Wallet to Deposit"}
                    </button>
                </div>
            </div>

            {/* BALANCE BOXES */}
            <div className="absolute top-35 right-10 flex flex-col gap-4 items-end">
                <div className="bg-white rounded-lg shadow-md p-4 w-64 text-right">
                    <h2 className="text-lg font-serif mb-1 text-gray-700 text-left">
                        ETH~Balance:
                    </h2>
                    <p className="text-base text-gray-700">
                        {ethBalance ? `${parseFloat(ethBalance).toFixed(4)} ETH` : "—"}
                    </p>
                    <div className="my-4 h-1 w-full bg-linear-to-r from-black to-gray-400 rounded"></div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-4 w-64 text-right">
                    <h2 className="text-lg font-serif mb-1 text-gray-700 text-left">
                        Deposit~ETH:
                    </h2>

                    {account && (
                        <p className="text-base text-green-500 font-semibold text-left">
                            {(Number(depositMap[normalizedAccount]) || 0).toFixed(4)} ETH Deposited
                        </p>
                    )}

                    {/* ✅ Add this line for 1 ETH value */}
                    <p className="text-sm text-gray-500 mt-2 text-left">
                        1 ETH ≈ <span className="font-semibold text-red-400">${ethPrice} USD</span>
                    </p>

                    <div className="my-4 h-1 w-full bg-linear-to-r from-black to-gray-400 rounded"></div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-4 w-64 text-right">
                    <h2 className="text-lg font-serif mb-1 text-gray-700 text-left">
                        Stablecoin~Balance:
                    </h2>

                    {account ? (
                        <p className="text-base text-gray-700 mt-2 text-left">
                            Claimable:{" "}
                            <span className="text-green-400 font-semi">
                                {(() => {
                                    const totalDeposited = depositedEth
                                    const totalValue = totalDeposited * Number(ethPrice || 0)
                                    const maxMintable = totalValue * 0.33
                                    const alreadyMinted = parseFloat(dscMinted || "0")
                                    const remaining = Math.max(0, maxMintable - alreadyMinted)
                                    return remaining.toFixed(2)
                                })()}{" "}
                                DSC
                            </span>
                        </p>
                    ) : (
                        <p className="text-base text-gray-700">—</p>
                    )}

                    <div className="my-4 h-1 w-full bg-linear-to-r from-black to-gray-400 rounded"></div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-4 w-64 text-right">
                    <h2 className="text-lg font-serif mb-1 text-gray-700 text-left">
                        claimed~balnce:
                    </h2>

                    {account ? (
                        <p className="text-base text-blue-400 font-bold mt-2 text-right">
                            {parseFloat(dscMinted || "0").toFixed(2)} DSC
                        </p>
                    ) : (
                        <p className="text-base text-gray-700">—</p> 
                    )}

                    <div className="my-4 h-1 w-full bg-linear-to-r from-black to-gray-400 rounded"></div>
                </div>
            </div>
        </div>
    )
}
