"use client"
import { useRouter } from "next/navigation"

export default function MoreMenu() {
    const router = useRouter()

    return (
        <nav className="bg-white shadow-sm border-b border-gray-200 px-6 py-3">
            <div className="max-w-7xl mx-auto flex gap-8 items-center">
                <button 
                    onClick={() => router.push("/")}
                    className="text-black font-serif hover:text-yellow-400 transition cursor-pointer"
                >
                    Home
                </button>
                <button 
                    onClick={() => router.push("/main")}
                    className="text-black font-serif hover:text-blue-400 transition cursor-pointer"
                >
                    Dashboard
                </button>
                <button
                    onClick={() => router.push("/repay")}
                    className="text-black font-serif hover:text-red-500 transition cursor-pointer"
                >
                    Repay Debt
                </button>
                <button 
                    onClick={() => router.push("/transactions")}
                    className="text-black font-serif hover:text-green-400 transition cursor-pointer"
                >
                    Transactions
                </button>
            </div>
        </nav>
    )
}