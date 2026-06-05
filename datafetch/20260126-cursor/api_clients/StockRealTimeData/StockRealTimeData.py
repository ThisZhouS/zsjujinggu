"""
证券/基金实时交易数据 API 客户端。

该模块提供以下实时数据接口，并支持存储到 PostgreSQL：
- 科创股票实时数据
- 实时交易数据（沪深指数）
- 实时数据（沪深基金）
- 香港股票实时数据
- 京市股票实时数据
"""

from datetime import datetime
from typing import Any, Dict, List, Optional

import requests

from api_clients.StockRealTimeData.StockRealTimeData_table import (
    BjStockRealTimeData,
    HfFundRealTimeData,
    HkStockRealTimeData,
    HsIndexRealTimeData,
    KcStockRealTimeData,
)
from config.database import get_db_context
from config.settings import settings
from core.exceptions import APIException, DatabaseException, ValidationException
from utils.db_utils import bulk_insert
from utils.logger import get_logger

logger = get_logger("api_clients.StockRealTimeData")


class StockRealTimeData:
    """证券/基金实时交易数据 API 客户端类。"""

    BASE_URL = "http://api.mairuiapi.com"

    def __init__(self, license_key: Optional[str] = None) -> None:
        """
        初始化实时交易数据 API 客户端。

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

    def fetch_kc_stock_real_time_data(self, stock_code: str) -> List[Dict[str, Any]]:
        """
        获取科创股票实时数据。

        Args:
            stock_code (str): 股票代码（如 688001）。

        Returns:
            List[Dict[str, Any]]: 科创股票实时数据列表。

        API接口: http://api.mairuiapi.com/kc/real/time/股票代码(如688001)/您的licence
        """
        if not stock_code:
            raise ValidationException("股票代码不能为空", "STOCK_CODE_EMPTY")

        url = f"{self.BASE_URL}/kc/real/time/{stock_code}/{self.license_key}"
        data = self._make_request(url)
        result: List[Dict[str, Any]] = []
        for item in data:
            # t 字段是主键的一部分，不能为 None，需要过滤掉无效数据
            t_value = item.get("t")
            if t_value is None:
                logger.warning(
                    "跳过无效数据：股票代码 {} 的更新时间字段为空", stock_code
                )
                continue

            result.append(
                {
                    "dm": item.get("dm") or item.get("Dm") or stock_code,
                    "p": item.get("p"),
                    "o": item.get("o"),
                    "h": item.get("h"),
                    "l": item.get("l"),
                    "yc": item.get("yc"),
                    "cje": item.get("cje"),
                    "v": item.get("v"),
                    "pv": item.get("pv"),
                    "ud": item.get("ud"),
                    "pc": item.get("pc"),
                    "zf": item.get("zf"),
                    "t": t_value,
                    "pe": item.get("pe"),
                    "tr": item.get("tr"),
                    "pb_ratio": item.get("pb_ratio"),
                    "tv": item.get("tv"),
                }
            )
        return result

    def fetch_and_save_kc_stock_real_time_data(self, stock_code: str) -> int:
        """
        获取并存储科创股票实时数据。

        Args:
            stock_code (str): 股票代码。

        Returns:
            int: 成功存储的记录数。

        API接口: http://api.mairuiapi.com/kc/real/time/股票代码(如688001)/您的licence
        """
        data = self.fetch_kc_stock_real_time_data(stock_code)
        if not data:
            logger.warning("未获取到科创股票实时数据，股票代码: {}", stock_code)
            return 0
        try:
            with get_db_context() as session:
                count = bulk_insert(session, KcStockRealTimeData, data, ignore_duplicates=True)
                logger.info("成功存储 {} 条科创股票实时数据，股票代码: {}", count, stock_code)
                return count
        except Exception as exc:
            error_msg = f"存储科创股票实时数据失败: {str(exc)}"
            logger.error(error_msg)
            raise DatabaseException(error_msg, "SAVE_KC_STOCK_REAL_TIME_DATA_ERROR")

    def fetch_hs_index_real_time_data(self, index_code: str) -> List[Dict[str, Any]]:
        """
        获取实时交易数据（沪深指数）。

        Args:
            index_code (str): 指数代码（如 000001.SH）。

        Returns:
            List[Dict[str, Any]]: 实时交易数据列表。

        API接口: http://api.mairuiapi.com/hsindex/real/time/指数代码(如：000001.SH)/证书您的licence
        """
        if not index_code:
            raise ValidationException("指数代码不能为空", "INDEX_CODE_EMPTY")

        url = f"{self.BASE_URL}/hsindex/real/time/{index_code}/{self.license_key}"
        data = self._make_request(url)
        result: List[Dict[str, Any]] = []
        for item in data:
            # t 字段是主键的一部分，不能为 None，需要过滤掉无效数据
            t_value = item.get("t")
            if t_value is None:
                logger.warning(
                    "跳过无效数据：指数代码 {} 的更新时间字段为空", index_code
                )
                continue

            result.append(
                {
                    "dm": item.get("dm") or index_code,
                    "p": item.get("p"),
                    "o": item.get("o"),
                    "h": item.get("h"),
                    "l": item.get("l"),
                    "yc": item.get("yc"),
                    "cje": item.get("cje"),
                    "v": item.get("v"),
                    "pv": item.get("pv"),
                    "ud": item.get("ud"),
                    "pc": item.get("pc"),
                    "zf": item.get("zf"),
                    "t": t_value,
                    "created_at": item.get("created_at") or datetime.now(),
                }
            )
        return result

    def fetch_and_save_hs_index_real_time_data(self, index_code: str) -> int:
        """
        获取并存储实时交易数据（沪深指数）。

        Args:
            index_code (str): 指数代码。

        Returns:
            int: 成功存储的记录数。

        API接口: http://api.mairuiapi.com/hsindex/real/time/指数代码(如：000001.SH)/证书您的licence
        """
        data = self.fetch_hs_index_real_time_data(index_code)
        if not data:
            logger.warning("未获取到实时交易数据（沪深指数），指数代码: {}", index_code)
            return 0
        try:
            with get_db_context() as session:
                count = bulk_insert(session, HsIndexRealTimeData, data, ignore_duplicates=True)
                logger.info("成功存储 {} 条实时交易数据（沪深指数），指数代码: {}", count, index_code)
                return count
        except Exception as exc:
            error_msg = f"存储实时交易数据（沪深指数）失败: {str(exc)}"
            logger.error(error_msg)
            raise DatabaseException(error_msg, "SAVE_HS_INDEX_REAL_TIME_DATA_ERROR")

    def fetch_hf_fund_real_time_data(self, fund_code: str) -> List[Dict[str, Any]]:
        """
        获取实时数据（沪深基金）。

        Args:
            fund_code (str): 基金代码（如 159001）。

        Returns:
            List[Dict[str, Any]]: 基金实时数据列表。

        API接口: http://api.mairuiapi.com/hf/real/time/基金代码(如159001)/您的licence
        """
        if not fund_code:
            raise ValidationException("基金代码不能为空", "FUND_CODE_EMPTY")

        url = f"{self.BASE_URL}/hf/real/time/{fund_code}/{self.license_key}"
        data = self._make_request(url)
        result: List[Dict[str, Any]] = []
        for item in data:
            # t 字段是主键的一部分，不能为 None，需要过滤掉无效数据
            t_value = item.get("t")
            if t_value is None:
                logger.warning(
                    "跳过无效数据：基金代码 {} 的更新时间字段为空", fund_code
                )
                continue

            result.append(
                {
                    "dm": item.get("dm") or fund_code,
                    "p": item.get("p"),
                    "o": item.get("o"),
                    "h": item.get("h"),
                    "l": item.get("l"),
                    "yc": item.get("yc"),
                    "cje": item.get("cje"),
                    "v": item.get("v"),
                    "pv": item.get("pv"),
                    "ud": item.get("ud"),
                    "pc": item.get("pc"),
                    "zf": item.get("zf"),
                    "t": t_value,
                    "pe": item.get("pe"),
                    "tr": item.get("tr"),
                    "pb_ratio": item.get("pb_ratio"),
                    "tv": item.get("tv"),
                }
            )
        return result

    def fetch_and_save_hf_fund_real_time_data(self, fund_code: str) -> int:
        """
        获取并存储实时数据（沪深基金）。

        Args:
            fund_code (str): 基金代码。

        Returns:
            int: 成功存储的记录数。

        API接口: http://api.mairuiapi.com/hf/real/time/基金代码(如159001)/您的licence
        """
        data = self.fetch_hf_fund_real_time_data(fund_code)
        if not data:
            logger.warning("未获取到实时数据（沪深基金），基金代码: {}", fund_code)
            return 0
        try:
            with get_db_context() as session:
                count = bulk_insert(session, HfFundRealTimeData, data, ignore_duplicates=True)
                logger.info("成功存储 {} 条实时数据（沪深基金），基金代码: {}", count, fund_code)
                return count
        except Exception as exc:
            error_msg = f"存储实时数据（沪深基金）失败: {str(exc)}"
            logger.error(error_msg)
            raise DatabaseException(error_msg, "SAVE_HF_FUND_REAL_TIME_DATA_ERROR")

    def fetch_hk_stock_real_time_data(self, stock_code: str) -> List[Dict[str, Any]]:
        """
        获取香港股票实时数据。

        Args:
            stock_code (str): 股票代码（如 00001）。

        Returns:
            List[Dict[str, Any]]: 香港股票实时数据列表。

        API接口: http://api.mairuiapi.com/hk/stock/real/time/股票代码(如00001)/您的licence
        """
        if not stock_code:
            raise ValidationException("股票代码不能为空", "STOCK_CODE_EMPTY")

        url = f"{self.BASE_URL}/hk/stock/real/time/{stock_code}/{self.license_key}"
        data = self._make_request(url)
        result: List[Dict[str, Any]] = []
        for item in data:
            # t 字段是主键的一部分，不能为 None，需要过滤掉无效数据
            t_value = item.get("t")
            if t_value is None:
                logger.warning(
                    "跳过无效数据：股票代码 {} 的更新时间字段为空", stock_code
                )
                continue

            result.append(
                {
                    "dm": item.get("Dm") or item.get("dm") or stock_code,
                    "p": item.get("p"),
                    "o": item.get("o"),
                    "h": item.get("h"),
                    "l": item.get("l"),
                    "yc": item.get("yc"),
                    "cje": item.get("cje"),
                    "v": item.get("v"),
                    "pv": item.get("pv"),
                    "ud": item.get("ud"),
                    "pc": item.get("pc"),
                    "zf": item.get("zf"),
                    "t": t_value,
                    "pe": item.get("pe"),
                    "tr": item.get("tr"),
                    "pb_ratio": item.get("pb_ratio"),
                    "tv": item.get("tv"),
                    "updated_at": item.get("updated_at"),
                }
            )
        return result

    def fetch_and_save_hk_stock_real_time_data(self, stock_code: str) -> int:
        """
        获取并存储香港股票实时数据。

        Args:
            stock_code (str): 股票代码。

        Returns:
            int: 成功存储的记录数。

        API接口: http://api.mairuiapi.com/hk/stock/real/time/股票代码(如00001)/您的licence
        """
        data = self.fetch_hk_stock_real_time_data(stock_code)
        if not data:
            logger.warning("未获取到香港股票实时数据，股票代码: {}", stock_code)
            return 0
        try:
            with get_db_context() as session:
                count = bulk_insert(session, HkStockRealTimeData, data, ignore_duplicates=True)
                logger.info("成功存储 {} 条香港股票实时数据，股票代码: {}", count, stock_code)
                return count
        except Exception as exc:
            error_msg = f"存储香港股票实时数据失败: {str(exc)}"
            logger.error(error_msg)
            raise DatabaseException(error_msg, "SAVE_HK_STOCK_REAL_TIME_DATA_ERROR")

    def fetch_bj_stock_real_time_data(self, stock_code: str) -> List[Dict[str, Any]]:
        """
        获取京市股票实时数据。

        Args:
            stock_code (str): 股票代码（如 430017）。

        Returns:
            List[Dict[str, Any]]: 京市股票实时数据列表。

        API接口: http://api.mairuiapi.com/bj/stock/real/time/股票代码(如430017)/您的licence
        """
        if not stock_code:
            raise ValidationException("股票代码不能为空", "STOCK_CODE_EMPTY")

        url = f"{self.BASE_URL}/bj/stock/real/time/{stock_code}/{self.license_key}"
        data = self._make_request(url)
        result: List[Dict[str, Any]] = []
        for item in data:
            # t 字段是主键的一部分，不能为 None，需要过滤掉无效数据
            t_value = item.get("t")
            if t_value is None:
                logger.warning(
                    "跳过无效数据：股票代码 {} 的更新时间字段为空", stock_code
                )
                continue

            result.append(
                {
                    "dm": item.get("dm") or stock_code,
                    "p": item.get("p"),
                    "o": item.get("o"),
                    "h": item.get("h"),
                    "l": item.get("l"),
                    "yc": item.get("yc"),
                    "cje": item.get("cje"),
                    "v": item.get("v"),
                    "pv": item.get("pv"),
                    "ud": item.get("ud"),
                    "pc": item.get("pc"),
                    "zf": item.get("zf"),
                    "t": t_value,
                    "pe": item.get("pe"),
                    "tr": item.get("tr"),
                    "pb_ratio": item.get("pb_ratio"),
                    "tv": item.get("tv"),
                }
            )
        return result

    def fetch_and_save_bj_stock_real_time_data(self, stock_code: str) -> int:
        """
        获取并存储京市股票实时数据。

        Args:
            stock_code (str): 股票代码。

        Returns:
            int: 成功存储的记录数。

        API接口: http://api.mairuiapi.com/bj/stock/real/time/股票代码(如430017)/您的licence
        """
        data = self.fetch_bj_stock_real_time_data(stock_code)
        if not data:
            logger.warning("未获取到京市股票实时数据，股票代码: {}", stock_code)
            return 0
        try:
            with get_db_context() as session:
                count = bulk_insert(session, BjStockRealTimeData, data, ignore_duplicates=True)
                logger.info("成功存储 {} 条京市股票实时数据，股票代码: {}", count, stock_code)
                return count
        except Exception as exc:
            error_msg = f"存储京市股票实时数据失败: {str(exc)}"
            logger.error(error_msg)
            raise DatabaseException(error_msg, "SAVE_BJ_STOCK_REAL_TIME_DATA_ERROR")


