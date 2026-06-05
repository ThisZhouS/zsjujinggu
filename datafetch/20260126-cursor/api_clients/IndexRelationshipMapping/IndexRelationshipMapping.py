"""
指数关系映射API客户端。

该模块提供指数/行业/概念与股票之间关系的API接口，包括：
- 指数、行业、概念树
- 根据股票找相关指数、行业、概念
- 根据指数、行业、概念找相关股票
- 所属指数
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

import requests

from config.database import get_db_context
from config.settings import settings
from core.exceptions import APIException, DatabaseException, ValidationException
from utils.db_utils import bulk_insert
from utils.logger import get_logger

from api_clients.IndexRelationshipMapping.IndexRelationshipMapping_table import (
    StockBelongingIndices,
    StockToZgMapping,
    ZgToStockMapping,
    ZgTree,
)

logger = get_logger("api_clients.IndexRelationshipMapping")


class IndexRelationshipMapping:
    """指数关系映射API客户端类。"""

    BASE_URL = "http://api.mairuiapi.com"

    def __init__(self, license_key: Optional[str] = None):
        """
        初始化指数关系映射API客户端。

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

    def fetch_zg_tree(self) -> List[Dict[str, Any]]:
        """
        获取指数、行业、概念树数据。

        Returns:
            List[Dict[str, Any]]: 树节点数据列表。

        API接口: http://api.mairuiapi.com/hszg/list/您的licence
        """
        url = f"{self.BASE_URL}/hszg/list/{self.license_key}"
        data = self._make_request(url)

        result: list[dict[str, Any]] = []
        for item in data:
            result.append(
                {
                    "code": item.get("Code") or item.get("code"),
                    "name": item.get("name"),
                    "type1": item.get("type1"),
                    "type2": item.get("type2"),
                    "level": item.get("Level") if "Level" in item else item.get("level"),
                    "pcode": item.get("pcode"),
                    "pname": item.get("pname"),
                    "isleaf": item.get("isleaf"),
                }
            )
        return result

    def fetch_and_save_zg_tree(self) -> int:
        """
        获取并存储指数、行业、概念树数据。

        Returns:
            int: 成功存储的记录数。

        API接口: http://api.mairuiapi.com/hszg/list/您的licence
        """
        data = self.fetch_zg_tree()
        if not data:
            logger.warning("未获取到指数、行业、概念树数据")
            return 0
        try:
            with get_db_context() as session:
                return bulk_insert(session, ZgTree, data, ignore_duplicates=True)
        except Exception as e:
            error_msg = f"存储指数、行业、概念树数据失败: {str(e)}"
            logger.error(error_msg)
            raise DatabaseException(error_msg, "SAVE_ZG_TREE_ERROR")

    def fetch_related_codes_by_stock(self, stock_code: str) -> List[Dict[str, Any]]:
        """
        根据股票代码获取相关指数、行业、概念。

        Args:
            stock_code (str): 股票代码，如 "000001"。

        Returns:
            List[Dict[str, Any]]: 映射数据列表。

        API接口: http://api.mairuiapi.com/hszg/zg/股票代码(如000001)/您的licence
        """
        if not stock_code:
            raise ValidationException("股票代码不能为空", "STOCK_CODE_EMPTY")

        url = f"{self.BASE_URL}/hszg/zg/{stock_code}/{self.license_key}"
        data = self._make_request(url)

        result: list[dict[str, Any]] = []
        for item in data:
            result.append(
                {
                    "dm": item.get("dm", stock_code),
                    "code": item.get("Code") or item.get("code"),
                    "name": item.get("name"),
                }
            )
        return result

    def fetch_and_save_related_codes_by_stock(self, stock_code: str) -> int:
        """
        获取并存储“股票 -> 指数/行业/概念”映射数据。

        Args:
            stock_code (str): 股票代码，如 "000001"。

        Returns:
            int: 成功存储的记录数。

        API接口: http://api.mairuiapi.com/hszg/zg/股票代码(如000001)/您的licence
        """
        data = self.fetch_related_codes_by_stock(stock_code)
        if not data:
            logger.warning(f"未获取到股票相关指数/行业/概念数据，股票代码: {stock_code}")
            return 0
        try:
            with get_db_context() as session:
                return bulk_insert(session, StockToZgMapping, data, ignore_duplicates=True)
        except Exception as e:
            error_msg = f"存储股票相关指数/行业/概念数据失败: {str(e)}"
            logger.error(error_msg)
            raise DatabaseException(error_msg, "SAVE_STOCK_TO_ZG_MAPPING_ERROR")

    def fetch_related_stocks_by_code(self, code: str) -> List[Dict[str, Any]]:
        """
        根据指数、行业、概念代码获取相关股票。

        Args:
            code (str): 指数、行业、概念代码，如 "sw2_650300"。

        Returns:
            List[Dict[str, Any]]: 相关股票数据列表。

        API接口: http://api.mairuiapi.com/hszg/gg/指数、行业、概念代码/您的licence
        """
        if not code:
            raise ValidationException("code不能为空", "CODE_EMPTY")

        url = f"{self.BASE_URL}/hszg/gg/{code}/{self.license_key}"
        data = self._make_request(url)

        result: list[dict[str, Any]] = []
        for item in data:
            result.append(
                {
                    "code": item.get("Code") or code,
                    "dm": item.get("dm"),
                    "mc": item.get("mc"),
                    "jys": item.get("jys"),
                }
            )
        return result

    def fetch_and_save_related_stocks_by_code(self, code: str) -> int:
        """
        获取并存储“指数/行业/概念 -> 股票”映射数据。

        Args:
            code (str): 指数、行业、概念代码，如 "sw2_650300"。

        Returns:
            int: 成功存储的记录数。

        API接口: http://api.mairuiapi.com/hszg/gg/指数、行业、概念代码/您的licence
        """
        data = self.fetch_related_stocks_by_code(code)
        if not data:
            logger.warning(f"未获取到相关股票数据，code: {code}")
            return 0
        try:
            with get_db_context() as session:
                return bulk_insert(session, ZgToStockMapping, data, ignore_duplicates=True)
        except Exception as e:
            error_msg = f"存储相关股票数据失败: {str(e)}"
            logger.error(error_msg)
            raise DatabaseException(error_msg, "SAVE_ZG_TO_STOCK_MAPPING_ERROR")

    def fetch_belonging_indices(self, stock_code: str) -> List[Dict[str, Any]]:
        """
        获取上市公司所属指数数据。

        Args:
            stock_code (str): 股票代码，如 "000001"。

        Returns:
            List[Dict[str, Any]]: 所属指数数据列表。

        API接口: http://api.mairuiapi.com/hscp/sszs/股票代码(如000001)/您的licence
        """
        if not stock_code:
            raise ValidationException("股票代码不能为空", "STOCK_CODE_EMPTY")

        url = f"{self.BASE_URL}/hscp/sszs/{stock_code}/{self.license_key}"
        data = self._make_request(url)

        result: list[dict[str, Any]] = []
        for item in data:
            index_code = item.get("dm") if item.get("dm") != stock_code else item.get("index_dm")
            # 文档中“指数代码”字段名也写为 dm，实际返回可能不同；优先使用 item['dm']，
            # 若等于股票代码则尝试 fallback。
            result.append(
                {
                    "stock_code": stock_code,
                    "index_code": index_code,
                    "mc": item.get("mc"),
                    "ind": item.get("Ind"),
                    "outd": item.get("outd"),
                }
            )
        return result

    def fetch_and_save_belonging_indices(self, stock_code: str) -> int:
        """
        获取并存储上市公司所属指数数据。

        Args:
            stock_code (str): 股票代码，如 "000001"。

        Returns:
            int: 成功存储的记录数。

        API接口: http://api.mairuiapi.com/hscp/sszs/股票代码(如000001)/您的licence
        """
        data = self.fetch_belonging_indices(stock_code)
        if not data:
            logger.warning(f"未获取到所属指数数据，股票代码: {stock_code}")
            return 0
        try:
            with get_db_context() as session:
                return bulk_insert(
                    session,
                    StockBelongingIndices,
                    data,
                    ignore_duplicates=True,
                )
        except Exception as e:
            error_msg = f"存储所属指数数据失败: {str(e)}"
            logger.error(error_msg)
            raise DatabaseException(error_msg, "SAVE_STOCK_BELONGING_INDICES_ERROR")

