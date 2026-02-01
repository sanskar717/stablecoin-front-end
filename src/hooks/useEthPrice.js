import { useEffect, useState } from "react"
import { fetchEthUsdPrice } from "../utils/fetchEthUsdPrice"

export const useEthPrice = () => {
    const [priceData, setPriceData] = useState({
        price: "0.00",
        updatedAt: "",
        loading: true,
        error: null,
    })

    useEffect(() => {
        let mounted = true

        const getPrice = async () => {
            try {
                console.log("🔄 Fetching ETH price...")
                const data = await fetchEthUsdPrice()

                if (!mounted) return

                console.log("📊 Price data received:", data)

                setPriceData({
                    price: data.price,
                    updatedAt: data.updatedAt,
                    loading: false,
                    error: null,
                })
            } catch (error) {
                if (!mounted) return

                console.error("⚠️ Failed to fetch price:", error.message)

                setPriceData((prev) => ({
                    ...prev,
                    loading: false,
                    error: error.message,
                }))
            }
        }

        getPrice()

        const interval = setInterval(getPrice, 7000)

        return () => {
            mounted = false
            clearInterval(interval)
        }
    }, [])

    return priceData
}
