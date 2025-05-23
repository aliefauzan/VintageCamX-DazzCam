import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface UploadResponse {
  id: string;
  message: string;
}

export interface ProcessResponse {
  id: string;
  message: string;
}

export interface CropData {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const uploadImage = async (file: File): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('image', file);
  
  const response = await api.post<UploadResponse>('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
};

export const processImage = async (imageId: string, aspectRatio: string = '1:1'): Promise<ProcessResponse> => {
  const response = await api.post<ProcessResponse>('/process', {
    imageId,
    aspectRatio,
  });
  
  return response.data;
};

export const processCustomCrop = async (imageId: string, cropData: CropData): Promise<ProcessResponse> => {
  const response = await api.post<ProcessResponse>('/process/custom', {
    imageId,
    cropData,
  });
  
  return response.data;
};

export const getDownloadUrl = (processedId: string): string => {
  return `${API_URL}/download/${processedId}`;
};

export default api; 