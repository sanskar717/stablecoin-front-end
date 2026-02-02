"use client"
import React, { useState, useEffect } from "react"

export default function HealthFactor({ totalCollateralUSD, totalDSCMinted, pendingMint = 0 }) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return (
            <div className="border-2 rounded-lg p-3 w-fit h-fit flex flex-col border-gray-300">
                <div className="flex flex-row items-center gap-4">
                    <h3 className="text-lg font-serif">Health-Factor:</h3>
                    <p className="text-2xl font-serif text-gray-400">...</p>
                    <p className="text-sm text-gray-400">Loading</p>
                </div>
                <p className="text-xs text-gray-500 mt-2">Minimum safe: 1.5</p>
            </div>
        )
    }

    const calculateHealthFactor = () => {
        const totalMinted = Math.max(0, totalDSCMinted + pendingMint)

        if (!totalMinted || totalMinted === 0) {
            return "∞"
        }

        if (!totalCollateralUSD || totalCollateralUSD === 0) {
            return "0.00"
        }

        const collateralAdjusted = (totalCollateralUSD * 50) / 100
        const healthFactor = collateralAdjusted / totalMinted

        return healthFactor.toFixed(2)
    }

    const hasNoCollateral = !totalCollateralUSD || totalCollateralUSD === 0

    if (hasNoCollateral) {
        return (
            <div className="border-2 border-yellow-500 bg-yellow-50 rounded-lg p-4 w-fit h-fit flex flex-col">
                <h2 className="text-yellow-700 font-bold text-lg mb-2"> Deposit ETH First!</h2>
                <p className="text-yellow-600 text-sm mb-2">
                    You must deposit ETH collateral before minting DSC.
                </p>
                <div className="bg-yellow-100 p-2 rounded border border-yellow-300 text-xs text-yellow-700">
                    <p>
                        <strong>Step 1:</strong> Deposit ETH collateral
                    </p>
                    <p>
                        <strong>Step 2:</strong> Then mint DSC
                    </p>
                </div>
                <p className="text-xs text-gray-500 mt-2">Minimum safe HF: 1.5</p>
            </div>
        )
    }

    const hf = calculateHealthFactor()
    const numericHF = hf === "∞" ? Infinity : parseFloat(hf)
    const isHealthy = numericHF >= 1.5
    const isAtRisk = numericHF < 1.5 && numericHF >= 1.0
    const isDangerous = numericHF < 1.0

    return (
        <>
            <div
                className={`border-2 rounded-lg p-3 w-fit h-fit flex flex-col ${
                    isDangerous
                        ? "border-red-600 bg-red-50"
                        : isAtRisk
                          ? "border-orange-500 bg-orange-50"
                          : "border-green-500 bg-green-50"
                }`}
            >
                <div className="flex flex-row items-center gap-2">
                    <h3 className="text-lg font-serif">Health-Factor:</h3>
                    <p
                        className={`text-2xl font-medium ${
                            isDangerous
                                ? "text-red-600"
                                : isAtRisk
                                  ? "text-orange-600"
                                  : "text-green-600"
                        }`}
                    >
                        {hf}
                    </p>
                    <p className="text-sm text-gray-600">
                        {isDangerous ? "❌ Liquidation Risk!" : isAtRisk ? "🟡 At risk" : "Safe"}
                    </p>
                </div>
                <p className="text-xs text-gray-500 mt-2">Minimum safe: 1.5</p>
            </div>

            {isDangerous && (
                <div className="border-2 border-red-600 bg-red-100 rounded-lg p-4 mt-3 max-w-sm">
                    <h2 className="text-red-700 font-bold text-lg mb-2">⚠️ LIQUIDATION ALERT!</h2>
                    <p className="text-red-600 text-sm mb-3">
                        Your health factor is below 1.0. You are at risk of liquidation!
                    </p>
                    <div className="bg-red-50 p-2 rounded mb-3 border border-red-300">
                        <p className="text-xs text-red-600">
                            <strong>Current HF:</strong> {hf}
                        </p>
                        <p className="text-xs text-red-600">
                            <strong>Collateral:</strong> ${totalCollateralUSD?.toFixed(2) || "0"}
                        </p>
                        <p className="text-xs text-red-600">
                            <strong>DSC Minted:</strong> ${totalDSCMinted?.toFixed(2) || "0"}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button className="bg-red-600 text-white px-4 py-2 rounded font-semibold hover:bg-red-700 text-sm">
                            Repay DSC Now
                        </button>
                        <button className="bg-orange-600 text-white px-4 py-2 rounded font-semibold hover:bg-orange-700 text-sm">
                            Add Collateral
                        </button>
                    </div>
                </div>
            )}

            {isAtRisk && !isDangerous && (
                <div className="border-2 border-orange-500 bg-orange-100 rounded-lg p-3 mt-3 max-w-sm">
                    <h3 className="text-orange-700 font-bold mb-2">🟡 Risky Zone</h3>
                    <p className="text-orange-600 text-xs mb-2">
                        Consider repaying DSC or adding collateral to improve your health factor.
                    </p>
                    <button className="bg-orange-500 text-white px-3 py-1 rounded text-sm hover:bg-orange-600">
                        Improve Health Factor
                    </button>
                </div>
            )}
        </>
    )
}
