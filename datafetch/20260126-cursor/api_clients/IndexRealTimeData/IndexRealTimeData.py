"""
指数实时数据 API 客户端。

该模块提供“京市指数实时数据”接口，用于按指数代码获取实时交易数据，并支持存储到 PostgreSQL。
"""

from typing import Any, Dict, List, Optional

import requests

from api_clients.IndexRealTimeData.IndexRealTimeData_table import BjIndexRealTimeData
from config.database import get_db_context
from config.settings import settings
from core.exceptions import APIException, DatabaseException, ValidationException
from utils.db_utils import bulk_insert
from utils.logger import get_logger

logger = get_logger("api_clients.IndexRealTimeData")


class IndexRealTimeData:
    """指数实时数据 API 客户端类。"""

    BASE_URL = "http://api.mairuiapi.com"

    def __init__(self, license_key: Optional[str] = None) -> None:
        """
        初始化指数实时数据 API 客户端。

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
            logger.info("发送 API 请求: %s", url)
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            data = response.json()
            if not isinstance(data, list):
                data = [data] if data else []
            logger.info("成功获取 %d 条数据", len(data))
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

    def fetch_index_real_time_data(self, index_code: str) -> List[Dict[str, Any]]:
        """
        获取指数实时数据（京市指数）。

        Args:
            index_code (str): 指数代码（如 899050）。

        Returns:
            List[Dict[str, Any]]: 指数实时数据列表。

        API接口: http://api.mairuiapi.com/bj/index/real/time/指数代码(如899050)/您的licence
        """
        if not index_code:
            raise ValidationException("指数代码不能为空", "INDEX_CODE_EMPTY")

        url = f"{self.BASE_URL}/bj/index/real/time/{index_code}/{self.license_key}"
        data = self._make_request(url)

        result: List[Dict[str, Any]] = []
        for item in data:
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
                    "t": item.get("t"),
                    "pe": item.get("pe"),
                    "tr": item.get("tr"),
                    "pb_ratio": item.get("pb_ratio"),
                    "tv": item.get("tv"),
                }
            )
        return result

    def fetch_and_save_index_real_time_data(self, index_code: str) -> int:
        """
        获取并存储指数实时数据（京市指数）。

        Args:
            index_code (str): 指数代码（如 899050）。

        Returns:
            int: 成功存储的记录数。

        API接口: http://api.mairuiapi.com/bj/index/real/time/指数代码(如899050)/您的licence
        """
        data = self.fetch_index_real_time_data(index_code)
        if not data:
            logger.warning("未获取到指数实时数据，指数代码: %s", index_code)
            return 0

        try:
            with get_db_context() as session:
                count = bulk_insert(
                    session,
                    BjIndexRealTimeData,
                    data,
                    ignore_duplicates=True,
                )
                logger.info("成功存储 %d 条指数实时数据，指数代码: %s", count, index_code)
                return count
        except Exception as exc:
            error_msg = f"存储指数实时数据失败: {str(exc)}"
            logger.error(error_msg)
            raise DatabaseException(error_msg, "SAVE_INDEX_REAL_TIME_DATA_ERROR")


