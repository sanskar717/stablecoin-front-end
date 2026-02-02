import DSCEngineABI from "../contracts/DscEngine.json"
import DecentralizedStableCoinABI from "../contracts/DecentralizedStablecoins.json"

const NETWORKS = {
    31337: {
        name: "Anvil local",
        AnvilrpcUrl: "http://127.0.0.1:8545",
        contracts: {
            DSCEngine: "0x0165878A594ca255338adfa4d48449f69242Eb8F",
            DSC: "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707",
            WETH: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
        },
    },

    11155111: {
        name: "Sepolia Testnet",
        SepoliarpcUrl: "https://eth-sepolia.g.alchemy.com/v2/-qMDxbeGIXs--zEfQVQ1x",
        contracts: {
            DSCEngine: "0xdE798F73481EFE9523d715A9F9b1afE54755b52E",
            DSC: "0xDD2F2f8A74A9bB9D4Cfb8FD0De763A5d1B3e1a6c",
            WETH: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14",
        },
    },
}

export const getNetworkConfig = (chainID) => {
    return NETWORKS[chainID] || NETWORKS[31337]
}

export const getContracts = (chainID) => {
    const network = getNetworkConfig(chainID)
    return {
        DSCEngine: {
            address: network.contracts.DSCEngine,
            abi: DSCEngineABI.abi,
        },
        DSC: {
            address: network.contracts.DSC,
            abi: DecentralizedStableCoinABI.abi,
        },
        WETH: {
            address: network.contracts.WETH,
        },
    }
}

export const SUPPORTED_CHAINS = [31337, 11155111]

export const CONTRACTS = {
    DSCEngine: {
        abi: DSCEngineABI.abi,
    },
    DSC: {
        abi: DecentralizedStableCoinABI.abi,
    },
}
