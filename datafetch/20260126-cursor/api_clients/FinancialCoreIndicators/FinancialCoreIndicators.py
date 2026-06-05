"""
财务核心指标API客户端。

该模块提供财务核心指标相关的API接口，包括：
- 财务主要指标
- 财务指标
- 近年业绩预告
"""

from typing import List, Dict, Any, Optional
import requests
from datetime import datetime

from config.settings import settings
from config.database import get_db_context
from core.exceptions import APIException, DatabaseException, ValidationException
from utils.logger import get_logger
from utils.db_utils import bulk_insert
from utils.data_utils import clean_numeric_to_none
from api_clients.FinancialCoreIndicators.FinancialCoreIndicators_table import (
    FinancialMainIndicators,
    FinancialIndicators,
    PerformanceForecast,
)

logger = get_logger("api_clients.FinancialCoreIndicators")


class FinancialCoreIndicators:
    """财务核心指标API客户端类。"""

    BASE_URL = "http://api.mairuiapi.com"

    def __init__(self, license_key: Optional[str] = None):
        """
        初始化财务核心指标API客户端。

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

    def fetch_financial_main_indicators(
        self,
        stock_code: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        获取财务主要指标数据。

        Args:
            stock_code (str): 股票代码，如"000001.SZ"。
            start_date (Optional[str]): 开始时间，格式YYYYMMDD，如"20240101"，默认为None。
            end_date (Optional[str]): 结束时间，格式YYYYMMDD，如"20241231"，默认为None。

        Returns:
            List[Dict[str, Any]]: 财务主要指标数据列表。

        Raises:
            ValidationException: 如果参数验证失败。
            APIException: 如果API请求失败。

        API接口: http://api.mairuiapi.com/hsstock/financial/pershareindex/股票代码（如000001.SZ）/您的licence?st=开始时间&et=结束时间
        """
        if not stock_code:
            raise ValidationException("股票代码不能为空", "STOCK_CODE_EMPTY")

        url = f"{self.BASE_URL}/hsstock/financial/pershareindex/{stock_code}/{self.license_key}"
        params = []
        if start_date:
            params.append(f"st={start_date}")
        if end_date:
            params.append(f"et={end_date}")

        if params:
            url += "?" + "&".join(params)

        data = self._make_request(url)

        # 数据字段映射和清理
        result = []
        for item in data:
            mapped_item = {
                "dm": item.get("dm", stock_code),
                "jzrq": item.get("jzrq", ""),
                "plrq": item.get("plrq", ""),
                "mgjyhdxjl": clean_numeric_to_none(item.get("Mgjyhdxjl")),
                "mgjzc": clean_numeric_to_none(item.get("mgjzc")),
                "jbmgsy": clean_numeric_to_none(item.get("jbmgsy")),
                "xsmgsy": clean_numeric_to_none(item.get("xsmgsy")),
                "mgwfplr": clean_numeric_to_none(item.get("mgwfplr")),
                "mgzbgjj": clean_numeric_to_none(item.get("mgzbgjj")),
                "kfmgsy": clean_numeric_to_none(item.get("kfmgsy")),
                "jzcsyl": clean_numeric_to_none(item.get("jzcsyl")),
                "xsmlv": clean_numeric_to_none(item.get("xsmlv")),
                "zyyrsrzz": clean_numeric_to_none(item.get("zyyrsrzz")),
                "jlrzz": clean_numeric_to_none(item.get("jlrzz")),
                "gsmgsyzzdjlrzz": clean_numeric_to_none(item.get("gsmgsyzzdjlrzz")),
                "kfjlrzz": clean_numeric_to_none(item.get("kfjlrzz")),
                "yyzsrgdhbzz": clean_numeric_to_none(item.get("yyzsrgdhbzz")),
                "sljlrjqhbzz": clean_numeric_to_none(item.get("sljlrjqhbzz")),
                "kfjlrgdhbzz": clean_numeric_to_none(item.get("kfjlrgdhbzz")),
                "jqjzcsyl": clean_numeric_to_none(item.get("jqjzcsyl")),
                "tbjzcsyl": clean_numeric_to_none(item.get("tbjzcsyl")),
                "tbzzcsyl": clean_numeric_to_none(item.get("tbzzcsyl")),
                "mlv": clean_numeric_to_none(item.get("mlv")),
                "jlv": clean_numeric_to_none(item.get("jlv")),
                "sjslv": clean_numeric_to_none(item.get("Sjslv")),
                "yskyysr": clean_numeric_to_none(item.get("yskyysr")),
                "xsxjlyysr": clean_numeric_to_none(item.get("xsxjlyysr")),
                "zcfzl": clean_numeric_to_none(item.get("zcfzl")),
                "chzzl": clean_numeric_to_none(item.get("chzzl")),
            }
            result.append(mapped_item)

        return result

    def fetch_and_save_financial_main_indicators(
        self,
        stock_code: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> int:
        """
        获取并存储财务主要指标数据。

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

        API接口: http://api.mairuiapi.com/hsstock/financial/pershareindex/股票代码（如000001.SZ）/您的licence?st=开始时间&et=结束时间
        """
        data = self.fetch_financial_main_indicators(stock_code, start_date, end_date)
        if not data:
            logger.warning(f"未获取到财务主要指标数据，股票代码: {stock_code}")
            return 0

        try:
            with get_db_context() as session:
                count = bulk_insert(session, FinancialMainIndicators, data, ignore_duplicates=True)
                logger.info(f"成功存储 {count} 条财务主要指标数据，股票代码: {stock_code}")
                return count
        except Exception as e:
            error_msg = f"存储财务主要指标数据失败: {str(e)}"
            logger.error(error_msg)
            raise DatabaseException(error_msg, "SAVE_FINANCIAL_MAIN_INDICATORS_ERROR")

    def fetch_financial_indicators(self, stock_code: str) -> List[Dict[str, Any]]:
        """
        获取财务指标数据。

        Args:
            stock_code (str): 股票代码，如"000001"。

        Returns:
            List[Dict[str, Any]]: 财务指标数据列表。

        Raises:
            ValidationException: 如果参数验证失败。
            APIException: 如果API请求失败。

        API接口: http://api.mairuiapi.com/hscp/cwzb/股票代码(如000001)/您的licence
        """
        if not stock_code:
            raise ValidationException("股票代码不能为空", "STOCK_CODE_EMPTY")

        url = f"{self.BASE_URL}/hscp/cwzb/{stock_code}/{self.license_key}"
        data = self._make_request(url)

        # 数据字段映射
        result = []
        for item in data:
            mapped_item = {
                "dm": item.get("dm", stock_code),
                "date": item.get("date", ""),
                "tbmg": item.get("tbmg"),
                "jqmg": item.get("jqmg"),
                "mgsy": item.get("mgsy"),
                "kfmg": item.get("kfmg"),
                "mgjz": item.get("Mgjz"),
                "mgjzad": item.get("mgjzad"),
                "mgjy": item.get("Mgjy"),
                "mggjj": item.get("mggjj"),
                "mgwly": item.get("mgwly"),
                "zclr": item.get("zclr"),
                "zylr": item.get("zylr"),
                "zzlr": item.get("zzlr"),
                "cblr": item.get("cblr"),
                "yylr": item.get("yylr"),
                "zycb": item.get("zycb"),
                "xsjl": item.get("xsjl"),
                "gbbc": item.get("gbbc"),
                "jzbc": item.get("jzbc"),
                "zcbc": item.get("zcbc"),
                "xsml": item.get("xsml"),
                "xxbz": item.get("xxbz"),
                "fzy": item.get("fzy"),
                "zybz": item.get("zybz"),
                "gxff": item.get("gxff"),
                "tzsy": item.get("tzsy"),
                "zyyw": item.get("zyyw"),
                "jzsy": item.get("jzsy"),
                "jqjz": item.get("jqjz"),
                "kflr": item.get("kflr"),
                "zysr": item.get("zysr"),
                "jlzz": item.get("Jlzz"),
                "jzzz": item.get("jzzz"),
                "zzzz": item.get("zzzz"),
                "yszz": item.get("yszz"),
                "yszzt": item.get("yszzt"),
                "chzz": item.get("chzz"),
                "chzzl": item.get("chzzl"),
                "gzzz": item.get("gzzz"),
                "zzzzl": item.get("zzzzl"),
                "zzzzt": item.get("zzzzt"),
                "ldzz": item.get("ldzz"),
                "ldzzt": item.get("ldzzt"),
                "gdzz": item.get("Gdzz"),
                "ldbl": item.get("ldbl"),
                "sdbl": item.get("Sdbl"),
                "xjbl": item.get("xjbl"),
                "lxzf": item.get("lxzf"),
                "zjbl": item.get("zjbl"),
                "gdqy": item.get("gdqy"),
                "cqfz": item.get("Cqfz"),
                "gdgd": item.get("Gdgd"),
                "fzqy": item.get("fzqy"),
                "zczjbl": item.get("zczjbl"),
                "zblv": item.get("zblv"),
                "gdzcjz": item.get("gdzcjz"),
                "zbgdh": item.get("zbgdh"),
                "cqbl": item.get("cqbl"),
                "qxjzb": item.get("qxjzb"),
                "gdzcbz": item.get("gdzcbz"),
                "zcfzl": item.get("zcfzl"),
                "zzc": item.get("zzc"),
                "jyxj": item.get("jyxj"),
                "zcjyxj": item.get("zcjyxj"),
                "jylrb": item.get("jylrb"),
                "jyfzl": item.get("jyfzl"),
                "xjlbl": item.get("xjlbl"),
                "dqgptz": item.get("dqgptz"),
                "dqzctz": item.get("dqzctz"),
                "dqjytz": item.get("dqjytz"),
                "qcgptz": item.get("qcgptz"),
                "cqzqtz": item.get("cqzqtz"),
                "cqjyxtz": item.get("cqjyxtz"),
                "yszk1": item.get("yszk1"),
                "yszk12": item.get("yszk12"),
                "yszk23": item.get("yszk23"),
                "yszk3": item.get("yszk3"),
                "yfhk1": item.get("yfhk1"),
                "yfhk12": item.get("yfhk12"),
                "yfhk23": item.get("yfhk23"),
                "yfhk3": item.get("yfhk3"),
                "ysk1": item.get("ysk1"),
                "ysk12": item.get("ysk12"),
                "ysk23": item.get("ysk23"),
                "ysk3": item.get("ysk3"),
            }
            result.append(mapped_item)

        return result

    def fetch_and_save_financial_indicators(self, stock_code: str) -> int:
        """
        获取并存储财务指标数据。

        Args:
            stock_code (str): 股票代码，如"000001"。

        Returns:
            int: 成功存储的记录数。

        Raises:
            ValidationException: 如果参数验证失败。
            APIException: 如果API请求失败。
            DatabaseException: 如果数据库操作失败。

        API接口: http://api.mairuiapi.com/hscp/cwzb/股票代码(如000001)/您的licence
        """
        data = self.fetch_financial_indicators(stock_code)
        if not data:
            logger.warning(f"未获取到财务指标数据，股票代码: {stock_code}")
            return 0

        try:
            with get_db_context() as session:
                count = bulk_insert(session, FinancialIndicators, data, ignore_duplicates=True)
                logger.info(f"成功存储 {count} 条财务指标数据，股票代码: {stock_code}")
                return count
        except Exception as e:
            error_msg = f"存储财务指标数据失败: {str(e)}"
            logger.error(error_msg)
            raise DatabaseException(error_msg, "SAVE_FINANCIAL_INDICATORS_ERROR")

    def fetch_performance_forecast(self, stock_code: str) -> List[Dict[str, Any]]:
        """
        获取近年业绩预告数据。

        Args:
            stock_code (str): 股票代码，如"000001"。

        Returns:
            List[Dict[str, Any]]: 近年业绩预告数据列表。

        Raises:
            ValidationException: 如果参数验证失败。
            APIException: 如果API请求失败。

        API接口: http://api.mairuiapi.com/hscp/yjyg/股票代码(如000001)/您的licence
        """
        if not stock_code:
            raise ValidationException("股票代码不能为空", "STOCK_CODE_EMPTY")

        url = f"{self.BASE_URL}/hscp/yjyg/{stock_code}/{self.license_key}"
        data = self._make_request(url)

        # 数据字段映射
        result = []
        for item in data:
            mapped_item = {
                "dm": item.get("dm", stock_code),
                "pdate": item.get("pdate", ""),
                "rdate": item.get("rdate", ""),
                "type": item.get("type"),
                "abs": item.get("abs"),
                "old": item.get("old"),
            }
            result.append(mapped_item)

        return result

    def fetch_and_save_performance_forecast(self, stock_code: str) -> int:
        """
        获取并存储近年业绩预告数据。

        Args:
            stock_code (str): 股票代码，如"000001"。

        Returns:
            int: 成功存储的记录数。

        Raises:
            ValidationException: 如果参数验证失败。
            APIException: 如果API请求失败。
            DatabaseException: 如果数据库操作失败。

        API接口: http://api.mairuiapi.com/hscp/yjyg/股票代码(如000001)/您的licence
        """
        data = self.fetch_performance_forecast(stock_code)
        if not data:
            logger.warning(f"未获取到近年业绩预告数据，股票代码: {stock_code}")
            return 0

        try:
            with get_db_context() as session:
                count = bulk_insert(session, PerformanceForecast, data, ignore_duplicates=True)
                logger.info(f"成功存储 {count} 条近年业绩预告数据，股票代码: {stock_code}")
                return count
        except Exception as e:
            error_msg = f"存储近年业绩预告数据失败: {str(e)}"
            logger.error(error_msg)
            raise DatabaseException(error_msg, "SAVE_PERFORMANCE_FORECAST_ERROR")

