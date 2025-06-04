export interface Currency {
    code: string;
    name: string;
    rate: number;
}

export interface ExchangeRate {
    rate_id: number;
    currency: string;
    code: string;
    mid: number;
    date: string;
}

export interface ExchangeRateHistory {
    date: string;
    mid: number;
}