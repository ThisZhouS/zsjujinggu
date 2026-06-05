"""
公司历史数据API客户端。

该模块提供公司历史数据相关的API接口，包括：
- 历届监事会成员
- 历届高管成员
- 历届董事会成员
"""

from typing import List, Dict, Any, Optional
import requests

from config.settings import settings
from config.database import get_db_context
from core.exceptions import APIException, DatabaseException, ValidationException
from utils.logger import get_logger
from utils.db_utils import bulk_insert
from api_clients.CompanyHistoricalData.CompanyHistoricalData_table import (
    SupervisoryBoardMember,
    ExecutiveMember,
    BoardMember,
)

logger = get_logger("api_clients.CompanyHistoricalData")


class CompanyHistoricalData:
    """公司历史数据API客户端类。"""

    BASE_URL = "http://api.mairuiapi.com"

    def __init__(self, license_key: Optional[str] = None):
        """
        初始化公司历史数据API客户端。

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

    def fetch_supervisory_board_member(self, stock_code: str) -> List[Dict[str, Any]]:
        """
        获取历届监事会成员数据。

        Args:
            stock_code (str): 股票代码，如"000001"。

        Returns:
            List[Dict[str, Any]]: 历届监事会成员数据列表。

        Raises:
            ValidationException: 如果参数验证失败。
            APIException: 如果API请求失败。

        API接口: http://api.mairuiapi.com/hscp/ljjj/股票代码(如000001)/您的licence
        """
        if not stock_code:
            raise ValidationException("股票代码不能为空", "STOCK_CODE_EMPTY")

        url = f"{self.BASE_URL}/hscp/ljjj/{stock_code}/{self.license_key}"
        data = self._make_request(url)

        # 数据字段映射
        result = []
        for item in data:
            mapped_item = {
                "dm": item.get("dm", stock_code),
                "name": item.get("name", ""),
                "title": item.get("title", ""),
                "sdate": item.get("sdate", ""),
                "edate": item.get("edate", ""),
            }
            result.append(mapped_item)

        return result

    def fetch_and_save_supervisory_board_member(self, stock_code: str) -> int:
        """
        获取并存储历届监事会成员数据。

        Args:
            stock_code (str): 股票代码，如"000001"。

        Returns:
            int: 成功存储的记录数。

        Raises:
            ValidationException: 如果参数验证失败。
            APIException: 如果API请求失败。
            DatabaseException: 如果数据库操作失败。

        API接口: http://api.mairuiapi.com/hscp/ljjj/股票代码(如000001)/您的licence
        """
        data = self.fetch_supervisory_board_member(stock_code)
        if not data:
            logger.warning(f"未获取到历届监事会成员数据，股票代码: {stock_code}")
            return 0

        try:
            with get_db_context() as session:
                count = bulk_insert(session, SupervisoryBoardMember, data, ignore_duplicates=True)
                logger.info(f"成功存储 {count} 条历届监事会成员数据，股票代码: {stock_code}")
                return count
        except Exception as e:
            error_msg = f"存储历届监事会成员数据失败: {str(e)}"
            logger.error(error_msg)
            raise DatabaseException(error_msg, "SAVE_SUPERVISORY_BOARD_MEMBER_ERROR")

    def fetch_executive_member(self, stock_code: str) -> List[Dict[str, Any]]:
        """
        获取历届高管成员数据。

        Args:
            stock_code (str): 股票代码，如"000001"。

        Returns:
            List[Dict[str, Any]]: 历届高管成员数据列表。

        Raises:
            ValidationException: 如果参数验证失败。
            APIException: 如果API请求失败。

        API接口: http://api.mairuiapi.com/hscp/ljgg/股票代码(如000001)/您的licence
        """
        if not stock_code:
            raise ValidationException("股票代码不能为空", "STOCK_CODE_EMPTY")

        url = f"{self.BASE_URL}/hscp/ljgg/{stock_code}/{self.license_key}"
        data = self._make_request(url)

        # 数据字段映射
        result = []
        for item in data:
            mapped_item = {
                "dm": item.get("dm", stock_code),
                "name": item.get("name", ""),
                "title": item.get("title", ""),
                "sdate": item.get("sdate", ""),
                "edate": item.get("edate", ""),
            }
            result.append(mapped_item)

        return result

    def fetch_and_save_executive_member(self, stock_code: str) -> int:
        """
        获取并存储历届高管成员数据。

        Args:
            stock_code (str): 股票代码，如"000001"。

        Returns:
            int: 成功存储的记录数。

        Raises:
            ValidationException: 如果参数验证失败。
            APIException: 如果API请求失败。
            DatabaseException: 如果数据库操作失败。

        API接口: http://api.mairuiapi.com/hscp/ljgg/股票代码(如000001)/您的licence
        """
        data = self.fetch_executive_member(stock_code)
        if not data:
            logger.warning(f"未获取到历届高管成员数据，股票代码: {stock_code}")
            return 0

        try:
            with get_db_context() as session:
                count = bulk_insert(session, ExecutiveMember, data, ignore_duplicates=True)
                logger.info(f"成功存储 {count} 条历届高管成员数据，股票代码: {stock_code}")
                return count
        except Exception as e:
            error_msg = f"存储历届高管成员数据失败: {str(e)}"
            logger.error(error_msg)
            raise DatabaseException(error_msg, "SAVE_EXECUTIVE_MEMBER_ERROR")

    def fetch_board_member(self, stock_code: str) -> List[Dict[str, Any]]:
        """
        获取历届董事会成员数据。

        Args:
            stock_code (str): 股票代码，如"000001"。

        Returns:
            List[Dict[str, Any]]: 历届董事会成员数据列表。

        Raises:
            ValidationException: 如果参数验证失败。
            APIException: 如果API请求失败。

        API接口: http://api.mairuiapi.com/hscp/ljds/股票代码(如000001)/您的licence
        """
        if not stock_code:
            raise ValidationException("股票代码不能为空", "STOCK_CODE_EMPTY")

        url = f"{self.BASE_URL}/hscp/ljds/{stock_code}/{self.license_key}"
        data = self._make_request(url)

        # 数据字段映射
        result = []
        for item in data:
            mapped_item = {
                "dm": item.get("dm", stock_code),
                "name": item.get("name", ""),
                "title": item.get("title", ""),
                "sdate": item.get("sdate", ""),
                "edate": item.get("edate", ""),
            }
            result.append(mapped_item)

        return result

    def fetch_and_save_board_member(self, stock_code: str) -> int:
        """
        获取并存储历届董事会成员数据。

        Args:
            stock_code (str): 股票代码，如"000001"。

        Returns:
            int: 成功存储的记录数。

        Raises:
            ValidationException: 如果参数验证失败。
            APIException: 如果API请求失败。
            DatabaseException: 如果数据库操作失败。

        API接口: http://api.mairuiapi.com/hscp/ljds/股票代码(如000001)/您的licence
        """
        data = self.fetch_board_member(stock_code)
        if not data:
            logger.warning(f"未获取到历届董事会成员数据，股票代码: {stock_code}")
            return 0

        try:
            with get_db_context() as session:
                count = bulk_insert(session, BoardMember, data, ignore_duplicates=True)
                logger.info(f"成功存储 {count} 条历届董事会成员数据，股票代码: {stock_code}")
                return count
        except Exception as e:
            error_msg = f"存储历届董事会成员数据失败: {str(e)}"
            logger.error(error_msg)
            raise DatabaseException(error_msg, "SAVE_BOARD_MEMBER_ERROR")

