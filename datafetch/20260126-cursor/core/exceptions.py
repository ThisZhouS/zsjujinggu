"""
自定义异常模块。

该模块定义了项目中使用的所有自定义异常类。
"""


class FinancialDataPlatformException(Exception):
    """金融数据平台基础异常类。"""

    def __init__(self, message: str, code: str = "UNKNOWN_ERROR"):
        """
        初始化异常。

        Args:
            message (str): 异常消息。
            code (str): 错误代码，默认为"UNKNOWN_ERROR"。
        """
        self.message = message
        self.code = code
        super().__init__(self.message)


class APIException(FinancialDataPlatformException):
    """API相关异常。"""

    def __init__(
        self,
        message: str,
        code: str = "API_ERROR",
        status_code: int = 500,
    ):
        """
        初始化API异常。

        Args:
            message (str): 异常消息。
            code (str): 错误代码，默认为"API_ERROR"。
            status_code (int): HTTP状态码，默认为500。
        """
        super().__init__(message, code)
        self.status_code = status_code


class DatabaseException(FinancialDataPlatformException):
    """数据库相关异常。"""

    def __init__(self, message: str, code: str = "DATABASE_ERROR"):
        """
        初始化数据库异常。

        Args:
            message (str): 异常消息。
            code (str): 错误代码，默认为"DATABASE_ERROR"。
        """
        super().__init__(message, code)


class ConfigurationException(FinancialDataPlatformException):
    """配置相关异常。"""

    def __init__(self, message: str, code: str = "CONFIGURATION_ERROR"):
        """
        初始化配置异常。

        Args:
            message (str): 异常消息。
            code (str): 错误代码，默认为"CONFIGURATION_ERROR"。
        """
        super().__init__(message, code)


class ValidationException(FinancialDataPlatformException):
    """数据验证异常。"""

    def __init__(self, message: str, code: str = "VALIDATION_ERROR"):
        """
        初始化验证异常。

        Args:
            message (str): 异常消息。
            code (str): 错误代码，默认为"VALIDATION_ERROR"。
        """
        super().__init__(message, code)


class RateLimitException(APIException):
    """API请求频率限制异常。"""

    def __init__(self, message: str = "请求频率超限，请稍后重试"):
        """
        初始化频率限制异常。

        Args:
            message (str): 异常消息，默认为"请求频率超限，请稍后重试"。
        """
        super().__init__(message, "RATE_LIMIT_ERROR", 429)

