"""
主要市场列表 API 客户端。

该模块提供市场基础信息中“主要市场列表”相关的 API 接口，包括：
- 股票列表
- 沪深基金列表
- 沪深主要指数列表
- 新股日历
- 港股股票列表
"""

from typing import List, Dict, Any, Optional

import requests

from config.settings import settings
from config.database import get_db_context
from core.exceptions import APIException, DatabaseException, ValidationException
from utils.logger import get_logger
from utils.db_utils import bulk_insert
from api_clients.MajorMarketLists.MajorMarketLists_table import (
    StockList,
    HsFundList,
    HsMainIndexList,
    NewStockCalendar,
    HkStockList,
)

logger = get_logger("api_clients.MajorMarketLists")


class MajorMarketLists:
    """主要市场列表 API 客户端类。"""

    BASE_URL = "http://api.mairuiapi.com"

    def __init__(self, license_key: Optional[str] = None) -> None:
        """
        初始化主要市场列表 API 客户端。

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
        except Exception as exc:  # pylint: disable=broad-except
            error_msg = f"处理 API 响应时发生错误: {str(exc)}"
            logger.error(error_msg)
            raise APIException(error_msg, "API_RESPONSE_ERROR")

    def fetch_stock_list(self) -> List[Dict[str, Any]]:
        """
        获取股票列表数据。

        Args:
            无。

        Returns:
            List[Dict[str, Any]]: 股票列表数据。

        API接口: http://api.mairuiapi.com/hslt/list/您的licence
        """
        url = f"{self.BASE_URL}/hslt/list/{self.license_key}"
        data = self._make_request(url)
        result: List[Dict[str, Any]] = []
        for item in data:
            # 尝试多种可能的字段名，优先使用大写 Dm
            dm = item.get("Dm") or item.get("dm") or item.get("code") or item.get("stock_code")
            if not dm:
                logger.warning("股票列表数据缺少 dm 字段，跳过该记录: {}", item)
                continue
            mapped_item = {
                "dm": dm,
                "mc": item.get("mc") or item.get("Mc") or "",
                "jys": item.get("jys") or item.get("Jys") or "",
                "updated_at": item.get("updated_at"),
            }
            result.append(mapped_item)
        return result

    def fetch_and_save_stock_list(self) -> int:
        """
        获取并存储股票列表数据。

        Args:
            无。

        Returns:
            int: 成功存储的记录数。

        API接口: http://api.mairuiapi.com/hslt/list/您的licence
        """
        data = self.fetch_stock_list()
        if not data:
            logger.warning("未获取到股票列表数据")
            return 0
        try:
            with get_db_context() as session:
                count = bulk_insert(session, StockList, data, ignore_duplicates=True)
                logger.info("成功存储 {} 条股票列表数据", count)
                return count
        except Exception as exc:  # pylint: disable=broad-except
            error_msg = f"存储股票列表数据失败: {str(exc)}"
            logger.error(error_msg)
            raise DatabaseException(error_msg, "SAVE_STOCK_LIST_ERROR")

    def fetch_hs_fund_list(self) -> List[Dict[str, Any]]:
        """
        获取沪深基金列表数据。

        Args:
            无。

        Returns:
            List[Dict[str, Any]]: 沪深基金列表数据。

        API接口: http://api.mairuiapi.com/fd/list/all/您的licence
        """
        url = f"{self.BASE_URL}/fd/list/all/{self.license_key}"
        data = self._make_request(url)
        result: List[Dict[str, Any]] = []
        for item in data:
            # 尝试多种可能的字段名
            dm = item.get("Dm") or item.get("dm") or item.get("code") or item.get("stock_code")
            if not dm:
                logger.warning("沪深基金列表数据缺少 dm 字段，跳过该记录: {}", item)
                continue
            mapped_item = {
                "dm": dm,
                "mc": item.get("mc") or item.get("Mc") or "",
                "jys": item.get("jys") or item.get("Jys") or "",
                "updated_at": item.get("updated_at"),
            }
            result.append(mapped_item)
        return result

    def fetch_and_save_hs_fund_list(self) -> int:
        """
        获取并存储沪深基金列表数据。

        Args:
            无。

        Returns:
            int: 成功存储的记录数。

        API接口: http://api.mairuiapi.com/fd/list/all/您的licence
        """
        data = self.fetch_hs_fund_list()
        if not data:
            logger.warning("未获取到沪深基金列表数据")
            return 0
        try:
            with get_db_context() as session:
                count = bulk_insert(session, HsFundList, data, ignore_duplicates=True)
                logger.info("成功存储 {} 条沪深基金列表数据", count)
                return count
        except Exception as exc:  # pylint: disable=broad-except
            error_msg = f"存储沪深基金列表数据失败: {str(exc)}"
            logger.error(error_msg)
            raise DatabaseException(error_msg, "SAVE_HS_FUND_LIST_ERROR")

    def fetch_hs_main_index_list(self) -> List[Dict[str, Any]]:
        """
        获取沪深主要指数列表数据。

        Args:
            无。

        Returns:
            List[Dict[str, Any]]: 沪深主要指数列表数据。

        API接口: http://api.mairuiapi.com/hsindex/list/您的licence
        """
        url = f"{self.BASE_URL}/hsindex/list/{self.license_key}"
        data = self._make_request(url)
        result: List[Dict[str, Any]] = []
        for item in data:
            # 尝试多种可能的字段名
            dm = item.get("Dm") or item.get("dm") or item.get("code") or item.get("stock_code")
            if not dm:
                logger.warning("沪深主要指数列表数据缺少 dm 字段，跳过该记录: {}", item)
                continue
            mapped_item = {
                "dm": dm,
                "mc": item.get("mc") or item.get("Mc") or "",
                "jys": item.get("jys") or item.get("Jys") or "",
                "updated_at": item.get("updated_at"),
            }
            result.append(mapped_item)
        return result

    def fetch_and_save_hs_main_index_list(self) -> int:
        """
        获取并存储沪深主要指数列表数据。

        Args:
            无。

        Returns:
            int: 成功存储的记录数。

        API接口: http://api.mairuiapi.com/hsindex/list/您的licence
        """
        data = self.fetch_hs_main_index_list()
        if not data:
            logger.warning("未获取到沪深主要指数列表数据")
            return 0
        try:
            with get_db_context() as session:
                count = bulk_insert(
                    session,
                    HsMainIndexList,
                    data,
                    ignore_duplicates=True,
                )
                logger.info("成功存储 {} 条沪深主要指数列表数据", count)
                return count
        except Exception as exc:  # pylint: disable=broad-except
            error_msg = f"存储沪深主要指数列表数据失败: {str(exc)}"
            logger.error(error_msg)
            raise DatabaseException(error_msg, "SAVE_HS_MAIN_INDEX_LIST_ERROR")

    def fetch_new_stock_calendar(self) -> List[Dict[str, Any]]:
        """
        获取新股日历数据。

        Args:
            无。

        Returns:
            List[Dict[str, Any]]: 新股日历数据。

        API接口: http://api.mairuiapi.com/hslt/new/您的licence
        """
        url = f"{self.BASE_URL}/hslt/new/{self.license_key}"
        data = self._make_request(url)
        result: List[Dict[str, Any]] = []
        for item in data:
            mapped_item = {
                "zqdm": item.get("zqdm"),
                "zqjc": item.get("Zqjc"),
                "sgdm": item.get("sgdm"),
                "fxsl": item.get("fxsl"),
                "swfxsl": item.get("swfxsl"),
                "sgsx": item.get("sgsx"),
                "dgsz": item.get("dgsz"),
                "sgrq": item.get("Sgrq"),
                "fxjg": item.get("fxjg"),
                "zxj": item.get("zxj"),
                "srspj": item.get("Srspj"),
                "zqgbrq": item.get("zqgbrq"),
                "zqjkrq": item.get("zqjkrq"),
                "ssrq": item.get("Ssrq"),
                "syl": item.get("syl"),
                "hysyl": item.get("hysyl"),
                "wszql": item.get("wszql"),
                "yzbsl": item.get("Yzbsl"),
                "zf": item.get("zf"),
                "yqhl": item.get("Yqhl"),
                "zyyw": item.get("zyyw"),
                "updated_at": item.get("updated_at"),
            }
            result.append(mapped_item)
        return result

    def fetch_and_save_new_stock_calendar(self) -> int:
        """
        获取并存储新股日历数据。

        Args:
            无。

        Returns:
            int: 成功存储的记录数。

        API接口: http://api.mairuiapi.com/hslt/new/您的licence
        """
        data = self.fetch_new_stock_calendar()
        if not data:
            logger.warning("未获取到新股日历数据")
            return 0
        try:
            with get_db_context() as session:
                count = bulk_insert(
                    session,
                    NewStockCalendar,
                    data,
                    ignore_duplicates=True,
                )
                logger.info("成功存储 {} 条新股日历数据", count)
                return count
        except Exception as exc:  # pylint: disable=broad-except
            error_msg = f"存储新股日历数据失败: {str(exc)}"
            logger.error(error_msg)
            raise DatabaseException(error_msg, "SAVE_NEW_STOCK_CALENDAR_ERROR")

    def fetch_hk_stock_list(self) -> List[Dict[str, Any]]:
        """
        获取港股股票列表数据。

        Args:
            无。

        Returns:
            List[Dict[str, Any]]: 港股股票列表数据。

        API接口: http://api.mairuiapi.com/hk/list/all/您的licence
        """
        url = f"{self.BASE_URL}/hk/list/all/{self.license_key}"
        data = self._make_request(url)
        result: List[Dict[str, Any]] = []
        for item in data:
            # 尝试多种可能的字段名
            dm = item.get("Dm") or item.get("dm") or item.get("code") or item.get("stock_code")
            if not dm:
                logger.warning("港股股票列表数据缺少 dm 字段，跳过该记录: {}", item)
                continue
            mapped_item = {
                "dm": dm,
                "mc": item.get("mc") or item.get("Mc") or "",
                "jys": item.get("jys") or item.get("Jys") or "",
                "updated_at": item.get("updated_at"),
            }
            result.append(mapped_item)
        return result

    def fetch_and_save_hk_stock_list(self) -> int:
        """
        获取并存储港股股票列表数据。

        Args:
            无。

        Returns:
            int: 成功存储的记录数。

        API接口: http://api.mairuiapi.com/hk/list/all/您的licence
        """
        data = self.fetch_hk_stock_list()
        if not data:
            logger.warning("未获取到港股股票列表数据")
            return 0
        try:
            with get_db_context() as session:
                count = bulk_insert(
                    session,
                    HkStockList,
                    data,
                    ignore_duplicates=True,
                )
                logger.info("成功存储 {} 条港股股票列表数据", count)
                return count
        except Exception as exc:  # pylint: disable=broad-except
            error_msg = f"存储港股股票列表数据失败: {str(exc)}"
            logger.error(error_msg)
            raise DatabaseException(error_msg, "SAVE_HK_STOCK_LIST_ERROR")


