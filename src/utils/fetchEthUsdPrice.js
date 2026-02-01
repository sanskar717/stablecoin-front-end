export const fetchEthUsdPrice = async () => {
    try {
        // 🏆 Binance API - Real-time, fastest, no CORS!
        const response = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT')
        
        if (!response.ok) {
            throw new Error('Failed to fetch price')
        }
        
        const data = await response.json()
        const price = parseFloat(data.price).toFixed(2)
        
        const updatedAt = new Date().toLocaleString("en-IN", {
            month: "2-digit",
            day: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
            timeZone: "Asia/Kolkata"
        })

        console.log("✅ Live ETH/USDT:", price)
        console.log("⏰ Updated:", updatedAt)
        
        return { price, updatedAt }
        
    } catch (error) {
        console.error("❌ Binance API error:", error.message)
        return { 
            price: "0.00", 
            updatedAt: new Date().toLocaleString() 
        }
    }
}
