
import { API_ENDPOINTS } from './apiConfig.js';
import axios from 'axios';

// 유틸리티 함수들
const getFileExtension = (file) => {
  return file.name.split('.').pop().toLowerCase();
};

const validateImageFile = (file) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (!allowedTypes.includes(file.type)) {
    throw new Error('JPG, JPEG, PNG 형식만 지원됩니다.');
  }

  if (file.size > maxSize) {
    throw new Error('파일 크기는 10MB 이하여야 합니다.');
  }

  return true;
};

const validateImageFiles = (files) => {
  if (!files || files.length === 0) {
    throw new Error('선택된 파일이 없습니다.');
  }
  if (files.length > 5) {
    throw new Error('이미지는 최대 5개까지 업로드할 수 있습니다.');
  }
  files.forEach((file, index) => {
    try {
      validateImageFile(file);
    } catch (error) {
      throw new Error(`파일 ${index + 1}: ${error.message}`);
    }
  });
  return true;
};

// Presigned URL 관련 함수들
const getSinglePresignedUrl = async (fetchData, file) => {
  const extension = getFileExtension(file);
  const response = await fetchData(
    `${API_ENDPOINTS.PRESIGNED_URL}?imageExtension=${extension}&filePath=board`,
    'GET'
  );
  return response.result || response;
};

const getMultiplePresignedUrls = async (fetchData, files) => {
  if (!files || files.length === 0) return [];
  const extensions = files.map(getFileExtension);
  const response = await fetchData(
    `${API_ENDPOINTS.PRESIGNED_URLS}?filePath=board`,
    'POST',
    extensions
  );
  const urlsData = Array.isArray(response) ? response : response?.result;
  if (!Array.isArray(urlsData)) {
    throw new Error('Presigned URL 응답 형식이 올바르지 않습니다.');
  }
  return urlsData;
};

// S3에 파일 업로드
const uploadFileToS3 = async (uploadUrl, file) => {
  try {
    const extension = getFileExtension(file);

    await axios.put(uploadUrl, file, {
      headers: {
        'Content-Type': `image/${extension}`,
        'x-amz-meta-content-type': `image/${extension}`,
        'x-amz-meta-filetype': `image/${extension}`,
      },
    });
  } catch (error) {
    console.error('S3 업로드 실패:', error.response || error);
    throw new Error('파일 업로드에 실패했습니다.');
  }
};

// 단일 이미지 업로드 (presigned URL + S3 업로드만)
export const uploadSingleImage = async (fetchData, file) => {
  try {
    validateImageFile(file);
    const urlData = await getSinglePresignedUrl(fetchData, file);

    await uploadFileToS3(urlData.uploadUrl, file);

    // DB 저장 없이 S3 정보만 반환
    return {
      keyName: urlData.keyName,
      imageUrl: urlData.publicUrl,
    };
  } catch (error) {
    console.error('단일 이미지 업로드 실패:', error);
    throw error;
  }
};

// 다중 이미지 업로드 (presigned URL + S3 업로드만)
export const uploadMultipleImages = async (fetchData, files) => {
  try {
    if (!files || files.length === 0) return [];
    validateImageFiles(files);

    const urlsData = await getMultiplePresignedUrls(fetchData, files);
    if (urlsData.length !== files.length) {
      throw new Error('Presigned URL 수와 파일 수가 일치하지 않습니다.');
    }

    const uploadPromises = files.map(async (file, index) => {
      const urlData = urlsData[index];
      if (!urlData?.uploadUrl || !urlData?.keyName || !urlData?.publicUrl) {
        throw new Error(`Presigned URL 정보가 누락되었습니다 (파일 ${index + 1})`);
      }
      await uploadFileToS3(urlData.uploadUrl, file);
      return { keyName: urlData.keyName, imageUrl: urlData.publicUrl };
    });

    const uploadResults = await Promise.all(uploadPromises);
    
    // DB 저장 없이 S3 정보만 반환
    return uploadResults;
  } catch (error) {
    console.error('다중 이미지 업로드 실패:', error);
    throw error;
  }
};

// 게시글 작성용 - S3 업로드 후 keyName과 imageUrl만 반환
export const processImagesForCreate = async (fetchData, files) => {
  try {
    if (!files || files.length === 0) return [];
    const uploadResults = await uploadMultipleImages(fetchData, files);
    return uploadResults.map((result) => ({
      keyName: result.keyName,
      imageUrl: result.imageUrl,
    }));
  } catch (error) {
    console.error('게시글 작성용 이미지 처리 실패:', error);
    throw error;
  }
};

// 게시글 수정용 - 기존 이미지와 새 이미지 처리
export const processImagesForUpdate = async (fetchData, existingImages = [], newFiles = []) => {
  try {
    const imageRequestDTOs = [];
    
    // 기존 이미지 처리 (이미 S3에 있는 이미지들)
    existingImages.forEach((img) => {
      if (img.keyName && img.url) {
        imageRequestDTOs.push({ keyName: img.keyName, imageUrl: img.url });
      } else if (img.url) {
        // URL에서 keyName 추출 시도
        const urlParts = img.url.split('/');
        const possibleKeyName = urlParts.slice(-2).join('/');
        imageRequestDTOs.push({ keyName: possibleKeyName, imageUrl: img.url });
      }
    });

    // 새로운 파일들 S3에 업로드
    if (newFiles && newFiles.length > 0) {
      const newUploadResults = await uploadMultipleImages(fetchData, newFiles);
      newUploadResults.forEach((result) => {
        imageRequestDTOs.push({ keyName: result.keyName, imageUrl: result.imageUrl });
      });
    }

    return imageRequestDTOs;
  } catch (error) {
    console.error('게시글 수정용 이미지 처리 실패:', error);
    throw error;
  }
};

// S3에서 이미지 삭제 
export const deleteImageFromS3 = async (fetchData, keyName) => {
  try {
    await fetchData(API_ENDPOINTS.IMAGE_DELETE(keyName), 'DELETE');
  } catch (error) {
    console.error('S3 이미지 삭제 실패:', error);
    throw error;
  }
};

// S3 객체 존재 확인
export const checkImageExists = async (fetchData, keyName) => {
  try {
    const response = await fetchData(`${API_ENDPOINTS.IMAGE_EXISTS}?keyName=${keyName}`, 'GET');
    return response.result || response;
  } catch (error) {
    console.error('S3 객체 존재 확인 실패:', error);
    return false;
  }
};

export { validateImageFile, validateImageFiles };