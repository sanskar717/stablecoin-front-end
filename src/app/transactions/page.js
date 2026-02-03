"use client"
import { useState, useEffect } from "react"
import MoreMenu from "../../components/MoreMenu"
import { ethers } from "ethers"
import TransactionHistory from "@/components/TransactionHistory"

export default function TransactionsContent() {
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

        const handleAccountsChanged = async (accounts) => {
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
        <div className="min-h-screen bg-gray-100 flex flex-col">
            {/* HEADER */}
            <header className="sticky top-0 z-40 bg-white shadow-md px-6 py-3">
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
                <div className="my-4 h-1 w-full bg-linear-to-r from-black to-gray-400 rounded"></div>
            </header>

            {/* NAVIGATION MENU */}
            <main className="sticky top-[73px] z-40">
                <MoreMenu />
            </main>

            {/* MAIN CONTENT */}
            <main>
                <TransactionHistory />
            </main>
        </div>
    )
}
