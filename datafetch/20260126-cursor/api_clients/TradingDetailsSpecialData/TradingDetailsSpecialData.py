"""
交易明细-特殊数据API客户端。

该模块提供交易明细特殊数据相关的API接口，包括：
- 资金流向数据
- 当天逐笔交易
- 历史涨跌停价格
"""

from typing import List, Dict, Any, Optional
import requests
from datetime import datetime

from config.settings import settings
from config.database import get_db_context
from core.exceptions import APIException, DatabaseException, ValidationException
from utils.logger import get_logger
from utils.db_utils import bulk_insert
from utils.date_utils import datetime_str_to_timestamp
from api_clients.TradingDetailsSpecialData.TradingDetailsSpecialData_table import (
    StockMoneyFlow,
    TodayTickTrade,
    StopPriceHistory,
)

logger = get_logger("api_clients.TradingDetailsSpecialData")


class TradingDetailsSpecialData:
    """交易明细-特殊数据API客户端类。"""

    BASE_URL = "http://api.mairuiapi.com"

    def __init__(self, license_key: Optional[str] = None):
        """
        初始化交易明细-特殊数据API客户端。

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

    def fetch_money_flow(
        self,
        stock_code: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        limit: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        """
        获取资金流向数据。

        Args:
            stock_code (str): 股票代码，如"000001"。
            start_date (Optional[str]): 开始时间，格式YYYYMMDD，如"20240101"，默认为None。
            end_date (Optional[str]): 结束时间，格式YYYYMMDD，如"20241231"，默认为None。
            limit (Optional[int]): 最新条数，如10表示获取最新的10条数据，默认为None。

        Returns:
            List[Dict[str, Any]]: 资金流向数据列表。

        Raises:
            ValidationException: 如果参数验证失败。
            APIException: 如果API请求失败。

        API接口: http://api.mairuiapi.com/hsstock/history/transaction/股票代码(如000001)/您的licence?st=开始时间&et=结束时间&lt=最新条数
        """
        if not stock_code:
            raise ValidationException("股票代码不能为空", "STOCK_CODE_EMPTY")

        url = f"{self.BASE_URL}/hsstock/history/transaction/{stock_code}/{self.license_key}"
        params = []
        if start_date:
            params.append(f"st={start_date}")
        if end_date:
            params.append(f"et={end_date}")
        if limit:
            params.append(f"lt={limit}")

        if params:
            url += "?" + "&".join(params)

        data = self._make_request(url)

        # 数据字段映射（API返回的字段名都是小写）
        result = []
        for item in data:
            # 处理 t 字段：如果是日期时间字符串，转换为时间戳（BIGINT）
            t_value = item.get("t")
            if t_value:
                if isinstance(t_value, str):
                    # 尝试解析日期时间字符串并转换为时间戳
                    try:
                        # 支持多种日期时间格式
                        if " " in t_value:
                            # 格式：YYYY-MM-DD HH:MM:SS
                            t_value = datetime_str_to_timestamp(t_value, "%Y-%m-%d %H:%M:%S")
                        elif len(t_value) == 10:
                            # 格式：YYYY-MM-DD
                            t_value = datetime_str_to_timestamp(t_value + " 00:00:00", "%Y-%m-%d %H:%M:%S")
                        else:
                            # 尝试其他常见格式
                            t_value = datetime_str_to_timestamp(t_value, "%Y-%m-%d %H:%M:%S")
                    except (ValueError, TypeError):
                        # 如果解析失败，尝试作为整数（可能已经是时间戳）
                        try:
                            t_value = int(t_value)
                        except (ValueError, TypeError):
                            logger.warning(f"无法解析时间字段 t: {t_value}")
                            t_value = None
                elif isinstance(t_value, (int, float)):
                    # 如果已经是数字，转换为整数
                    t_value = int(t_value)
                # 如果是 None，保持 None

            mapped_item = {
                "dm": item.get("dm", stock_code),
                "t": t_value,
                "zmbzds": item.get("zmbzds"),
                "zmszds": item.get("zmszds"),
                "dddx": item.get("dddx"),
                "zddy": item.get("zddy"),
                "ddcf": item.get("Ddcf") or item.get("ddcf"),  # API可能返回Ddcf或ddcf
                "zmbzdszl": item.get("zmbzdszl"),
                "zmszdszl": item.get("zmszdszl"),
                "cjbszl": item.get("cjbszl"),
                "zmbtdcje": item.get("zmbtdcje"),
                "zmbddcje": item.get("zmbddcje"),
                "zmbzdcje": item.get("zmbzdcje"),
                "zmbxdcje": item.get("zmbxdcje"),
                "zmbljcje": item.get("zmbljcje"),
                "zmstdcje": item.get("zmstdcje"),
                "zmsddcje": item.get("zmsddcje"),
                "zmszdcje": item.get("zmszdcje"),
                "zmsxdcje": item.get("zmsxdcje"),
                "zmsljcje": item.get("zmsljcje"),
                "bdmbtdcje": item.get("bdmbtdcje"),
                "bdmbddcje": item.get("bdmbddcje"),
                "bdmbzdcje": item.get("bdmbzdcje"),
                "bdmbxdcje": item.get("bdmbxdcje"),
                "bdmbljcje": item.get("bdmbljcje"),
                "bdmstdcje": item.get("bdmstdcje"),
                "bdmsddcje": item.get("bdmsddcje"),
                "bdmszdcje": item.get("bdmszdcje"),
                "bdmsxdcje": item.get("bdmsxdcje"),
                "bdmsljcje": item.get("bdmsljcje"),
                "jlrcdcje": item.get("jlrcdcje"),
                "jlrddcje": item.get("jlrddcje"),
                "jlrzdcje": item.get("jlrzdcje"),
                "jlrxdcje": item.get("jlrxdcje"),
                "zmbtdcjl": item.get("zmbtdcjl"),
                "zmbddcjl": item.get("zmbddcjl"),
                "zmbzdcjl": item.get("zmbzdcjl"),
                "zmbxdcjl": item.get("zmbxdcjl"),
                "zmbljcjl": item.get("zmbljcjl"),
                "zmstdcjl": item.get("zmstdcjl"),
                "zmsddcjl": item.get("zmsddcjl"),
                "zmszdcjl": item.get("zmszdcjl"),
                "zmsxdcjl": item.get("zmsxdcjl"),
                "zmsljcjl": item.get("zmsljcjl"),
                "bdmbtdcjl": item.get("bdmbtdcjl"),
                "bdmbddcjl": item.get("bdmbddcjl"),
                "bdmbzdcjl": item.get("bdmbzdcjl"),
                "bdmbxdcjl": item.get("bdmbxdcjl"),
                "bdmbljcjl": item.get("bdmbljcjl"),
                "bdmstdcjl": item.get("bdmstdcjl"),
                "bdmsddcjl": item.get("bdmsddcjl"),
                "bdmszdcjl": item.get("bdmszdcjl"),
                "bdmsxdcjl": item.get("bdmsxdcjl"),
                "bdmsljcjl": item.get("bdmsljcjl"),
                "jlrcdcjl": item.get("jlrcdcjl"),
                "jlrddcjl": item.get("jlrddcjl"),
                "jlrzdcjl": item.get("jlrzdcjl"),
                "jlrxdcjl": item.get("jlrxdcjl"),
                "zmbtdcjzl": item.get("zmbtdcjzl"),
                "zmbddcjzl": item.get("zmbddcjzl"),
                "zmbzdcjzl": item.get("zmbzdcjzl"),
                "zmbxdcjzl": item.get("zmbxdcjzl"),
                "zmbljcjzl": item.get("zmbljcjzl"),
                "zmstdcjzl": item.get("zmstdcjzl"),
                "zmsddcjzl": item.get("zmsddcjzl") or item.get("Zmsddcjzl"),
                "zmszdcjzl": item.get("zmszdcjzl"),
                "zmsxdcjzl": item.get("zmsxdcjzl"),
                "zmsljcjzl": item.get("zmsljcjzl"),
                "bdmbtdcjzl": item.get("bdmbtdcjzl"),
                "bdmbddcjzl": item.get("bdmbddcjzl"),
                "bdmbzdcjzl": item.get("bdmbzdcjzl"),
                "bdmbxdcjzl": item.get("bdmbxdcjzl"),
                "bdmbljcjzl": item.get("bdmbljcjzl"),
                "bdmstdcjzl": item.get("bdmstdcjzl"),
                "bdmsddcjzl": item.get("bdmsddcjzl"),
                "bdmszdcjzl": item.get("bdmszdcjzl"),
                "bdmsxdcjzl": item.get("bdmsxdcjzl"),
                "bdmsljcjzl": item.get("bdmsljcjzl") or item.get("Bdmsljcjzl"),
                "jlrcdcjzl": item.get("jlrcdcjzl"),
                "jlrddcjzl": item.get("jlrddcjzl"),
                "jlrzdcjzl": item.get("jlrzdcjzl"),
                "jlrxdcjzl": item.get("jlrxdcjzl"),
                "zmbtdcjzlv": item.get("zmbtdcjzlv"),
                "zmbddcjzlv": item.get("zmbddcjzlv"),
                "zmbzdcjzlv": item.get("zmbzdcjzlv"),
                "zmbxdcjzlv": item.get("zmbxdcjzlv"),
                "zmbljcjzlv": item.get("zmbljcjzlv"),
                "zmstdcjzlv": item.get("zmstdcjzlv"),
                "zmsddcjzlv": item.get("zmsddcjzlv"),
                "zmszdcjzlv": item.get("zmszdcjzlv"),
                "zmsxdcjzlv": item.get("zmsxdcjzlv"),
                "zmsljcjzlv": item.get("zmsljcjzlv"),
                "bdmbtdcjzlv": item.get("bdmbtdcjzlv"),
                "bdmbddcjzlv": item.get("bdmbddcjzlv"),
                "bdmbzdcjzlv": item.get("bdmbzdcjzlv"),
                "bdmbxdcjzlv": item.get("bdmbxdcjzlv"),
                "bdmbljcjzlv": item.get("bdmbljcjzlv") or item.get("Bdmbljcjzlv"),
                "bdmstdcjzlv": item.get("bdmstdcjzlv"),
                "bdmsddcjzlv": item.get("bdmsddcjzlv"),
                "bdmszdcjzlv": item.get("bdmszdcjzlv"),
                "bdmsxdcjzlv": item.get("bdmsxdcjzlv"),
                "bdmsljcjzlv": item.get("bdmsljcjzlv"),
            }
            result.append(mapped_item)

        return result

    def fetch_and_save_money_flow(
        self,
        stock_code: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        limit: Optional[int] = None,
    ) -> int:
        """
        获取并存储资金流向数据。

        Args:
            stock_code (str): 股票代码，如"000001"。
            start_date (Optional[str]): 开始时间，格式YYYYMMDD，如"20240101"，默认为None。
            end_date (Optional[str]): 结束时间，格式YYYYMMDD，如"20241231"，默认为None。
            limit (Optional[int]): 最新条数，如10表示获取最新的10条数据，默认为None。

        Returns:
            int: 成功存储的记录数。

        Raises:
            ValidationException: 如果参数验证失败。
            APIException: 如果API请求失败。
            DatabaseException: 如果数据库操作失败。

        API接口: http://api.mairuiapi.com/hsstock/history/transaction/股票代码(如000001)/您的licence?st=开始时间&et=结束时间&lt=最新条数
        """
        data = self.fetch_money_flow(stock_code, start_date, end_date, limit)
        if not data:
            logger.warning(f"未获取到资金流向数据，股票代码: {stock_code}")
            return 0

        try:
            with get_db_context() as session:
                # StockMoneyFlow 表字段较多（约70+个），使用较小的 batch_size 以避免 SQL 编译时间过长
                # 每个批次约 5 条记录，每条记录约 70 个字段，总共约 350 个参数，在可接受范围内
                count = bulk_insert(session, StockMoneyFlow, data, ignore_duplicates=True, batch_size=5)
                logger.info(f"成功存储 {count} 条资金流向数据，股票代码: {stock_code}")
                return count
        except Exception as e:
            error_msg = f"存储资金流向数据失败: {str(e)}"
            logger.error(error_msg)
            raise DatabaseException(error_msg, "SAVE_MONEY_FLOW_ERROR")

    def fetch_today_tick_trade(self, stock_code: str) -> List[Dict[str, Any]]:
        """
        获取当天逐笔交易数据。

        Args:
            stock_code (str): 股票代码，如"000001"。

        Returns:
            List[Dict[str, Any]]: 当天逐笔交易数据列表。

        Raises:
            ValidationException: 如果参数验证失败。
            APIException: 如果API请求失败。

        API接口: http://api.mairuiapi.com/hsrl/zbjy/股票代码(如000001)/您的licence
        """
        if not stock_code:
            raise ValidationException("股票代码不能为空", "STOCK_CODE_EMPTY")

        url = f"{self.BASE_URL}/hsrl/zbjy/{stock_code}/{self.license_key}"
        data = self._make_request(url)

        # 数据字段映射
        result = []
        for item in data:
            mapped_item = {
                "dm": item.get("dm", stock_code),
                "d": item.get("d", ""),
                "t": item.get("t", ""),
                "v": item.get("v"),
                "p": item.get("p"),
                "ts": item.get("ts"),
            }
            result.append(mapped_item)

        return result

    def fetch_and_save_today_tick_trade(self, stock_code: str) -> int:
        """
        获取并存储当天逐笔交易数据。

        Args:
            stock_code (str): 股票代码，如"000001"。

        Returns:
            int: 成功存储的记录数。

        Raises:
            ValidationException: 如果参数验证失败。
            APIException: 如果API请求失败。
            DatabaseException: 如果数据库操作失败。

        API接口: http://api.mairuiapi.com/hsrl/zbjy/股票代码(如000001)/您的licence
        """
        data = self.fetch_today_tick_trade(stock_code)
        if not data:
            logger.warning(f"未获取到当天逐笔交易数据，股票代码: {stock_code}")
            return 0

        try:
            with get_db_context() as session:
                count = bulk_insert(session, TodayTickTrade, data, ignore_duplicates=True)
                logger.info(f"成功存储 {count} 条当天逐笔交易数据，股票代码: {stock_code}")
                return count
        except Exception as e:
            error_msg = f"存储当天逐笔交易数据失败: {str(e)}"
            logger.error(error_msg)
            raise DatabaseException(error_msg, "SAVE_TODAY_TICK_TRADE_ERROR")

    def fetch_stop_price_history(
        self,
        stock_code: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        获取历史涨跌停价格数据。

        Args:
            stock_code (str): 股票代码，如"000001.SZ"。
            start_date (Optional[str]): 开始时间，格式YYYYMMDD，如"20240101"，默认为None。
            end_date (Optional[str]): 结束时间，格式YYYYMMDD，如"20241231"，默认为None。

        Returns:
            List[Dict[str, Any]]: 历史涨跌停价格数据列表。

        Raises:
            ValidationException: 如果参数验证失败。
            APIException: 如果API请求失败。

        API接口: http://api.mairuiapi.com/hsstock/stopprice/history/股票代码（如000001.SZ）/您的licence?st=开始时间&et=结束时间
        """
        if not stock_code:
            raise ValidationException("股票代码不能为空", "STOCK_CODE_EMPTY")

        url = f"{self.BASE_URL}/hsstock/stopprice/history/{stock_code}/{self.license_key}"
        params = []
        if start_date:
            params.append(f"st={start_date}")
        if end_date:
            params.append(f"et={end_date}")

        if params:
            url += "?" + "&".join(params)

        data = self._make_request(url)

        # 数据字段映射
        result = []
        for item in data:
            mapped_item = {
                "dm": item.get("dm", stock_code),
                "t": item.get("t", ""),
                "h": item.get("h"),
                "l": item.get("l"),
            }
            result.append(mapped_item)

        return result

    def fetch_and_save_stop_price_history(
        self,
        stock_code: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> int:
        """
        获取并存储历史涨跌停价格数据。

        Args:
            stock_code (str): 股票代码，如"000001.SZ"。
            start_date (Optional[str]): 开始时间，格式YYYYMMDD，如"20240101"，默认为None。
            end_date (Optional[str]): 结束时间，格式YYYYMMDD，如"20241231"，默认为None。

        Returns:
            int: 成功存储的记录数。

        Raises:
            ValidationException: 如果参数验证失败。
            APIException: 如果API请求失败。
            DatabaseException: 如果数据库操作失败。

        API接口: http://api.mairuiapi.com/hsstock/stopprice/history/股票代码（如000001.SZ）/您的licence?st=开始时间&et=结束时间
        """
        data = self.fetch_stop_price_history(stock_code, start_date, end_date)
        if not data:
            logger.warning(f"未获取到历史涨跌停价格数据，股票代码: {stock_code}")
            return 0

        try:
            with get_db_context() as session:
                count = bulk_insert(session, StopPriceHistory, data, ignore_duplicates=True)
                logger.info(f"成功存储 {count} 条历史涨跌停价格数据，股票代码: {stock_code}")
                return count
        except Exception as e:
            error_msg = f"存储历史涨跌停价格数据失败: {str(e)}"
            logger.error(error_msg)
            raise DatabaseException(error_msg, "SAVE_STOP_PRICE_HISTORY_ERROR")

