"use client"
import { useState, useEffect } from "react"
import MoreMenu from "@/components/MoreMenu"
import { ethers } from "ethers"
import { getContracts } from "@/config/contracts"

export default function RepayDebtPage() {
    const [account, setAccount] = useState(null)
    const [dscEngine, setDscEngine] = useState(null)
    const [signer, setSigner] = useState(null)
    const [dscBalance, setDscBalance] = useState("0.00")
    const [depositedEth, setDepositedEth] = useState("0.00")
    const [repayAmount, setRepayAmount] = useState("")
    const [withdrawAmount, setWithdrawAmount] = useState("")
    const [estimatedEth, setEstimatedEth] = useState("0.00")
    const [ethRepayAmount, setEthRepayAmount] = useState("")
    const [dscMinted, setDscMinted] = useState("0.00")

    const connectWallet = async () => {
        if (account) {
            setAccount(null)
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
            const contracts = getContracts(chainId)

            const dscEngineInstance = new ethers.Contract(
                contracts.DSCEngine.address,
                contracts.DSCEngine.abi,
                signerInstance,
            )
            setDscEngine(dscEngineInstance)
        } catch (error) {
            console.log("Error connecting wallet:", error)
            alert("Failed to connect wallet")
        }
    }

    const fetchBalances = async () => {
        if (!account || !signer || !dscEngine) return

        try {
            const provider = new ethers.BrowserProvider(window.ethereum)
            const network = await provider.getNetwork()
            const chainId = Number(network.chainId)
            const contracts = getContracts(chainId)

            const dscContract = new ethers.Contract(
                contracts.DSC.address,
                contracts.DSC.abi,
                provider,
            )
            const dscBal = await dscContract.balanceOf(account)
            setDscBalance(ethers.formatEther(dscBal))

            const accountInfo = await dscEngine.getAccountInfo(account)
            const mintedDsc = ethers.formatEther(accountInfo[0])
            console.log("🔥 Minted DSC:", mintedDsc)
            setDscMinted(mintedDsc)

            const collateral = await dscEngine.getCollateralBalanceOfUser(
                account,
                "0x0000000000000000000000000000000000000000",
            )
            setDepositedEth(ethers.formatEther(collateral))
        } catch (error) {
            console.error("Error fetching balances:", error)
        }
    }

    const handleRepay = async () => {
        if (!repayAmount || parseFloat(repayAmount) <= 0) {
            alert("Please enter a valid amount!")
            return
        }

        try {
            const amount = ethers.parseEther(repayAmount)

            const provider = new ethers.BrowserProvider(window.ethereum)
            const network = await provider.getNetwork()
            const chainId = Number(network.chainId)
            const contracts = getContracts(chainId)

            const dscContract = new ethers.Contract(
                contracts.DSC.address,
                contracts.DSC.abi,
                signer,
            )

            console.log("Approving DSC spend...")
            const approveTx = await dscContract.approve(contracts.DSCEngine.address, amount)
            await approveTx.wait()

            console.log("Repaying DSC debt...")
            const burnTx = await dscEngine.burnDSC(amount)
            await burnTx.wait()

            alert(`Repaid ${repayAmount} DSC successfully~`)
            setRepayAmount("")
            await fetchBalances()
        } catch (error) {
            console.error("Repay Failed:", error)
            alert(`Failed: ${error.message}`)
        }
    }

    const handleWithdraw = async () => {
        if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
            alert("Please enter a valid amount!")
            return
        }

        if (parseFloat(dscMinted) > 0) {
            alert(`⚠️ Cannot withdraw! You have ${dscMinted} DSC minted. Please repay DSC first.`)
            return
        }

        const depositedAmount = parseFloat(depositedEth)
        const withdrawAmt = parseFloat(withdrawAmount)

        if (withdrawAmt > depositedAmount) {
            alert(
                `Cannot withdraw ${withdrawAmount} ETH! You only have ${depositedEth} ETH deposited.`,
            )
            return
        }

        try {
            const amount = ethers.parseEther(withdrawAmount)

            console.log("Withdrawing ETH...")
            const tx = await dscEngine.redeemCollateral(
                "0x0000000000000000000000000000000000000000",
                amount,
            )
            await tx.wait()

            alert(`Withdrew ${withdrawAmount} ETH successfully~`)
            setWithdrawAmount("")
            await fetchBalances()
        } catch (error) {
            console.error("Withdraw Failed:", error)
            if (error.message.includes("BreaksHealthFactor")) {
                alert("Cannot withdraw! Health Factor would be too low.")
            } else {
                alert(`Failed: ${error.message}`)
            }
        }
    }

    const calculateEthRequired = async (dscAmount) => {
        if (!dscAmount || parseFloat(dscAmount) <= 0 || !dscEngine) {
            setEstimatedEth("0.00")
            return
        }

        try {
            const amount = ethers.parseEther(dscAmount)

            const ethPrice = await dscEngine.getETHPriceInUSD()
            const PRECISION = BigInt(1e18)

            const requiredETH = (amount * PRECISION) / ethPrice

            setEstimatedEth(ethers.formatEther(requiredETH))
        } catch (error) {
            console.error("Error calculating ETH required:", error)
            setEstimatedEth("0.00")
        }
    }

    const handleRepayWithETH = async () => {
        if (!ethRepayAmount || parseFloat(ethRepayAmount) <= 0) {
            alert("Please enter a valid DSC amount!")
            return
        }

        if (parseFloat(estimatedEth) <= 0) {
            alert("Cannot calculate ETH required!")
            return
        }

        try {
            const dscAmount = ethers.parseEther(ethRepayAmount)
            const ethAmount = ethers.parseEther(estimatedEth)

            const tx = await dscEngine.repayDSCWithETHDirect(dscAmount, {
                value: ethAmount,
            })

            await tx.wait()

            alert(`✅ Repaid ${ethRepayAmount} DSC using ${estimatedEth} ETH!`)
            setEthRepayAmount("")
            setEstimatedEth("0.00")
            await fetchBalances()
        } catch (error) {
            console.error("Repay Failed:", error)
            alert(`❌ Failed: ${error.message}`)
        }
    }

    useEffect(() => {
        if (account && signer && dscEngine) {
            fetchBalances()
        }
    }, [account, signer, dscEngine])

    useEffect(() => {
        const restoreSignerAndContract = async () => {
            if (account && typeof window.ethereum !== "undefined") {
                try {
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
                } catch (error) {
                    console.error("Error restoring signer:", error)
                }
            }
        }

        restoreSignerAndContract()
    }, [account])

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
            } else {
                setAccount(null)
                setDscBalance("0.00")
                setDepositedEth("0.00")
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

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
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
                <div className="my-4 h-1 w-full bg-gradient-to-r from-black to-gray-400 rounded"></div>
            </header>

            <MoreMenu />

            <div className="absolute top-[180px] left-7 flex flex-col gap-4 items-end">
                <div className="bg-white rounded-lg shadow-md p-4 w-64">
                    <h2 className="text-lg font-serif mb-1 text-gray-700 text-left">
                        DSC~Minted (Debt):
                    </h2>
                    <p className="text-base text-blue-400 font-serif text-left">{dscMinted} DSC</p>
                    <div className="my-4 h-1 w-full bg-gradient-to-r from-black to-gray-400 rounded"></div>
                </div>
            </div>

            <div className="absolute top-[320px] left-7 flex flex-col gap-4 items-end">
                <div className="bg-white rounded-lg shadow-md p-4 w-64">
                    <h2 className="text-lg font-serif mb-1 text-gray-700 text-left">
                        Deposited~ETH:
                    </h2>
                    <p className="text-base text-green-500 font-serif text-left">
                        {depositedEth} ETH
                    </p>
                    <div className="my-4 h-1 w-full bg-gradient-to-r from-black to-gray-400 rounded"></div>
                </div>
            </div>

            <div className="flex-grow flex flex-col md:flex-row justify-center items-center gap-4 mt-8 mb-12 px-4">
                {/* REPAY BOX */}
                <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                    <h1 className="text-4xl font-serif mb-4">Repay DSC Debt</h1>

                    {parseFloat(dscMinted) === 0 ? (
                        <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4 text-center">
                            <p className="text-lg text-gray-700 mb-2">⚠️ No DSC to repay</p>
                            <p className="text-sm text-gray-600">
                                You don't have any DSC minted yet.
                            </p>
                            <p className="text-sm text-gray-600 mt-2">
                                Go to{" "}
                                <a href="/main" className="text-blue-500 underline font-semibold">
                                    Dashboard
                                </a>{" "}
                                to mint DSC first.
                            </p>
                        </div>
                    ) : (
                        <>
                            <input
                                type="number"
                                placeholder="Amount to repay (DSC)"
                                value={repayAmount}
                                onChange={(e) => setRepayAmount(e.target.value)}
                                disabled={!account}
                                className="border-2 border-gray-300 p-3 rounded-lg w-full mb-4 text-lg"
                            />

                            <button
                                onClick={handleRepay}
                                disabled={!account || !dscEngine}
                                className="bg-red-500 text-white px-6 py-3 rounded-lg w-full text-lg font-serif hover:bg-red-400 transition disabled:bg-gray-400 cursor-pointer mb-4"
                            >
                                Repay with DSC Balance
                            </button>

                            <input
                                type="number"
                                placeholder="Amount to repay With ETH"
                                value={ethRepayAmount}
                                onChange={async (e) => {
                                    setEthRepayAmount(e.target.value)
                                    await calculateEthRequired(e.target.value)
                                }}
                                disabled={!account}
                                className="border-2 border-gray-300 p-3 rounded-lg w-full mb-4 text-lg"
                            />

                            {parseFloat(ethRepayAmount) > 0 && (
                                <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-300 p-3 rounded-lg w-full mb-4">
                                    <p className="text-sm text-gray-600">💰 ETH Required:</p>
                                    <p className="text-2xl font-bold text-blue-600">
                                        {estimatedEth} ETH
                                    </p>
                                </div>
                            )}

                            <button
                                onClick={handleRepayWithETH}
                                disabled={
                                    !account || !dscEngine || parseFloat(ethRepayAmount) <= 0
                                }
                                className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-lg w-full text-lg font-serif hover:from-blue-600 hover:to-purple-600 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                🔄 Swap ETH & Repay DSC
                            </button>
                        </>
                    )}
                </div>

                <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                    <h1 className="text-4xl font-serif mb-4">Withdraw ETH</h1>

                    {parseFloat(depositedEth) === 0 ? (
                        <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4 text-center">
                            <p className="text-lg text-gray-700 mb-2">⚠️ No ETH to withdraw</p>
                            <p className="text-sm text-gray-600">
                                You haven't deposited any ETH yet.
                            </p>
                            <p className="text-sm text-gray-600 mt-2">
                                Go to{" "}
                                <a href="/main" className="text-blue-500 underline font-semibold">
                                    Dashboard
                                </a>{" "}
                                to deposit ETH first.
                            </p>
                        </div>
                    ) : (
                        <>
                            <input
                                type="number"
                                placeholder="Amount to withdraw (ETH)"
                                value={withdrawAmount}
                                onChange={(e) => setWithdrawAmount(e.target.value)}
                                disabled={!account}
                                className="border-2 border-gray-300 p-3 rounded-lg w-full mb-4 text-lg"
                            />

                            <button
                                onClick={handleWithdraw}
                                disabled={!account || !dscEngine}
                                className="bg-blue-500 text-white px-6 py-3 rounded-lg w-full text-lg font-serif hover:bg-blue-600 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                Withdraw ETH
                            </button>
                        </>
                    )}
                </div>
            </div>
         </div>
    )
}
