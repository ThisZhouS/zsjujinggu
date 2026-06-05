"""
股东明细数据API客户端。

该模块提供股东明细相关的API接口，包括：
- 十大股东
- 十大流通股东
- 股东变化趋势
- 基金持股
"""

from __future__ import annotations

import json
from typing import Any, Dict, List, Optional

import requests

from config.database import get_db_context
from config.settings import settings
from core.exceptions import APIException, DatabaseException, ValidationException
from utils.db_utils import bulk_insert
from utils.logger import get_logger

from api_clients.ShareholderDetailedData.ShareholderDetailedData_table import (
    FundHoldings,
    ShareholderChangeTrend,
    ShareholderTop10,
    ShareholderTop10Float,
)

logger = get_logger("api_clients.ShareholderDetailedData")


class ShareholderDetailedData:
    """股东明细数据API客户端类。"""

    BASE_URL = "http://api.mairuiapi.com"

    def __init__(self, license_key: Optional[str] = None) -> None:
        """
        初始化股东明细数据API客户端。

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
            APIException: 如果请求失败或响应格式异常。

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
            status_code = e.response.status_code if hasattr(e, "response") and e.response else 500
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

    def _validate_stock_code(self, stock_code: str) -> None:
        """
        校验股票代码。

        Args:
            stock_code (str): 股票代码。

        Raises:
            ValidationException: 如果股票代码为空。

        API接口: 无
        """
        if not stock_code:
            raise ValidationException("股票代码不能为空", "STOCK_CODE_EMPTY")

    def _to_json_str(self, value: Any) -> str:
        """
        将对象安全序列化为JSON字符串。

        Args:
            value (Any): 待序列化对象。

        Returns:
            str: JSON字符串；若value为空则返回空字符串。

        API接口: 无
        """
        if value is None:
            return ""
        try:
            return json.dumps(value, ensure_ascii=False)
        except Exception:
            return ""

    def fetch_top10_shareholders(self, stock_code: str) -> List[Dict[str, Any]]:
        """
        获取十大股东数据。

        Args:
            stock_code (str): 股票代码，如"000001"。

        Returns:
            List[Dict[str, Any]]: 十大股东数据列表。

        Raises:
            ValidationException: 如果参数验证失败。
            APIException: 如果API请求失败。

        API接口: http://api.mairuiapi.com/hscp/sdgd/股票代码(如000001)/您的licence
        """
        self._validate_stock_code(stock_code)
        url = f"{self.BASE_URL}/hscp/sdgd/{stock_code}/{self.license_key}"
        data = self._make_request(url)

        result: List[Dict[str, Any]] = []
        for item in data:
            mapped_item = {
                "dm": item.get("dm", stock_code),
                "jzrq": item.get("jzrq", ""),
                "ggrq": item.get("Ggrq", item.get("ggrq", "")),
                "gdsm": item.get("gdsm", ""),
                "gdzs": item.get("gdzs"),
                "pjcg": item.get("pjcg"),
                "sdgd_json": self._to_json_str(item.get("sdgd")),
            }
            result.append(mapped_item)
        return result

    def fetch_and_save_top10_shareholders(self, stock_code: str) -> int:
        """
        获取并存储十大股东数据。

        Args:
            stock_code (str): 股票代码，如"000001"。

        Returns:
            int: 成功存储的记录数。

        Raises:
            ValidationException: 如果参数验证失败。
            APIException: 如果API请求失败。
            DatabaseException: 如果数据库操作失败。

        API接口: http://api.mairuiapi.com/hscp/sdgd/股票代码(如000001)/您的licence
        """
        data = self.fetch_top10_shareholders(stock_code)
        if not data:
            logger.warning(f"未获取到十大股东数据，股票代码: {stock_code}")
            return 0

        try:
            with get_db_context() as session:
                return bulk_insert(session, ShareholderTop10, data, ignore_duplicates=True)
        except Exception as e:
            error_msg = f"存储十大股东数据失败: {str(e)}"
            logger.error(error_msg)
            raise DatabaseException(error_msg, "SAVE_TOP10_SHAREHOLDERS_ERROR")

    def fetch_top10_float_shareholders(self, stock_code: str) -> List[Dict[str, Any]]:
        """
        获取十大流通股东数据。

        Args:
            stock_code (str): 股票代码，如"000001"。

        Returns:
            List[Dict[str, Any]]: 十大流通股东数据列表。

        Raises:
            ValidationException: 如果参数验证失败。
            APIException: 如果API请求失败。

        API接口: http://api.mairuiapi.com/hscp/ltgd/股票代码(如000001)/您的licence
        """
        self._validate_stock_code(stock_code)
        url = f"{self.BASE_URL}/hscp/ltgd/{stock_code}/{self.license_key}"
        data = self._make_request(url)

        result: List[Dict[str, Any]] = []
        for item in data:
            mapped_item = {
                "dm": item.get("dm", stock_code),
                "jzrq": item.get("jzrq", ""),
                "ggrq": item.get("ggrq", item.get("Ggrq", "")),
                "sdgd_json": self._to_json_str(item.get("sdgd")),
            }
            result.append(mapped_item)
        return result

    def fetch_and_save_top10_float_shareholders(self, stock_code: str) -> int:
        """
        获取并存储十大流通股东数据。

        Args:
            stock_code (str): 股票代码，如"000001"。

        Returns:
            int: 成功存储的记录数。

        Raises:
            ValidationException: 如果参数验证失败。
            APIException: 如果API请求失败。
            DatabaseException: 如果数据库操作失败。

        API接口: http://api.mairuiapi.com/hscp/ltgd/股票代码(如000001)/您的licence
        """
        data = self.fetch_top10_float_shareholders(stock_code)
        if not data:
            logger.warning(f"未获取到十大流通股东数据，股票代码: {stock_code}")
            return 0

        try:
            with get_db_context() as session:
                return bulk_insert(session, ShareholderTop10Float, data, ignore_duplicates=True)
        except Exception as e:
            error_msg = f"存储十大流通股东数据失败: {str(e)}"
            logger.error(error_msg)
            raise DatabaseException(error_msg, "SAVE_TOP10_FLOAT_SHAREHOLDERS_ERROR")

    def fetch_shareholder_change_trend(self, stock_code: str) -> List[Dict[str, Any]]:
        """
        获取股东变化趋势数据。

        Args:
            stock_code (str): 股票代码，如"000001"。

        Returns:
            List[Dict[str, Any]]: 股东变化趋势数据列表。

        Raises:
            ValidationException: 如果参数验证失败。
            APIException: 如果API请求失败。

        API接口: http://api.mairuiapi.com/hscp/gdbh/股票代码(如000001)/您的licence
        """
        self._validate_stock_code(stock_code)
        url = f"{self.BASE_URL}/hscp/gdbh/{stock_code}/{self.license_key}"
        data = self._make_request(url)

        result: List[Dict[str, Any]] = []
        for item in data:
            mapped_item = {
                "dm": item.get("dm", stock_code),
                "jzrq": item.get("jzrq", ""),
                "gdhs": item.get("Gdhs", item.get("gdhs", "")),
                "bh": item.get("bh", ""),
            }
            result.append(mapped_item)
        return result

    def fetch_and_save_shareholder_change_trend(self, stock_code: str) -> int:
        """
        获取并存储股东变化趋势数据。

        Args:
            stock_code (str): 股票代码，如"000001"。

        Returns:
            int: 成功存储的记录数。

        Raises:
            ValidationException: 如果参数验证失败。
            APIException: 如果API请求失败。
            DatabaseException: 如果数据库操作失败。

        API接口: http://api.mairuiapi.com/hscp/gdbh/股票代码(如000001)/您的licence
        """
        data = self.fetch_shareholder_change_trend(stock_code)
        if not data:
            logger.warning(f"未获取到股东变化趋势数据，股票代码: {stock_code}")
            return 0

        try:
            with get_db_context() as session:
                return bulk_insert(session, ShareholderChangeTrend, data, ignore_duplicates=True)
        except Exception as e:
            error_msg = f"存储股东变化趋势数据失败: {str(e)}"
            logger.error(error_msg)
            raise DatabaseException(error_msg, "SAVE_SHAREHOLDER_CHANGE_TREND_ERROR")

    def fetch_fund_holdings(self, stock_code: str) -> List[Dict[str, Any]]:
        """
        获取基金持股数据。

        Args:
            stock_code (str): 股票代码，如"000001"。

        Returns:
            List[Dict[str, Any]]: 基金持股数据列表。

        Raises:
            ValidationException: 如果参数验证失败。
            APIException: 如果API请求失败。

        API接口: http://api.mairuiapi.com/hscp/jjcg/股票代码(如000001)/您的licence
        """
        self._validate_stock_code(stock_code)
        url = f"{self.BASE_URL}/hscp/jjcg/{stock_code}/{self.license_key}"
        data = self._make_request(url)

        result: List[Dict[str, Any]] = []
        for item in data:
            mapped_item = {
                "dm": item.get("dm", stock_code),
                "jzrq": item.get("jzrq", ""),
                "jjmc": item.get("jjmc", ""),
                "jjdm": item.get("Jjdm", item.get("jjdm", "")),
                "ccsl": item.get("ccsl"),
                "ltbl": item.get("ltbl"),
                "cgsz": item.get("Cgsz", item.get("cgsz")),
                "jzbl": item.get("jzbl"),
            }
            result.append(mapped_item)
        return result

    def fetch_and_save_fund_holdings(self, stock_code: str) -> int:
        """
        获取并存储基金持股数据。

        Args:
            stock_code (str): 股票代码，如"000001"。

        Returns:
            int: 成功存储的记录数。

        Raises:
            ValidationException: 如果参数验证失败。
            APIException: 如果API请求失败。
            DatabaseException: 如果数据库操作失败。

        API接口: http://api.mairuiapi.com/hscp/jjcg/股票代码(如000001)/您的licence
        """
        data = self.fetch_fund_holdings(stock_code)
        if not data:
            logger.warning(f"未获取到基金持股数据，股票代码: {stock_code}")
            return 0

        try:
            with get_db_context() as session:
                return bulk_insert(session, FundHoldings, data, ignore_duplicates=True)
        except Exception as e:
            error_msg = f"存储基金持股数据失败: {str(e)}"
            logger.error(error_msg)
            raise DatabaseException(error_msg, "SAVE_FUND_HOLDINGS_ERROR")


