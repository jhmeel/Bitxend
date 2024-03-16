import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
interface AxiosInstanceConfig extends AxiosRequestConfig {
  baseURL: string;
  headers: Record<string, string>;
}

 const axiosInstance = (): AxiosInstance => {
  const config: AxiosInstanceConfig = {
    baseURL: "http://127.0.0.1:8000",
    headers: { "Content-Type": "application/json" },
  };

  return axios.create(config);
};

export default axiosInstance