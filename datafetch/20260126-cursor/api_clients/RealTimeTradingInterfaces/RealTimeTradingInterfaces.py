"""
实时交易接口API客户端。

该模块提供实时交易相关的API接口，包括：
- 实时交易数据（全部 券商数据源）
- 实时交易数据（全部 网络数据源）
- 实时交易数据（券商数据源）
- 实时交易数据（多股）
- 实时交易数据（网络数据源）
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional, Sequence

import requests

from config.database import get_db_context
from config.settings import settings
from core.exceptions import APIException, DatabaseException, ValidationException
from utils.db_utils import bulk_insert
from utils.logger import get_logger

from api_clients.RealTimeTradingInterfaces.RealTimeTradingInterfaces_table import (
    RealTimeTradingAllBroker,
    RealTimeTradingAllNetwork,
    RealTimeTradingBroker,
    RealTimeTradingMultiStock,
    RealTimeTradingNetwork,
)

logger = get_logger("api_clients.RealTimeTradingInterfaces")


class RealTimeTradingInterfaces:
    """实时交易接口API客户端类。"""

    API_BASE_URL = "http://api.mairuiapi.com"
    ALL_API_BASE_URL = "http://a.mairuiapi.com"

    def __init__(self, license_key: Optional[str] = None) -> None:
        """
        初始化实时交易接口API客户端。

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

    def _require_stock_code(self, stock_code: str) -> None:
        """
        校验股票代码参数。

        Args:
            stock_code (str): 股票代码。

        Raises:
            ValidationException: 如果股票代码为空。

        API接口: 无
        """
        if not stock_code:
            raise ValidationException("股票代码不能为空", "STOCK_CODE_EMPTY")

    def _require_dm_and_t(
        self,
        item: Dict[str, Any],
        context: str,
        *,
        allow_missing_dm: bool = False,
    ) -> None:
        """
        校验返回数据中是否包含主键字段。

        Args:
            item (Dict[str, Any]): 单条返回数据。
            context (str): 校验上下文提示信息。
            allow_missing_dm (bool): 是否允许缺少dm字段（仅在外部已提供dm时使用）。

        Raises:
            ValidationException: 如果dm或t缺失。

        API接口: 无
        """
        if not allow_missing_dm and not item.get("dm"):
            raise ValidationException(f"返回数据缺少主键字段dm: {context}", "MISSING_PRIMARY_KEY_DM")
        if not item.get("t"):
            raise ValidationException(f"返回数据缺少主键字段t: {context}", "MISSING_PRIMARY_KEY_T")

    def _map_broker_item(self, item: Dict[str, Any], default_dm: Optional[str] = None) -> Dict[str, Any]:
        """
        映射券商数据源字段到表模型字段。

        Args:
            item (Dict[str, Any]): API返回的单条数据。
            default_dm (Optional[str]): 当返回数据不包含dm时使用的默认股票代码。

        Returns:
            Dict[str, Any]: 映射后的数据。

        API接口: 无
        """
        allow_missing_dm = default_dm is not None
        self._require_dm_and_t(item, "券商数据源", allow_missing_dm=allow_missing_dm)
        dm_value = item.get("dm") or default_dm
        if not dm_value:
            raise ValidationException("无法确定返回数据的股票代码dm", "MISSING_PRIMARY_KEY_DM")
        return {
            "dm": dm_value,
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

    def _map_network_item(self, item: Dict[str, Any]) -> Dict[str, Any]:
        """
        映射网络数据源字段到表模型字段。

        Args:
            item (Dict[str, Any]): API返回的单条数据。

        Returns:
            Dict[str, Any]: 映射后的数据。

        API接口: 无
        """
        self._require_dm_and_t(item, "网络数据源")
        return {
            "dm": item.get("dm"),
            "fm": item.get("fm"),
            "h": item.get("h"),
            "hs": item.get("hs"),
            "lb": item.get("lb"),
            "l": item.get("l"),
            "lt": item.get("lt"),
            "o": item.get("o"),
            "pe": item.get("pe"),
            "pc": item.get("pc"),
            "p": item.get("p"),
            "sz": item.get("sz"),
            "cje": item.get("cje"),
            "ud": item.get("ud"),
            "v": item.get("v"),
            "yc": item.get("yc"),
            "zf": item.get("zf"),
            "zs": item.get("zs"),
            "sjl": item.get("sjl"),
            "zdf60": item.get("zdf60"),
            "zdfnc": item.get("zdfnc"),
            "t": item.get("t"),
        }

    def fetch_realtime_trading_all_broker(self) -> List[Dict[str, Any]]:
        """
        获取实时交易数据（全部 券商数据源）。

        Returns:
            List[Dict[str, Any]]: 实时交易数据列表。

        Raises:
            APIException: 如果API请求失败。

        API接口: http://a.mairuiapi.com/hsrl/ssjy/all/您的licence
        """
        url = f"{self.ALL_API_BASE_URL}/hsrl/ssjy/all/{self.license_key}"
        data = self._make_request(url)
        return [self._map_broker_item(item) for item in data]

    def fetch_and_save_realtime_trading_all_broker(self) -> int:
        """
        获取并存储实时交易数据（全部 券商数据源）。

        Returns:
            int: 成功存储的记录数。

        Raises:
            APIException: 如果API请求失败。
            DatabaseException: 如果数据库操作失败。

        API接口: http://a.mairuiapi.com/hsrl/ssjy/all/您的licence
        """
        data = self.fetch_realtime_trading_all_broker()
        if not data:
            logger.warning("未获取到实时交易数据（全部 券商数据源）")
            return 0

        try:
            with get_db_context() as session:
                return bulk_insert(session, RealTimeTradingAllBroker, data, ignore_duplicates=True)
        except Exception as e:
            error_msg = f"存储实时交易数据（全部 券商数据源）失败: {str(e)}"
            logger.error(error_msg)
            raise DatabaseException(error_msg, "SAVE_REALTIME_TRADING_ALL_BROKER_ERROR")

    def fetch_realtime_trading_all_network(self) -> List[Dict[str, Any]]:
        """
        获取实时交易数据（全部 网络数据源）。

        Returns:
            List[Dict[str, Any]]: 实时交易数据列表。

        Raises:
            APIException: 如果API请求失败。

        API接口: http://a.mairuiapi.com/hsrl/real/all/您的licence
        """
        url = f"{self.ALL_API_BASE_URL}/hsrl/real/all/{self.license_key}"
        data = self._make_request(url)
        return [self._map_network_item(item) for item in data]

    def fetch_and_save_realtime_trading_all_network(self) -> int:
        """
        获取并存储实时交易数据（全部 网络数据源）。

        Returns:
            int: 成功存储的记录数。

        Raises:
            APIException: 如果API请求失败。
            DatabaseException: 如果数据库操作失败。

        API接口: http://a.mairuiapi.com/hsrl/real/all/您的licence
        """
        data = self.fetch_realtime_trading_all_network()
        if not data:
            logger.warning("未获取到实时交易数据（全部 网络数据源）")
            return 0

        try:
            with get_db_context() as session:
                return bulk_insert(session, RealTimeTradingAllNetwork, data, ignore_duplicates=True)
        except Exception as e:
            error_msg = f"存储实时交易数据（全部 网络数据源）失败: {str(e)}"
            logger.error(error_msg)
            raise DatabaseException(error_msg, "SAVE_REALTIME_TRADING_ALL_NETWORK_ERROR")

    def fetch_realtime_trading_broker(self, stock_code: str) -> List[Dict[str, Any]]:
        """
        获取实时交易数据（券商数据源）。

        Args:
            stock_code (str): 股票代码，如"000001"。

        Returns:
            List[Dict[str, Any]]: 实时交易数据列表。

        Raises:
            ValidationException: 如果参数验证失败。
            APIException: 如果API请求失败。

        API接口: http://api.mairuiapi.com/hsstock/real/time/股票代码/证书您的licence
        """
        self._require_stock_code(stock_code)
        url = f"{self.API_BASE_URL}/hsstock/real/time/{stock_code}/{self.license_key}"
        data = self._make_request(url)
        mapped: List[Dict[str, Any]] = []
        for item in data:
            item = dict(item)
            item.setdefault("dm", stock_code)
            mapped.append(self._map_broker_item(item, default_dm=stock_code))
        return mapped

    def fetch_and_save_realtime_trading_broker(self, stock_code: str) -> int:
        """
        获取并存储实时交易数据（券商数据源）。

        Args:
            stock_code (str): 股票代码，如"000001"。

        Returns:
            int: 成功存储的记录数。

        Raises:
            ValidationException: 如果参数验证失败。
            APIException: 如果API请求失败。
            DatabaseException: 如果数据库操作失败。

        API接口: http://api.mairuiapi.com/hsstock/real/time/股票代码/证书您的licence
        """
        data = self.fetch_realtime_trading_broker(stock_code)
        if not data:
            logger.warning(f"未获取到实时交易数据（券商数据源），股票代码: {stock_code}")
            return 0

        try:
            with get_db_context() as session:
                return bulk_insert(session, RealTimeTradingBroker, data, ignore_duplicates=True)
        except Exception as e:
            error_msg = f"存储实时交易数据（券商数据源）失败: {str(e)}"
            logger.error(error_msg)
            raise DatabaseException(error_msg, "SAVE_REALTIME_TRADING_BROKER_ERROR")

    def fetch_realtime_trading_network(self, stock_code: str) -> List[Dict[str, Any]]:
        """
        获取实时交易数据（网络数据源）。

        Args:
            stock_code (str): 股票代码，如"000001"。

        Returns:
            List[Dict[str, Any]]: 实时交易数据列表。

        Raises:
            ValidationException: 如果参数验证失败。
            APIException: 如果API请求失败。

        API接口: http://api.mairuiapi.com/hsrl/ssjy/股票代码(如000001)/您的licence
        """
        self._require_stock_code(stock_code)
        url = f"{self.API_BASE_URL}/hsrl/ssjy/{stock_code}/{self.license_key}"
        data = self._make_request(url)
        mapped: List[Dict[str, Any]] = []
        for item in data:
            item = dict(item)
            item.setdefault("dm", stock_code)
            mapped.append(self._map_network_item(item))
        return mapped

    def fetch_and_save_realtime_trading_network(self, stock_code: str) -> int:
        """
        获取并存储实时交易数据（网络数据源）。

        Args:
            stock_code (str): 股票代码，如"000001"。

        Returns:
            int: 成功存储的记录数。

        Raises:
            ValidationException: 如果参数验证失败。
            APIException: 如果API请求失败。
            DatabaseException: 如果数据库操作失败。

        API接口: http://api.mairuiapi.com/hsrl/ssjy/股票代码(如000001)/您的licence
        """
        data = self.fetch_realtime_trading_network(stock_code)
        if not data:
            logger.warning(f"未获取到实时交易数据（网络数据源），股票代码: {stock_code}")
            return 0

        try:
            with get_db_context() as session:
                return bulk_insert(session, RealTimeTradingNetwork, data, ignore_duplicates=True)
        except Exception as e:
            error_msg = f"存储实时交易数据（网络数据源）失败: {str(e)}"
            logger.error(error_msg)
            raise DatabaseException(error_msg, "SAVE_REALTIME_TRADING_NETWORK_ERROR")

    def fetch_realtime_trading_multi_stock(self, stock_codes: Sequence[str]) -> List[Dict[str, Any]]:
        """
        获取实时交易数据（多股）。

        Args:
            stock_codes (Sequence[str]): 股票代码列表，最多20只。

        Returns:
            List[Dict[str, Any]]: 实时交易数据列表。

        Raises:
            ValidationException: 如果参数验证失败。
            APIException: 如果API请求失败。

        API接口: http://api.mairuiapi.com/hsrl/ssjy_more/您的licence?stock_codes=股票代码1,股票代码2……股票代码20
        """
        if not stock_codes:
            raise ValidationException("股票代码列表不能为空", "STOCK_CODES_EMPTY")
        if len(stock_codes) > 20:
            raise ValidationException("股票代码列表最多支持20只股票", "STOCK_CODES_TOO_MANY")
        for code in stock_codes:
            if not code:
                raise ValidationException("股票代码列表包含空值", "STOCK_CODE_EMPTY")

        codes_param = ",".join(stock_codes)
        url = f"{self.API_BASE_URL}/hsrl/ssjy_more/{self.license_key}?stock_codes={codes_param}"
        data = self._make_request(url)

        mapped: List[Dict[str, Any]] = []
        if not data:
            return []

        # 该接口文档说明字段中未包含dm；若实际返回也缺少dm，则按请求传入的顺序补齐dm。
        has_dm = any(isinstance(item, dict) and item.get("dm") for item in data)
        if has_dm:
            for item in data:
                mapped.append(self._map_broker_item(item))
            return mapped

        if len(data) != len(stock_codes):
            raise ValidationException(
                "多股接口返回条数与传入股票代码数量不一致，无法按顺序补齐dm",
                "MULTI_STOCK_LENGTH_MISMATCH",
            )

        for idx, item in enumerate(data):
            default_dm = stock_codes[idx]
            mapped.append(self._map_broker_item(item, default_dm=default_dm))
        return mapped

    def fetch_and_save_realtime_trading_multi_stock(self, stock_codes: Sequence[str]) -> int:
        """
        获取并存储实时交易数据（多股）。

        Args:
            stock_codes (Sequence[str]): 股票代码列表，最多20只。

        Returns:
            int: 成功存储的记录数。

        Raises:
            ValidationException: 如果参数验证失败。
            APIException: 如果API请求失败。
            DatabaseException: 如果数据库操作失败。

        API接口: http://api.mairuiapi.com/hsrl/ssjy_more/您的licence?stock_codes=股票代码1,股票代码2……股票代码20
        """
        data = self.fetch_realtime_trading_multi_stock(stock_codes)
        if not data:
            logger.warning(f"未获取到实时交易数据（多股），股票代码: {','.join(stock_codes)}")
            return 0

        try:
            with get_db_context() as session:
                return bulk_insert(session, RealTimeTradingMultiStock, data, ignore_duplicates=True)
        except Exception as e:
            error_msg = f"存储实时交易数据（多股）失败: {str(e)}"
            logger.error(error_msg)
            raise DatabaseException(error_msg, "SAVE_REALTIME_TRADING_MULTI_STOCK_ERROR")


