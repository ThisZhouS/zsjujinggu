"""
历史分时交易数据API客户端。

该模块提供历史/最新分时交易相关的API接口，包括：
- HS 指数历史分时交易（hsindex/history）
- HS 指数最新分时交易（hsindex/latest）
- HS 股票最新分时交易（hsstock/latest）
- HK（文档所述）股票历史分时交易（hsstock/history）
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

import requests

from config.database import get_db_context
from config.settings import settings
from core.exceptions import APIException, DatabaseException, ValidationException
from utils.db_utils import bulk_insert
from utils.logger import get_logger

from api_clients.HistoricalTradingData.HistoricalTradingData_table import (
    HsStockHistoryTrading,
    HsIndexHistoryTrading,
    HsIndexLatestTrading,
    HsStockLatestTrading,
)

logger = get_logger("api_clients.HistoricalTradingData")


class HistoricalTradingData:
    """历史分时交易数据API客户端类。"""

    BASE_URL = "http://api.mairuiapi.com"

    def __init__(self, license_key: Optional[str] = None):
        """
        初始化历史分时交易数据API客户端。

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

    def fetch_hs_index_history_trading(
        self,
        index_code: str,
        level: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        获取 HS 指数历史分时交易数据。

        Args:
            index_code (str): 指数代码.市场，如 "000001.SH"。
            level (str): 分时级别，如 5/15/30/60/d/w/m/y。
            start_date (Optional[str]): 开始时间 YYYYMMDD 或 YYYYMMDDhhmmss。
            end_date (Optional[str]): 结束时间 YYYYMMDD 或 YYYYMMDDhhmmss。

        Returns:
            List[Dict[str, Any]]: 历史交易数据列表。

        API接口: http://api.mairuiapi.com/hsindex/history/指数代码.市场（如000001.SH）/分时级别(如d)/您的licence?st=开始时间&et=结束时间
        """
        if not index_code:
            raise ValidationException("指数代码不能为空", "INDEX_CODE_EMPTY")
        if not level:
            raise ValidationException("分时级别不能为空", "LEVEL_EMPTY")

        url = f"{self.BASE_URL}/hsindex/history/{index_code}/{level}/{self.license_key}"
        params: list[str] = []
        if start_date:
            params.append(f"st={start_date}")
        if end_date:
            params.append(f"et={end_date}")
        if params:
            url += "?" + "&".join(params)

        data = self._make_request(url)
        result: list[dict[str, Any]] = []
        for item in data:
            result.append(
                {
                    "dm": item.get("dm", index_code),
                    "t": item.get("t", ""),
                    "o": item.get("o"),
                    "h": item.get("h"),
                    "l": item.get("l"),
                    "c": item.get("c"),
                    "v": item.get("v"),
                    "a": item.get("a"),
                    "pc": item.get("pc"),
                    "st": item.get("st", start_date),
                    "et": item.get("et", end_date),
                }
            )
        return result

    def fetch_and_save_hs_index_history_trading(
        self,
        index_code: str,
        level: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> int:
        """
        获取并存储 HS 指数历史分时交易数据。

        Args:
            index_code (str): 指数代码.市场，如 "000001.SH"。
            level (str): 分时级别，如 5/15/30/60/d/w/m/y。
            start_date (Optional[str]): 开始时间 YYYYMMDD 或 YYYYMMDDhhmmss。
            end_date (Optional[str]): 结束时间 YYYYMMDD 或 YYYYMMDDhhmmss。

        Returns:
            int: 成功存储的记录数。

        API接口: http://api.mairuiapi.com/hsindex/history/指数代码.市场（如000001.SH）/分时级别(如d)/您的licence?st=开始时间&et=结束时间
        """
        data = self.fetch_hs_index_history_trading(index_code, level, start_date, end_date)
        if not data:
            logger.warning(f"未获取到HS指数历史分时交易数据，指数代码: {index_code}")
            return 0
        try:
            with get_db_context() as session:
                return bulk_insert(session, HsIndexHistoryTrading, data, ignore_duplicates=True)
        except Exception as e:
            error_msg = f"存储HS指数历史分时交易数据失败: {str(e)}"
            logger.error(error_msg)
            raise DatabaseException(error_msg, "SAVE_HS_INDEX_HISTORY_TRADING_ERROR")

    def fetch_hs_index_latest_trading(self, index_code: str, level: str) -> List[Dict[str, Any]]:
        """
        获取 HS 指数最新分时交易数据。

        Args:
            index_code (str): 指数代码.市场，如 "000001.SH"。
            level (str): 分时级别，如 5/15/30/60/d/w/m/y。

        Returns:
            List[Dict[str, Any]]: 最新交易数据列表。

        API接口: http://api.mairuiapi.com/hsindex/latest/指数代码.市场（如000001.SH）/分时级别(如d)/您的licence
        """
        if not index_code:
            raise ValidationException("指数代码不能为空", "INDEX_CODE_EMPTY")
        if not level:
            raise ValidationException("分时级别不能为空", "LEVEL_EMPTY")

        url = f"{self.BASE_URL}/hsindex/latest/{index_code}/{level}/{self.license_key}"
        data = self._make_request(url)

        result: list[dict[str, Any]] = []
        for item in data:
            result.append(
                {
                    "dm": item.get("dm", index_code),
                    "t": item.get("t", ""),
                    "o": item.get("o"),
                    "h": item.get("h"),
                    "l": item.get("l"),
                    "c": item.get("c"),
                    "v": item.get("v"),
                    "a": item.get("a"),
                    "pc": item.get("pc"),
                }
            )
        return result

    def fetch_and_save_hs_index_latest_trading(self, index_code: str, level: str) -> int:
        """
        获取并存储 HS 指数最新分时交易数据。

        Args:
            index_code (str): 指数代码.市场，如 "000001.SH"。
            level (str): 分时级别，如 5/15/30/60/d/w/m/y。

        Returns:
            int: 成功存储的记录数。

        API接口: http://api.mairuiapi.com/hsindex/latest/指数代码.市场（如000001.SH）/分时级别(如d)/您的licence
        """
        data = self.fetch_hs_index_latest_trading(index_code, level)
        if not data:
            logger.warning(f"未获取到HS指数最新分时交易数据，指数代码: {index_code}")
            return 0
        try:
            with get_db_context() as session:
                return bulk_insert(session, HsIndexLatestTrading, data, ignore_duplicates=True)
        except Exception as e:
            error_msg = f"存储HS指数最新分时交易数据失败: {str(e)}"
            logger.error(error_msg)
            raise DatabaseException(error_msg, "SAVE_HS_INDEX_LATEST_TRADING_ERROR")

    def fetch_hs_stock_latest_trading(
        self,
        stock_code: str,
        level: str,
        adjust_type: str,
        latest: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        """
        获取 HS 股票最新分时交易数据。

        Args:
            stock_code (str): 股票代码.市场，如 "000001.SZ"。
            level (str): 分时级别，如 5/15/30/60/d/w/m/y。
            adjust_type (str): 除权方式 n/f/b/fr/br（分钟级仅 n）。
            latest (Optional[int]): 最新条数（lt）。

        Returns:
            List[Dict[str, Any]]: 最新分时交易数据列表。

        API接口: http://api.mairuiapi.com/hsstock/latest/股票代码.市场（如000001.SZ）/分时级别(如d)/除权方式/您的licence?lt=最新条数(如5)
        """
        if not stock_code:
            raise ValidationException("股票代码不能为空", "STOCK_CODE_EMPTY")
        if not level:
            raise ValidationException("分时级别不能为空", "LEVEL_EMPTY")
        if not adjust_type:
            raise ValidationException("除权方式不能为空", "ADJUST_TYPE_EMPTY")

        url = f"{self.BASE_URL}/hsstock/latest/{stock_code}/{level}/{adjust_type}/{self.license_key}"
        if latest is not None:
            url += f"?lt={latest}"

        data = self._make_request(url)
        result: list[dict[str, Any]] = []
        for item in data:
            result.append(
                {
                    "dm": item.get("dm", stock_code),
                    "t": item.get("t", ""),
                    "model": item.get("model", adjust_type),
                    "o": item.get("o"),
                    "h": item.get("h"),
                    "l": item.get("l"),
                    "c": item.get("c"),
                    "v": item.get("v"),
                    "a": item.get("a"),
                    "pc": item.get("pc"),
                    "sf": item.get("sf"),
                }
            )
        return result

    def fetch_and_save_hs_stock_latest_trading(
        self,
        stock_code: str,
        level: str,
        adjust_type: str,
        latest: Optional[int] = None,
    ) -> int:
        """
        获取并存储 HS 股票最新分时交易数据。

        Args:
            stock_code (str): 股票代码.市场，如 "000001.SZ"。
            level (str): 分时级别，如 5/15/30/60/d/w/m/y。
            adjust_type (str): 除权方式 n/f/b/fr/br。
            latest (Optional[int]): 最新条数（lt）。

        Returns:
            int: 成功存储的记录数。

        API接口: http://api.mairuiapi.com/hsstock/latest/股票代码.市场（如000001.SZ）/分时级别(如d)/除权方式/您的licence?lt=最新条数(如5)
        """
        data = self.fetch_hs_stock_latest_trading(stock_code, level, adjust_type, latest)
        if not data:
            logger.warning(f"未获取到HS股票最新分时交易数据，股票代码: {stock_code}")
            return 0
        try:
            with get_db_context() as session:
                return bulk_insert(session, HsStockLatestTrading, data, ignore_duplicates=True)
        except Exception as e:
            error_msg = f"存储HS股票最新分时交易数据失败: {str(e)}"
            logger.error(error_msg)
            raise DatabaseException(error_msg, "SAVE_HS_STOCK_LATEST_TRADING_ERROR")

    def fetch_hs_stock_history_trading(
        self,
        stock_code: str,
        level: str,
        adjust_type: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        latest: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        """
        获取 HK（文档所述）股票历史分时交易数据。

        Args:
            stock_code (str): 股票代码.市场，如 "000001.SZ"。
            level (str): 分时级别，如 5/15/30/60/d/w/m/y。
            adjust_type (str): 除权方式 n/f/b/fr/br（分钟级仅 n）。
            start_date (Optional[str]): 开始时间 YYYYMMDD 或 YYYYMMDDhhmmss。
            end_date (Optional[str]): 结束时间 YYYYMMDD 或 YYYYMMDDhhmmss。
            latest (Optional[int]): 最新条数（lt）。

        Returns:
            List[Dict[str, Any]]: 历史分时交易数据列表。

        API接口: http://api.mairuiapi.com/hsstock/history/股票代码.市场（如000001.SZ）/分时级别(如d)/除权方式/您的licence?st=开始时间&et=结束时间&lt=最新条数
        """
        if not stock_code:
            raise ValidationException("股票代码不能为空", "STOCK_CODE_EMPTY")
        if not level:
            raise ValidationException("分时级别不能为空", "LEVEL_EMPTY")
        if not adjust_type:
            raise ValidationException("除权方式不能为空", "ADJUST_TYPE_EMPTY")

        url = f"{self.BASE_URL}/hsstock/history/{stock_code}/{level}/{adjust_type}/{self.license_key}"
        params: list[str] = []
        if start_date:
            params.append(f"st={start_date}")
        if end_date:
            params.append(f"et={end_date}")
        if latest is not None:
            params.append(f"lt={latest}")
        if params:
            url += "?" + "&".join(params)

        data = self._make_request(url)
        result: list[dict[str, Any]] = []
        for item in data:
            result.append(
                {
                    "dm": item.get("dm", stock_code),
                    "t": item.get("t", ""),
                    "model": item.get("model", adjust_type),
                    "o": item.get("o"),
                    "h": item.get("h"),
                    "l": item.get("l"),
                    "c": item.get("c"),
                    "v": item.get("v"),
                    "a": item.get("a"),
                    "pc": item.get("pc"),
                    "sf": item.get("sf"),
                }
            )
        return result

    def fetch_and_save_hs_stock_history_trading(
        self,
        stock_code: str,
        level: str,
        adjust_type: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        latest: Optional[int] = None,
    ) -> int:
        """
        获取并存储 HS（文档所述）股票历史分时交易数据。

        Args:
            stock_code (str): 股票代码.市场，如 "000001.SZ"。
            level (str): 分时级别，如 5/15/30/60/d/w/m/y。
            adjust_type (str): 除权方式 n/f/b/fr/br。
            start_date (Optional[str]): 开始时间 YYYYMMDD 或 YYYYMMDDhhmmss。
            end_date (Optional[str]): 结束时间 YYYYMMDD 或 YYYYMMDDhhmmss。
            latest (Optional[int]): 最新条数（lt）。

        Returns:
            int: 成功存储的记录数。

        API接口: http://api.mairuiapi.com/hsstock/history/股票代码.市场（如000001.SZ）/分时级别(如d)/除权方式/您的licence?st=开始时间&et=结束时间&lt=最新条数
        """
        data = self.fetch_hs_stock_history_trading(
            stock_code, level, adjust_type, start_date, end_date, latest
        )
        if not data:
            logger.warning(f"未获取到Hs股票历史分时交易数据，股票代码: {stock_code}")
            return 0
        try:
            with get_db_context() as session:
                return bulk_insert(session, HsStockHistoryTrading, data, ignore_duplicates=True)
        except Exception as e:
            error_msg = f"存储Hs股票历史分时交易数据失败: {str(e)}"
            logger.error(error_msg)
            raise DatabaseException(error_msg, "SAVE_HS_STOCK_HISTORY_TRADING_ERROR")

