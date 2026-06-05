"""
其他市场列表 API 客户端。

该模块提供市场基础信息中“其他市场列表”相关的 API 接口，包括：
- 京市指数列表
- 科创股票列表
- ETF 基金列表
- 京市股票列表
"""

from typing import List, Dict, Any, Optional

import requests

from config.settings import settings
from config.database import get_db_context
from core.exceptions import APIException, DatabaseException, ValidationException
from utils.logger import get_logger
from utils.db_utils import bulk_insert
from api_clients.OtherMarketLists.OtherMarketLists_table import (
    BjIndexList,
    KcStockList,
    EtfFundList,
    BjStockList,
)

logger = get_logger("api_clients.OtherMarketLists")


class OtherMarketLists:
    """其他市场列表 API 客户端类。"""

    BASE_URL = "http://api.mairuiapi.com"

    def __init__(self, license_key: Optional[str] = None) -> None:
        """
        初始化其他市场列表 API 客户端。

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

    def fetch_bj_index_list(self) -> List[Dict[str, Any]]:
        """
        获取京市指数列表数据。

        Args:
            无。

        Returns:
            List[Dict[str, Any]]: 京市指数列表数据。

        API接口: http://api.mairuiapi.com/bj/list/index/您的licence
        """
        url = f"{self.BASE_URL}/bj/list/index/{self.license_key}"
        data = self._make_request(url)
        result: List[Dict[str, Any]] = []
        for item in data:
            # 尝试多种可能的字段名
            dm = item.get("Dm") or item.get("dm") or item.get("code") or item.get("stock_code")
            if not dm:
                logger.warning("京市指数列表数据缺少 dm 字段，跳过该记录: {}", item)
                continue
            mapped_item = {
                "dm": dm,
                "mc": item.get("mc") or item.get("Mc") or "",
                "jys": item.get("jys") or item.get("Jys") or "",
                "updated_at": item.get("updated_at"),
            }
            result.append(mapped_item)
        return result

    def fetch_and_save_bj_index_list(self) -> int:
        """
        获取并存储京市指数列表数据。

        Args:
            无。

        Returns:
            int: 成功存储的记录数。

        API接口: http://api.mairuiapi.com/bj/list/index/您的licence
        """
        data = self.fetch_bj_index_list()
        if not data:
            logger.warning("未获取到京市指数列表数据")
            return 0
        try:
            with get_db_context() as session:
                count = bulk_insert(session, BjIndexList, data, ignore_duplicates=True)
                logger.info("成功存储 {} 条京市指数列表数据", count)
                return count
        except Exception as exc:
            error_msg = f"存储京市指数列表数据失败: {str(exc)}"
            logger.error(error_msg)
            raise DatabaseException(error_msg, "SAVE_BJ_INDEX_LIST_ERROR")

    def fetch_kc_stock_list(self) -> List[Dict[str, Any]]:
        """
        获取科创股票列表数据。

        Args:
            无。

        Returns:
            List[Dict[str, Any]]: 科创股票列表数据。

        API接口: http://api.mairuiapi.com/kc/list/all/您的licence
        """
        url = f"{self.BASE_URL}/kc/list/all/{self.license_key}"
        data = self._make_request(url)
        result: List[Dict[str, Any]] = []
        for item in data:
            # 尝试多种可能的字段名
            dm = item.get("Dm") or item.get("dm") or item.get("code") or item.get("stock_code")
            if not dm:
                logger.warning("科创股票列表数据缺少 dm 字段，跳过该记录: {}", item)
                continue
            mapped_item = {
                "dm": dm,
                "mc": item.get("mc") or item.get("Mc") or "",
                "jys": item.get("jys") or item.get("Jys") or "",
                "updated_at": item.get("updated_at"),
            }
            result.append(mapped_item)
        return result

    def fetch_and_save_kc_stock_list(self) -> int:
        """
        获取并存储科创股票列表数据。

        Args:
            无。

        Returns:
            int: 成功存储的记录数。

        API接口: http://api.mairuiapi.com/kc/list/all/您的licence
        """
        data = self.fetch_kc_stock_list()
        if not data:
            logger.warning("未获取到科创股票列表数据")
            return 0
        try:
            with get_db_context() as session:
                count = bulk_insert(session, KcStockList, data, ignore_duplicates=True)
                logger.info("成功存储 {} 条科创股票列表数据", count)
                return count
        except Exception as exc:
            error_msg = f"存储科创股票列表数据失败: {str(exc)}"
            logger.error(error_msg)
            raise DatabaseException(error_msg, "SAVE_KC_STOCK_LIST_ERROR")

    def fetch_etf_fund_list(self) -> List[Dict[str, Any]]:
        """
        获取 ETF 基金列表数据。

        Args:
            无。

        Returns:
            List[Dict[str, Any]]: ETF 基金列表数据。

        API接口: http://api.mairuiapi.com/fd/list/etf/您的licence
        """
        url = f"{self.BASE_URL}/fd/list/etf/{self.license_key}"
        data = self._make_request(url)
        result: List[Dict[str, Any]] = []
        for item in data:
            # 尝试多种可能的字段名
            dm = item.get("Dm") or item.get("dm") or item.get("code") or item.get("stock_code")
            if not dm:
                logger.warning("ETF 基金列表数据缺少 dm 字段，跳过该记录: {}", item)
                continue
            mapped_item = {
                "dm": dm,
                "mc": item.get("mc") or item.get("Mc") or "",
                "jys": item.get("jys") or item.get("Jys") or "",
                "updated_at": item.get("updated_at"),
            }
            result.append(mapped_item)
        return result

    def fetch_and_save_etf_fund_list(self) -> int:
        """
        获取并存储 ETF 基金列表数据。

        Args:
            无。

        Returns:
            int: 成功存储的记录数。

        API接口: http://api.mairuiapi.com/fd/list/etf/您的licence
        """
        data = self.fetch_etf_fund_list()
        if not data:
            logger.warning("未获取到 ETF 基金列表数据")
            return 0
        try:
            with get_db_context() as session:
                count = bulk_insert(session, EtfFundList, data, ignore_duplicates=True)
                logger.info("成功存储 {} 条 ETF 基金列表数据", count)
                return count
        except Exception as exc:
            error_msg = f"存储 ETF 基金列表数据失败: {str(exc)}"
            logger.error(error_msg)
            raise DatabaseException(error_msg, "SAVE_ETF_FUND_LIST_ERROR")

    def fetch_bj_stock_list(self) -> List[Dict[str, Any]]:
        """
        获取京市股票列表数据。

        Args:
            无。

        Returns:
            List[Dict[str, Any]]: 京市股票列表数据。

        API接口: http://api.mairuiapi.com/bj/list/all/您的licence
        """
        url = f"{self.BASE_URL}/bj/list/all/{self.license_key}"
        data = self._make_request(url)
        result: List[Dict[str, Any]] = []
        for item in data:
            # 尝试多种可能的字段名
            dm = item.get("Dm") or item.get("dm") or item.get("code") or item.get("stock_code")
            if not dm:
                logger.warning("京市股票列表数据缺少 dm 字段，跳过该记录: {}", item)
                continue
            mapped_item = {
                "dm": dm,
                "mc": item.get("mc") or item.get("Mc") or "",
                "jys": item.get("jys") or item.get("Jys") or "",
                "updated_at": item.get("updated_at"),
            }
            result.append(mapped_item)
        return result

    def fetch_and_save_bj_stock_list(self) -> int:
        """
        获取并存储京市股票列表数据。

        Args:
            无。

        Returns:
            int: 成功存储的记录数。

        API接口: http://api.mairuiapi.com/bj/list/all/您的licence
        """
        data = self.fetch_bj_stock_list()
        if not data:
            logger.warning("未获取到京市股票列表数据")
            return 0
        try:
            with get_db_context() as session:
                count = bulk_insert(session, BjStockList, data, ignore_duplicates=True)
                logger.info("成功存储 {} 条京市股票列表数据", count)
                return count
        except Exception as exc:
            error_msg = f"存储京市股票列表数据失败: {str(exc)}"
            logger.error(error_msg)
            raise DatabaseException(error_msg, "SAVE_BJ_STOCK_LIST_ERROR")


