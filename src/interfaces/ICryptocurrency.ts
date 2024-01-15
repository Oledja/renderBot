interface ICryptocurrency {
    averagePrice?: number;
    created_at: Date;
    market: string;
    name: string;
    price?: number;
    symbol: string;
}

export default ICryptocurrency;
