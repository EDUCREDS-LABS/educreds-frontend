import axios from 'axios';
import { getAuthHeaders } from './auth';

const API_URL = '/api/templates'; // Adjust if your API is hosted elsewhere

export const getTemplates = async () => {
  const response = await axios.get(API_URL, { headers: getAuthHeaders() });
  return response.data;
};

export const getTemplateById = async (id: string) => {
  const response = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return response.data;
};

export const createTemplate = async (templateData: any) => {
  const response = await axios.post(API_URL, templateData, { headers: getAuthHeaders() });
  return response.data;
};

export const updateTemplate = async (id: string, templateData: any) => {
  const response = await axios.put(`${API_URL}/${id}`, templateData, { headers: getAuthHeaders() });
  return response.data;
};

export const deleteTemplate = async (id: string) => {
  const response = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return response.data;
};
