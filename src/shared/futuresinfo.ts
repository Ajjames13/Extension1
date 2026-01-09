export type FuturesContract = {
  symbol: string;
  tickSize: number;
  tickValue: number;
  name: string;
  exchange: string;
};

export const FUTURES_INFO: Record<string, FuturesContract> = {
  // EQUITY INDEX
  ES: { symbol: "ES", tickSize: 0.25, tickValue: 12.5, name: "E-mini S&P 500", exchange: "CME" },
  MES: { symbol: "MES", tickSize: 0.25, tickValue: 1.25, name: "Micro E-mini S&P 500", exchange: "CME" },
  NQ: { symbol: "NQ", tickSize: 0.25, tickValue: 5.0, name: "E-mini Nasdaq-100", exchange: "CME" },
  MNQ: { symbol: "MNQ", tickSize: 0.25, tickValue: 0.5, name: "Micro E-mini Nasdaq-100", exchange: "CME" },
  YM: { symbol: "YM", tickSize: 1.0, tickValue: 5.0, name: "E-mini Dow", exchange: "CBOT" },
  MYM: { symbol: "MYM", tickSize: 1.0, tickValue: 0.5, name: "Micro E-mini Dow", exchange: "CBOT" },
  RTY: { symbol: "RTY", tickSize: 0.1, tickValue: 5.0, name: "E-mini Russell 2000", exchange: "CME" },
  M2K: { symbol: "M2K", tickSize: 0.1, tickValue: 0.5, name: "Micro E-mini Russell 2000", exchange: "CME" },
  EMD: { symbol: "EMD", tickSize: 0.1, tickValue: 10.0, name: "E-mini S&P MidCap 400", exchange: "CME" },
  NKD: { symbol: "NKD", tickSize: 5.0, tickValue: 25.0, name: "Nikkei 225 (USD)", exchange: "CME" },
  MNK: { symbol: "MNK", tickSize: 5.0, tickValue: 2.5, name: "Micro Nikkei (USD)", exchange: "CME" },

  // FX
  "6A": { symbol: "6A", tickSize: 0.00005, tickValue: 5.0, name: "Australian Dollar", exchange: "CME" },
  "6B": { symbol: "6B", tickSize: 0.0001, tickValue: 6.25, name: "British Pound", exchange: "CME" },
  "6C": { symbol: "6C", tickSize: 0.00005, tickValue: 5.0, name: "Canadian Dollar", exchange: "CME" },
  "6E": { symbol: "6E", tickSize: 0.00005, tickValue: 6.25, name: "Euro FX", exchange: "CME" },
  "6J": { symbol: "6J", tickSize: 0.0000005, tickValue: 6.25, name: "Japanese Yen", exchange: "CME" },
  "6N": { symbol: "6N", tickSize: 0.00005, tickValue: 5.0, name: "New Zealand Dollar", exchange: "CME" },
  "6S": { symbol: "6S", tickSize: 0.0001, tickValue: 12.5, name: "Swiss Franc", exchange: "CME" },
  E7: { symbol: "E7", tickSize: 0.0001, tickValue: 6.25, name: "E-mini Euro FX", exchange: "CME" },
  J7: { symbol: "J7", tickSize: 0.000001, tickValue: 6.25, name: "E-mini Japanese Yen", exchange: "CME" },
  M6A: { symbol: "M6A", tickSize: 0.0001, tickValue: 1.0, name: "Micro AUD/USD", exchange: "CME" },
  M6B: { symbol: "M6B", tickSize: 0.0001, tickValue: 0.625, name: "Micro GBP/USD", exchange: "CME" },
  MCD: { symbol: "MCD", tickSize: 0.0001, tickValue: 1.0, name: "Micro CAD/USD", exchange: "CME" },
  M6E: { symbol: "M6E", tickSize: 0.0001, tickValue: 1.25, name: "Micro EUR/USD", exchange: "CME" },
  MJY: { symbol: "MJY", tickSize: 0.000001, tickValue: 1.25, name: "Micro JPY/USD", exchange: "CME" },
  MSF: { symbol: "MSF", tickSize: 0.0001, tickValue: 1.25, name: "Micro CHF/USD", exchange: "CME" },
  DX: { symbol: "DX", tickSize: 0.005, tickValue: 5.0, name: "U.S. Dollar Index", exchange: "ICEUS" },

  // ENERGY
  CL: { symbol: "CL", tickSize: 0.01, tickValue: 10.0, name: "Crude Oil (WTI)", exchange: "NYMEX" },
  QM: { symbol: "QM", tickSize: 0.025, tickValue: 12.5, name: "E-mini Crude Oil", exchange: "NYMEX" },
  MCL: { symbol: "MCL", tickSize: 0.01, tickValue: 1.0, name: "Micro WTI Crude Oil", exchange: "NYMEX" },
  NG: { symbol: "NG", tickSize: 0.001, tickValue: 10.0, name: "Natural Gas", exchange: "NYMEX" },
  QG: { symbol: "QG", tickSize: 0.005, tickValue: 12.5, name: "E-mini Natural Gas", exchange: "NYMEX" },
  MNG: { symbol: "MNG", tickSize: 0.001, tickValue: 1.0, name: "Micro Henry Hub Natural Gas", exchange: "NYMEX" },
  RB: { symbol: "RB", tickSize: 0.0001, tickValue: 4.2, name: "RBOB Gasoline", exchange: "NYMEX" },
  HO: { symbol: "HO", tickSize: 0.0001, tickValue: 4.2, name: "Heating Oil", exchange: "NYMEX" },

  // METALS
  GC: { symbol: "GC", tickSize: 0.1, tickValue: 10.0, name: "Gold", exchange: "COMEX" },
  QO: { symbol: "QO", tickSize: 0.25, tickValue: 12.5, name: "E-mini Gold", exchange: "COMEX" },
  MGC: { symbol: "MGC", tickSize: 0.1, tickValue: 1.0, name: "Micro Gold", exchange: "COMEX" },
  "1OZ": { symbol: "1OZ", tickSize: 0.25, tickValue: 0.25, name: "1-Ounce Gold", exchange: "COMEX" },
  SI: { symbol: "SI", tickSize: 0.005, tickValue: 25.0, name: "Silver", exchange: "COMEX" },
  QI: { symbol: "QI", tickSize: 0.0125, tickValue: 31.25, name: "E-mini Silver", exchange: "COMEX" },
  SIL: { symbol: "SIL", tickSize: 0.01, tickValue: 10.0, name: "E-micro Silver", exchange: "COMEX" },
  HG: { symbol: "HG", tickSize: 0.0005, tickValue: 12.5, name: "Copper", exchange: "COMEX" },
  QC: { symbol: "QC", tickSize: 0.002, tickValue: 25.0, name: "E-mini Copper", exchange: "COMEX" },
  MHG: { symbol: "MHG", tickSize: 0.0005, tickValue: 1.25, name: "Micro Copper", exchange: "COMEX" },
  PL: { symbol: "PL", tickSize: 0.1, tickValue: 5.0, name: "Platinum", exchange: "NYMEX" },

  // RATES
  ZB: { symbol: "ZB", tickSize: 0.03125, tickValue: 31.25, name: "US Treasury Bond (30Y)", exchange: "CBOT" },
  UB: { symbol: "UB", tickSize: 0.03125, tickValue: 31.25, name: "Ultra US Treasury Bond", exchange: "CBOT" },
  ZN: { symbol: "ZN", tickSize: 0.015625, tickValue: 15.625, name: "10-Year US Treasury Note", exchange: "CBOT" },
  TN: { symbol: "TN", tickSize: 0.03125, tickValue: 15.625, name: "Ultra 10-Year US Treasury Note", exchange: "CBOT" },
  ZF: { symbol: "ZF", tickSize: 0.0078125, tickValue: 7.8125, name: "5-Year US Treasury Note", exchange: "CBOT" },
  ZT: { symbol: "ZT", tickSize: 0.0078125, tickValue: 15.625, name: "2-Year US Treasury Note", exchange: "CBOT" },
  Z3N: { symbol: "Z3N", tickSize: 0.0078125, tickValue: 15.625, name: "3-Year US Treasury Note", exchange: "CBOT" },
  GE: { symbol: "GE", tickSize: 0.01, tickValue: 25.0, name: "Eurodollar", exchange: "CME" },
  ZQ: { symbol: "ZQ", tickSize: 0.005, tickValue: 20.835, name: "30-Day Federal Funds", exchange: "CBOT" },
  "30YY": { symbol: "30YY", tickSize: 0.1, tickValue: 1.0, name: "Micro 30-Year Yield", exchange: "CBOT" },
  "10YY": { symbol: "10YY", tickSize: 0.1, tickValue: 1.0, name: "Micro 10-Year Yield", exchange: "CBOT" },
  "5YY": { symbol: "5YY", tickSize: 0.1, tickValue: 1.0, name: "Micro 5-Year Yield", exchange: "CBOT" },
  "2YY": { symbol: "2YY", tickSize: 0.1, tickValue: 1.0, name: "Micro 2-Year Yield", exchange: "CBOT" },
  MWNA: { symbol: "MWNA", tickSize: 0.03125, tickValue: 3.125, name: "Micro Ultra US Treasury Bond", exchange: "CBOT" },
  MTN: { symbol: "MTN", tickSize: 0.015625, tickValue: 1.5625, name: "Micro Ultra 10-Year US Treasury Note", exchange: "CBOT" },

  // GRAINS
  ZC: { symbol: "ZC", tickSize: 0.0025, tickValue: 12.5, name: "Corn", exchange: "CBOT" },
  XC: { symbol: "XC", tickSize: 0.00125, tickValue: 1.25, name: "Mini Corn", exchange: "CBOT" },
  MZC: { symbol: "MZC", tickSize: 0.005, tickValue: 2.5, name: "Micro Corn", exchange: "CBOT" },
  ZW: { symbol: "ZW", tickSize: 0.0025, tickValue: 12.5, name: "Chicago SRW Wheat", exchange: "CBOT" },
  XW: { symbol: "XW", tickSize: 0.00125, tickValue: 1.25, name: "Mini Chicago SRW Wheat", exchange: "CBOT" },
  MZW: { symbol: "MZW", tickSize: 0.005, tickValue: 2.5, name: "Micro Wheat", exchange: "CBOT" },
  ZS: { symbol: "ZS", tickSize: 0.0025, tickValue: 12.5, name: "Soybeans", exchange: "CBOT" },
  XK: { symbol: "XK", tickSize: 0.00125, tickValue: 1.25, name: "Mini Soybeans", exchange: "CBOT" },
  MZS: { symbol: "MZS", tickSize: 0.005, tickValue: 2.5, name: "Micro Soybeans", exchange: "CBOT" },
  ZL: { symbol: "ZL", tickSize: 0.0001, tickValue: 6.0, name: "Soybean Oil", exchange: "CBOT" },
  MZL: { symbol: "MZL", tickSize: 0.02, tickValue: 1.2, name: "Micro Soybean Oil", exchange: "CBOT" },
  ZM: { symbol: "ZM", tickSize: 0.1, tickValue: 10.0, name: "Soybean Meal", exchange: "CBOT" },
  MZM: { symbol: "MZM", tickSize: 0.2, tickValue: 2.0, name: "Micro Soybean Meal", exchange: "CBOT" },
  ZO: { symbol: "ZO", tickSize: 0.0025, tickValue: 12.5, name: "Oats", exchange: "CBOT" },
  ZR: { symbol: "ZR", tickSize: 0.005, tickValue: 10.0, name: "Rough Rice", exchange: "CBOT" },

  // SOFTS
  DC: { symbol: "DC", tickSize: 0.01, tickValue: 20.0, name: "Class III Milk", exchange: "CME" },
  LBS: { symbol: "LBS", tickSize: 0.5, tickValue: 13.75, name: "Lumber", exchange: "CME" },
  CC: { symbol: "CC", tickSize: 1.0, tickValue: 10.0, name: "Cocoa", exchange: "ICEUS" },
  CT: { symbol: "CT", tickSize: 0.0001, tickValue: 5.0, name: "Cotton", exchange: "ICEUS" },
  KC: { symbol: "KC", tickSize: 0.0005, tickValue: 18.75, name: "Coffee", exchange: "ICEUS" },
  OJ: { symbol: "OJ", tickSize: 0.0005, tickValue: 7.5, name: "Orange Juice", exchange: "ICEUS" },
  SB: { symbol: "SB", tickSize: 0.0001, tickValue: 11.2, name: "Sugar #11", exchange: "ICEUS" },

  // MEATS
  GF: { symbol: "GF", tickSize: 0.00025, tickValue: 12.5, name: "Feeder Cattle", exchange: "CME" },
  HE: { symbol: "HE", tickSize: 0.00025, tickValue: 10.0, name: "Lean Hogs", exchange: "CME" },
  LE: { symbol: "LE", tickSize: 0.00025, tickValue: 10.0, name: "Live Cattle", exchange: "CME" },

  // CRYPTO
  BTC: { symbol: "BTC", tickSize: 5.0, tickValue: 25.0, name: "Bitcoin Futures", exchange: "CME" },
  MBT: { symbol: "MBT", tickSize: 5.0, tickValue: 0.5, name: "Micro Bitcoin Futures", exchange: "CME" },
  ETH: { symbol: "ETH", tickSize: 0.5, tickValue: 25.0, name: "Ether Futures", exchange: "CME" },
  MET: { symbol: "MET", tickSize: 0.5, tickValue: 0.05, name: "Micro Ether Futures", exchange: "CME" }
};