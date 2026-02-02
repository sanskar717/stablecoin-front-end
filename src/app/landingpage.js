"use client"
import Link from "next/link"
import { useState, useEffect } from "react"

export default function LandingPage() {
    const [account, setAccount] = useState(null)

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
        } catch (error) {
            console.log("Error connecting wallet:", error)
            alert("Failed to connect wallet")
        }
    }

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

        const handleAccountsChanged = (accounts) => {
            if (accounts.length > 0) {
                setAccount(accounts[0])
                localStorage.removeItem("walletDisconnected")
            } else {
                setAccount(null)
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
        <main className="min-h-screen px-5 pt-5">
            <header className="flex justify-end mb-8">
                <button
                    onClick={connectWallet}
                    className="bg-black text-white px-6 py-3 rounded-lg text-base font-serif hover:bg-gray-800 transition cursor-pointer"
                >
                    {account
                        ? `Disconnect ${account.slice(0, 6)}...${account.slice(-4)}`
                        : "Connect Wallet"}
                </button>
            </header>

            <div className="my-4 h-1 w-full bg-linear-to-r from-black to-gray-400 rounded"></div>

            <div className="max-w-5xl w-full grid md:grid-cols-2 gap-10 items-center">
                <div className="absolute top-9 left-2">
                    <h1 className="text-4xl font-serif text-black text-left">
                        Convert ETH into Stablecoin
                    </h1>
                </div>
            </div>

            <div className="mb-8">
                <h2 className="text-4xl font-serif mb-4">Welcome to the Future of DeFi</h2>
                <p className="text-2xl font-serif leading-relaxed">
                    • Mint decentralized stablecoins backed by on-chain collateral.
                    <br />
                    • Experience seamless onboarding with Account Abstraction.
                    <br />
                    • Built for speed, security, and self-custody.
                    <br />• Powered by Ethereum and Chainlink price feeds.
                </p>
            </div>

            <section className="flex justify-end items-end min-h-[50vh] px-4 pb-5">
                <Link
                    href="/main"
                    className="px-8 py-4 bg-black text-white rounded-xl text-lg hover:opacity-80 transition"
                >
                    Launch App
                </Link>
            </section>
        </main>
    )
}
