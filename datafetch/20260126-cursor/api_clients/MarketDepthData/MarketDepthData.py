"""
盘口深度数据 API 客户端。

该模块提供市场深度数据相关的 API 接口，包括：
- 沪深买卖五档盘口
- 科创买卖五档盘口
- 京市买卖五档盘口
- 港股买卖五档盘口
"""

from typing import Any, Dict, List, Optional

import requests

from api_clients.MarketDepthData.MarketDepthData_table import (
    BjStockRealFive,
    HkStockRealFive,
    HsStockRealFive,
    KcStockRealFive,
)
from config.database import get_db_context
from config.settings import settings
from core.exceptions import APIException, DatabaseException, ValidationException
from utils.data_utils import clean_numeric_to_none, clean_string
from utils.db_utils import bulk_insert, ensure_float_array_columns
from utils.logger import get_logger

logger = get_logger("api_clients.MarketDepthData")


class MarketDepthData:
    """盘口深度数据 API 客户端类。"""

    BASE_URL = "http://api.mairuiapi.com"

    def __init__(self, license_key: Optional[str] = None) -> None:
        """
        初始化盘口深度数据 API 客户端。

        Args:
            license_key (Optional[str]): API 许可证密钥，默认为 None（从配置读取）。

        Returns:
            None: 无返回值。

        API接口: 无
        """
        self.license_key = license_key or settings.API_LICENSE
        if not self.license_key:
            raise ValidationException("API 许可证密钥未配置", "LICENSE_NOT_CONFIGURED")

    def _make_request(self, url: str) -> List[Dict[str, Any]]:
        """
        发送 HTTP 请求并返回 JSON 数据。

        Args:
            url (str): 请求 URL。

        Returns:
            List[Dict[str, Any]]: API 返回的 JSON 数据列表。

        API接口: 无
        """
        try:
            logger.info("发送 API 请求: {}", url)
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            data = response.json()
            if not isinstance(data, list):
                data = [data] if data else []
            logger.info("成功获取 {} 条数据", len(data))
            return data
        except requests.exceptions.HTTPError as exc:
            status_code = exc.response.status_code if exc.response else 500
            error_msg = f"API 请求失败: HTTP {status_code} - {str(exc)}"
            logger.error(error_msg)
            raise APIException(error_msg, "API_REQUEST_ERROR", status_code)
        except requests.exceptions.RequestException as exc:
            error_msg = f"API 请求失败: {str(exc)}"
            logger.error(error_msg)
            raise APIException(error_msg, "API_REQUEST_ERROR", 500)
        except Exception as exc:
            error_msg = f"处理 API 响应时发生错误: {str(exc)}"
            logger.error(error_msg)
            raise APIException(error_msg, "API_RESPONSE_ERROR")

    def _clean_numeric_list(self, values: Any) -> Optional[List[Optional[float]]]:
        """
        清理并转换五档数组字段为 Optional[List[Optional[float]]]。

        Args:
            values (Any): 原始输入，通常为列表，如 [p1, p2, p3, p4, p5]。

        Returns:
            Optional[List[Optional[float]]]: 清理后的列表；若 values 为空或非列表则返回 None。

        API接口: 无
        """
        if values is None:
            return None
        if not isinstance(values, list):
            return None
        return [clean_numeric_to_none(v) for v in values]

    def _extract_time(self, item: Dict[str, Any]) -> Optional[str]:
        """
        从返回数据中提取更新时间字段 t。

        Args:
            item (Dict[str, Any]): API返回的单条数据。

        Returns:
            Optional[str]: 更新时间字符串；若无法获取则返回 None。

        API接口: 无
        """
        for key in ("t", "T", "time", "Time", "sj", "Sj"):
            value = item.get(key)
            value_str = clean_string(value, default="") if value is not None else ""
            if value_str:
                return value_str
        return None

    def fetch_hs_stock_real_five(self, stock_code: str) -> List[Dict[str, Any]]:
        """
        获取沪深买卖五档盘口数据。

        Args:
            stock_code (str): 股票代码。

        Returns:
            List[Dict[str, Any]]: 沪深买卖五档盘口数据列表。

        API接口: http://api.mairuiapi.com/hsstock/real/five/股票代码/证书您的licence
        """
        if not stock_code:
            raise ValidationException("股票代码不能为空", "STOCK_CODE_EMPTY")

        url = f"{self.BASE_URL}/hsstock/real/five/{stock_code}/{self.license_key}"
        data = self._make_request(url)

        result: List[Dict[str, Any]] = []
        for item in data:
            t_value = self._extract_time(item)
            if not t_value:
                logger.warning("返回数据缺少更新时间t，跳过：dm=%s item=%s", stock_code, item)
                continue
            result.append(
                {
                    "dm": item.get("dm") or item.get("Dm") or stock_code,
                    "ps": self._clean_numeric_list(item.get("ps")),
                    "pb": self._clean_numeric_list(item.get("pb")),
                    "vs": self._clean_numeric_list(item.get("vs")),
                    "vb": self._clean_numeric_list(item.get("vb")),
                    "t": t_value,
                }
            )
        return result

    def fetch_and_save_hs_stock_real_five(self, stock_code: str) -> int:
        """
        获取并存储沪深买卖五档盘口数据。

        Args:
            stock_code (str): 股票代码。

        Returns:
            int: 成功存储的记录数。

        API接口: http://api.mairuiapi.com/hsstock/real/five/股票代码/证书您的licence
        """
        data = self.fetch_hs_stock_real_five(stock_code)
        if not data:
            logger.warning("未获取到沪深买卖五档盘口数据，股票代码: %s", stock_code)
            return 0

        try:
            with get_db_context() as session:
                ensure_float_array_columns(session, "hs_stock_real_five", ["ps", "pb", "vs", "vb"])
                count = bulk_insert(session, HsStockRealFive, data, ignore_duplicates=True)
                logger.info("成功存储 {} 条沪深买卖五档盘口数据，股票代码: {}", count, stock_code)
                return count
        except Exception as exc:
            error_msg = f"存储沪深买卖五档盘口数据失败: {str(exc)}"
            logger.error(error_msg)
            raise DatabaseException(error_msg, "SAVE_HS_STOCK_REAL_FIVE_ERROR")

    def fetch_kc_stock_real_five(self, stock_code: str) -> List[Dict[str, Any]]:
        """
        获取科创买卖五档盘口数据。

        Args:
            stock_code (str): 股票代码（如 688001）。

        Returns:
            List[Dict[str, Any]]: 科创买卖五档盘口数据列表。

        API接口: http://api.mairuiapi.com/kc/real/five/股票代码(如688001)/您的licence
        """
        if not stock_code:
            raise ValidationException("股票代码不能为空", "STOCK_CODE_EMPTY")

        url = f"{self.BASE_URL}/kc/real/five/{stock_code}/{self.license_key}"
        data = self._make_request(url)

        result: List[Dict[str, Any]] = []
        for item in data:
            t_value = self._extract_time(item)
            if not t_value:
                logger.warning("返回数据缺少更新时间t，跳过：dm=%s item=%s", stock_code, item)
                continue
            result.append(
                {
                    "dm": item.get("dm") or item.get("Dm") or stock_code,
                    "ps": self._clean_numeric_list(item.get("ps")),
                    "pb": self._clean_numeric_list(item.get("pb")),
                    "vs": self._clean_numeric_list(item.get("vs")),
                    "vb": self._clean_numeric_list(item.get("vb")),
                    "t": t_value,
                }
            )
        return result

    def fetch_and_save_kc_stock_real_five(self, stock_code: str) -> int:
        """
        获取并存储科创买卖五档盘口数据。

        Args:
            stock_code (str): 股票代码。

        Returns:
            int: 成功存储的记录数。

        API接口: http://api.mairuiapi.com/kc/real/five/股票代码(如688001)/您的licence
        """
        data = self.fetch_kc_stock_real_five(stock_code)
        if not data:
            logger.warning("未获取到科创买卖五档盘口数据，股票代码: %s", stock_code)
            return 0

        try:
            with get_db_context() as session:
                ensure_float_array_columns(session, "kc_stock_real_five", ["ps", "pb", "vs", "vb"])
                count = bulk_insert(session, KcStockRealFive, data, ignore_duplicates=True)
                logger.info("成功存储 {} 条科创买卖五档盘口数据，股票代码: {}", count, stock_code)
                return count
        except Exception as exc:
            error_msg = f"存储科创买卖五档盘口数据失败: {str(exc)}"
            logger.error(error_msg)
            raise DatabaseException(error_msg, "SAVE_KC_STOCK_REAL_FIVE_ERROR")

    def fetch_bj_stock_real_five(self, stock_code: str) -> List[Dict[str, Any]]:
        """
        获取京市买卖五档盘口数据。

        Args:
            stock_code (str): 股票代码（如 430017）。

        Returns:
            List[Dict[str, Any]]: 京市买卖五档盘口数据列表。

        API接口: http://api.mairuiapi.com/bj/stock/real/five/股票代码(如430017)/您的licence
        """
        if not stock_code:
            raise ValidationException("股票代码不能为空", "STOCK_CODE_EMPTY")

        url = f"{self.BASE_URL}/bj/stock/real/five/{stock_code}/{self.license_key}"
        data = self._make_request(url)

        result: List[Dict[str, Any]] = []
        for item in data:
            t_value = self._extract_time(item)
            if not t_value:
                logger.warning("返回数据缺少更新时间t，跳过：dm=%s item=%s", stock_code, item)
                continue
            result.append(
                {
                    "dm": item.get("dm") or item.get("Dm") or stock_code,
                    "ps": self._clean_numeric_list(item.get("ps")),
                    "pb": self._clean_numeric_list(item.get("pb")),
                    "vs": self._clean_numeric_list(item.get("vs")),
                    "vb": self._clean_numeric_list(item.get("vb")),
                    "t": t_value,
                }
            )
        return result

    def fetch_and_save_bj_stock_real_five(self, stock_code: str) -> int:
        """
        获取并存储京市买卖五档盘口数据。

        Args:
            stock_code (str): 股票代码。

        Returns:
            int: 成功存储的记录数。

        API接口: http://api.mairuiapi.com/bj/stock/real/five/股票代码(如430017)/您的licence
        """
        data = self.fetch_bj_stock_real_five(stock_code)
        if not data:
            logger.warning("未获取到京市买卖五档盘口数据，股票代码: %s", stock_code)
            return 0

        try:
            with get_db_context() as session:
                ensure_float_array_columns(session, "bj_stock_real_five", ["ps", "pb", "vs", "vb"])
                count = bulk_insert(session, BjStockRealFive, data, ignore_duplicates=True)
                logger.info("成功存储 {} 条京市买卖五档盘口数据，股票代码: {}", count, stock_code)
                return count
        except Exception as exc:
            error_msg = f"存储京市买卖五档盘口数据失败: {str(exc)}"
            logger.error(error_msg)
            raise DatabaseException(error_msg, "SAVE_BJ_STOCK_REAL_FIVE_ERROR")

    def fetch_hk_stock_real_five(self, stock_code: str) -> List[Dict[str, Any]]:
        """
        获取港股买卖五档盘口数据。

        Args:
            stock_code (str): 股票代码（如 00001）。

        Returns:
            List[Dict[str, Any]]: 港股买卖五档盘口数据列表。

        API接口: http://api.mairuiapi.com/hk/stock/real/five/股票代码(如00001)/您的licence
        """
        if not stock_code:
            raise ValidationException("股票代码不能为空", "STOCK_CODE_EMPTY")

        url = f"{self.BASE_URL}/hk/stock/real/five/{stock_code}/{self.license_key}"
        data = self._make_request(url)

        result: List[Dict[str, Any]] = []
        for item in data:
            t_value = self._extract_time(item)
            if not t_value:
                logger.warning("返回数据缺少更新时间t，跳过：dm=%s item=%s", stock_code, item)
                continue
            result.append(
                {
                    "dm": item.get("Dm") or item.get("dm") or stock_code,
                    "ps": self._clean_numeric_list(item.get("ps")),
                    "pb": self._clean_numeric_list(item.get("pb")),
                    "vs": self._clean_numeric_list(item.get("vs")),
                    "vb": self._clean_numeric_list(item.get("vb")),
                    "t": t_value,
                }
            )
        return result

    def fetch_and_save_hk_stock_real_five(self, stock_code: str) -> int:
        """
        获取并存储港股买卖五档盘口数据。

        Args:
            stock_code (str): 股票代码。

        Returns:
            int: 成功存储的记录数。

        API接口: http://api.mairuiapi.com/hk/stock/real/five/股票代码(如00001)/您的licence
        """
        data = self.fetch_hk_stock_real_five(stock_code)
        if not data:
            logger.warning("未获取到港股买卖五档盘口数据，股票代码: %s", stock_code)
            return 0

        try:
            with get_db_context() as session:
                ensure_float_array_columns(session, "hk_stock_real_five", ["ps", "pb", "vs", "vb"])
                count = bulk_insert(session, HkStockRealFive, data, ignore_duplicates=True)
                logger.info("成功存储 {} 条港股买卖五档盘口数据，股票代码: {}", count, stock_code)
                return count
        except Exception as exc:
            error_msg = f"存储港股买卖五档盘口数据失败: {str(exc)}"
            logger.error(error_msg)
            raise DatabaseException(error_msg, "SAVE_HK_STOCK_REAL_FIVE_ERROR")


