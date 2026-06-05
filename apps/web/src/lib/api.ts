import axios, { AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { getToken, removeToken } from './auth';

// 使用相对路径，通过 Next.js rewrites 代理到后端，避免 CORS 问题
const API_BASE_URL = '/';

export interface ApiRequestConfig<D = any> extends AxiosRequestConfig<D> {
  skipAuthRedirect?: boolean;
}

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器：附加 Authorization header
client.interceptors.request.use(
  (config: InternalAxiosRequestConfig & { skipAuthRedirect?: boolean }) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器：处理 401、解包 res.data.data（后端统一响应格式 { code, message, data }）
client.interceptors.response.use(
  (response) => {
    const body = response.data;
    // 统一处理业务响应码；登录拦截等业务错误走 reject，便于页面展示阻断状态
    if (body && typeof body === 'object' && 'code' in body && body.code !== 200) {
      return Promise.reject(body);
    }

    // 解包后端统一响应格式，返回内层 data 字段
    if (body && typeof body === 'object' && 'data' in body) {
      return body.data;
    }
    return body;
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      const config = error.config as ApiRequestConfig | undefined;

      // 401 未认证，清理失效 token；仅对受保护请求跳转登录
      if (status === 401) {
        removeToken();
        if (typeof window !== 'undefined') {
          const shouldRedirect = !config?.skipAuthRedirect && window.location.pathname !== '/login';
          if (shouldRedirect) {
            window.location.href = '/login';
          }
        }
      }

      // 解包业务错误
      if (data && typeof data === 'object') {
        return Promise.reject(data);
      }
    }

    return Promise.reject(error);
  }
);

const apiClient = {
  get<T = any>(url: string, config?: ApiRequestConfig): Promise<T> {
    return client.get<any, T>(url, config);
  },

  post<T = any, D = any>(url: string, data?: D, config?: ApiRequestConfig<D>): Promise<T> {
    return client.post<any, T, D>(url, data, config);
  },

  put<T = any, D = any>(url: string, data?: D, config?: ApiRequestConfig<D>): Promise<T> {
    return client.put<any, T, D>(url, data, config);
  },

  delete<T = any>(url: string, config?: ApiRequestConfig): Promise<T> {
    return client.delete<any, T>(url, config);
  },
};

export default apiClient;
