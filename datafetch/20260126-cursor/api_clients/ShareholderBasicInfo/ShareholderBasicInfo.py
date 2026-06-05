"""
股东基础信息API客户端。

该模块提供股东基础信息相关的API接口，包括：
- 公司股东数
- 公司十大股东
- 公司十大流通股东
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

import requests

from config.database import get_db_context
from config.settings import settings
from core.exceptions import APIException, DatabaseException, ValidationException
from utils.db_utils import bulk_insert
from utils.logger import get_logger

from api_clients.ShareholderBasicInfo.ShareholderBasicInfo_table import (
    CompanyShareholderCount,
    CompanyTopFlowHolders,
    CompanyTopHolders,
)

logger = get_logger("api_clients.ShareholderBasicInfo")


class ShareholderBasicInfo:
    """股东基础信息API客户端类。"""

    BASE_URL = "http://api.mairuiapi.com"

    def __init__(self, license_key: Optional[str] = None) -> None:
        """
        初始化股东基础信息API客户端。

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

    def _build_date_params(self, start_date: Optional[str], end_date: Optional[str]) -> str:
        """
        构建开始/结束时间查询参数。

        Args:
            start_date (Optional[str]): 开始时间，格式YYYYMMDD。
            end_date (Optional[str]): 结束时间，格式YYYYMMDD。

        Returns:
            str: 查询参数字符串（含?或为空字符串）。

        API接口: 无
        """
        params: List[str] = []
        if start_date:
            params.append(f"st={start_date}")
        if end_date:
            params.append(f"et={end_date}")
        return ("?" + "&".join(params)) if params else ""

    def fetch_company_shareholder_count(
        self,
        stock_code: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        获取公司股东数。

        Args:
            stock_code (str): 股票代码，如"000001.SZ"。
            start_date (Optional[str]): 开始时间YYYYMMDD，默认为None（不限制）。
            end_date (Optional[str]): 结束时间YYYYMMDD，默认为None（不限制）。

        Returns:
            List[Dict[str, Any]]: 公司股东数数据列表。

        Raises:
            ValidationException: 如果参数验证失败。
            APIException: 如果API请求失败。

        API接口: http://api.mairuiapi.com/hsstock/financial/hm/股票代码（如000001.SZ）/您的licence?st=开始时间&et=结束时间
        """
        self._validate_stock_code(stock_code)
        params = self._build_date_params(start_date, end_date)
        url = f"{self.BASE_URL}/hsstock/financial/hm/{stock_code}/{self.license_key}{params}"
        data = self._make_request(url)

        result: List[Dict[str, Any]] = []
        for item in data:
            mapped_item = {
                "dm": item.get("dm", stock_code),
                "plrq": item.get("plrq", ""),
                "jzrq": item.get("jzrq", ""),
                "gdzs": item.get("gdzs", ""),
                "agdhs": item.get("agdhs", ""),
                "bgdhs": item.get("bgdhs", ""),
                "hgdhs": item.get("hgdhs", ""),
                "yltgdhs": item.get("yltgdhs", ""),
                "wltgdhs": item.get("wltgdhs", ""),
            }
            result.append(mapped_item)
        return result

    def fetch_and_save_company_shareholder_count(
        self,
        stock_code: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> int:
        """
        获取并存储公司股东数。

        Args:
            stock_code (str): 股票代码，如"000001.SZ"。
            start_date (Optional[str]): 开始时间YYYYMMDD，默认为None（不限制）。
            end_date (Optional[str]): 结束时间YYYYMMDD，默认为None（不限制）。

        Returns:
            int: 成功存储的记录数。

        Raises:
            ValidationException: 如果参数验证失败。
            APIException: 如果API请求失败。
            DatabaseException: 如果数据库操作失败。

        API接口: http://api.mairuiapi.com/hsstock/financial/hm/股票代码（如000001.SZ）/您的licence?st=开始时间&et=结束时间
        """
        data = self.fetch_company_shareholder_count(stock_code, start_date, end_date)
        if not data:
            logger.warning(f"未获取到公司股东数数据，股票代码: {stock_code}")
            return 0

        try:
            with get_db_context() as session:
                return bulk_insert(session, CompanyShareholderCount, data, ignore_duplicates=True)
        except Exception as e:
            error_msg = f"存储公司股东数数据失败: {str(e)}"
            logger.error(error_msg)
            raise DatabaseException(error_msg, "SAVE_COMPANY_SHAREHOLDER_COUNT_ERROR")

    def fetch_company_top_holders(
        self,
        stock_code: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        获取公司十大股东。

        Args:
            stock_code (str): 股票代码，如"000001.SZ"。
            start_date (Optional[str]): 开始时间YYYYMMDD，默认为None（不限制）。
            end_date (Optional[str]): 结束时间YYYYMMDD，默认为None（不限制）。

        Returns:
            List[Dict[str, Any]]: 公司十大股东数据列表。

        Raises:
            ValidationException: 如果参数验证失败。
            APIException: 如果API请求失败。

        API接口: http://api.mairuiapi.com/hsstock/financial/topholder/股票代码（如000001.SZ）/您的licence?st=开始时间&et=结束时间
        """
        self._validate_stock_code(stock_code)
        params = self._build_date_params(start_date, end_date)
        url = f"{self.BASE_URL}/hsstock/financial/topholder/{stock_code}/{self.license_key}{params}"
        data = self._make_request(url)

        result: List[Dict[str, Any]] = []
        for item in data:
            mapped_item = {
                "dm": item.get("dm", stock_code),
                "plrq": item.get("plrq", ""),
                "jzrq": item.get("jzrq", ""),
                "gdmc": item.get("gdmc", ""),
                "gdlx": item.get("gdlx", ""),
                "cgsl": item.get("cgsl", ""),
                "bdyy": item.get("Bdyy", item.get("bdyy", "")),
                "cgbl": item.get("cgbl", ""),
                "gfxz": item.get("gfxz", ""),
                "cgpm": item.get("cgpm", ""),
            }
            result.append(mapped_item)
        return result

    def fetch_and_save_company_top_holders(
        self,
        stock_code: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> int:
        """
        获取并存储公司十大股东。

        Args:
            stock_code (str): 股票代码，如"000001.SZ"。
            start_date (Optional[str]): 开始时间YYYYMMDD，默认为None（不限制）。
            end_date (Optional[str]): 结束时间YYYYMMDD，默认为None（不限制）。

        Returns:
            int: 成功存储的记录数。

        Raises:
            ValidationException: 如果参数验证失败。
            APIException: 如果API请求失败。
            DatabaseException: 如果数据库操作失败。

        API接口: http://api.mairuiapi.com/hsstock/financial/topholder/股票代码（如000001.SZ）/您的licence?st=开始时间&et=结束时间
        """
        data = self.fetch_company_top_holders(stock_code, start_date, end_date)
        if not data:
            logger.warning(f"未获取到公司十大股东数据，股票代码: {stock_code}")
            return 0

        try:
            with get_db_context() as session:
                return bulk_insert(session, CompanyTopHolders, data, ignore_duplicates=True)
        except Exception as e:
            error_msg = f"存储公司十大股东数据失败: {str(e)}"
            logger.error(error_msg)
            raise DatabaseException(error_msg, "SAVE_COMPANY_TOP_HOLDERS_ERROR")

    def fetch_company_top_flow_holders(
        self,
        stock_code: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        获取公司十大流通股东。

        Args:
            stock_code (str): 股票代码，如"000001.SZ"。
            start_date (Optional[str]): 开始时间YYYYMMDD，默认为None（不限制）。
            end_date (Optional[str]): 结束时间YYYYMMDD，默认为None（不限制）。

        Returns:
            List[Dict[str, Any]]: 公司十大流通股东数据列表。

        Raises:
            ValidationException: 如果参数验证失败。
            APIException: 如果API请求失败。

        API接口: http://api.mairuiapi.com/hsstock/financial/flowholder/股票代码（如000001.SZ）/您的licence?st=开始时间&et=结束时间
        """
        self._validate_stock_code(stock_code)
        params = self._build_date_params(start_date, end_date)
        url = f"{self.BASE_URL}/hsstock/financial/flowholder/{stock_code}/{self.license_key}{params}"
        data = self._make_request(url)

        result: List[Dict[str, Any]] = []
        for item in data:
            mapped_item = {
                "dm": item.get("dm", stock_code),
                "ggrq": item.get("ggrq", ""),
                "jzrq": item.get("jzrq", ""),
                "gdmc": item.get("gdmc", ""),
                "gdlx": item.get("Gdlx", item.get("gdlx", "")),
                "cgsl": item.get("cgsl", ""),
                "bdyy": item.get("Bdyy", item.get("bdyy", "")),
                "cgbl": item.get("cgbl", ""),
                "gfxz": item.get("gfxz", ""),
                "cgpm": item.get("cgpm", ""),
            }
            result.append(mapped_item)
        return result

    def fetch_and_save_company_top_flow_holders(
        self,
        stock_code: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> int:
        """
        获取并存储公司十大流通股东。

        Args:
            stock_code (str): 股票代码，如"000001.SZ"。
            start_date (Optional[str]): 开始时间YYYYMMDD，默认为None（不限制）。
            end_date (Optional[str]): 结束时间YYYYMMDD，默认为None（不限制）。

        Returns:
            int: 成功存储的记录数。

        Raises:
            ValidationException: 如果参数验证失败。
            APIException: 如果API请求失败。
            DatabaseException: 如果数据库操作失败。

        API接口: http://api.mairuiapi.com/hsstock/financial/flowholder/股票代码（如000001.SZ）/您的licence?st=开始时间&et=结束时间
        """
        data = self.fetch_company_top_flow_holders(stock_code, start_date, end_date)
        if not data:
            logger.warning(f"未获取到公司十大流通股东数据，股票代码: {stock_code}")
            return 0

        try:
            with get_db_context() as session:
                return bulk_insert(session, CompanyTopFlowHolders, data, ignore_duplicates=True)
        except Exception as e:
            error_msg = f"存储公司十大流通股东数据失败: {str(e)}"
            logger.error(error_msg)
            raise DatabaseException(error_msg, "SAVE_COMPANY_TOP_FLOW_HOLDERS_ERROR")


