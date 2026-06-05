# ============================================================
# Stage 1: 依赖构建层（利用 layer cache，源码变更不重装包）
# ============================================================
FROM python:3.11-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /build

# 仅复制依赖清单，最大化 cache 命中率
COPY requirements.txt .

RUN python -m pip install --upgrade pip \
    && pip install --prefix=/install -r requirements.txt

# ============================================================
# Stage 2: 运行层（精简镜像，不含构建工具）
# ============================================================
FROM python:3.11-slim AS runner

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app

WORKDIR /app

# 从 builder 层拷贝已安装的包
COPY --from=builder /install /usr/local

# 拷贝项目源码（.dockerignore 已排除 .env / log / __pycache__ 等）
COPY . /app

# 默认打印帮助；实际任务通过 docker compose run --rm app python ... 触发
CMD ["python", "-c", "print('Financial Data Platform ready.\\nUsage: docker compose run --rm app python example/<script>.py')"]


ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app

WORKDIR /app

# 从 builder 层拷贝已安装的包
COPY --from=builder /install /usr/local

# 拷贝项目源码（.dockerignore 已排除 .env / log / __pycache__ 等）
COPY . /app

# 默认打印帮助；实际任务通过 docker compose run --rm app python ... 触发
CMD ["python", "-c", "print('Financial Data Platform ready.\\nUsage: docker compose run --rm app python example/<script>.py')"]
