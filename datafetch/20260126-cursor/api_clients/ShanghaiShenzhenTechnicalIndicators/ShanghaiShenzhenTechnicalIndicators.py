"""
沪深指数历史分时技术指标API客户端。

该模块提供沪深指数历史分时技术指标相关的API接口，包括：
- 历史分时MA
- 历史分时MACD
- 历史分时BOLL
- 历史分时KDJ
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

import requests

from config.database import get_db_context
from config.settings import settings
from core.exceptions import APIException, DatabaseException, ValidationException
from utils.db_utils import bulk_insert
from utils.logger import get_logger

from api_clients.ShanghaiShenzhenTechnicalIndicators.ShanghaiShenzhenTechnicalIndicators_table import (
    IndexHistoryBoll,
    IndexHistoryKdj,
    IndexHistoryMa,
    IndexHistoryMacd,
)

logger = get_logger("api_clients.ShanghaiShenzhenTechnicalIndicators")


class ShanghaiShenzhenTechnicalIndicators:
    """沪深指数历史分时技术指标API客户端类。"""

    BASE_URL = "http://api.mairuiapi.com"

    def __init__(self, license_key: Optional[str] = None):
        """
        初始化沪深指数历史分时技术指标API客户端。

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

    def _build_url(
        self,
        indicator: str,
        index_code: str,
        level: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        latest: Optional[int] = None,
    ) -> str:
        """
        构建指数历史分时指标URL。

        Args:
            indicator (str): 指标路径名，如 "ma" / "macd" / "boll" / "kdj"。
            index_code (str): 指数代码，如 "000001.SH"。
            level (str): 分时级别，如 5/15/30/60/d/w/m/y。
            start_date (Optional[str]): 开始时间 YYYYMMDD 或 YYYYMMDDhhmmss。
            end_date (Optional[str]): 结束时间 YYYYMMDD 或 YYYYMMDDhhmmss。
            latest (Optional[int]): 最新条数，对应 lt 参数。

        Returns:
            str: 完整请求URL。

        API接口: 无
        """
        base = (
            f"{self.BASE_URL}/hsindex/history/{indicator}/"
            f"{index_code}/{level}/{self.license_key}"
        )
        params: list[str] = []
        if start_date:
            params.append(f"st={start_date}")
        if end_date:
            params.append(f"et={end_date}")
        if latest is not None:
            params.append(f"lt={latest}")
        return base if not params else base + "?" + "&".join(params)

    def fetch_history_ma(
        self,
        index_code: str,
        level: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        latest: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        """
        获取指数历史分时MA数据。

        Args:
            index_code (str): 指数代码，如 "000001.SH"。
            level (str): 分时级别，如 5/15/30/60/d/w/m/y。
            start_date (Optional[str]): 开始时间 YYYYMMDD 或 YYYYMMDDhhmmss。
            end_date (Optional[str]): 结束时间 YYYYMMDD 或 YYYYMMDDhhmmss。
            latest (Optional[int]): 最新条数（lt）。

        Returns:
            List[Dict[str, Any]]: 指数历史分时MA数据列表。

        API接口: http://api.mairuiapi.com/hsindex/history/ma/指数代码(如000001.SH)/分时级别(如d)/您的licence?st=开始时间&et=结束时间&lt=最新条数
        """
        if not index_code:
            raise ValidationException("指数代码不能为空", "INDEX_CODE_EMPTY")
        if not level:
            raise ValidationException("分时级别不能为空", "LEVEL_EMPTY")

        url = self._build_url("ma", index_code, level, start_date, end_date, latest)
        data = self._make_request(url)

        result: list[dict[str, Any]] = []
        for item in data:
            result.append(
                {
                    "dm": item.get("dm", index_code),
                    "t": item.get("t", ""),
                    "ma3": item.get("ma3"),
                    "ma5": item.get("ma5"),
                    "ma10": item.get("ma10"),
                    "ma15": item.get("ma15"),
                    "ma20": item.get("ma20"),
                    "ma30": item.get("ma30"),
                    "ma60": item.get("ma60"),
                    "ma120": item.get("ma120"),
                    "ma200": item.get("ma200"),
                    "ma250": item.get("ma250"),
                }
            )
        return result

    def fetch_and_save_history_ma(
        self,
        index_code: str,
        level: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        latest: Optional[int] = None,
    ) -> int:
        """
        获取并存储指数历史分时MA数据。

        Args:
            index_code (str): 指数代码，如 "000001.SH"。
            level (str): 分时级别，如 5/15/30/60/d/w/m/y。
            start_date (Optional[str]): 开始时间 YYYYMMDD 或 YYYYMMDDhhmmss。
            end_date (Optional[str]): 结束时间 YYYYMMDD 或 YYYYMMDDhhmmss。
            latest (Optional[int]): 最新条数（lt）。

        Returns:
            int: 成功存储的记录数。

        API接口: http://api.mairuiapi.com/hsindex/history/ma/指数代码(如000001.SH)/分时级别(如d)/您的licence?st=开始时间&et=结束时间&lt=最新条数
        """
        data = self.fetch_history_ma(index_code, level, start_date, end_date, latest)
        if not data:
            logger.warning(f"未获取到指数历史分时MA数据，指数代码: {index_code}")
            return 0
        try:
            with get_db_context() as session:
                return bulk_insert(session, IndexHistoryMa, data, ignore_duplicates=True)
        except Exception as e:
            error_msg = f"存储指数历史分时MA数据失败: {str(e)}"
            logger.error(error_msg)
            raise DatabaseException(error_msg, "SAVE_INDEX_HISTORY_MA_ERROR")

    def fetch_history_macd(
        self,
        index_code: str,
        level: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        latest: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        """
        获取指数历史分时MACD数据。

        Args:
            index_code (str): 指数代码，如 "000001.SH"。
            level (str): 分时级别，如 5/15/30/60/d/w/m/y。
            start_date (Optional[str]): 开始时间 YYYYMMDD 或 YYYYMMDDhhmmss。
            end_date (Optional[str]): 结束时间 YYYYMMDD 或 YYYYMMDDhhmmss。
            latest (Optional[int]): 最新条数（lt）。

        Returns:
            List[Dict[str, Any]]: 指数历史分时MACD数据列表。

        API接口: http://api.mairuiapi.com/hsindex/history/macd/指数代码(如000001.SH)/分时级别(如d)/您的licence?st=开始时间&et=结束时间&lt=最新条数
        """
        if not index_code:
            raise ValidationException("指数代码不能为空", "INDEX_CODE_EMPTY")
        if not level:
            raise ValidationException("分时级别不能为空", "LEVEL_EMPTY")

        url = self._build_url("macd", index_code, level, start_date, end_date, latest)
        data = self._make_request(url)

        result: list[dict[str, Any]] = []
        for item in data:
            result.append(
                {
                    "dm": item.get("dm", index_code),
                    "t": item.get("t", ""),
                    "diff": item.get("diff"),
                    "dea": item.get("dea"),
                    "macd": item.get("macd"),
                    "ema12": item.get("ema12"),
                    "ema26": item.get("ema26"),
                }
            )
        return result

    def fetch_and_save_history_macd(
        self,
        index_code: str,
        level: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        latest: Optional[int] = None,
    ) -> int:
        """
        获取并存储指数历史分时MACD数据。

        Args:
            index_code (str): 指数代码，如 "000001.SH"。
            level (str): 分时级别，如 5/15/30/60/d/w/m/y。
            start_date (Optional[str]): 开始时间 YYYYMMDD 或 YYYYMMDDhhmmss。
            end_date (Optional[str]): 结束时间 YYYYMMDD 或 YYYYMMDDhhmmss。
            latest (Optional[int]): 最新条数（lt）。

        Returns:
            int: 成功存储的记录数。

        API接口: http://api.mairuiapi.com/hsindex/history/macd/指数代码(如000001.SH)/分时级别(如d)/您的licence?st=开始时间&et=结束时间&lt=最新条数
        """
        data = self.fetch_history_macd(index_code, level, start_date, end_date, latest)
        if not data:
            logger.warning(f"未获取到指数历史分时MACD数据，指数代码: {index_code}")
            return 0
        try:
            with get_db_context() as session:
                return bulk_insert(
                    session, IndexHistoryMacd, data, ignore_duplicates=True
                )
        except Exception as e:
            error_msg = f"存储指数历史分时MACD数据失败: {str(e)}"
            logger.error(error_msg)
            raise DatabaseException(error_msg, "SAVE_INDEX_HISTORY_MACD_ERROR")

    def fetch_history_boll(
        self,
        index_code: str,
        level: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        latest: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        """
        获取指数历史分时BOLL数据。

        Args:
            index_code (str): 指数代码，如 "000001.SH"。
            level (str): 分时级别，如 5/15/30/60/d/w/m/y。
            start_date (Optional[str]): 开始时间 YYYYMMDD 或 YYYYMMDDhhmmss。
            end_date (Optional[str]): 结束时间 YYYYMMDD 或 YYYYMMDDhhmmss。
            latest (Optional[int]): 最新条数（lt）。

        Returns:
            List[Dict[str, Any]]: 指数历史分时BOLL数据列表。

        API接口: http://api.mairuiapi.com/hsindex/history/boll/指数代码(如000001.SH)/分时级别(如d)/您的licence?st=开始时间&et=结束时间&lt=最新条数
        """
        if not index_code:
            raise ValidationException("指数代码不能为空", "INDEX_CODE_EMPTY")
        if not level:
            raise ValidationException("分时级别不能为空", "LEVEL_EMPTY")

        url = self._build_url("boll", index_code, level, start_date, end_date, latest)
        data = self._make_request(url)

        result: list[dict[str, Any]] = []
        for item in data:
            result.append(
                {
                    "dm": item.get("dm", index_code),
                    "t": item.get("t", ""),
                    "u": item.get("u"),
                    "d": item.get("d"),
                    "m": item.get("m"),
                }
            )
        return result

    def fetch_and_save_history_boll(
        self,
        index_code: str,
        level: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        latest: Optional[int] = None,
    ) -> int:
        """
        获取并存储指数历史分时BOLL数据。

        Args:
            index_code (str): 指数代码，如 "000001.SH"。
            level (str): 分时级别，如 5/15/30/60/d/w/m/y。
            start_date (Optional[str]): 开始时间 YYYYMMDD 或 YYYYMMDDhhmmss。
            end_date (Optional[str]): 结束时间 YYYYMMDD 或 YYYYMMDDhhmmss。
            latest (Optional[int]): 最新条数（lt）。

        Returns:
            int: 成功存储的记录数。

        API接口: http://api.mairuiapi.com/hsindex/history/boll/指数代码(如000001.SH)/分时级别(如d)/您的licence?st=开始时间&et=结束时间&lt=最新条数
        """
        data = self.fetch_history_boll(index_code, level, start_date, end_date, latest)
        if not data:
            logger.warning(f"未获取到指数历史分时BOLL数据，指数代码: {index_code}")
            return 0
        try:
            with get_db_context() as session:
                return bulk_insert(
                    session, IndexHistoryBoll, data, ignore_duplicates=True
                )
        except Exception as e:
            error_msg = f"存储指数历史分时BOLL数据失败: {str(e)}"
            logger.error(error_msg)
            raise DatabaseException(error_msg, "SAVE_INDEX_HISTORY_BOLL_ERROR")

    def fetch_history_kdj(
        self,
        index_code: str,
        level: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        latest: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        """
        获取指数历史分时KDJ数据。

        Args:
            index_code (str): 指数代码，如 "000001.SH"。
            level (str): 分时级别，如 5/15/30/60/d/w/m/y。
            start_date (Optional[str]): 开始时间 YYYYMMDD 或 YYYYMMDDhhmmss。
            end_date (Optional[str]): 结束时间 YYYYMMDD 或 YYYYMMDDhhmmss。
            latest (Optional[int]): 最新条数（lt）。

        Returns:
            List[Dict[str, Any]]: 指数历史分时KDJ数据列表。

        API接口: http://api.mairuiapi.com/hsindex/history/kdj/指数代码(如000001.SH)/分时级别(如d)/您的licence?st=开始时间&et=结束时间&lt=最新条数
        """
        if not index_code:
            raise ValidationException("指数代码不能为空", "INDEX_CODE_EMPTY")
        if not level:
            raise ValidationException("分时级别不能为空", "LEVEL_EMPTY")

        url = self._build_url("kdj", index_code, level, start_date, end_date, latest)
        data = self._make_request(url)

        result: list[dict[str, Any]] = []
        for item in data:
            result.append(
                {
                    "dm": item.get("dm", index_code),
                    "t": item.get("t", ""),
                    "k": item.get("k"),
                    "d": item.get("d"),
                    "j": item.get("j"),
                }
            )
        return result

    def fetch_and_save_history_kdj(
        self,
        index_code: str,
        level: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        latest: Optional[int] = None,
    ) -> int:
        """
        获取并存储指数历史分时KDJ数据。

        Args:
            index_code (str): 指数代码，如 "000001.SH"。
            level (str): 分时级别，如 5/15/30/60/d/w/m/y。
            start_date (Optional[str]): 开始时间 YYYYMMDD 或 YYYYMMDDhhmmss。
            end_date (Optional[str]): 结束时间 YYYYMMDD 或 YYYYMMDDhhmmss。
            latest (Optional[int]): 最新条数（lt）。

        Returns:
            int: 成功存储的记录数。

        API接口: http://api.mairuiapi.com/hsindex/history/kdj/指数代码(如000001.SH)/分时级别(如d)/您的licence?st=开始时间&et=结束时间&lt=最新条数
        """
        data = self.fetch_history_kdj(index_code, level, start_date, end_date, latest)
        if not data:
            logger.warning(f"未获取到指数历史分时KDJ数据，指数代码: {index_code}")
            return 0
        try:
            with get_db_context() as session:
                return bulk_insert(session, IndexHistoryKdj, data, ignore_duplicates=True)
        except Exception as e:
            error_msg = f"存储指数历史分时KDJ数据失败: {str(e)}"
            logger.error(error_msg)
            raise DatabaseException(error_msg, "SAVE_INDEX_HISTORY_KDJ_ERROR")

