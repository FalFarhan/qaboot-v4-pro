/**
 * QABOOT V4 PRO - Real Technical Analysis Engine
 * تحليل فني حقيقي بناءً على بيانات Binance API
 */

// ============================================
// TECHNICAL ANALYSIS ENGINE
// ============================================

class TechnicalAnalysis {
    constructor() {
        this.cache = new Map();
        this.cacheExpiry = 60000; // 1 minute
    }

    // RSI (Relative Strength Index)
    calculateRSI(closes, period = 14) {
        if (closes.length < period + 1) return 50;
        
        let gains = 0;
        let losses = 0;
        
        // Calculate initial averages
        for (let i = 1; i <= period; i++) {
            const change = closes[i] - closes[i - 1];
            if (change > 0) gains += change;
            else losses -= change;
        }
        
        let avgGain = gains / period;
        let avgLoss = losses / period;
        
        // Calculate RSI
        for (let i = period + 1; i < closes.length; i++) {
            const change = closes[i] - closes[i - 1];
            const gain = change > 0 ? change : 0;
            const loss = change < 0 ? -change : 0;
            
            avgGain = ((avgGain * (period - 1)) + gain) / period;
            avgLoss = ((avgLoss * (period - 1)) + loss) / period;
        }
        
        if (avgLoss === 0) return 100;
        const rs = avgGain / avgLoss;
        return 100 - (100 / (1 + rs));
    }

    // MACD (Moving Average Convergence Divergence)
    calculateMACD(closes, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
        const emaFast = this.calculateEMA(closes, fastPeriod);
        const emaSlow = this.calculateEMA(closes, slowPeriod);
        
        const macdLine = emaFast.map((fast, i) => fast - emaSlow[i]);
        const signalLine = this.calculateEMA(macdLine, signalPeriod);
        const histogram = macdLine.map((macd, i) => macd - signalLine[i]);
        
        return {
            macd: macdLine[macdLine.length - 1],
            signal: signalLine[signalLine.length - 1],
            histogram: histogram[histogram.length - 1],
            trend: macdLine[macdLine.length - 1] > signalLine[signalLine.length - 1] ? 'BULLISH' : 'BEARISH'
        };
    }

    // EMA (Exponential Moving Average)
    calculateEMA(values, period) {
        if (values.length < period) return values;
        
        const multiplier = 2 / (period + 1);
        const ema = [values.slice(0, period).reduce((a, b) => a + b, 0) / period];
        
        for (let i = period; i < values.length; i++) {
            ema.push((values[i] - ema[ema.length - 1]) * multiplier + ema[ema.length - 1]);
        }
        
        // Pad beginning with SMA
        const padding = new Array(period - 1).fill(ema[0]);
        return [...padding, ...ema];
    }

    // Bollinger Bands
    calculateBollingerBands(closes, period = 20, stdDev = 2) {
        if (closes.length < period) return null;
        
        const sma = closes.slice(-period).reduce((a, b) => a + b, 0) / period;
        const squaredDiffs = closes.slice(-period).map(price => Math.pow(price - sma, 2));
        const variance = squaredDiffs.reduce((a, b) => a + b, 0) / period;
        const std = Math.sqrt(variance);
        
        const upper = sma + (std * stdDev);
        const lower = sma - (std * stdDev);
        const current = closes[closes.length - 1];
        const position = (current - lower) / (upper - lower);
        
        return {
            upper: upper,
            middle: sma,
            lower: lower,
            position: position, // 0 = at lower, 1 = at upper
            squeeze: (upper - lower) / sma < 0.05 // Bands squeezed
        };
    }

    // Support and Resistance
    findSupportResistance(highs, lows, closes) {
        const levels = [];
        const window = 5;
        
        for (let i = window; i < closes.length - window; i++) {
            // Local high
            if (highs[i] === Math.max(...highs.slice(i - window, i + window + 1))) {
                levels.push({ price: highs[i], type: 'resistance', strength: window });
            }
            // Local low
            if (lows[i] === Math.min(...lows.slice(i - window, i + window + 1))) {
                levels.push({ price: lows[i], type: 'support', strength: window });
            }
        }
        
        // Group nearby levels
        const grouped = [];
        levels.forEach(level => {
            const existing = grouped.find(g => Math.abs(g.price - level.price) / level.price < 0.02);
            if (existing) {
                existing.strength += level.strength;
                existing.price = (existing.price + level.price) / 2;
            } else {
                grouped.push({...level});
            }
        });
        
        return grouped.sort((a, b) => b.strength - a.strength).slice(0, 5);
    }

    // Fibonacci Retracement
    calculateFibonacci(high, low) {
        const diff = high - low;
        return {
            '0%': high,
            '23.6%': high - diff * 0.236,
            '38.2%': high - diff * 0.382,
            '50%': high - diff * 0.5,
            '61.8%': high - diff * 0.618,
            '78.6%': high - diff * 0.786,
            '100%': low
        };
    }

    // Volume Analysis
    analyzeVolume(volumes, closes) {
        const avgVolume = volumes.slice(-20).reduce((a, b) => a + b, 0) / 20;
        const currentVolume = volumes[volumes.length - 1];
        const volumeRatio = currentVolume / avgVolume;
        
        // Price change
        const priceChange = (closes[closes.length - 1] - closes[closes.length - 2]) / closes[closes.length - 2];
        
        return {
            ratio: volumeRatio,
            trend: volumeRatio > 1.5 ? 'HIGH' : volumeRatio < 0.5 ? 'LOW' : 'NORMAL',
            confirmation: (priceChange > 0 && volumeRatio > 1) || (priceChange < 0 && volumeRatio > 1)
        };
    }

    // Trend Analysis
    analyzeTrend(closes) {
        const ema20 = this.calculateEMA(closes, 20);
        const ema50 = this.calculateEMA(closes, 50);
        const ema200 = this.calculateEMA(closes, 200);
        
        const current = closes[closes.length - 1];
        const shortTrend = current > ema20[ema20.length - 1];
        const mediumTrend = current > ema50[ema50.length - 1];
        const longTrend = current > ema200[ema200.length - 1];
        
        return {
            short: shortTrend ? 'BULLISH' : 'BEARISH',
            medium: mediumTrend ? 'BULLISH' : 'BEARISH',
            long: longTrend ? 'BULLISH' : 'BEARISH',
            alignment: (shortTrend && mediumTrend && longTrend) ? 'STRONG_BULL' : 
                       (!shortTrend && !mediumTrend && !longTrend) ? 'STRONG_BEAR' : 'MIXED'
        };
    }

    // Generate Complete Analysis
    async analyzeSymbol(symbol, timeframe = '1h') {
        const cacheKey = `${symbol}_${timeframe}`;
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.time < this.cacheExpiry) {
            return cached.data;
        }

        try {
            const response = await fetch(`/api/candles/${symbol}/${timeframe}`);
            const candles = await response.json();
            
            if (!candles || candles.length < 50) {
                return null;
            }
            
            const closes = candles.map(c => c.close);
            const highs = candles.map(c => c.high);
            const lows = candles.map(c => c.low);
            const volumes = candles.map(c => c.volume);
            
            const currentPrice = closes[closes.length - 1];
            const previousPrice = closes[closes.length - 2];
            const priceChange = ((currentPrice - previousPrice) / previousPrice) * 100;
            
            // Calculate all indicators
            const rsi = this.calculateRSI(closes);
            const macd = this.calculateMACD(closes);
            const bollinger = this.calculateBollingerBands(closes);
            const supportResistance = this.findSupportResistance(highs, lows, closes);
            const volume = this.analyzeVolume(volumes, closes);
            const trend = this.analyzeTrend(closes);
            
            // Generate Signal
            let signal = 'HOLD';
            let confidence = 50;
            let reasons = [];
            
            // RSI-based signal
            if (rsi < 30) {
                signal = 'BUY';
                confidence += 20;
                reasons.push('RSI oversold');
            } else if (rsi > 70) {
                signal = 'SELL';
                confidence += 20;
                reasons.push('RSI overbought');
            }
            
            // MACD-based signal
            if (macd.trend === 'BULLISH' && macd.histogram > 0) {
                if (signal === 'BUY') confidence += 15;
                else if (signal === 'HOLD') { signal = 'BUY'; confidence += 15; }
                reasons.push('MACD bullish crossover');
            } else if (macd.trend === 'BEARISH' && macd.histogram < 0) {
                if (signal === 'SELL') confidence += 15;
                else if (signal === 'HOLD') { signal = 'SELL'; confidence += 15; }
                reasons.push('MACD bearish crossover');
            }
            
            // Trend alignment
            if (trend.alignment === 'STRONG_BULL') {
                if (signal === 'BUY') confidence += 15;
                reasons.push('Strong uptrend');
            } else if (trend.alignment === 'STRONG_BEAR') {
                if (signal === 'SELL') confidence += 15;
                reasons.push('Strong downtrend');
            }
            
            // Volume confirmation
            if (volume.confirmation) {
                confidence += 10;
                reasons.push('Volume confirms');
            }
            
            // Bollinger Bands
            if (bollinger && bollinger.position < 0.1) {
                if (signal === 'BUY') confidence += 10;
                reasons.push('Near lower band');
            } else if (bollinger && bollinger.position > 0.9) {
                if (signal === 'SELL') confidence += 10;
                reasons.push('Near upper band');
            }
            
            // Calculate targets based on support/resistance
            const nearestResistance = supportResistance.find(r => r.type === 'resistance' && r.price > currentPrice);
            const nearestSupport = supportResistance.find(r => r.type === 'support' && r.price < currentPrice);
            
            const atr = this.calculateATR(highs, lows, closes);
            const target = signal === 'BUY' ? (nearestResistance ? nearestResistance.price : currentPrice * 1.05) : 
                          signal === 'SELL' ? (nearestSupport ? nearestSupport.price : currentPrice * 0.95) : currentPrice;
            const stopLoss = signal === 'BUY' ? currentPrice - (atr * 2) : 
                            signal === 'SELL' ? currentPrice + (atr * 2) : currentPrice;
            const riskReward = Math.abs(target - currentPrice) / Math.abs(currentPrice - stopLoss);
            
            const result = {
                symbol: symbol,
                price: currentPrice,
                change24h: priceChange,
                signal: signal,
                confidence: Math.min(confidence, 95),
                reasons: reasons,
                indicators: {
                    rsi: rsi,
                    macd: macd,
                    bollinger: bollinger,
                    trend: trend,
                    volume: volume
                },
                levels: {
                    support: supportResistance.filter(r => r.type === 'support').slice(0, 3),
                    resistance: supportResistance.filter(r => r.type === 'resistance').slice(0, 3)
                },
                entry: currentPrice,
                target: target,
                stopLoss: stopLoss,
                riskReward: riskReward.toFixed(2),
                timestamp: Date.now()
            };
            
            this.cache.set(cacheKey, { data: result, time: Date.now() });
            return result;
            
        } catch (error) {
            console.error(`Analysis error for ${symbol}:`, error);
            return null;
        }
    }

    // Calculate ATR (Average True Range)
    calculateATR(highs, lows, closes, period = 14) {
        const trs = [];
        for (let i = 1; i < highs.length; i++) {
            const tr1 = highs[i] - lows[i];
            const tr2 = Math.abs(highs[i] - closes[i - 1]);
            const tr3 = Math.abs(lows[i] - closes[i - 1]);
            trs.push(Math.max(tr1, tr2, tr3));
        }
        return trs.slice(-period).reduce((a, b) => a + b, 0) / period;
    }
}

// Global instance
const TA = new TechnicalAnalysis();

// ============================================
// REAL SIGNAL GENERATOR
// ============================================

async function generateRealSignal(symbol) {
    const analysis = await TA.analyzeSymbol(symbol, '1h');
    if (!analysis) return null;
    
    // Calculate strategy breakdown
    const strategies = [
        { name: 'RSI Momentum', confidence: analysis.indicators.rsi < 30 ? 90 : analysis.indicators.rsi > 70 ? 90 : 50, weight: 0.25 },
        { name: 'MACD Cross', confidence: analysis.indicators.macd.trend === 'BULLISH' ? 85 : 45, weight: 0.25 },
        { name: 'Trend Follow', confidence: analysis.indicators.trend.alignment.includes('STRONG') ? 90 : 60, weight: 0.25 },
        { name: 'Volume Breakout', confidence: analysis.indicators.volume.trend === 'HIGH' ? 80 : 50, weight: 0.25 }
    ];
    
    const weightedConfidence = strategies.reduce((sum, s) => sum + (s.confidence * s.weight), 0) / 
                               strategies.reduce((sum, s) => sum + s.weight, 0);
    
    return {
        symbol: symbol,
        name: getCoinName(symbol),
        signal: analysis.signal,
        confidence: Math.round(weightedConfidence),
        entry: analysis.entry,
        target: analysis.target,
        stopLoss: analysis.stopLoss,
        riskReward: analysis.riskReward,
        strategies: strategies,
        timeframe: '1H',
        aiPrediction: analysis.indicators.trend.short,
        whaleActivity: analysis.indicators.volume.trend === 'HIGH' ? 'ACCUMULATING' : 'DISTRIBUTING',
        reasons: analysis.reasons,
        indicators: analysis.indicators,
        levels: analysis.levels
    };
}

function getCoinName(symbol) {
    const names = {
        'BTC': 'Bitcoin', 'ETH': 'Ethereum', 'SOL': 'Solana', 'BNB': 'BNB',
        'XRP': 'XRP', 'ADA': 'Cardano', 'AVAX': 'Avalanche', 'DOT': 'Polkadot',
        'LINK': 'Chainlink', 'MATIC': 'Polygon', 'UNI': 'Uniswap', 'ATOM': 'Cosmos',
        'LTC': 'Litecoin', 'ALGO': 'Algorand', 'VET': 'VeChain', 'FIL': 'Filecoin',
        'TRX': 'TRON', 'ETC': 'Ethereum Classic', 'XLM': 'Stellar', 'HBAR': 'Hedera',
        'ICP': 'Internet Computer', 'APT': 'Aptos', 'ARB': 'Arbitrum', 'OP': 'Optimism',
        'IMX': 'Immutable X', 'NEAR': 'NEAR Protocol', 'TAO': 'Bittensor',
        'ATH': 'Aethir', 'ZBT': 'ZEROBASE', 'FET': 'Artificial Superintelligence',
        'VIRTUAL': 'Virtuals Protocol', 'STX': 'Stacks', 'ZETA': 'ZetaChain',
        'SEI': 'Sei', 'KAS': 'Kaspa', 'SYRUP': 'Maple Finance', 'TRAC': 'OriginTrail',
        'W': 'Wormhole', 'KTA': 'Keeta', 'ONDO': 'Ondo', 'SUI': 'Sui',
        'BIO': 'Bio Protocol', 'KO': 'Kyuzo Friends', 'POL': 'POL'
    };
    return names[symbol] || symbol;
}

// ============================================
// EXPORT
// ============================================

window.TA = TA;
window.generateRealSignal = generateRealSignal;