"""
指数技术指标API客户端。

该模块提供指数/行情技术指标相关的API接口，包括：
- 历史分时BOLL
- 历史分时KDJ
- 历史分时MA
- 历史分时MACD
- 行情指标
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

import requests

from config.database import get_db_context
from config.settings import settings
from core.exceptions import APIException, DatabaseException, ValidationException
from utils.db_utils import bulk_insert
from utils.logger import get_logger

from api_clients.IndexTechnicalIndicators.IndexTechnicalIndicators_table import (
    HistoryBoll,
    HistoryKdj,
    HistoryMa,
    HistoryMacd,
    MarketIndicators,
)

logger = get_logger("api_clients.IndexTechnicalIndicators")


class IndexTechnicalIndicators:
    """指数技术指标API客户端类。"""

    BASE_URL = "http://api.mairuiapi.com"

    def __init__(self, license_key: Optional[str] = None):
        """
        初始化指数技术指标API客户端。

        Args:
            license_key (Optional[str]): API许可证密钥，默认为None（从配置读取）。

        API接口: 无
        """
        self.license_key = license_key or settings.API_LICENSE
        if not self.license_key:
            raise ValidationException("API许可证密钥未配置", "LICENSE_NOT_CONFIGURED")

    def _make_request(self, url: str) -> List[Dict[str, Any]]:
        """
        发送HTTP请求并返回JSON数据。

        Args:
            url (str): 请求URL。

        Returns:
            List[Dict[str, Any]]: API返回的JSON数据列表。

        Raises:
            APIException: 如果请求失败。

        API接口: 无
        """
        try:
            logger.info(f"发送API请求: {url}")
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            data = response.json()

            if not isinstance(data, list):
                data = [data] if data else []

            logger.info(f"成功获取 {len(data)} 条数据")
            return data
        except requests.exceptions.HTTPError as e:
            status_code = (
                e.response.status_code
                if hasattr(e, "response") and e.response
                else 500
            )
            error_msg = f"API请求失败: HTTP {status_code} - {str(e)}"
            logger.error(error_msg)
            raise APIException(error_msg, "API_REQUEST_ERROR", status_code)
        except requests.exceptions.RequestException as e:
            error_msg = f"API请求失败: {str(e)}"
            logger.error(error_msg)
            raise APIException(error_msg, "API_REQUEST_ERROR", 500)
        except Exception as e:
            error_msg = f"处理API响应时发生错误: {str(e)}"
            logger.error(error_msg)
            raise APIException(error_msg, "API_RESPONSE_ERROR")

    def _build_history_url(
        self,
        indicator: str,
        stock_code: str,
        level: str,
        adjust_type: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        latest: Optional[int] = None,
    ) -> str:
        """
        构建历史分时指标URL。

        Args:
            indicator (str): 指标路径名，如 "boll" / "kdj" / "ma" / "macd"。
            stock_code (str): 股票代码，如 "000001.SZ"。
            level (str): 分时级别，如 5/15/30/60/d/w/m/y。
            adjust_type (str): 除权类型，如 n/f/b/fr/br。
            start_date (Optional[str]): 开始时间 YYYYMMDD 或 YYYYMMDDhhmmss。
            end_date (Optional[str]): 结束时间 YYYYMMDD 或 YYYYMMDDhhmmss。
            latest (Optional[int]): 最新条数，对应 lt 参数。

        Returns:
            str: 完整请求URL。

        API接口: 无
        """
        base = (
            f"{self.BASE_URL}/hsstock/history/{indicator}/"
            f"{stock_code}/{level}/{adjust_type}/{self.license_key}"
        )
        params: list[str] = []
        if start_date:
            params.append(f"st={start_date}")
        if end_date:
            params.append(f"et={end_date}")
        if latest is not None:
            params.append(f"lt={latest}")
        return base if not params else base + "?" + "&".join(params)

    def _build_market_indicators_url(
        self,
        stock_code: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> str:
        """
        构建行情指标URL。

        Args:
            stock_code (str): 股票代码，如 "000001.SZ"。
            start_date (Optional[str]): 开始时间 YYYYMMDD。
            end_date (Optional[str]): 结束时间 YYYYMMDD。

        Returns:
            str: 完整请求URL。

        API接口: 无
        """
        base = f"{self.BASE_URL}/hsstock/indicators/{stock_code}/{self.license_key}"
        params: list[str] = []
        if start_date:
            params.append(f"st={start_date}")
        if end_date:
            params.append(f"et={end_date}")
        return base if not params else base + "?" + "&".join(params)

    def fetch_history_boll(
        self,
        stock_code: str,
        level: str,
        adjust_type: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        latest: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        """
        获取历史分时BOLL数据。

        Args:
            stock_code (str): 股票代码，如 "000001.SZ"。
            level (str): 分时级别，如 5/15/30/60/d/w/m/y。
            adjust_type (str): 除权类型，如 n/f/b/fr/br（分钟级仅支持 n）。
            start_date (Optional[str]): 开始时间 YYYYMMDD 或 YYYYMMDDhhmmss。
            end_date (Optional[str]): 结束时间 YYYYMMDD 或 YYYYMMDDhhmmss。
            latest (Optional[int]): 最新条数（lt）。

        Returns:
            List[Dict[str, Any]]: 历史分时BOLL数据列表。

        API接口: http://api.mairuiapi.com/hsstock/history/boll/股票代码(如000001.SZ)/分时级别(如d)/除权类型(如n)/您的licence?st=开始时间&et=结束时间&lt=最新条数
        """
        if not stock_code:
            raise ValidationException("股票代码不能为空", "STOCK_CODE_EMPTY")
        if not level:
            raise ValidationException("分时级别不能为空", "LEVEL_EMPTY")
        if not adjust_type:
            raise ValidationException("除权类型不能为空", "ADJUST_TYPE_EMPTY")

        url = self._build_history_url(
            "boll",
            stock_code,
            level,
            adjust_type,
            start_date,
            end_date,
            latest,
        )
        data = self._make_request(url)

        result: list[dict[str, Any]] = []
        for item in data:
            result.append(
                {
                    "dm": item.get("dm", stock_code),
                    "t": item.get("t", ""),
                    "model": item.get("model", adjust_type),
                    "u": item.get("u"),
                    "d": item.get("d"),
                    "m": item.get("m"),
                }
            )
        return result

    def fetch_and_save_history_boll(
        self,
        stock_code: str,
        level: str,
        adjust_type: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        latest: Optional[int] = None,
    ) -> int:
        """
        获取并存储历史分时BOLL数据。

        Args:
            stock_code (str): 股票代码，如 "000001.SZ"。
            level (str): 分时级别，如 5/15/30/60/d/w/m/y。
            adjust_type (str): 除权类型，如 n/f/b/fr/br。
            start_date (Optional[str]): 开始时间 YYYYMMDD 或 YYYYMMDDhhmmss。
            end_date (Optional[str]): 结束时间 YYYYMMDD 或 YYYYMMDDhhmmss。
            latest (Optional[int]): 最新条数（lt）。

        Returns:
            int: 成功存储的记录数。

        API接口: http://api.mairuiapi.com/hsstock/history/boll/股票代码(如000001.SZ)/分时级别(如d)/除权类型(如n)/您的licence?st=开始时间&et=结束时间&lt=最新条数
        """
        data = self.fetch_history_boll(
            stock_code, level, adjust_type, start_date, end_date, latest
        )
        if not data:
            logger.warning(f"未获取到历史分时BOLL数据，股票代码: {stock_code}")
            return 0
        try:
            with get_db_context() as session:
                return bulk_insert(session, HistoryBoll, data, ignore_duplicates=True)
        except Exception as e:
            error_msg = f"存储历史分时BOLL数据失败: {str(e)}"
            logger.error(error_msg)
            raise DatabaseException(error_msg, "SAVE_HISTORY_BOLL_ERROR")

    def fetch_history_kdj(
        self,
        stock_code: str,
        level: str,
        adjust_type: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        latest: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        """
        获取历史分时KDJ数据。

        Args:
            stock_code (str): 股票代码，如 "000001.SZ"。
            level (str): 分时级别，如 5/15/30/60/d/w/m/y。
            adjust_type (str): 除权类型，如 n/f/b/fr/br（分钟级仅支持 n）。
            start_date (Optional[str]): 开始时间 YYYYMMDD 或 YYYYMMDDhhmmss。
            end_date (Optional[str]): 结束时间 YYYYMMDD 或 YYYYMMDDhhmmss。
            latest (Optional[int]): 最新条数（lt）。

        Returns:
            List[Dict[str, Any]]: 历史分时KDJ数据列表。

        API接口: http://api.mairuiapi.com/hsstock/history/kdj/股票代码(如000001.SZ)/分时级别(如d)/除权类型(如n)/您的licence?st=开始时间&et=结束时间&lt=最新条数
        """
        if not stock_code:
            raise ValidationException("股票代码不能为空", "STOCK_CODE_EMPTY")
        if not level:
            raise ValidationException("分时级别不能为空", "LEVEL_EMPTY")
        if not adjust_type:
            raise ValidationException("除权类型不能为空", "ADJUST_TYPE_EMPTY")

        url = self._build_history_url(
            "kdj",
            stock_code,
            level,
            adjust_type,
            start_date,
            end_date,
            latest,
        )
        data = self._make_request(url)

        result: list[dict[str, Any]] = []
        for item in data:
            result.append(
                {
                    "dm": item.get("dm", stock_code),
                    "t": item.get("t", ""),
                    "model": item.get("model", adjust_type),
                    "k": item.get("k"),
                    "d": item.get("d"),
                    "j": item.get("j"),
                }
            )
        return result

    def fetch_and_save_history_kdj(
        self,
        stock_code: str,
        level: str,
        adjust_type: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        latest: Optional[int] = None,
    ) -> int:
        """
        获取并存储历史分时KDJ数据。

        Args:
            stock_code (str): 股票代码，如 "000001.SZ"。
            level (str): 分时级别，如 5/15/30/60/d/w/m/y。
            adjust_type (str): 除权类型，如 n/f/b/fr/br。
            start_date (Optional[str]): 开始时间 YYYYMMDD 或 YYYYMMDDhhmmss。
            end_date (Optional[str]): 结束时间 YYYYMMDD 或 YYYYMMDDhhmmss。
            latest (Optional[int]): 最新条数（lt）。

        Returns:
            int: 成功存储的记录数。

        API接口: http://api.mairuiapi.com/hsstock/history/kdj/股票代码(如000001.SZ)/分时级别(如d)/除权类型(如n)/您的licence?st=开始时间&et=结束时间&lt=最新条数
        """
        data = self.fetch_history_kdj(
            stock_code, level, adjust_type, start_date, end_date, latest
        )
        if not data:
            logger.warning(f"未获取到历史分时KDJ数据，股票代码: {stock_code}")
            return 0
        try:
            with get_db_context() as session:
                return bulk_insert(session, HistoryKdj, data, ignore_duplicates=True)
        except Exception as e:
            error_msg = f"存储历史分时KDJ数据失败: {str(e)}"
            logger.error(error_msg)
            raise DatabaseException(error_msg, "SAVE_HISTORY_KDJ_ERROR")

    def fetch_history_ma(
        self,
        stock_code: str,
        level: str,
        adjust_type: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        latest: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        """
        获取历史分时MA数据。

        Args:
            stock_code (str): 股票代码，如 "000001.SZ"。
            level (str): 分时级别，如 5/15/30/60/d/w/m/y。
            adjust_type (str): 除权类型，如 n/f/b/fr/br（分钟级仅支持 n）。
            start_date (Optional[str]): 开始时间 YYYYMMDD 或 YYYYMMDDhhmmss。
            end_date (Optional[str]): 结束时间 YYYYMMDD 或 YYYYMMDDhhmmss。
            latest (Optional[int]): 最新条数（lt）。

        Returns:
            List[Dict[str, Any]]: 历史分时MA数据列表。

        API接口: http://api.mairuiapi.com/hsstock/history/ma/股票代码(如000001.SZ)/分时级别(如d)/除权类型(如n)/您的licence?st=开始时间&et=结束时间&lt=最新条数
        """
        if not stock_code:
            raise ValidationException("股票代码不能为空", "STOCK_CODE_EMPTY")
        if not level:
            raise ValidationException("分时级别不能为空", "LEVEL_EMPTY")
        if not adjust_type:
            raise ValidationException("除权类型不能为空", "ADJUST_TYPE_EMPTY")

        url = self._build_history_url(
            "ma",
            stock_code,
            level,
            adjust_type,
            start_date,
            end_date,
            latest,
        )
        data = self._make_request(url)

        result: list[dict[str, Any]] = []
        for item in data:
            result.append(
                {
                    "dm": item.get("dm", stock_code),
                    "t": item.get("t", ""),
                    "model": item.get("model", adjust_type),
                    "ma3": item.get("ma3"),
                    "ma5": item.get("ma5"),
                    "ma10": item.get("ma10"),
                    "ma15": item.get("ma15"),
                    "ma20": item.get("ma20"),
                    "ma30": item.get("ma30"),
                    "ma60": item.get("ma60"),
                    "ma120": item.get("ma120"),
                    "ma200": item.get("ma200"),
                    "ma250": item.get("ma250"),
                }
            )
        return result

    def fetch_and_save_history_ma(
        self,
        stock_code: str,
        level: str,
        adjust_type: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        latest: Optional[int] = None,
    ) -> int:
        """
        获取并存储历史分时MA数据。

        Args:
            stock_code (str): 股票代码，如 "000001.SZ"。
            level (str): 分时级别，如 5/15/30/60/d/w/m/y。
            adjust_type (str): 除权类型，如 n/f/b/fr/br。
            start_date (Optional[str]): 开始时间 YYYYMMDD 或 YYYYMMDDhhmmss。
            end_date (Optional[str]): 结束时间 YYYYMMDD 或 YYYYMMDDhhmmss。
            latest (Optional[int]): 最新条数（lt）。

        Returns:
            int: 成功存储的记录数。

        API接口: http://api.mairuiapi.com/hsstock/history/ma/股票代码(如000001.SZ)/分时级别(如d)/除权类型(如n)/您的licence?st=开始时间&et=结束时间&lt=最新条数
        """
        data = self.fetch_history_ma(
            stock_code, level, adjust_type, start_date, end_date, latest
        )
        if not data:
            logger.warning(f"未获取到历史分时MA数据，股票代码: {stock_code}")
            return 0
        try:
            with get_db_context() as session:
                return bulk_insert(session, HistoryMa, data, ignore_duplicates=True)
        except Exception as e:
            error_msg = f"存储历史分时MA数据失败: {str(e)}"
            logger.error(error_msg)
            raise DatabaseException(error_msg, "SAVE_HISTORY_MA_ERROR")

    def fetch_history_macd(
        self,
        stock_code: str,
        level: str,
        adjust_type: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        latest: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        """
        获取历史分时MACD数据。

        Args:
            stock_code (str): 股票代码，如 "000001.SZ"。
            level (str): 分时级别，如 5/15/30/60/d/w/m/y。
            adjust_type (str): 除权类型，如 n/f/b/fr/br（分钟级仅支持 n）。
            start_date (Optional[str]): 开始时间 YYYYMMDD 或 YYYYMMDDhhmmss。
            end_date (Optional[str]): 结束时间 YYYYMMDD 或 YYYYMMDDhhmmss。
            latest (Optional[int]): 最新条数（lt）。

        Returns:
            List[Dict[str, Any]]: 历史分时MACD数据列表。

        API接口: http://api.mairuiapi.com/hsstock/history/macd/股票代码(如000001.SZ)/分时级别(如d)/除权类型(如n)/您的licence?st=开始时间&et=结束时间&lt=最新条数
        """
        if not stock_code:
            raise ValidationException("股票代码不能为空", "STOCK_CODE_EMPTY")
        if not level:
            raise ValidationException("分时级别不能为空", "LEVEL_EMPTY")
        if not adjust_type:
            raise ValidationException("除权类型不能为空", "ADJUST_TYPE_EMPTY")

        url = self._build_history_url(
            "macd",
            stock_code,
            level,
            adjust_type,
            start_date,
            end_date,
            latest,
        )
        data = self._make_request(url)

        result: list[dict[str, Any]] = []
        for item in data:
            result.append(
                {
                    "dm": item.get("dm", stock_code),
                    "t": item.get("t", ""),
                    "model": item.get("model", adjust_type),
                    "diff": item.get("diff"),
                    "dea": item.get("dea"),
                    "macd": item.get("macd"),
                    "ema12": item.get("ema12"),
                    "ema26": item.get("ema26"),
                }
            )
        return result

    def fetch_and_save_history_macd(
        self,
        stock_code: str,
        level: str,
        adjust_type: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        latest: Optional[int] = None,
    ) -> int:
        """
        获取并存储历史分时MACD数据。

        Args:
            stock_code (str): 股票代码，如 "000001.SZ"。
            level (str): 分时级别，如 5/15/30/60/d/w/m/y。
            adjust_type (str): 除权类型，如 n/f/b/fr/br。
            start_date (Optional[str]): 开始时间 YYYYMMDD 或 YYYYMMDDhhmmss。
            end_date (Optional[str]): 结束时间 YYYYMMDD 或 YYYYMMDDhhmmss。
            latest (Optional[int]): 最新条数（lt）。

        Returns:
            int: 成功存储的记录数。

        API接口: http://api.mairuiapi.com/hsstock/history/macd/股票代码(如000001.SZ)/分时级别(如d)/除权类型(如n)/您的licence?st=开始时间&et=结束时间&lt=最新条数
        """
        data = self.fetch_history_macd(
            stock_code, level, adjust_type, start_date, end_date, latest
        )
        if not data:
            logger.warning(f"未获取到历史分时MACD数据，股票代码: {stock_code}")
            return 0
        try:
            with get_db_context() as session:
                return bulk_insert(session, HistoryMacd, data, ignore_duplicates=True)
        except Exception as e:
            error_msg = f"存储历史分时MACD数据失败: {str(e)}"
            logger.error(error_msg)
            raise DatabaseException(error_msg, "SAVE_HISTORY_MACD_ERROR")

    def fetch_market_indicators(
        self,
        stock_code: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        获取行情指标数据。

        Args:
            stock_code (str): 股票代码，如 "000001.SZ"。
            start_date (Optional[str]): 开始时间 YYYYMMDD。
            end_date (Optional[str]): 结束时间 YYYYMMDD。

        Returns:
            List[Dict[str, Any]]: 行情指标数据列表。

        API接口: http://api.mairuiapi.com/hsstock/indicators/股票代码（如000001.SZ）/您的licence?st=开始时间&et=结束时间
        """
        if not stock_code:
            raise ValidationException("股票代码不能为空", "STOCK_CODE_EMPTY")

        url = self._build_market_indicators_url(stock_code, start_date, end_date)
        data = self._make_request(url)

        result: list[dict[str, Any]] = []
        for item in data:
            result.append(
                {
                    "dm": item.get("dm", stock_code),
                    "time": item.get("time", ""),
                    "lb": item.get("lb"),
                    "om": item.get("om"),
                    "fm": item.get("fm"),
                    "d3": item.get("3d"),
                    "d5": item.get("5d"),
                    "d10": item.get("10d"),
                    "t3": item.get("3t"),
                    "t5": item.get("5t"),
                    "t10": item.get("10t"),
                }
            )
        return result

    def fetch_and_save_market_indicators(
        self,
        stock_code: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> int:
        """
        获取并存储行情指标数据。

        Args:
            stock_code (str): 股票代码，如 "000001.SZ"。
            start_date (Optional[str]): 开始时间 YYYYMMDD。
            end_date (Optional[str]): 结束时间 YYYYMMDD。

        Returns:
            int: 成功存储的记录数。

        API接口: http://api.mairuiapi.com/hsstock/indicators/股票代码（如000001.SZ）/您的licence?st=开始时间&et=结束时间
        """
        data = self.fetch_market_indicators(stock_code, start_date, end_date)
        if not data:
            logger.warning(f"未获取到行情指标数据，股票代码: {stock_code}")
            return 0
        try:
            with get_db_context() as session:
                return bulk_insert(
                    session, MarketIndicators, data, ignore_duplicates=True
                )
        except Exception as e:
            error_msg = f"存储行情指标数据失败: {str(e)}"
            logger.error(error_msg)
            raise DatabaseException(error_msg, "SAVE_MARKET_INDICATORS_ERROR")

