"""
财务季度事件API客户端。

该模块提供财务季度事件相关的API接口，包括：
- 近年分红
- 近年增发
- 近一年各季度利润
- 近一年各季度现金流
"""

from typing import List, Dict, Any, Optional
import requests

from config.settings import settings
from config.database import get_db_context
from core.exceptions import APIException, DatabaseException, ValidationException
from utils.logger import get_logger
from utils.db_utils import bulk_insert
from api_clients.FinancialQuartersEvents.FinancialQuartersEvents_table import (
    RecentDividend,
    RecentAdditionalIssue,
    QuarterlyProfit,
    QuarterlyCashFlow,
)

logger = get_logger("api_clients.FinancialQuartersEvents")


class FinancialQuartersEvents:
    """财务季度事件API客户端类。"""

    BASE_URL = "http://api.mairuiapi.com"

    def __init__(self, license_key: Optional[str] = None):
        """
        初始化财务季度事件API客户端。

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
            status_code = e.response.status_code if hasattr(e, 'response') and e.response else 500
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

    def fetch_recent_dividend(self, stock_code: str) -> List[Dict[str, Any]]:
        """
        获取近年分红数据。

        Args:
            stock_code (str): 股票代码，如"000001"。

        Returns:
            List[Dict[str, Any]]: 近年分红数据列表。

        Raises:
            ValidationException: 如果参数验证失败。
            APIException: 如果API请求失败。

        API接口: http://api.mairuiapi.com/hscp/jnfh/股票代码(如000001)/您的licence
        """
        if not stock_code:
            raise ValidationException("股票代码不能为空", "STOCK_CODE_EMPTY")

        url = f"{self.BASE_URL}/hscp/jnfh/{stock_code}/{self.license_key}"
        data = self._make_request(url)

        # 数据字段映射
        result = []
        for item in data:
            mapped_item = {
                "dm": item.get("dm", stock_code),
                "sdate": item.get("sdate", ""),
                "give": item.get("give"),
                "change": item.get("change"),
                "send": item.get("Send"),  # 注意API返回的是Send
                "line": item.get("line"),
                "cdate": item.get("cdate"),
                "edate": item.get("edate"),
                "hdate": item.get("hdate"),
            }
            result.append(mapped_item)

        return result

    def fetch_and_save_recent_dividend(self, stock_code: str) -> int:
        """
        获取并存储近年分红数据。

        Args:
            stock_code (str): 股票代码，如"000001"。

        Returns:
            int: 成功存储的记录数。

        Raises:
            ValidationException: 如果参数验证失败。
            APIException: 如果API请求失败。
            DatabaseException: 如果数据库操作失败。

        API接口: http://api.mairuiapi.com/hscp/jnfh/股票代码(如000001)/您的licence
        """
        data = self.fetch_recent_dividend(stock_code)
        if not data:
            logger.warning(f"未获取到近年分红数据，股票代码: {stock_code}")
            return 0

        try:
            with get_db_context() as session:
                count = bulk_insert(session, RecentDividend, data, ignore_duplicates=True)
                logger.info(f"成功存储 {count} 条近年分红数据，股票代码: {stock_code}")
                return count
        except Exception as e:
            error_msg = f"存储近年分红数据失败: {str(e)}"
            logger.error(error_msg)
            raise DatabaseException(error_msg, "SAVE_RECENT_DIVIDEND_ERROR")

    def fetch_recent_additional_issue(self, stock_code: str) -> List[Dict[str, Any]]:
        """
        获取近年增发数据。

        Args:
            stock_code (str): 股票代码，如"000001"。

        Returns:
            List[Dict[str, Any]]: 近年增发数据列表。

        Raises:
            ValidationException: 如果参数验证失败。
            APIException: 如果API请求失败。

        API接口: http://api.mairuiapi.com/hscp/jnzf/股票代码(如000001)/您的licence
        """
        if not stock_code:
            raise ValidationException("股票代码不能为空", "STOCK_CODE_EMPTY")

        url = f"{self.BASE_URL}/hscp/jnzf/{stock_code}/{self.license_key}"
        data = self._make_request(url)

        # 数据字段映射
        result = []
        for item in data:
            mapped_item = {
                "dm": item.get("dm", stock_code),
                "sdate": item.get("sdate", ""),
                "type": item.get("type"),
                "price": item.get("price"),
                "tprice": item.get("tprice"),
                "fprice": item.get("fprice"),
                "amount": item.get("amount"),
            }
            result.append(mapped_item)

        return result

    def fetch_and_save_recent_additional_issue(self, stock_code: str) -> int:
        """
        获取并存储近年增发数据。

        Args:
            stock_code (str): 股票代码，如"000001"。

        Returns:
            int: 成功存储的记录数。

        Raises:
            ValidationException: 如果参数验证失败。
            APIException: 如果API请求失败。
            DatabaseException: 如果数据库操作失败。

        API接口: http://api.mairuiapi.com/hscp/jnzf/股票代码(如000001)/您的licence
        """
        data = self.fetch_recent_additional_issue(stock_code)
        if not data:
            logger.warning(f"未获取到近年增发数据，股票代码: {stock_code}")
            return 0

        try:
            with get_db_context() as session:
                count = bulk_insert(session, RecentAdditionalIssue, data, ignore_duplicates=True)
                logger.info(f"成功存储 {count} 条近年增发数据，股票代码: {stock_code}")
                return count
        except Exception as e:
            error_msg = f"存储近年增发数据失败: {str(e)}"
            logger.error(error_msg)
            raise DatabaseException(error_msg, "SAVE_RECENT_ADDITIONAL_ISSUE_ERROR")

    def fetch_quarterly_profit(self, stock_code: str) -> List[Dict[str, Any]]:
        """
        获取近一年各季度利润数据。

        Args:
            stock_code (str): 股票代码，如"000001"。

        Returns:
            List[Dict[str, Any]]: 近一年各季度利润数据列表。

        Raises:
            ValidationException: 如果参数验证失败。
            APIException: 如果API请求失败。

        API接口: http://api.mairuiapi.com/hscp/jdlr/股票代码(如000001)/您的licence
        """
        if not stock_code:
            raise ValidationException("股票代码不能为空", "STOCK_CODE_EMPTY")

        url = f"{self.BASE_URL}/hscp/jdlr/{stock_code}/{self.license_key}"
        data = self._make_request(url)

        # 数据字段映射
        result = []
        for item in data:
            mapped_item = {
                "dm": item.get("dm", stock_code),
                "date": item.get("date", ""),
                "income": item.get("income"),
                "expend": item.get("expend"),
                "profit": item.get("profit"),
                "totalp": item.get("totalp"),
                "reprofit": item.get("reprofit"),
                "basege": item.get("basege"),
                "ettege": item.get("ettege"),
                "otherp": item.get("otherp"),
                "totalcp": item.get("totalcp"),
            }
            result.append(mapped_item)

        return result

    def fetch_and_save_quarterly_profit(self, stock_code: str) -> int:
        """
        获取并存储近一年各季度利润数据。

        Args:
            stock_code (str): 股票代码，如"000001"。

        Returns:
            int: 成功存储的记录数。

        Raises:
            ValidationException: 如果参数验证失败。
            APIException: 如果API请求失败。
            DatabaseException: 如果数据库操作失败。

        API接口: http://api.mairuiapi.com/hscp/jdlr/股票代码(如000001)/您的licence
        """
        data = self.fetch_quarterly_profit(stock_code)
        if not data:
            logger.warning(f"未获取到近一年各季度利润数据，股票代码: {stock_code}")
            return 0

        try:
            with get_db_context() as session:
                count = bulk_insert(session, QuarterlyProfit, data, ignore_duplicates=True)
                logger.info(f"成功存储 {count} 条近一年各季度利润数据，股票代码: {stock_code}")
                return count
        except Exception as e:
            error_msg = f"存储近一年各季度利润数据失败: {str(e)}"
            logger.error(error_msg)
            raise DatabaseException(error_msg, "SAVE_QUARTERLY_PROFIT_ERROR")

    def fetch_quarterly_cash_flow(self, stock_code: str) -> List[Dict[str, Any]]:
        """
        获取近一年各季度现金流数据。

        Args:
            stock_code (str): 股票代码，如"000001"。

        Returns:
            List[Dict[str, Any]]: 近一年各季度现金流数据列表。

        Raises:
            ValidationException: 如果参数验证失败。
            APIException: 如果API请求失败。

        API接口: http://api.mairuiapi.com/hscp/jdxj/股票代码(如000001)/您的licence
        """
        if not stock_code:
            raise ValidationException("股票代码不能为空", "STOCK_CODE_EMPTY")

        url = f"{self.BASE_URL}/hscp/jdxj/{stock_code}/{self.license_key}"
        data = self._make_request(url)

        # 数据字段映射
        result = []
        for item in data:
            mapped_item = {
                "dm": item.get("dm", stock_code),
                "date": item.get("date", ""),
                "jyin": item.get("jyin"),
                "jyout": item.get("jyout"),
                "jyfinal": item.get("jyfinal"),
                "tzin": item.get("tzin"),
                "tzout": item.get("tzout"),
                "tzfinal": item.get("tzfinal"),
                "czin": item.get("czin"),
                "czout": item.get("czout"),
                "czfinal": item.get("czfinal"),
                "hl": item.get("hl"),
                "cashinc": item.get("cashinc"),
                "cashs": item.get("cashs"),
                "cashe": item.get("cashe"),
            }
            result.append(mapped_item)

        return result

    def fetch_and_save_quarterly_cash_flow(self, stock_code: str) -> int:
        """
        获取并存储近一年各季度现金流数据。

        Args:
            stock_code (str): 股票代码，如"000001"。

        Returns:
            int: 成功存储的记录数。

        Raises:
            ValidationException: 如果参数验证失败。
            APIException: 如果API请求失败。
            DatabaseException: 如果数据库操作失败。

        API接口: http://api.mairuiapi.com/hscp/jdxj/股票代码(如000001)/您的licence
        """
        data = self.fetch_quarterly_cash_flow(stock_code)
        if not data:
            logger.warning(f"未获取到近一年各季度现金流数据，股票代码: {stock_code}")
            return 0

        try:
            with get_db_context() as session:
                count = bulk_insert(session, QuarterlyCashFlow, data, ignore_duplicates=True)
                logger.info(f"成功存储 {count} 条近一年各季度现金流数据，股票代码: {stock_code}")
                return count
        except Exception as e:
            error_msg = f"存储近一年各季度现金流数据失败: {str(e)}"
            logger.error(error_msg)
            raise DatabaseException(error_msg, "SAVE_QUARTERLY_CASH_FLOW_ERROR")

