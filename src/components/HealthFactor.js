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
        // ✅ Include pending mint in calculation
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

    const hf = calculateHealthFactor()
    const numericHF = hf === "∞" ? Infinity : parseFloat(hf)
    const isHealthy = numericHF >= 1.5 // ✅ 1.5 minimum (contract requirement)
    const isAtRisk = numericHF < 1.5 && numericHF >= 1.0
    const isDangerous = numericHF < 1.0

    return (
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
                    {isDangerous ? "❌ Liquidation!" : isAtRisk ? "At risk" : "safe"}
                </p>
            </div>
            <p className="text-xs text-gray-500 mt-2">Minimum safe: 1.5</p>
        </div>
    )
}
