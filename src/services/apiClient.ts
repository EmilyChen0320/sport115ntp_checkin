import axios, { type AxiosInstance } from "axios";
import { getEndpointConfig } from "../config/endpoint";

const endpoint = getEndpointConfig();

export const apiClient: AxiosInstance = axios.create({
  baseURL: endpoint.baseURL,
  timeout: endpoint.timeout,
  headers: endpoint.authToken
    ? {
        Authorization: `Bearer ${endpoint.authToken}`,
      }
    : undefined,
});
