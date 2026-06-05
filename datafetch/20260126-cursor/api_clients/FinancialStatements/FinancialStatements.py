"""
财务报表API客户端。

该模块提供财务报表相关的API接口，包括：
- 利润表
- 现金流量表
- 资产负债表
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

import requests

from config.database import get_db_context
from config.settings import settings
from core.exceptions import APIException, DatabaseException, ValidationException
from utils.data_utils import clean_numeric_to_none
from utils.db_utils import bulk_insert
from utils.logger import get_logger

from api_clients.FinancialStatements.FinancialStatements_table import (
    BalanceSheet,
    CashFlowStatement,
    IncomeStatement,
)

logger = get_logger("api_clients.FinancialStatements")


class FinancialStatements:
    """财务报表API客户端类。"""

    BASE_URL = "http://api.mairuiapi.com"

    def __init__(self, license_key: Optional[str] = None):
        """
        初始化财务报表API客户端。

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

    @staticmethod
    def _build_url(
        endpoint: str,
        stock_code: str,
        license_key: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> str:
        """
        构建带可选时间参数的URL。

        Args:
            endpoint (str): 接口路径（不含BASE_URL），如 "hsstock/financial/income"。
            stock_code (str): 股票代码，如 "000001.SZ"。
            license_key (str): license key。
            start_date (Optional[str]): 开始时间，YYYYMMDD。
            end_date (Optional[str]): 结束时间，YYYYMMDD。

        Returns:
            str: 完整请求URL。

        API接口: 无
        """
        base = f"{FinancialStatements.BASE_URL}/{endpoint}/{stock_code}/{license_key}"
        params: list[str] = []
        if start_date:
            params.append(f"st={start_date}")
        if end_date:
            params.append(f"et={end_date}")
        return base if not params else base + "?" + "&".join(params)

    def fetch_income_statement(
        self,
        stock_code: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        获取利润表数据。

        Args:
            stock_code (str): 股票代码，如 "000001.SZ"。
            start_date (Optional[str]): 开始时间，格式YYYYMMDD，如"20240101"，默认为None。
            end_date (Optional[str]): 结束时间，格式YYYYMMDD，如"20241231"，默认为None。

        Returns:
            List[Dict[str, Any]]: 利润表数据列表。

        Raises:
            ValidationException: 如果参数验证失败。
            APIException: 如果API请求失败。

        API接口: http://api.mairuiapi.com/hsstock/financial/income/股票代码（如000001.SZ）/您的licence?st=开始时间&et=结束时间
        """
        if not stock_code:
            raise ValidationException("股票代码不能为空", "STOCK_CODE_EMPTY")

        url = self._build_url(
            "hsstock/financial/income",
            stock_code,
            self.license_key,
            start_date,
            end_date,
        )
        data = self._make_request(url)

        result: list[dict[str, Any]] = []
        for item in data:
            mapped_item = {
                "dm": item.get("dm", stock_code),
                "jzrq": item.get("jzrq", ""),
                "plrq": item.get("plrq", ""),
                "yysr": clean_numeric_to_none(item.get("Yysr")),
                "yzbf": clean_numeric_to_none(item.get("yzbf")),
                "fdczssr": clean_numeric_to_none(item.get("fdczssr")),
                "yyzcb": clean_numeric_to_none(item.get("yyzcb")),
                "fdczscb": clean_numeric_to_none(item.get("fdczscb")),
                "yffy": clean_numeric_to_none(item.get("yffy")),
                "tbj": clean_numeric_to_none(item.get("tbj")),
                "pczjje": clean_numeric_to_none(item.get("pczjje")),
                "tqbxhtzbjje": clean_numeric_to_none(item.get("tqbxhtzbjje")),
                "bdhlzc": clean_numeric_to_none(item.get("bdhlzc")),
                "fbfy": clean_numeric_to_none(item.get("fbfy")),
                "gyjzbdsy": clean_numeric_to_none(item.get("gyjzbdsy")),
                "qhsy": clean_numeric_to_none(item.get("qhsy")),
                "tgsy": clean_numeric_to_none(item.get("tgsy")),
                "btsr": clean_numeric_to_none(item.get("btsr")),
                "qtywlr": clean_numeric_to_none(item.get("qtywlr")),
                "bhbfzhbqsljlr": clean_numeric_to_none(item.get("bhbfzhbqsljlr")),
                "lxsr": clean_numeric_to_none(item.get("lxsr")),
                "sxfjyjsr": clean_numeric_to_none(item.get("sxfjyjsr")),
                "sxfjyjzc": clean_numeric_to_none(item.get("sxfjyjzc")),
                "qtywcb": clean_numeric_to_none(item.get("qtywcb")),
                "hdsy": clean_numeric_to_none(item.get("hdsy")),
                "fldzcczsy": clean_numeric_to_none(item.get("fldzcczsy")),
                "sdsfy": clean_numeric_to_none(item.get("sdsfy")),
                "wqrtzss": clean_numeric_to_none(item.get("wqrtzss")),
                "gsmgsyzzdjlr": clean_numeric_to_none(item.get("gsmgsyzzdjlr")),
                "lxzc": clean_numeric_to_none(item.get("lxzc")),
                "qtywsr": clean_numeric_to_none(item.get("qtywsr")),
                "yyzsr": clean_numeric_to_none(item.get("yyzsr")),
                "yycb": clean_numeric_to_none(item.get("Yycb")),
                "yysjjfj": clean_numeric_to_none(item.get("yysjjfj")),
                "xsfy": clean_numeric_to_none(item.get("Xsfy")),
                "glfy": clean_numeric_to_none(item.get("glfy")),
                "cwfy": clean_numeric_to_none(item.get("Cwfy")),
                "zcjzss": clean_numeric_to_none(item.get("zcjzss")),
                "tzsy": clean_numeric_to_none(item.get("tzsy")),
                "lyqyhhhqydtzsy": clean_numeric_to_none(item.get("lyqyhhhqydtzsy")),
                "yylr": clean_numeric_to_none(item.get("yylr")),
                "ywsr": clean_numeric_to_none(item.get("Ywsr")),
                "ywzc": clean_numeric_to_none(item.get("ywzc")),
                "lze": clean_numeric_to_none(item.get("lze")),
                "jlr": clean_numeric_to_none(item.get("jlr")),
                "jlrhfcjcx": clean_numeric_to_none(item.get("jlrhfcjcx")),
                "ssgdsy": clean_numeric_to_none(item.get("ssgdsy")),
                "jbmgsy": clean_numeric_to_none(item.get("jbmgsy")),
                "xsmgsy": clean_numeric_to_none(item.get("xsmgsy")),
                "zhsyz": clean_numeric_to_none(item.get("zhsyz")),
                "gsssgdzhsyz": clean_numeric_to_none(item.get("gsssgdzhsyz")),
                "qtsy": clean_numeric_to_none(item.get("Qtsy")),
            }
            result.append(mapped_item)

        return result

    def fetch_and_save_income_statement(
        self,
        stock_code: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> int:
        """
        获取并存储利润表数据。

        Args:
            stock_code (str): 股票代码，如 "000001.SZ"。
            start_date (Optional[str]): 开始时间，格式YYYYMMDD，如"20240101"，默认为None。
            end_date (Optional[str]): 结束时间，格式YYYYMMDD，如"20241231"，默认为None。

        Returns:
            int: 成功存储的记录数。

        Raises:
            ValidationException: 如果参数验证失败。
            APIException: 如果API请求失败。
            DatabaseException: 如果数据库操作失败。

        API接口: http://api.mairuiapi.com/hsstock/financial/income/股票代码（如000001.SZ）/您的licence?st=开始时间&et=结束时间
        """
        data = self.fetch_income_statement(stock_code, start_date, end_date)
        if not data:
            logger.warning(f"未获取到利润表数据，股票代码: {stock_code}")
            return 0

        try:
            with get_db_context() as session:
                count = bulk_insert(session, IncomeStatement, data, ignore_duplicates=True)
                logger.info(f"成功存储 {count} 条利润表数据，股票代码: {stock_code}")
                return count
        except Exception as e:
            error_msg = f"存储利润表数据失败: {str(e)}"
            logger.error(error_msg)
            raise DatabaseException(error_msg, "SAVE_INCOME_STATEMENT_ERROR")

    def fetch_cashflow_statement(
        self,
        stock_code: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        获取现金流量表数据。

        Args:
            stock_code (str): 股票代码，如 "000001.SZ"。
            start_date (Optional[str]): 开始时间，格式YYYYMMDD，如"20240101"，默认为None。
            end_date (Optional[str]): 结束时间，格式YYYYMMDD，如"20241231"，默认为None。

        Returns:
            List[Dict[str, Any]]: 现金流量表数据列表。

        Raises:
            ValidationException: 如果参数验证失败。
            APIException: 如果API请求失败。

        API接口: http://api.mairuiapi.com/hsstock/financial/cashflow/股票代码（如000001.SZ）/您的licence?st=开始时间&et=结束时间
        """
        if not stock_code:
            raise ValidationException("股票代码不能为空", "STOCK_CODE_EMPTY")

        url = self._build_url(
            "hsstock/financial/cashflow",
            stock_code,
            self.license_key,
            start_date,
            end_date,
        )
        data = self._make_request(url)

        result: list[dict[str, Any]] = []
        for item in data:
            mapped_item = {
                "dm": item.get("dm", stock_code),
                "jzrq": item.get("jzrq", ""),
                "plrq": item.get("plrq", ""),
                "sdydbxbfqdxj": clean_numeric_to_none(item.get("sdydbxbfqdxj")),
                "sdzbxywxjjje": clean_numeric_to_none(item.get("sdzbxywxjjje")),
                "bhcjjtkkjzje": clean_numeric_to_none(item.get("bhcjjtkkjzje")),
                "czjyxjrzcjzje": clean_numeric_to_none(item.get("czjyxjrzcjzje")),
                "sqlxsxfjyjdxj": clean_numeric_to_none(item.get("sqlxsxfjyjdxj")),
                "hgywzjjzje": clean_numeric_to_none(item.get("hgywzjjzje")),
                "zfybxhtpfkxdj": clean_numeric_to_none(item.get("zfybxhtpfkxdj")),
                "zfbdhldxj": clean_numeric_to_none(item.get("zfbdhldxj")),
                "czfzgsjqtsddxj": clean_numeric_to_none(item.get("czfzgsjqtsddxj")),
                "jszyhdqckssddxj": clean_numeric_to_none(item.get("jszyhdqckssddxj")),
                "tzszfdxj": clean_numeric_to_none(item.get("tzszfdxj")),
                "zydkjzje": clean_numeric_to_none(item.get("zydkjzje")),
                "qdfzgsjqtywdwzfdxjje": clean_numeric_to_none(item.get("qdfzgsjqtywdwzfdxjje")),
                "zjzyhdqckszfdxj": clean_numeric_to_none(item.get("zjzyhdqckszfdxj")),
                "qzfzgsxrxj": clean_numeric_to_none(item.get("Qzfzgsxrxj")),
                "qz_fzgszfgsssgdglr": clean_numeric_to_none(item.get("qz:fzgszfgsssgdglr")),
                "ssgdsy": clean_numeric_to_none(item.get("ssgdsy")),
                "wqrdtzss": clean_numeric_to_none(item.get("wqrdtzss")),
                "dysyzj_j_js": clean_numeric_to_none(item.get("dysyzj(j:js)")),
                "yjfz": clean_numeric_to_none(item.get("yjfz")),
                "jxyyfxmdzj": clean_numeric_to_none(item.get("jxyyfxmdzj")),
                "ywgwswjskdjs_j_zj": clean_numeric_to_none(item.get("ywgwswjskdjs(j:zj)")),
                "yjswgwgdjz_j_js": clean_numeric_to_none(item.get("yjswgwgdjz(j:js)")),
                "xssptglwsddxj": clean_numeric_to_none(item.get("xssptglwsddxj")),
                "khckhtyckxkjzje": clean_numeric_to_none(item.get("khckhtyckxkjzje")),
                "xzyhyhkjzje": clean_numeric_to_none(item.get("xzyhyhkjzje")),
                "xtjrgjqjcrzjjzje": clean_numeric_to_none(item.get("xtjrgjqjcrzjjzje")),
                "sddsfyfh": clean_numeric_to_none(item.get("sddsfyfh")),
                "tzzfdxj": clean_numeric_to_none(item.get("tzzfdxj")),
                "sdqtyjyghdxj": clean_numeric_to_none(item.get("sdqtyjyghdxj")),
                "jyhdxjlrxj": clean_numeric_to_none(item.get("Jyhdxjlrxj")),
                "gmspjslwzfdxj": clean_numeric_to_none(item.get("gmspjslwzfdxj")),
                "khdkjdknzje": clean_numeric_to_none(item.get("khdkjdknzje")),
                "cfzyxhytckxkjzje": clean_numeric_to_none(item.get("cfzyxhytckxkjzje")),
                "zflxsxfjyjdxj": clean_numeric_to_none(item.get("zflxsxfjyjdxj")),
                "zfgzyjwzgzfdxj": clean_numeric_to_none(item.get("zfgzyjwzgzfdxj")),
                "zfdgxsf": clean_numeric_to_none(item.get("zfdgxsf")),
                "zfqtyjyghdxj": clean_numeric_to_none(item.get("zfqtyjyghdxj")),
                "jyhdxjlcxj": clean_numeric_to_none(item.get("jyhdxjlcxj")),
                "jyhdcsdxjlje": clean_numeric_to_none(item.get("jyhdcsdxjlje")),
                "shtzssddxj": clean_numeric_to_none(item.get("shtzssddxj")),
                "qdtzsysddxj": clean_numeric_to_none(item.get("qdtzsysddxj")),
                "czgdzcwxzhqtqctzssddxj": clean_numeric_to_none(
                    item.get("czgdzcwxzhqtqctzssddxj")
                ),
                "sdqtytzghdxj": clean_numeric_to_none(item.get("sdqtytzghdxj")),
                "tzhdxjlrxj": clean_numeric_to_none(item.get("tzhdxjlrxj")),
                "gjgdzcwxzhqtqctzzfdxj": clean_numeric_to_none(
                    item.get("gjgdzcwxzhqtqctzzfdxj")
                ),
                "tzhdxjlcxj": clean_numeric_to_none(item.get("tzhdxjlcxj")),
                "tzhdcsdxjlxj": clean_numeric_to_none(item.get("tzhdcsdxjlxj")),
                "xstzsdj": clean_numeric_to_none(item.get("xstzsdj")),
                "qdjkjddxj": clean_numeric_to_none(item.get("Qdjkjddxj")),
                "fxzjsddxj": clean_numeric_to_none(item.get("fxzjsddxj")),
                "sdqtczghdxj": clean_numeric_to_none(item.get("sdqtczghdxj")),
                "czhdxjlrxj": clean_numeric_to_none(item.get("Czhdxjlrxj")),
                "chzwzfxj": clean_numeric_to_none(item.get("chzwzfxj")),
                "fpglrlhcllxzfdxj": clean_numeric_to_none(item.get("fpglrlhcllxzfdxj")),
                "zfqtczdxj": clean_numeric_to_none(item.get("zfqtczdxj")),
                "czhdxjlcxj": clean_numeric_to_none(item.get("Czhdxjlcxj")),
                "czhdcsdxjlxj": clean_numeric_to_none(item.get("czhdcsdxjlxj")),
                "hlbddxjdxy": clean_numeric_to_none(item.get("hlbddxjdxy")),
                "xjxjdhwjzje": clean_numeric_to_none(item.get("xjxjdhwjzje")),
                "qcxjjxjdhwye": clean_numeric_to_none(item.get("qcxjjxjdhwye")),
                "qmxjjxjdhwye": clean_numeric_to_none(item.get("qmxjjxjdhwye")),
                "jlr": clean_numeric_to_none(item.get("jlr")),
                "zcjzzb": clean_numeric_to_none(item.get("zcjzzb")),
                "gdzczjyqzcshscxwzczj": clean_numeric_to_none(item.get("gdzczjyqzcshscxwzczj")),
                "wxzctx": clean_numeric_to_none(item.get("wxzctx")),
                "cqdtfytx": clean_numeric_to_none(item.get("cqdtfytx")),
                "dtfydjs": clean_numeric_to_none(item.get("dtfydjs")),
                "ytfydzj": clean_numeric_to_none(item.get("ytfydzj")),
                "czgdzcwxzhqtqctzss": clean_numeric_to_none(item.get("czgdzcwxzhqtqctzss")),
                "gdzcgbss": clean_numeric_to_none(item.get("gdzcgbss")),
                "gyjzbds": clean_numeric_to_none(item.get("gyjzbds")),
                "cwfy": clean_numeric_to_none(item.get("Cwfy")),
                "tzss": clean_numeric_to_none(item.get("Tzss")),
                "dysdszcjs": clean_numeric_to_none(item.get("dysdszcjs")),
                "dysdsfzzj": clean_numeric_to_none(item.get("dysdsfzzj")),
                "chdjs": clean_numeric_to_none(item.get("chdjs")),
                "jxyysxmdjs": clean_numeric_to_none(item.get("jxyysxmdjs")),
                "qt": clean_numeric_to_none(item.get("qt")),
                "jyhdcsdxjlxj": clean_numeric_to_none(item.get("jyhdcsdxjlxj")),
                "zwzwzb": clean_numeric_to_none(item.get("zwzwzb")),
                "ynndqdkzhgzq": clean_numeric_to_none(item.get("ynndqdkzhgzq")),
                "rzrgdzc": clean_numeric_to_none(item.get("rzrgdzc")),
                "xjdqmye": clean_numeric_to_none(item.get("xjdqmye")),
                "xjdqcye": clean_numeric_to_none(item.get("xjdqcye")),
                "xjdhwdqmye": clean_numeric_to_none(item.get("xjdhwdqmye")),
                "xjdhwdqcye": clean_numeric_to_none(item.get("xjdhwdqcye")),
                "xjxjdhwdjzje": clean_numeric_to_none(item.get("xjxjdhwdjzje")),
            }
            result.append(mapped_item)

        return result

    def fetch_and_save_cashflow_statement(
        self,
        stock_code: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> int:
        """
        获取并存储现金流量表数据。

        Args:
            stock_code (str): 股票代码，如 "000001.SZ"。
            start_date (Optional[str]): 开始时间，格式YYYYMMDD，如"20240101"，默认为None。
            end_date (Optional[str]): 结束时间，格式YYYYMMDD，如"20241231"，默认为None。

        Returns:
            int: 成功存储的记录数。

        Raises:
            ValidationException: 如果参数验证失败。
            APIException: 如果API请求失败。
            DatabaseException: 如果数据库操作失败。

        API接口: http://api.mairuiapi.com/hsstock/financial/cashflow/股票代码（如000001.SZ）/您的licence?st=开始时间&et=结束时间
        """
        data = self.fetch_cashflow_statement(stock_code, start_date, end_date)
        if not data:
            logger.warning(f"未获取到现金流量表数据，股票代码: {stock_code}")
            return 0

        try:
            with get_db_context() as session:
                count = bulk_insert(session, CashFlowStatement, data, ignore_duplicates=True)
                logger.info(f"成功存储 {count} 条现金流量表数据，股票代码: {stock_code}")
                return count
        except Exception as e:
            error_msg = f"存储现金流量表数据失败: {str(e)}"
            logger.error(error_msg)
            raise DatabaseException(error_msg, "SAVE_CASHFLOW_STATEMENT_ERROR")

    def fetch_balance_sheet(
        self,
        stock_code: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        获取资产负债表数据。

        Args:
            stock_code (str): 股票代码，如 "000001.SZ"。
            start_date (Optional[str]): 开始时间，格式YYYYMMDD，如"20240101"，默认为None。
            end_date (Optional[str]): 结束时间，格式YYYYMMDD，如"20241231"，默认为None。

        Returns:
            List[Dict[str, Any]]: 资产负债表数据列表。

        Raises:
            ValidationException: 如果参数验证失败。
            APIException: 如果API请求失败。

        API接口: http://api.mairuiapi.com/hsstock/financial/balance/股票代码（如000001.SZ）/您的licence?st=开始时间&et=结束时间
        """
        if not stock_code:
            raise ValidationException("股票代码不能为空", "STOCK_CODE_EMPTY")

        url = self._build_url(
            "hsstock/financial/balance",
            stock_code,
            self.license_key,
            start_date,
            end_date,
        )
        data = self._make_request(url)

        result: list[dict[str, Any]] = []
        for item in data:
            mapped_item = {
                "dm": item.get("dm", stock_code),
                "jzrq": item.get("jzrq", ""),
                "plrq": item.get("plrq", ""),
                "nbysk": clean_numeric_to_none(item.get("nbysk")),
                "gdzcql": clean_numeric_to_none(item.get("gdzcql")),
                "yffbzk": clean_numeric_to_none(item.get("yffbzk")),
                "jsbfj": clean_numeric_to_none(item.get("jsbfj")),
                "ysbf": clean_numeric_to_none(item.get("ysbf")),
                "ysfbzk": clean_numeric_to_none(item.get("ysfbzk")),
                "ysfbhtzbj": clean_numeric_to_none(item.get("Ysfbhtzbj")),
                "ysgl": clean_numeric_to_none(item.get("Ysgl")),
                "ysckts": clean_numeric_to_none(item.get("ysckts")),
                "ysbtk": clean_numeric_to_none(item.get("ysbtk")),
                "ysbzj": clean_numeric_to_none(item.get("ysbzj")),
                "dfy": clean_numeric_to_none(item.get("dfy")),
                "dclldzcsy": clean_numeric_to_none(item.get("dclldzcsy")),
                "ynndqdfldzc": clean_numeric_to_none(item.get("ynndqdfldzc")),
                "cqysk": clean_numeric_to_none(item.get("cqysk")),
                "qtcqtz": clean_numeric_to_none(item.get("qtcqtz")),
                "gdzcyz": clean_numeric_to_none(item.get("gdzcyz")),
                "gdzcjz": clean_numeric_to_none(item.get("gdzcjz")),
                "gdzcjzzbj": clean_numeric_to_none(item.get("gdzcjzzbj")),
                "scxswzc": clean_numeric_to_none(item.get("scxswzc")),
                "gyxswzc": clean_numeric_to_none(item.get("gyxswzc")),
                "yqzc": clean_numeric_to_none(item.get("yqzc")),
                "kfzc": clean_numeric_to_none(item.get("kfzc")),
                "gqfzltq": clean_numeric_to_none(item.get("gqfzltq")),
                "qtfldzc": clean_numeric_to_none(item.get("qtfldzc")),
                "yfsxfyj": clean_numeric_to_none(item.get("yfsxfyj")),
                "qtjyk": clean_numeric_to_none(item.get("qtjyk")),
                "yfbzj": clean_numeric_to_none(item.get("yfbzj")),
                "nbyfk": clean_numeric_to_none(item.get("nbyfk")),
                "ytfy": clean_numeric_to_none(item.get("ytfy")),
                "bxhtzbj": clean_numeric_to_none(item.get("bxhtzbj")),
                "dlmmzqk": clean_numeric_to_none(item.get("dlmmzqk")),
                "dlcxzqk": clean_numeric_to_none(item.get("dlcxzqk")),
                "gjpjjs": clean_numeric_to_none(item.get("gjpjjs")),
                "gnpjjs": clean_numeric_to_none(item.get("gnpjjs")),
                "dysr": clean_numeric_to_none(item.get("dysr")),
                "yfdqzq": clean_numeric_to_none(item.get("yfdqzq")),
                "cqdysr": clean_numeric_to_none(item.get("cqdysr")),
                "wqddtzss": clean_numeric_to_none(item.get("wqddtzss")),
                "nfpxjgl": clean_numeric_to_none(item.get("nfpxjgl")),
                "yjfz": clean_numeric_to_none(item.get("yjfz")),
                "xsckjtycf": clean_numeric_to_none(item.get("xsckjtycf")),
                "yjldfz": clean_numeric_to_none(item.get("yjldfz")),
                "j_kcg": clean_numeric_to_none(item.get("j_kcg")),
                "hbzj": clean_numeric_to_none(item.get("Hbzj")),
                "cczj": clean_numeric_to_none(item.get("cczj")),
                "jyxjrzc": clean_numeric_to_none(item.get("jyxjrzc")),
                "ysjrzc": clean_numeric_to_none(item.get("ysjrzc")),
                "yspj": clean_numeric_to_none(item.get("yspj")),
                "yszk": clean_numeric_to_none(item.get("yszk")),
                "yfkx": clean_numeric_to_none(item.get("yfkx")),
                "yslx": clean_numeric_to_none(item.get("yslx")),
                "qtysk": clean_numeric_to_none(item.get("qtysk")),
                "mrfsjrzck": clean_numeric_to_none(item.get("Mrfsjrzck")),
                "gyjzjzbdqjsrdq": clean_numeric_to_none(item.get("gyjzjzbdqjsrdq")),
                "ch": clean_numeric_to_none(item.get("ch")),
                "qtldzc": clean_numeric_to_none(item.get("qtldzc")),
                "ldzchj": clean_numeric_to_none(item.get("ldzchj")),
                "ffdkjjd": clean_numeric_to_none(item.get("ffdkjjd")),
                "kkgsjrzc": clean_numeric_to_none(item.get("kkgsjrzc")),
                "cyzdqtz": clean_numeric_to_none(item.get("cyzdqtz")),
                "cqgqtz": clean_numeric_to_none(item.get("cqgqtz")),
                "tzxfd": clean_numeric_to_none(item.get("Tzxfd")),
                "ljzj": clean_numeric_to_none(item.get("ljzj")),
                "gdzc": clean_numeric_to_none(item.get("Gdzc")),
                "zjgc": clean_numeric_to_none(item.get("zjgc")),
                "gcwz": clean_numeric_to_none(item.get("Gcwz")),
                "wxzc": clean_numeric_to_none(item.get("wxzc")),
                "sy": clean_numeric_to_none(item.get("sy")),
                "cqdtfy": clean_numeric_to_none(item.get("cqdtfy")),
                "dysdszc": clean_numeric_to_none(item.get("dysdszc")),
                "fldzchj": clean_numeric_to_none(item.get("fldzchj")),
                "zczj": clean_numeric_to_none(item.get("zczj")),
                "dqjk": clean_numeric_to_none(item.get("dqjk")),
                "xzyhyhk": clean_numeric_to_none(item.get("xzyhyhk")),
                "crzj": clean_numeric_to_none(item.get("crzj")),
                "jyxjrfz": clean_numeric_to_none(item.get("jyxjrfz")),
                "ysjrfz": clean_numeric_to_none(item.get("ysjrfz")),
                "yfpj": clean_numeric_to_none(item.get("yfpj")),
                "yfzk": clean_numeric_to_none(item.get("yfzk")),
                "ysk": clean_numeric_to_none(item.get("Ysk")),
                "mchgjrzck": clean_numeric_to_none(item.get("mchgjrzck")),
                "yfgzxc": clean_numeric_to_none(item.get("yfgzxc")),
                "yjsf": clean_numeric_to_none(item.get("yjsf")),
                "yflx": clean_numeric_to_none(item.get("yflx")),
                "yfgl": clean_numeric_to_none(item.get("yfgl")),
                "qtfzk": clean_numeric_to_none(item.get("qtfzk")),
                "ynndqdfldfz": clean_numeric_to_none(item.get("ynndqdfldfz")),
                "qtldfz": clean_numeric_to_none(item.get("qtldfz")),
                "ldfzhj": clean_numeric_to_none(item.get("ldfzhj")),
                "cqjk": clean_numeric_to_none(item.get("cqjk")),
                "yfzq": clean_numeric_to_none(item.get("yfzq")),
                "cqyfk": clean_numeric_to_none(item.get("cqyfk")),
                "zxyfk": clean_numeric_to_none(item.get("zxyfk")),
                "dysdsfz": clean_numeric_to_none(item.get("dysdsfz")),
                "qtfldfz": clean_numeric_to_none(item.get("qtfldfz")),
                "fldfzhj": clean_numeric_to_none(item.get("fldfzhj")),
                "fzhj": clean_numeric_to_none(item.get("fzhj")),
                "sszb": clean_numeric_to_none(item.get("sszb")),
                "zbgj": clean_numeric_to_none(item.get("zbgj")),
                "zxzb": clean_numeric_to_none(item.get("Zxzb")),
                "ylgj": clean_numeric_to_none(item.get("ylgj")),
                "ybfxzb": clean_numeric_to_none(item.get("ybfxzb")),
                "wfplr": clean_numeric_to_none(item.get("wfplr")),
                "wbbzbzhc": clean_numeric_to_none(item.get("wbbzbzhc")),
                "gsmgdqsyhj": clean_numeric_to_none(item.get("gsmgdqsyhj")),
                "ssgdqy": clean_numeric_to_none(item.get("ssgdqy")),
                "syzqyhj": clean_numeric_to_none(item.get("syzqyhj")),
                "fzhgdqyzj": clean_numeric_to_none(item.get("fzhgdqyzj")),
            }
            result.append(mapped_item)

        return result

    def fetch_and_save_balance_sheet(
        self,
        stock_code: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> int:
        """
        获取并存储资产负债表数据。

        Args:
            stock_code (str): 股票代码，如 "000001.SZ"。
            start_date (Optional[str]): 开始时间，格式YYYYMMDD，如"20240101"，默认为None。
            end_date (Optional[str]): 结束时间，格式YYYYMMDD，如"20241231"，默认为None。

        Returns:
            int: 成功存储的记录数。

        Raises:
            ValidationException: 如果参数验证失败。
            APIException: 如果API请求失败。
            DatabaseException: 如果数据库操作失败。

        API接口: http://api.mairuiapi.com/hsstock/financial/balance/股票代码（如000001.SZ）/您的licence?st=开始时间&et=结束时间
        """
        data = self.fetch_balance_sheet(stock_code, start_date, end_date)
        if not data:
            logger.warning(f"未获取到资产负债表数据，股票代码: {stock_code}")
            return 0

        try:
            with get_db_context() as session:
                count = bulk_insert(session, BalanceSheet, data, ignore_duplicates=True)
                logger.info(f"成功存储 {count} 条资产负债表数据，股票代码: {stock_code}")
                return count
        except Exception as e:
            error_msg = f"存储资产负债表数据失败: {str(e)}"
            logger.error(error_msg)
            raise DatabaseException(error_msg, "SAVE_BALANCE_SHEET_ERROR")

