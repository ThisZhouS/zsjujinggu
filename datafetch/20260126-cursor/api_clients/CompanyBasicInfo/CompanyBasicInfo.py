"""
公司基本信息API客户端。

该模块提供公司基本信息相关的API接口，包括：
- 公司简介
- 公司股本表
- 股票基础信息
- 解禁限售
"""

from typing import List, Dict, Any, Optional
import requests
from datetime import datetime

from config.settings import settings
from config.database import get_db_context
from core.exceptions import APIException, DatabaseException, ValidationException
from utils.logger import get_logger
from utils.db_utils import bulk_insert
from api_clients.CompanyBasicInfo.CompanyBasicInfo_table import (
    CompanyIntro,
    CompanyCapital,
    StockBasicInfo,
    LiftRestriction,
)
from api_clients.MajorMarketLists.MajorMarketLists_table import StockList

logger = get_logger("api_clients.CompanyBasicInfo")


class CompanyBasicInfo:
    """公司基本信息API客户端类。"""

    BASE_URL = "http://api.mairuiapi.com"

    def __init__(self, license_key: Optional[str] = None):
        """
        初始化公司基本信息API客户端。

        Args:
            license_key (Optional[str]): API许可证密钥，默认为None（从配置读取）。

        API接口: 无
        """
        self.license_key = license_key or settings.API_LICENSE
        if not self.license_key:
            raise ValidationException("API许可证密钥未配置", "LICENSE_NOT_CONFIGURED")

    def _get_stock_codes_without_suffix(self) -> List[str]:
        """
        从股票列表表中获取不带交易所后缀的股票代码。

        Returns:
            List[str]: 股票代码列表，例如["000001", "000002"]。

        API接口: 无
        """
        with get_db_context() as session:
            rows = session.query(StockList.dm).all()
            codes = [row.dm for row in rows if row.dm]
        if not codes:
            raise ValidationException("股票列表为空，请先同步 stock_list 数据", "STOCK_LIST_EMPTY")
        return codes

    def _get_stock_codes_with_suffix(self) -> List[str]:
        """
        从股票列表表中获取带交易所后缀的股票代码。

        Returns:
            List[str]: 股票代码列表，例如["000001.SZ", "600000.SH"]。

        API接口: 无
        """
        with get_db_context() as session:
            rows = session.query(StockList.dm, StockList.jys).all()

        codes: List[str] = []
        for dm, jys in rows:
            if not dm:
                continue
            if jys == "sz":
                codes.append(f"{dm}.SZ")
            elif jys == "sh":
                codes.append(f"{dm}.SH")
            else:
                codes.append(dm)

        if not codes:
            raise ValidationException("股票列表为空，请先同步 stock_list 数据", "STOCK_LIST_EMPTY")
        return codes

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

    def fetch_company_intro(self, stock_code: str) -> List[Dict[str, Any]]:
        """
        获取公司简介数据。

        Args:
            stock_code (str): 股票代码，如"000001"。

        Returns:
            List[Dict[str, Any]]: 公司简介数据列表。

        Raises:
            ValidationException: 如果参数验证失败。
            APIException: 如果API请求失败。

        API接口: http://api.mairuiapi.com/hscp/gsjj/股票代码(如000001)/您的licence
        """
        if not stock_code:
            raise ValidationException("股票代码不能为空", "STOCK_CODE_EMPTY")

        url = f"{self.BASE_URL}/hscp/gsjj/{stock_code}/{self.license_key}"
        data = self._make_request(url)

        # 数据字段映射（API返回的字段名可能不同，需要转换）
        result = []
        for item in data:
            mapped_item = {
                "dm": item.get("dm", stock_code),
                "name": item.get("name", ""),
                "ename": item.get("ename", ""),
                "market": item.get("market", ""),
                "idea": item.get("Idea", ""),  # 注意API返回的是Idea
                "ldate": item.get("ldate", ""),
                "sprice": item.get("sprice", ""),
                "principal": item.get("principal", ""),
                "rdate": item.get("rdate", ""),
                "rprice": item.get("rprice", ""),
                "instype": item.get("instype", ""),
                "organ": item.get("organ", ""),
                "secre": item.get("secre", ""),
                "phone": item.get("phone", ""),
                "sphone": item.get("sphone", ""),
                "fax": item.get("fax", ""),
                "sfax": item.get("Sfax", ""),  # 注意API返回的是Sfax
                "email": item.get("email", ""),
                "semail": item.get("semail", ""),
                "site": item.get("site", ""),
                "post": item.get("Post", ""),  # 注意API返回的是Post
                "infosite": item.get("infosite", ""),
                "oname": item.get("oname", ""),
                "addr": item.get("addr", ""),
                "oaddr": item.get("oaddr", ""),
                "desc": item.get("desc", ""),
                "bscope": item.get("bscope", ""),
                "printype": item.get("printype", ""),
                "referrer": item.get("referrer", ""),
                "putype": item.get("putype", ""),
                "pe": item.get("pe", ""),
                "firgu": item.get("firgu", ""),
                "lastgu": item.get("lastgu", ""),
                "realgu": item.get("realgu", ""),
                "planm": item.get("planm", ""),
                "realm": item.get("realm", ""),
                "pubfee": item.get("pubfee", ""),
                "collect": item.get("collect", ""),
                "signfee": item.get("signfee", ""),
                "pdate": item.get("pdate", ""),
            }
            result.append(mapped_item)

        return result

    def fetch_and_save_company_intro(self, stock_code: str) -> int:
        """
        获取并存储公司简介数据。

        Args:
            stock_code (str): 股票代码，如"000001"。

        Returns:
            int: 成功存储的记录数。

        Raises:
            ValidationException: 如果参数验证失败。
            APIException: 如果API请求失败。
            DatabaseException: 如果数据库操作失败。

        API接口: http://api.mairuiapi.com/hscp/gsjj/股票代码(如000001)/您的licence
        """
        data = self.fetch_company_intro(stock_code)
        if not data:
            logger.warning(f"未获取到公司简介数据，股票代码: {stock_code}")
            return 0

        try:
            with get_db_context() as session:
                count = bulk_insert(session, CompanyIntro, data, ignore_duplicates=True)
                logger.info(f"成功存储 {count} 条公司简介数据，股票代码: {stock_code}")
                return count
        except Exception as e:
            error_msg = f"存储公司简介数据失败: {str(e)}"
            logger.error(error_msg)
            raise DatabaseException(error_msg, "SAVE_COMPANY_INTRO_ERROR")

    def fetch_and_save_company_intro_for_all(self) -> int:
        """
        基于股票列表批量获取并存储所有股票的公司简介数据。

        Returns:
            int: 成功存储的记录总数。

        API接口: http://api.mairuiapi.com/hscp/gsjj/股票代码(如000001)/您的licence
        """
        stock_codes = self._get_stock_codes_without_suffix()
        total = 0
        for code in stock_codes:
            try:
                total += self.fetch_and_save_company_intro(code)
            except Exception as exc:  # pylint: disable=broad-except
                logger.error("批量处理公司简介失败，股票代码: %s，错误: %s", code, exc)
        return total

    def fetch_company_capital(
        self,
        stock_code: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        获取公司股本表数据。

        Args:
            stock_code (str): 股票代码，如"000001.SZ"。
            start_date (Optional[str]): 开始时间，格式YYYYMMDD，如"20240101"，默认为None。
            end_date (Optional[str]): 结束时间，格式YYYYMMDD，如"20241231"，默认为None。

        Returns:
            List[Dict[str, Any]]: 公司股本表数据列表。

        Raises:
            ValidationException: 如果参数验证失败。
            APIException: 如果API请求失败。

        API接口: http://api.mairuiapi.com/hsstock/financial/capital/股票代码（如000001.SZ）/您的licence?st=开始时间&et=结束时间
        """
        if not stock_code:
            raise ValidationException("股票代码不能为空", "STOCK_CODE_EMPTY")

        url = f"{self.BASE_URL}/hsstock/financial/capital/{stock_code}/{self.license_key}"
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
                "zgb": item.get("zgb"),
                "ysltag": item.get("ysltag"),
                "xsltgf": item.get("xsltgf"),
                "bdrq": item.get("bdrq", ""),
                "plrq": item.get("plrq", ""),
            }
            result.append(mapped_item)

        return result

    def fetch_and_save_company_capital(
        self,
        stock_code: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> int:
        """
        获取并存储公司股本表数据。

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

        API接口: http://api.mairuiapi.com/hsstock/financial/capital/股票代码（如000001.SZ）/您的licence?st=开始时间&et=结束时间
        """
        data = self.fetch_company_capital(stock_code, start_date, end_date)
        if not data:
            logger.warning(f"未获取到公司股本表数据，股票代码: {stock_code}")
            return 0

        try:
            with get_db_context() as session:
                count = bulk_insert(session, CompanyCapital, data, ignore_duplicates=True)
                logger.info(f"成功存储 {count} 条公司股本表数据，股票代码: {stock_code}")
                return count
        except Exception as e:
            error_msg = f"存储公司股本表数据失败: {str(e)}"
            logger.error(error_msg)
            raise DatabaseException(error_msg, "SAVE_COMPANY_CAPITAL_ERROR")

    def fetch_and_save_company_capital_for_all(
        self,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> int:
        """
        基于股票列表批量获取并存储所有股票的公司股本表数据。

        Args:
            start_date (Optional[str]): 开始时间，格式YYYYMMDD，如"20240101"，默认为None。
            end_date (Optional[str]): 结束时间，格式YYYYMMDD，如"20241231"，默认为None。

        Returns:
            int: 成功存储的记录总数。

        API接口: http://api.mairuiapi.com/hsstock/financial/capital/股票代码（如000001.SZ）/您的licence?st=开始时间&et=结束时间
        """
        stock_codes = self._get_stock_codes_with_suffix()
        total = 0
        for code in stock_codes:
            try:
                total += self.fetch_and_save_company_capital(code, start_date, end_date)
            except Exception as exc:  # pylint: disable=broad-except
                logger.error("批量处理公司股本表失败，股票代码: %s，错误: %s", code, exc)
        return total

    def fetch_stock_basic_info(self, stock_code: str) -> List[Dict[str, Any]]:
        """
        获取股票基础信息数据。

        Args:
            stock_code (str): 股票代码，如"000001.SZ"。

        Returns:
            List[Dict[str, Any]]: 股票基础信息数据列表。

        Raises:
            ValidationException: 如果参数验证失败。
            APIException: 如果API请求失败。

        API接口: http://api.mairuiapi.com/hsstock/instrument/股票代码（如000001.SZ）/您的licence
        """
        if not stock_code:
            raise ValidationException("股票代码不能为空", "STOCK_CODE_EMPTY")

        url = f"{self.BASE_URL}/hsstock/instrument/{stock_code}/{self.license_key}"
        data = self._make_request(url)

        # 数据字段映射
        result = []
        for item in data:
            mapped_item = {
                "dm": item.get("dm", stock_code),
                "ei": item.get("ei", ""),
                "ii": item.get("ii", ""),
                "name": item.get("name", ""),
                "od": item.get("od", ""),
                "pc": item.get("pc"),
                "up": item.get("up"),
                "dp": item.get("dp"),
                "fv": item.get("fv"),
                "tv": item.get("tv"),
                "pk": item.get("pk"),
                "is_stop": item.get("is", 0),  # 注意API返回的是is，表模型是is_stop
            }
            result.append(mapped_item)

        return result

    def fetch_and_save_stock_basic_info(self, stock_code: str) -> int:
        """
        获取并存储股票基础信息数据。

        Args:
            stock_code (str): 股票代码，如"000001.SZ"。

        Returns:
            int: 成功存储的记录数。

        Raises:
            ValidationException: 如果参数验证失败。
            APIException: 如果API请求失败。
            DatabaseException: 如果数据库操作失败。

        API接口: http://api.mairuiapi.com/hsstock/instrument/股票代码（如000001.SZ）/您的licence
        """
        data = self.fetch_stock_basic_info(stock_code)
        if not data:
            logger.warning(f"未获取到股票基础信息数据，股票代码: {stock_code}")
            return 0

        try:
            with get_db_context() as session:
                count = bulk_insert(session, StockBasicInfo, data, ignore_duplicates=True)
                logger.info(f"成功存储 {count} 条股票基础信息数据，股票代码: {stock_code}")
                return count
        except Exception as e:
            error_msg = f"存储股票基础信息数据失败: {str(e)}"
            logger.error(error_msg)
            raise DatabaseException(error_msg, "SAVE_STOCK_BASIC_INFO_ERROR")

    def fetch_and_save_stock_basic_info_for_all(self) -> int:
        """
        基于股票列表批量获取并存储所有股票的股票基础信息数据。

        Returns:
            int: 成功存储的记录总数。

        API接口: http://api.mairuiapi.com/hsstock/instrument/股票代码（如000001.SZ）/您的licence
        """
        stock_codes = self._get_stock_codes_with_suffix()
        total = 0
        for code in stock_codes:
            try:
                total += self.fetch_and_save_stock_basic_info(code)
            except Exception as exc:  # pylint: disable=broad-except
                logger.error("批量处理股票基础信息失败，股票代码: %s，错误: %s", code, exc)
        return total

    def fetch_lift_restriction(self, stock_code: str) -> List[Dict[str, Any]]:
        """
        获取解禁限售数据。

        Args:
            stock_code (str): 股票代码，如"000001"。

        Returns:
            List[Dict[str, Any]]: 解禁限售数据列表。

        Raises:
            ValidationException: 如果参数验证失败。
            APIException: 如果API请求失败。

        API接口: http://api.mairuiapi.com/hscp/jjxs/股票代码(如000001)/您的licence
        """
        if not stock_code:
            raise ValidationException("股票代码不能为空", "STOCK_CODE_EMPTY")

        url = f"{self.BASE_URL}/hscp/jjxs/{stock_code}/{self.license_key}"
        data = self._make_request(url)

        # 数据字段映射
        result = []
        for item in data:
            mapped_item = {
                "dm": item.get("dm", stock_code),
                "rdate": item.get("rdate", ""),
                "ramount": item.get("ramount"),
                "rprice": item.get("rprice"),
                "batch": item.get("batch"),
                "pdate": item.get("pdate", ""),
            }
            result.append(mapped_item)

        return result

    def fetch_and_save_lift_restriction(self, stock_code: str) -> int:
        """
        获取并存储解禁限售数据。

        Args:
            stock_code (str): 股票代码，如"000001"。

        Returns:
            int: 成功存储的记录数。

        Raises:
            ValidationException: 如果参数验证失败。
            APIException: 如果API请求失败。
            DatabaseException: 如果数据库操作失败。

        API接口: http://api.mairuiapi.com/hscp/jjxs/股票代码(如000001)/您的licence
        """
        data = self.fetch_lift_restriction(stock_code)
        if not data:
            logger.warning(f"未获取到解禁限售数据，股票代码: {stock_code}")
            return 0

        try:
            with get_db_context() as session:
                count = bulk_insert(session, LiftRestriction, data, ignore_duplicates=True)
                logger.info(f"成功存储 {count} 条解禁限售数据，股票代码: {stock_code}")
                return count
        except Exception as e:
            error_msg = f"存储解禁限售数据失败: {str(e)}"
            logger.error(error_msg)
            raise DatabaseException(error_msg, "SAVE_LIFT_RESTRICTION_ERROR")

    def fetch_and_save_lift_restriction_for_all(self) -> int:
        """
        基于股票列表批量获取并存储所有股票的解禁限售数据。

        Returns:
            int: 成功存储的记录总数。

        API接口: http://api.mairuiapi.com/hscp/jjxs/股票代码(如000001)/您的licence
        """
        stock_codes = self._get_stock_codes_without_suffix()
        total = 0
        for code in stock_codes:
            try:
                total += self.fetch_and_save_lift_restriction(code)
            except Exception as exc:  # pylint: disable=broad-except
                logger.error("批量处理解禁限售数据失败，股票代码: %s，错误: %s", code, exc)
        return total

