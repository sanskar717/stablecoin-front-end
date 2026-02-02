import { useEthPrice } from "@/hooks/useEthPrice"
import { useEffect, useState } from "react"

export default function LiveETHTicker() {
    const { price: ethPrice, updatedAt } = useEthPrice()
    const [priceChange, setPriceChange] = useState(0)
    const [previousPrice, setPreviousPrice] = useState(null)
    const [isIncreasing, setIsIncreasing] = useState(true)

    useEffect(() => {
        if (previousPrice !== null && ethPrice) {
            const change =
                ((parseFloat(ethPrice) - parseFloat(previousPrice)) / parseFloat(previousPrice)) *
                100
            setPriceChange(change)
            setIsIncreasing(parseFloat(ethPrice) >= parseFloat(previousPrice))
        }
        if (ethPrice) {
            setPreviousPrice(ethPrice)
        }
    }, [ethPrice])

    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-linear-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                        <span className="text-2xl text-white">⟠</span>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-800">Ethereum</h3>
                        <p className="text-sm text-gray-500">ETH/USD</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-green-50 px-3 py-2 rounded-full">
                    <div className="relative">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <div className="absolute inset-0 w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
                    </div>
                    <span className="text-xs text-green-600 font-semibold">LIVE</span>
                </div>
            </div>

            <div className="mb-4">
                <div className="flex items-baseline gap-3">
                    <h1 className="text-5xl font-bold text-gray-900">${ethPrice}</h1>
                    <span className="text-2xl text-gray-400 font-medium">USD</span>
                </div>

                {priceChange !== 0 && (
                    <div
                        className={`items-center gap-2 mt-3 px-3 py-1 rounded-lg inline-flex ${
                            isIncreasing ? "bg-green-50" : "bg-red-50"
                        }`}
                    >
                        <span
                            className={`text-xl ${isIncreasing ? "text-green-600" : "text-red-600"}`}
                        >
                            {isIncreasing ? "↗" : "↘"}
                        </span>
                        <span
                            className={`text-base font-bold ${
                                isIncreasing ? "text-green-600" : "text-red-600"
                            }`}
                        >
                            {isIncreasing ? "+" : ""}
                            {priceChange.toFixed(2)}%
                        </span>
                        <span className="text-xs text-gray-500 font-medium">24h change</span>
                    </div>
                )}
            </div>

            <div className="h-px bg-linear-to-r from-gray-200 via-gray-300 to-gray-200 my-4"></div>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 font-medium mb-1">Market Cap</p>
                    <p className="text-lg font-bold text-gray-800">$401.2B</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 font-medium mb-1">24h Volume</p>
                    <p className="text-lg font-bold text-gray-800">$15.3B</p>
                </div>
            </div>

            <div className="h-20 flex items-center justify-center rounded-lg bg-gray-50 mb-4 relative overflow-hidden">
                <div
                    className={`absolute inset-0 ${
                        isIncreasing
                            ? "bg-linear-to-r from-green-100/30 to-green-50/10"
                            : "bg-linear-to-r from-red-100/30 to-red-50/10"
                    }`}
                />

                <div className="absolute inset-0 flex items-end justify-around px-2 py-2">
                    {[
                        14, 22, 18, 28, 16, 32, 20, 26, 15, 30, 19, 25, 17, 31, 21, 27, 13, 24, 18,
                        29, 22, 28, 16, 23,
                    ].map((height, i) => (
                        <div
                            key={i}
                            className={`w-1 rounded-t ${
                                isIncreasing ? "bg-green-400/50" : "bg-red-400/50"
                            }`}
                            style={{ height: `${height + 8}px` }}
                        />
                    ))}
                </div>

            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                <div className="flex items-center gap-2">
                    <svg
                        className="w-4 h-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                    <p className="text-xs text-gray-500">Updated: {updatedAt}</p>
                </div>

                <div className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded">
                    <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0L9.798 3.202L12 5.403l2.202-2.201L12 0zm0 18.597l-2.202 2.201L12 24l2.202-3.202L12 18.597zM5.403 12L3.202 9.798 0 12l3.202 2.202L5.403 12zm13.194 0l2.201-2.202L24 12l-3.202 2.202L18.597 12z" />
                    </svg>
                    <span className="text-xs text-blue-600 font-semibold">Chainlink</span>
                </div>
            </div>

            <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                <p className="text-xs text-blue-700 flex items-start gap-2">
                    <svg
                        className="w-4 h-4 mt-0.5 shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                            clipRule="evenodd"
                        />
                    </svg>
                    <span>
                        <strong className="font-semibold">Live Data:</strong> Price fetched from
                        Chainlink Oracle on blockchain. Updates every few seconds.
                    </span>
                </p>
            </div>
        </div>
    )
}
