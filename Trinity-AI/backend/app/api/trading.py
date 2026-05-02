"""
Trading API — real-time trade execution via deriv.com MCP tools.
POST /api/trading/proposal  → price a contract
POST /api/trading/execute   → place a trade
POST /api/trading/close    → close a position
"""
from pydantic import BaseModel
from fastapi import APIRouter, Request

router = APIRouter(prefix="/trading", tags=["trading"])


class ProposalRequest(BaseModel):
    symbol: str          # e.g. "R_50"
    contract_type: str   # MULTUP | MULTDOWN | CALL | PUT
    amount: float        # stake in USD
    multiplier: int = 100


class ExecuteRequest(BaseModel):
    symbol: str
    contract_type: str
    amount: float
    multiplier: int = 100
    stop_loss: float = 0
    take_profit: float = 0


class CloseRequest(BaseModel):
    contract_id: int


@router.post("/proposal")
async def get_proposal(req: ProposalRequest, request: Request):
    broker_manager = request.app.state.broker_manager
    result = await broker_manager.get_proposal(
        symbol=req.symbol,
        contract_type=req.contract_type,
        amount=req.amount,
        multiplier=req.multiplier,
    )
    if "error" in result:
        return {"success": False, "error": result["error"]}
    return {"success": True, "proposal": result}


@router.post("/execute")
async def execute_trade(req: ExecuteRequest, request: Request):
    broker_manager = request.app.state.broker_manager
    result = await broker_manager.place_trade(
        symbol=req.symbol,
        contract_type=req.contract_type,
        amount=req.amount,
        multiplier=req.multiplier,
        stop_loss=req.stop_loss,
        take_profit=req.take_profit,
    )
    if "error" in result:
        return {"success": False, "error": result["error"]}
    return {"success": True, "trade": result}


@router.post("/close")
async def close_trade(req: CloseRequest, request: Request):
    broker_manager = request.app.state.broker_manager
    result = await broker_manager.close_trade(contract_id=req.contract_id)
    if "error" in result:
        return {"success": False, "error": result["error"]}
    return {"success": True, "result": result}


@router.get("/candles/:symbol")
async def get_candles(symbol: str, timeframe: str = "M5",
                      count: int = 100, request: Request = None):
    broker_manager = request.app.state.broker_manager
    candles = await broker_manager.get_candles(symbol, timeframe, count)

    # Add structure summary
    if candles and len(candles) > 0:
        closes = [c["close"] for c in candles]
        highs = [c["high"] for c in candles]
        lows = [c["low"] for c in candles]
        recent_high = max(highs[-20:])
        recent_low = min(lows[-20:])
        current_price = closes[-1]
        range_ = recent_high - recent_low
        price_position = ((current_price - recent_low) / range_ * 100) if range_ > 0 else 50

        return {
            "symbol": symbol,
            "timeframe": timeframe,
            "candle_count": len(candles),
            "structure_summary": {
                "recent_high": round(recent_high, 5),
                "recent_low": round(recent_low, 5),
                "current_price": round(current_price, 5),
                "price_position_pct": round(price_position, 1),
                "zone": "PREMIUM (sell bias)" if price_position > 50 else "DISCOUNT (buy bias)",
            },
            "candles": candles,
        }
    return {"symbol": symbol, "timeframe": timeframe, "candles": [], "structure_summary": {}}