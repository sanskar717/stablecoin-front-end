"use client"
import Link from "next/link"
import { useState, useEffect } from "react"

export default function LandingPage() {
    const [account, setAccount] = useState(null)
    const [isHovered, setIsHovered] = useState(false)
    const [scrolled, setScrolled] = useState(false)

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

        const handleScroll = () => {
            setScrolled(window.scrollY > 50)
        }

        window.addEventListener("scroll", handleScroll)

        return () => {
            if (window.ethereum) {
                window.ethereum.removeListener("accountsChanged", handleAccountsChanged)
            }
            window.removeEventListener("scroll", handleScroll)
        }
    }, [])

    return (
        <main className="min-h-screen bg-white text-black">
            {/* Premium Header */}
            <header className={`fixed w-full top-0 z-50 transition-all duration-300 ${
                scrolled 
                    ? "bg-white border-b border-gray-200 shadow-sm" 
                    : "bg-white/95 backdrop-blur-md border-b border-gray-100"
            }`}>
                <div className="max-w-7xl mx-auto px-6 md:px-12 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-lg">₿</span>
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            StableCoin
                        </h1>
                    </div>

                    <button
                        onClick={connectWallet}
                        className="px-6 py-2.5 rounded-lg font-semibold text-sm bg-black text-white hover:bg-gray-800 active:scale-95 transition-all duration-300 border border-black hover:border-gray-600"
                    >
                        {account
                            ? `${account.slice(0, 6)}...${account.slice(-4)}`
                            : "Connect Wallet"}
                    </button>
                </div>
            </header>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-6 md:px-12">
                <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
                    {/* Left Content */}
                    <div className="space-y-8">
                        <div className="space-y-4">
                            <p className="text-sm font-semibold tracking-widest text-gray-600 uppercase">
                                Next Generation DeFi
                            </p>
                            <h2 className="text-6xl md:text-7xl font-black leading-tight tracking-tight">
                                Convert ETH into{" "}
                                <span className="relative">
                                    Stablecoin
                                    <span className="absolute -bottom-2 left-0 w-full h-1 bg-black"></span>
                                </span>
                            </h2>
                            <p className="text-lg text-gray-600 max-w-xl leading-relaxed mt-6">
                                Mint decentralized stablecoins backed by real on-chain collateral. 
                                Experience the future of DeFi with premium security and seamless integration.
                            </p>
                        </div>

                        {/* Features */}
                        <div className="space-y-3 pt-4">
                            <div className="flex items-center gap-3">
                                <div className="w-1 h-6 bg-black"></div>
                                <span className="text-gray-700 font-medium">100% Decentralized & Secure</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-1 h-6 bg-black"></div>
                                <span className="text-gray-700 font-medium">Account Abstraction Ready</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-1 h-6 bg-black"></div>
                                <span className="text-gray-700 font-medium">Real-time Chainlink Feeds</span>
                            </div>
                        </div>

                        {/* CTA */}
                        <div className="pt-8 flex items-center gap-4">
                            <Link
                                href="/main"
                                onMouseEnter={() => setIsHovered(true)}
                                onMouseLeave={() => setIsHovered(false)}
                                className="px-8 py-3.5 rounded-lg bg-black text-white font-bold text-base hover:bg-gray-900 transition-all duration-300 hover:shadow-xl active:scale-95"
                            >
                                Launch App
                            </Link>
                            <a 
                                href="#features"
                                className="px-6 py-3.5 rounded-lg border-2 border-black text-black font-bold text-base hover:bg-gray-50 transition-all duration-300"
                            >
                                Learn More
                            </a>
                        </div>
                    </div>

                    {/* Right Visual */}
                    <div className="relative hidden md:block h-96">
                        <div className="absolute inset-0 bg-gray-100 rounded-2xl"></div>
                        <div className="absolute inset-6 border-2 border-black rounded-xl flex items-center justify-center">
                            <div className="text-center">
                                <div className="text-5xl font-black mb-4">ETH</div>
                                <div className="text-2xl text-gray-600 mb-6">↓</div>
                                <div className="text-5xl font-black">STBLC</div>
                                <div className="mt-8 pt-6 border-t-2 border-gray-300 text-sm text-gray-600 font-semibold">
                                    Premium Stablecoin Protocol
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-24 px-6 md:px-12 bg-gray-50 border-y-2 border-black">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-5xl font-black mb-4 tracking-tight">Why Choose StableCoin?</h2>
                    <p className="text-lg text-gray-600 mb-16 max-w-2xl">
                        Enterprise-grade stability meets decentralized finance. Every feature engineered for excellence.
                    </p>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                title: "Backed by Collateral",
                                desc: "100% backed by real ETH collateral on-chain. Transparent and verifiable at all times.",
                                icon: "🔒"
                            },
                            {
                                title: "Real-time Price Feeds",
                                desc: "Powered by Chainlink Oracle. Accurate pricing ensures optimal minting conditions.",
                                icon: "📊"
                            },
                            {
                                title: "Self-Custodial",
                                desc: "Complete control of your assets. No intermediaries, no compromises on security.",
                                icon: "🔑"
                            },
                        ].map((feature, idx) => (
                            <div key={idx} className="p-8 bg-white border-2 border-black rounded-xl hover:shadow-xl transition-all duration-300">
                                <div className="text-4xl mb-4">{feature.icon}</div>
                                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                                <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-20 px-6 md:px-12">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-4 gap-6">
                        {[
                            { label: "TVL", value: "$0", subtext: "And growing" },
                            { label: "Users", value: "Active", subtext: "Worldwide" },
                            { label: "Network", value: "Ethereum", subtext: "Layer 1" },
                            { label: "Security", value: "Audited", subtext: "Smart Contracts" },
                        ].map((stat, idx) => (
                            <div key={idx} className="p-6 border-2 border-gray-200 rounded-xl hover:border-black transition-all duration-300">
                                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-2">
                                    {stat.label}
                                </p>
                                <p className="text-3xl font-black mb-1">{stat.value}</p>
                                <p className="text-sm text-gray-500">{stat.subtext}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 px-6 md:px-12 bg-black text-white border-t-2 border-black">
                <div className="max-w-4xl mx-auto text-center space-y-8">
                    <h2 className="text-5xl md:text-6xl font-black leading-tight">
                        Ready to Mint Stablecoins?
                    </h2>
                    <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                        Join the future of decentralized finance. Secure, fast, and completely decentralized.
                    </p>
                    <Link
                        href="/main"
                        className="inline-block px-10 py-4 bg-white text-black font-bold text-lg rounded-lg hover:bg-gray-100 transition-all duration-300 hover:shadow-2xl active:scale-95"
                    >
                        Launch App Now →
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t-2 border-gray-200 py-12 px-6 md:px-12">
                <div className="max-w-7xl mx-auto flex justify-between items-center text-sm text-gray-600">
                    <p>© 2026 StableCoin. All rights reserved.</p>
                    <div className="flex gap-6">
                        <a href="#" className="hover:text-black transition">Docs</a>
                        <a href="#" className="hover:text-black transition">Twitter</a>
                        <a href="#" className="hover:text-black transition">GitHub</a>
                    </div>
                </div>
            </footer>

            <style jsx>{`
                @keyframes slideInUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                section {
                    animation: slideInUp 0.6s ease-out;
                }
            `}</style>
        </main>
    )
}