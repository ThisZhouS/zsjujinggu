"""
全量获取执行脚本。

该脚本提供异步并发执行 useful/ 目录下的独立数据获取脚本，
支持断点续跑、网络错误处理、进度跟踪、配置文件等功能。
"""

from __future__ import annotations

import argparse
import asyncio
import os
import sys
from dataclasses import dataclass, field
from datetime import date, datetime
from pathlib import Path
from typing import Iterable, Optional, Any
import yaml

# 项目路径配置
PROJECT_ROOT = Path(__file__).resolve().parent.parent
USEFUL_DIR = PROJECT_ROOT / "useful"
LOG_DIR = PROJECT_ROOT / "log" / "full_fetch"
STATE_DIR = PROJECT_ROOT / "log" / "full_fetch_state"
DEFAULT_CONFIG_FILE = PROJECT_ROOT / "config" / "fetch_config.yaml"

# 网络错误关键词（用于检测是否为断网导致的失败）
RETRYABLE_NETWORK_ERRORS = (
    "connectionerror",
    "timeout",
    "timed out",
    "proxyerror",
    "network is unreachable",
    "name or service not known",
    "temporary failure in name resolution",
    "connection reset by peer",
    "max retries exceeded",
    "failed to establish a new connection",
    "ssl",
    "certificate",
    "dns",
)

# 默认配置
DEFAULT_PAUSE_SECONDS = 30
DEFAULT_RETRY_DELAY_SECONDS = 10
DEFAULT_RETRY_TIMES = 3
DEFAULT_GLOBAL_QPS = 5
DEFAULT_CONCURRENCY = 5
DEFAULT_FULL_START_DATE = "1991-01-01"

# 列表源脚本（需要优先执行）
LIST_SOURCE_SCRIPT_NAMES = [
    "major_market_lists_fetch_and_save_hk_stock_list.py",
    "major_market_lists_fetch_and_save_hs_fund_list.py",
    "major_market_lists_fetch_and_save_hs_main_index_list.py",
    "major_market_lists_fetch_and_save_new_stock_calendar.py",
    "major_market_lists_fetch_and_save_stock_list.py",
    "other_market_lists_fetch_and_save_bj_index_list.py",
    "other_market_lists_fetch_and_save_bj_stock_list.py",
    "other_market_lists_fetch_and_save_etf_fund_list.py",
    "other_market_lists_fetch_and_save_kc_stock_list.py",
    "index_relationship_mapping_fetch_and_save_zg_tree.py",
]

# 需要按日期遍历的脚本
DATE_FULL_FETCH_SCRIPT_NAMES = [
    "stock_pool_classification_fetch_and_save_limit_down_pool.py",
    "stock_pool_classification_fetch_and_save_limit_up_break_pool.py",
    "stock_pool_classification_fetch_and_save_limit_up_pool.py",
    "stock_pool_classification_fetch_and_save_strong_pool.py",
    "stock_pool_classification_fetch_and_save_sub_new_pool.py",
]


@dataclass(frozen=True)
class FetchConfig:
    """全量获取配置。"""
    resume: bool = False
    full_start_date: Optional[str] = None
    full_end_date: Optional[str] = None
    currency: Optional[int] = None
    retry_times: Optional[int] = None
    retry_delay_seconds: Optional[int] = None
    pause_seconds: Optional[int] = None
    global_qps: Optional[int] = None
    scripts: Optional[list[str]] = None
    useful_dir: Optional[str] = None
    log_dir: Optional[str] = None
    state_dir: Optional[str] = None
    verbose: bool = False
    dry_run: bool = False
    single_date_mode: bool = False
    single_date: Optional[str] = None


@dataclass(frozen=True)
class TaskSpec:
    """任务规格定义。"""
    script: Path
    task_key: str
    env_overrides: dict[str, str] = field(default_factory=dict)


class FullFetchRunner:
    """全量获取执行器。"""

    def __init__(
        self,
        scripts: list[Path],
        retry_times: int,
        retry_delay_seconds: int,
        pause_seconds: int,
        resume: bool,
        global_qps: int,
        concurrency: int,
        full_start_date: str,
        full_end_date: Optional[str],
        verbose: bool,
        dry_run: bool,
    ) -> None:
        """初始化执行器。"""
        self.scripts = scripts
        self.retry_times = retry_times
        self.retry_delay_seconds = retry_delay_seconds
        self.pause_seconds = pause_seconds
        self.resume = resume
        self.global_qps = global_qps
        self.concurrency = concurrency
        self.full_start_date = full_start_date
        self.full_end_date = full_end_date
        self.verbose = verbose
        self.dry_run = dry_run

        # 运行时配置
        self.run_tag = datetime.now().strftime("%Y%m%d_%H%M%S")
        self.log_file = LOG_DIR / f"full_fetch_{self.run_tag}.log"
        self.state_file = STATE_DIR / "last_full_fetch_state.txt"

        # 统计信息
        self.success_count = 0
        self.fail_count = 0
        self.skipped_count = 0
        self.failed_tasks: list[str] = []

        # 断点续跑相关
        self.last_success_name = self._load_last_success_name() if resume else None
        self.resume_mode = resume and self.last_success_name is not None
        self.resume_reached = not self.resume_mode

        # 锁管理
        self.log_lock = asyncio.Lock()
        self.state_lock = asyncio.Lock()
        self.pause_lock = asyncio.Lock()
        self.network_pause_until = 0.0

    def _load_last_success_name(self) -> Optional[str]:
        """加载上次成功执行的任务名称。"""
        if not self.state_file.exists():
            return None
        value = self.state_file.read_text(encoding="utf-8").strip()
        return value or None

    async def _save_last_success_name(self, task_key: str) -> None:
        """保存当前成功执行的任务名称。"""
        async with self.state_lock:
            STATE_DIR.mkdir(parents=True, exist_ok=True)
            self.state_file.write_text(task_key, encoding="utf-8")

    async def log(self, message: str) -> None:
        """写入日志。"""
        if not self.verbose and message.startswith("[DEBUG]"):
            return
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        line = f"{timestamp} | {message}"
        async with self.log_lock:
            print(line)
            if not self.dry_run:
                with self.log_file.open("a", encoding="utf-8") as file:
                    file.write(line + "\n")

    async def debug(self, message: str) -> None:
        """写入调试日志。"""
        await self.log(f"[DEBUG] {message}")

    async def register_network_pause(self, task_key: str) -> None:
        """注册网络暂停事件。"""
        async with self.pause_lock:
            pause_until = asyncio.get_running_loop().time() + self.pause_seconds
            if pause_until > self.network_pause_until:
                self.network_pause_until = pause_until
                await self.log(
                    f"[PAUSE] 检测到疑似断网，全部任务暂停 {self.pause_seconds} 秒，触发任务: {task_key}"
                )

    async def wait_if_paused(self) -> None:
        """等待网络恢复（如果处于暂停状态）。"""
        while True:
            async with self.pause_lock:
                remaining = self.network_pause_until - asyncio.get_running_loop().time()
            if remaining <= 0:
                return
            await asyncio.sleep(min(remaining, 1))

    async def should_skip_by_resume(self, task_key: str) -> bool:
        """判断是否应该因断点续跑而跳过此任务。"""
        if not self.resume_mode:
            return False
        if self.resume_reached:
            return False
        if task_key == self.last_success_name:
            self.resume_reached = True
            self.skipped_count += 1
            await self.log(f"[RESUME] 跳过已完成任务: {task_key}")
            return True
        self.skipped_count += 1
        await self.log(f"[RESUME] 跳过已完成任务: {task_key}")
        return True

    async def run(self) -> int:
        """执行全部任务。"""
        # 创建必要的目录
        LOG_DIR.mkdir(parents=True, exist_ok=True)
        STATE_DIR.mkdir(parents=True, exist_ok=True)

        # 打印开始信息
        await self.log("=" * 64)
        await self.log("全量获取开始")
        await self.log(f"项目目录: {PROJECT_ROOT}")
        await self.log(f"脚本数量: {len(self.scripts)}")
        await self.log(f"日志文件: {self.log_file}")
        await self.log(f"总接口限速: {self.global_qps} 次/秒")
        await self.log(f"并发任务数: {self.concurrency}")
        await self.log(f"全量起始日期: {self.full_start_date}")
        if self.full_end_date:
            await self.log(f"全量结束日期: {self.full_end_date}")
        else:
            await self.log(f"全量结束日期: 今天")
        await self.log("执行顺序: 先列表/参数源数据，后依赖数据；单日参数接口按日期范围遍历")
        if self.resume_mode and self.last_success_name:
            await self.log(f"断点续跑: 从 {self.last_success_name} 之后继续")
        else:
            await self.log("断点续跑: 未启用或无历史断点")
        if self.dry_run:
            await self.log("⚠️  模式: dry_run (不实际执行，只显示任务列表)")
        await self.log("=" * 64)

        if self.dry_run:
            # 在 dry_run 模式下，只显示任务列表
            phase1, phase2 = self.split_phases(self.scripts)
            await self.show_tasks("phase-1 列表/参数源数据", phase1)
            await self.show_tasks("phase-2 依赖明细数据", phase2)
        else:
            # 分阶段执行
            phase1, phase2 = self.split_phases(self.scripts)
            await self.run_phase("phase-1 列表/参数源数据", phase1)
            await self.run_phase("phase-2 依赖明细数据", phase2)

        # 打印结束信息
        await self.log("")
        await self.log("=" * 64)
        await self.log("全量获取结束")
        await self.log(f"成功: {self.success_count}")
        await self.log(f"失败: {self.fail_count}")
        await self.log(f"跳过: {self.skipped_count}")
        if self.failed_tasks:
            await self.log("失败任务列表:")
            for name in self.failed_tasks:
                await self.log(f"  - {name}")
        await self.log("=" * 64)
        return 0 if self.fail_count == 0 else 1

    async def show_tasks(self, phase_name: str, scripts: list[Path]) -> None:
        """显示任务列表（dry_run 模式）。"""
        if not scripts:
            return
        await self.log("")
        await self.log(f"================ {phase_name} 任务列表 ================")
        tasks = self.build_tasks(scripts)
        for idx, task in enumerate(tasks, 1):
            await self.log(f"  {idx:3d}. {task.task_key}")
        await self.log(f"================ 共 {len(tasks)} 个任务 ================")

    async def run_phase(self, phase_name: str, scripts: list[Path]) -> None:
        """执行一个阶段的任务。"""
        if not scripts:
            return
        await self.log("")
        await self.log(f"================ {phase_name} 开始 ================")
        tasks = self.build_tasks(scripts)
        semaphore = asyncio.Semaphore(self.concurrency)
        await asyncio.gather(*(self.run_task(task, semaphore, len(tasks)) for task in tasks))
        await self.log(f"================ {phase_name} 结束 ================")

    def build_tasks(self, scripts: list[Path]) -> list[TaskSpec]:
        """构建任务列表。"""
        tasks: list[TaskSpec] = []
        end_date_str = self.full_end_date or date.today().isoformat()
        total_dates = self.build_date_strings(self.full_start_date, end_date_str)

        for script in scripts:
            if script.name in DATE_FULL_FETCH_SCRIPT_NAMES:
                # 对于需要日期参数的脚本，为每个日期创建一个任务
                for day in total_dates:
                    task_key = f"{script.name}|{day}"
                    tasks.append(
                        TaskSpec(
                            script=script,
                            task_key=task_key,
                            env_overrides={
                                "FULL_FETCH_SINGLE_DATE": day,
                                "FULL_FETCH_MODE": "single_date",
                            },
                        )
                    )
            else:
                # 对于不需要日期参数的脚本，只创建一个任务
                tasks.append(
                    TaskSpec(
                        script=script,
                        task_key=script.name,
                        env_overrides={},
                    )
                )
        return tasks

    async def run_task(
        self,
        task: TaskSpec,
        semaphore: asyncio.Semaphore,
        total_tasks: int,
    ) -> None:
        """执行单个任务。"""
        if await self.should_skip_by_resume(task.task_key):
            return

        async with semaphore:
            await self.log("")
            await self.log(f"--- 开始执行任务: {task.task_key} / 总任务数 {total_tasks} ---")
            success = await self.run_single_task(task)
            if success:
                self.success_count += 1
                await self._save_last_success_name(task.task_key)
                await self.log(f"[OK] {task.task_key}")
            else:
                self.fail_count += 1
                self.failed_tasks.append(task.task_key)
                await self.log(f"[FAIL] {task.task_key}")

    async def run_single_task(self, task: TaskSpec) -> bool:
        """执行单个任务（包含重试逻辑）。"""
        for attempt in range(1, self.retry_times + 1):
            await self.wait_if_paused()
            await self.log(f"[RUN] {task.task_key} 第 {attempt}/{self.retry_times} 次执行")
            success, network_error = await self.execute_process(task)
            if success:
                return True

            if attempt >= self.retry_times:
                await self.log(f"[ERROR] {task.task_key} 重试次数已用尽")
                return False

            if network_error:
                await self.register_network_pause(task.task_key)
            else:
                await self.log(
                    f"[RETRY] {task.task_key} {self.retry_delay_seconds} 秒后进行下一次重试"
                )
                await asyncio.sleep(self.retry_delay_seconds)

        return False

    async def execute_process(self, task: TaskSpec) -> tuple[bool, bool]:
        """执行子进程并返回执行结果。"""
        if self.dry_run:
            # 在 dry_run 模式下，不实际执行
            await self.log(f"[DRY-RUN] {task.task_key} (跳过执行)")
            return True, False

        command = [sys.executable, str(task.script)]
        env = os.environ.copy()
        env["API_REQUEST_RATE_LIMIT"] = str(self.global_qps * 60)
        env["FULL_FETCH_GLOBAL_QPS"] = str(self.global_qps)
        env["FULL_FETCH_START_DATE"] = self.full_start_date
        env["FULL_FETCH_END_DATE"] = date.today().isoformat()
        env.update(task.env_overrides)

        try:
            process = await asyncio.create_subprocess_exec(
                *command,
                cwd=str(PROJECT_ROOT),
                env=env,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.STDOUT,
            )
        except Exception as e:
            await self.log(f"[ERROR] 创建进程失败: {e}")
            return False, True

        network_error = False
        assert process.stdout is not None
        while True:
            raw_line = await process.stdout.readline()
            if not raw_line:
                break
            line = raw_line.decode("utf-8", errors="replace").rstrip("\n")
            await self.log(f"[{task.task_key}] {line}")
            if self.is_network_error_line(line):
                network_error = True

        return_code = await process.wait()
        if return_code == 0:
            return True, False

        await self.log(f"[EXIT] {task.task_key} 退出码: {return_code}")
        return False, network_error

    @staticmethod
    def is_network_error_line(line: str) -> bool:
        """判断日志行是否包含网络错误关键词。"""
        lower_line = line.lower()
        return any(keyword in lower_line for keyword in RETRYABLE_NETWORK_ERRORS)

    @staticmethod
    def split_phases(all_scripts: list[Path]) -> tuple[list[Path], list[Path]]:
        """将脚本分为两个阶段：列表源和依赖数据。"""
        list_set = set(LIST_SOURCE_SCRIPT_NAMES)
        phase1 = [script for script in all_scripts if script.name in list_set]
        phase2 = [script for script in all_scripts if script.name not in list_set]
        return phase1, phase2

    @staticmethod
    def build_date_strings(start_date_str: str, end_date_str: str) -> list[str]:
        """构建日期字符串列表（从开始日期到结束日期）。"""
        start_date = date.fromisoformat(start_date_str)
        end_date = date.fromisoformat(end_date_str)
        days: list[str] = []
        current = start_date
        while current <= end_date:
            days.append(current.isoformat())
            current = date.fromordinal(current.toordinal() + 1)
        return days


def load_config_file(config_path: Path) -> FetchConfig:
    """从 YAML 文件加载配置。"""
    default_config = FetchConfig()

    if not config_path.exists():
        print(f"警告: 配置文件不存在: {config_path}")
        print("使用默认配置")
        return default_config

    try:
        with open(config_path, "r", encoding="utf-8") as f:
            config_data = yaml.safe_load(f) or {}
    except Exception as e:
        print(f"警告: 配置文件解析失败: {e}")
        print("使用默认配置")
        return default_config

    # 解析配置值
    return FetchConfig(
        resume=boolean_config(config_data.get("resume", default_config.resume)),
        full_start_date=config_data.get("full_start_date", default_config.full_start_date),
        full_end_date=config_data.get("full_end_date", default_config.full_end_date),
        currency=config_data.get("currency", default_config.currency),
        retry_times=config_data.get("retry_times", default_config.retry_times),
        retry_delay_seconds=config_data.get("retry_delay_seconds", default_config.retry_delay_seconds),
        pause_seconds=config_data.get("pause_seconds", default_config.pause_seconds),
        global_qps=config_data.get("global_qps", default_config.global_qps),
        scripts=config_data.get("scripts", default_config.scripts),
        useful_dir=config_data.get("useful_dir", default_config.useful_dir),
        log_dir=config_data.get("log_dir", default_config.log_dir),
        state_dir=config_data.get("state_dir", default_config.state_dir),
        verbose=boolean_config(config_data.get("verbose", default_config.verbose)),
        dry_run=boolean_config(config_data.get("dry_run", default_config.dry_run)),
        single_date_mode=boolean_config(config_data.get("single_date_mode", default_config.single_date_mode)),
        single_date=config_data.get("single_date", default_config.single_date),
    )


def boolean_config(value: Any) -> bool:
    """将配置值转换为布尔类型。"""
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.lower() in ("true", "1", "yes", "on")
    return False


def discover_useful_scripts(directory: Path) -> list[Path]:
    """发现 useful 目录下的所有 Python 脚本。"""
    if not directory.exists():
        print(f"错误: useful 目录不存在: {directory}")
        return []
    return sorted(
        path for path in directory.glob("*.py") if path.name != "__init__.py"
    )


def prioritize_scripts(all_scripts: list[Path]) -> list[Path]:
    """按照优先级排序脚本。"""
    order_map = {name: index for index, name in enumerate(LIST_SOURCE_SCRIPT_NAMES)}

    def sort_key(script: Path) -> tuple[int, int, str]:
        script_name = script.name
        if script_name in order_map:
            return (0, order_map[script_name], script_name)
        return (1, len(order_map), script_name)

    return sorted(all_scripts, key=sort_key)


def filter_scripts(all_scripts: list[Path], include: Optional[list[str]]) -> list[Path]:
    """根据文件名过滤脚本。"""
    if not include:
        return all_scripts
    include_names = {name.strip() for name in include if name.strip()}
    selected = [script for script in all_scripts if script.name in include_names]
    return prioritize_scripts(selected)


def parse_args() -> argparse.Namespace:
    """解析命令行参数。"""
    parser = argparse.ArgumentParser(
        description="异步执行 useful 目录下的全量获取脚本",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "--config",
        "-c",
        type=str,
        default=str(DEFAULT_CONFIG_FILE),
        help=f"配置文件路径（YAML），默认：{DEFAULT_CONFIG_FILE}",
    )
    parser.add_argument(
        "--scripts",
        nargs="*",
        default=[],
        help="仅执行指定脚本文件名，多个脚本用空格分隔",
    )
    parser.add_argument(
        "--retry-times",
        type=int,
        help=f"每个任务失败后的最大重试次数，默认：{DEFAULT_RETRY_TIMES}",
    )
    parser.add_argument(
        "--retry-delay-seconds",
        type=int,
        help=f"非断网失败时的重试等待秒数，默认：{DEFAULT_RETRY_DELAY_SECONDS}",
    )
    parser.add_argument(
        "--pause-seconds",
        type=int,
        help=f"检测到断网后的暂停秒数，默认：{DEFAULT_PAUSE_SECONDS}",
    )
    parser.add_argument(
        "--global-qps",
        type=int,
        help=f"限制总接口请求速率为每秒多少次，默认：{DEFAULT_GLOBAL_QPS}",
    )
    parser.add_argument(
        "--concurrency",
        type=int,
        help=f"异步并发任务数，默认：{DEFAULT_CONCURRENCY}",
    )
    parser.add_argument(
        "--full-start-date",
        help=f"全量起始日期，格式：YYYY-MM-DD，默认：{DEFAULT_FULL_START_DATE}",
    )
    parser.add_argument(
        "--full-end-date",
        help="全量结束日期，格式：YYYY-MM-DD（默认：今天）",
    )
    parser.add_argument(
        "--resume",
        action="store_true",
        help="启用断点续跑",
    )
    parser.add_argument(
        "--no-resume",
        action="store_true",
        help="禁用断点续跑（从头执行全部任务）",
    )
    parser.add_argument(
        "--verbose",
        "-v",
        action="store_true",
        help="启用详细日志输出",
    )
    parser.add_argument(
        "--dry-run",
        "-n",
        action="store_true",
        help="测试模式：显示任务列表但不实际执行",
    )
    return parser.parse_args()


def main() -> int:
    """主函数。"""
    args = parse_args()

    # 加载配置文件
    config_file = Path(args.config)
    config = load_config_file(config_file)

    # 应用配置目录（如果在配置文件中指定）
    useful_dir_path = Path(config.useful_dir) if config.useful_dir else USEFUL_DIR
    log_dir_path = Path(config.log_dir) if config.log_dir else LOG_DIR
    state_dir_path = Path(config.state_dir) if config.state_dir else STATE_DIR

    # 优先级：命令行参数 > 配置文件 > 默认值
    resume = args.resume or (not args.no_resume and config.resume)
    full_start_date = args.full_start_date or config.full_start_date or DEFAULT_FULL_START_DATE
    full_end_date = args.full_end_date or config.full_end_date
    concurrency = args.concurrency or config.currency or DEFAULT_CONCURRENCY
    retry_times = args.retry_times or config.retry_times or DEFAULT_RETRY_TIMES
    retry_delay_seconds = args.retry_delay_seconds or config.retry_delay_seconds or DEFAULT_RETRY_DELAY_SECONDS
    pause_seconds = args.pause_seconds or config.pause_seconds or DEFAULT_PAUSE_SECONDS
    global_qps = args.global_qps or config.global_qps or DEFAULT_GLOBAL_QPS
    verbose = args.verbose or config.verbose
    dry_run = args.dry_run or config.dry_run

    # 如果配置文件中指定了脚本列表，且命令行没有指定，则使用配置文件的
    script_list = args.scripts if args.scripts else config.scripts

    # 发现并过滤脚本
    all_scripts = prioritize_scripts(discover_useful_scripts(useful_dir_path))
    scripts = filter_scripts(all_scripts, script_list)

    if not scripts:
        print("错误: 未找到可执行的 useful 脚本")
        print(f"useful 目录路径: {useful_dir_path}")
        if useful_dir_path.exists():
            found_scripts = list(useful_dir_path.glob("*.py"))
            print(f"useful 目录内容: {len(found_scripts)} 个文件")
            if found_scripts:
                print("前 10 个脚本:")
                for s in found_scripts[:10]:
                    print(f"  - {s.name}")
        return 1

    runner = FullFetchRunner(
        scripts=scripts,
        retry_times=max(1, retry_times),
        retry_delay_seconds=max(1, retry_delay_seconds),
        pause_seconds=max(1, pause_seconds),
        resume=resume,
        global_qps=max(1, global_qps),
        concurrency=max(1, concurrency),
        full_start_date=full_start_date,
        full_end_date=full_end_date,
        verbose=verbose,
        dry_run=dry_run,
    )
    return asyncio.run(runner.run())


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except KeyboardInterrupt:
        print("\n\n用户中断执行")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n执行过程中发生异常: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
