"""
股票池分类API客户端。

该模块提供股票池分类相关的API接口，包括：
- 跌停股池
- 强势股池
- 炸板股池
- 涨停股池
- 次新股池
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

import requests

from config.database import get_db_context
from config.settings import settings
from core.exceptions import APIException, DatabaseException, ValidationException
from utils.db_utils import bulk_insert
from utils.logger import get_logger

from api_clients.StockPoolClassification.StockPoolClassification_table import (
    LimitDownPool,
    LimitUpBreakPool,
    LimitUpPool,
    StrongPool,
    SubNewPool,
)

logger = get_logger("api_clients.StockPoolClassification")


class StockPoolClassification:
    """股票池分类API客户端类。"""

    BASE_URL = "http://api.mairuiapi.com"

    def __init__(self, license_key: Optional[str] = None) -> None:
        """
        初始化股票池分类API客户端。

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

    def _validate_date(self, date: str) -> None:
        """
        校验日期参数。

        Args:
            date (str): 日期，格式yyyy-MM-dd。

        Raises:
            ValidationException: 如果日期为空。

        API接口: 无
        """
        if not date:
            raise ValidationException("日期参数不能为空", "DATE_EMPTY")

    def _convert_yes_no_to_numeric(self, value: Any) -> Optional[float]:
        """
        将"是"/"否"字符串转换为数值（1/0）。

        Args:
            value (Any): 输入值，可能是"是"、"否"、数字或None。

        Returns:
            Optional[float]: 转换后的数值，1表示"是"，0表示"否"，None表示无效值。

        API接口: 无
        """
        if value is None:
            return None
        if isinstance(value, (int, float)):
            return float(value)
        if isinstance(value, str):
            value = value.strip()
            if value == "是":
                return 1.0
            if value == "否":
                return 0.0
            # 尝试转换为数字
            try:
                return float(value)
            except (ValueError, TypeError):
                logger.warning(f"无法将值转换为数字: {value}")
                return None
        return None

    def fetch_limit_down_pool(self, date: str) -> List[Dict[str, Any]]:
        """
        获取跌停股池。

        Args:
            date (str): 日期，格式yyyy-MM-dd。

        Returns:
            List[Dict[str, Any]]: 跌停股池数据列表。

        Raises:
            ValidationException: 如果参数验证失败。
            APIException: 如果API请求失败。

        API接口: http://api.mairuiapi.com/hslt/dtgc/日期(如2020-01-15)/您的licence
        """
        self._validate_date(date)
        url = f"{self.BASE_URL}/hslt/dtgc/{date}/{self.license_key}"
        data = self._make_request(url)

        result: List[Dict[str, Any]] = []
        for item in data:
            # 主键字段不能为 None，需要确保有值
            dm_value = item.get("dm") or ""
            lbt_value = item.get("lbt") or ""

            # 如果主键字段为空，跳过该条记录
            if not dm_value or not lbt_value:
                logger.warning(
                    "跳过无效数据：主键字段为空 (dm={}, lbt={})",
                    dm_value,
                    lbt_value,
                )
                continue

            mapped_item = {
                "dm": dm_value,
                "date": date,
                "mc": item.get("mc") or "",
                "p": item.get("p"),
                "zf": item.get("zf"),
                "cje": item.get("Cje") or item.get("cje"),
                "lt": item.get("lt"),
                "zsz": item.get("zsz"),
                "pe": item.get("pe"),
                "hs": item.get("hs"),
                "lbc": item.get("lbc"),
                "lbt": lbt_value,
                "zj": item.get("zj"),
                "fba": item.get("fba"),
                "zbc": item.get("zbc"),
            }
            result.append(mapped_item)
        return result

    def fetch_and_save_limit_down_pool(self, date: str) -> int:
        """
        获取并存储跌停股池。

        Args:
            date (str): 日期，格式yyyy-MM-dd。

        Returns:
            int: 成功存储的记录数。

        Raises:
            ValidationException: 如果参数验证失败。
            APIException: 如果API请求失败。
            DatabaseException: 如果数据库操作失败。

        API接口: http://api.mairuiapi.com/hslt/dtgc/日期(如2020-01-15)/您的licence
        """
        data = self.fetch_limit_down_pool(date)
        if not data:
            logger.warning(f"未获取到跌停股池数据，日期: {date}")
            return 0

        try:
            with get_db_context() as session:
                return bulk_insert(session, LimitDownPool, data, ignore_duplicates=True)
        except Exception as e:
            error_msg = f"存储跌停股池数据失败: {str(e)}"
            logger.error(error_msg)
            raise DatabaseException(error_msg, "SAVE_LIMIT_DOWN_POOL_ERROR")

    def fetch_strong_pool(self, date: str) -> List[Dict[str, Any]]:
        """
        获取强势股池。

        Args:
            date (str): 日期，格式yyyy-MM-dd。

        Returns:
            List[Dict[str, Any]]: 强势股池数据列表。

        Raises:
            ValidationException: 如果参数验证失败。
            APIException: 如果API请求失败。

        API接口: http://api.mairuiapi.com/hslt/qsgc/日期(如2020-01-15)/您的licence
        """
        self._validate_date(date)
        url = f"{self.BASE_URL}/hslt/qsgc/{date}/{self.license_key}"
        data = self._make_request(url)

        result: List[Dict[str, Any]] = []
        for item in data:
            # 主键字段不能为 None，需要确保有值
            dm_value = item.get("dm") or ""
            tj_value = item.get("tj") or ""

            # 如果主键字段为空，跳过该条记录
            if not dm_value or not tj_value:
                logger.warning(
                    "跳过无效数据：主键字段为空 (dm={}, tj={})",
                    dm_value,
                    tj_value,
                )
                continue

            mapped_item = {
                "dm": dm_value,
                "date": date,
                "mc": item.get("Mc") or item.get("mc") or "",
                "p": item.get("p"),
                "ztp": item.get("Ztp") or item.get("ztp"),
                "zf": item.get("zf"),
                "cje": item.get("cje") or item.get("Cje"),
                "lt": item.get("lt"),
                "zsz": item.get("zsz"),
                "zs": item.get("zs"),
                "nh": self._convert_yes_no_to_numeric(item.get("nh")),
                "lb": item.get("lb"),
                "hs": item.get("hs"),
                "tj": tj_value,
            }
            result.append(mapped_item)
        return result

    def fetch_and_save_strong_pool(self, date: str) -> int:
        """
        获取并存储强势股池。

        Args:
            date (str): 日期，格式yyyy-MM-dd。

        Returns:
            int: 成功存储的记录数。

        Raises:
            ValidationException: 如果参数验证失败。
            APIException: 如果API请求失败。
            DatabaseException: 如果数据库操作失败。

        API接口: http://api.mairuiapi.com/hslt/qsgc/日期(如2020-01-15)/您的licence
        """
        data = self.fetch_strong_pool(date)
        if not data:
            logger.warning(f"未获取到强势股池数据，日期: {date}")
            return 0

        try:
            with get_db_context() as session:
                return bulk_insert(session, StrongPool, data, ignore_duplicates=True)
        except Exception as e:
            error_msg = f"存储强势股池数据失败: {str(e)}"
            logger.error(error_msg)
            raise DatabaseException(error_msg, "SAVE_STRONG_POOL_ERROR")

    def fetch_limit_up_break_pool(self, date: str) -> List[Dict[str, Any]]:
        """
        获取炸板股池。

        Args:
            date (str): 日期，格式yyyy-MM-dd。

        Returns:
            List[Dict[str, Any]]: 炸板股池数据列表。

        Raises:
            ValidationException: 如果参数验证失败。
            APIException: 如果API请求失败。

        API接口: http://api.mairuiapi.com/hslt/zbgc/日期(如2020-01-15)/您的licence
        """
        self._validate_date(date)
        url = f"{self.BASE_URL}/hslt/zbgc/{date}/{self.license_key}"
        data = self._make_request(url)

        result: List[Dict[str, Any]] = []
        for item in data:
            # 主键字段不能为 None，需要确保有值
            dm_value = item.get("dm") or ""
            fbt_value = item.get("fbt") or ""

            # 如果主键字段为空，跳过该条记录
            if not dm_value or not fbt_value:
                logger.warning(
                    "跳过无效数据：主键字段为空 (dm={}, fbt={})",
                    dm_value,
                    fbt_value,
                )
                continue

            mapped_item = {
                "dm": dm_value,
                "date": date,
                "mc": item.get("mc") or "",
                "p": item.get("p"),
                "ztp": item.get("ztp") or item.get("Ztp"),
                "zf": item.get("zf"),
                "cje": item.get("cje") or item.get("Cje"),
                "lt": item.get("lt"),
                "zsz": item.get("zsz"),
                "zs": item.get("zs"),
                "hs": item.get("hs"),
                "tj": item.get("tj") or "",
                "fbt": fbt_value,
                "zbc": item.get("zbc"),
            }
            result.append(mapped_item)
        return result

    def fetch_and_save_limit_up_break_pool(self, date: str) -> int:
        """
        获取并存储炸板股池。

        Args:
            date (str): 日期，格式yyyy-MM-dd。

        Returns:
            int: 成功存储的记录数。

        Raises:
            ValidationException: 如果参数验证失败。
            APIException: 如果API请求失败。
            DatabaseException: 如果数据库操作失败。

        API接口: http://api.mairuiapi.com/hslt/zbgc/日期(如2020-01-15)/您的licence
        """
        data = self.fetch_limit_up_break_pool(date)
        if not data:
            logger.warning(f"未获取到炸板股池数据，日期: {date}")
            return 0

        try:
            with get_db_context() as session:
                return bulk_insert(session, LimitUpBreakPool, data, ignore_duplicates=True)
        except Exception as e:
            error_msg = f"存储炸板股池数据失败: {str(e)}"
            logger.error(error_msg)
            raise DatabaseException(error_msg, "SAVE_LIMIT_UP_BREAK_POOL_ERROR")

    def fetch_limit_up_pool(self, date: str) -> List[Dict[str, Any]]:
        """
        获取涨停股池。

        Args:
            date (str): 日期，格式yyyy-MM-dd。

        Returns:
            List[Dict[str, Any]]: 涨停股池数据列表。

        Raises:
            ValidationException: 如果参数验证失败。
            APIException: 如果API请求失败。

        API接口: http://api.mairuiapi.com/hslt/ztgc/日期(如2020-01-15)/您的licence
        """
        self._validate_date(date)
        url = f"{self.BASE_URL}/hslt/ztgc/{date}/{self.license_key}"
        data = self._make_request(url)

        result: List[Dict[str, Any]] = []
        for item in data:
            # 主键字段不能为 None，需要确保有值
            dm_value = item.get("dm") or ""
            fbt_value = item.get("fbt") or ""
            lbt_value = item.get("lbt") or ""

            # 如果主键字段为空，跳过该条记录
            if not dm_value or not fbt_value or not lbt_value:
                logger.warning(
                    "跳过无效数据：主键字段为空 (dm={}, fbt={}, lbt={})",
                    dm_value,
                    fbt_value,
                    lbt_value,
                )
                continue

            mapped_item = {
                "dm": dm_value,
                "date": date,
                "mc": item.get("Mc") or item.get("mc") or "",
                "p": item.get("p"),
                "zf": item.get("zf"),
                "cje": item.get("cje") or item.get("Cje"),
                "lt": item.get("lt"),
                "zsz": item.get("zsz"),
                "hs": item.get("hs"),
                "lbc": item.get("Lbc") or item.get("lbc"),
                "fbt": fbt_value,
                "lbt": lbt_value,
                "zj": item.get("zj"),
                "zbc": item.get("zbc"),
                "tj": item.get("tj") or "",
                "hy": item.get("hy") or "",
            }
            result.append(mapped_item)
        return result

    def fetch_and_save_limit_up_pool(self, date: str) -> int:
        """
        获取并存储涨停股池。

        Args:
            date (str): 日期，格式yyyy-MM-dd。

        Returns:
            int: 成功存储的记录数。

        Raises:
            ValidationException: 如果参数验证失败。
            APIException: 如果API请求失败。
            DatabaseException: 如果数据库操作失败。

        API接口: http://api.mairuiapi.com/hslt/ztgc/日期(如2020-01-15)/您的licence
        """
        data = self.fetch_limit_up_pool(date)
        if not data:
            logger.warning(f"未获取到涨停股池数据，日期: {date}")
            return 0

        try:
            with get_db_context() as session:
                return bulk_insert(session, LimitUpPool, data, ignore_duplicates=True)
        except Exception as e:
            error_msg = f"存储涨停股池数据失败: {str(e)}"
            logger.error(error_msg)
            raise DatabaseException(error_msg, "SAVE_LIMIT_UP_POOL_ERROR")

    def fetch_sub_new_pool(self, date: str) -> List[Dict[str, Any]]:
        """
        获取次新股池。

        Args:
            date (str): 日期，格式yyyy-MM-dd。

        Returns:
            List[Dict[str, Any]]: 次新股池数据列表。

        Raises:
            ValidationException: 如果参数验证失败。
            APIException: 如果API请求失败。

        API接口: http://api.mairuiapi.com/hslt/cxgc/日期(如2020-01-15)/您的licence
        """
        self._validate_date(date)
        url = f"{self.BASE_URL}/hslt/cxgc/{date}/{self.license_key}"
        data = self._make_request(url)

        result: List[Dict[str, Any]] = []
        for item in data:
            # 主键字段不能为 None，需要确保有值
            dm_value = item.get("dm") or ""
            od_value = item.get("od") or ""
            ipod_value = item.get("ipod") or ""

            # 如果主键字段为空，跳过该条记录
            if not dm_value or not od_value or not ipod_value:
                logger.warning(
                    "跳过无效数据：主键字段为空 (dm={}, od={}, ipod={})",
                    dm_value,
                    od_value,
                    ipod_value,
                )
                continue

            mapped_item = {
                "dm": dm_value,
                "date": date,
                "mc": item.get("mc") or "",
                "p": item.get("p"),
                "ztp": item.get("ztp") or item.get("Ztp"),
                "zf": item.get("zf"),
                "cje": item.get("cje") or item.get("Cje"),
                "lt": item.get("lt"),
                "zsz": item.get("zsz"),
                "nh": self._convert_yes_no_to_numeric(item.get("nh")),
                "hs": item.get("hs"),
                "tj": item.get("tj") or "",
                "kb": item.get("kb"),
                "od": od_value,
                "ipod": ipod_value,
            }
            result.append(mapped_item)
        return result

    def fetch_and_save_sub_new_pool(self, date: str) -> int:
        """
        获取并存储次新股池。

        Args:
            date (str): 日期，格式yyyy-MM-dd。

        Returns:
            int: 成功存储的记录数。

        Raises:
            ValidationException: 如果参数验证失败。
            APIException: 如果API请求失败。
            DatabaseException: 如果数据库操作失败。

        API接口: http://api.mairuiapi.com/hslt/cxgc/日期(如2020-01-15)/您的licence
        """
        data = self.fetch_sub_new_pool(date)
        if not data:
            logger.warning(f"未获取到次新股池数据，日期: {date}")
            return 0

        try:
            with get_db_context() as session:
                return bulk_insert(session, SubNewPool, data, ignore_duplicates=True)
        except Exception as e:
            error_msg = f"存储次新股池数据失败: {str(e)}"
            logger.error(error_msg)
            raise DatabaseException(error_msg, "SAVE_SUB_NEW_POOL_ERROR")


