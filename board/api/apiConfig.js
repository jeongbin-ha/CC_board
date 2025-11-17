
// 공통 상수
export const API_ENDPOINTS = {
  // 게시판
  BOARDS: '/boards',
  HOT_BOARDS: '/boards/hot',
  BOARD_SEARCH: '/boards/search',
  BOARD_LIKE: (boardId) => `/boards/${boardId}/like`,
  
  // 댓글
  COMMENTS: (boardId) => `/boards/${boardId}/comments`,
  COMMENT_UPDATE: (boardId, commentId) => `/boards/${boardId}/comments/${commentId}`,
  COMMENT_DELETE: (boardId, commentId) => `/boards/${boardId}/comments/${commentId}`,
  COMMENT_LIKE: (boardId, commentId) => `/boards/${boardId}/comments/${commentId}/like`,
  
  // 이미지
  PRESIGNED_URL: '/upload/s3/presignedUrl',
  PRESIGNED_URLS: '/upload/s3/presignedUrls',
  IMAGE_SAVE: '/images',
  IMAGE_SAVE_MULTIPLE: '/images/multipleImages',
  IMAGE_DELETE: (keyName) => `/upload/s3/${encodeURIComponent(keyName)}`,
  IMAGE_EXISTS: '/upload/s3',
  
  // 사용자
  MY_PAGE: '/member/myPage',
  
  // 신고
  REPORTS: '/boards/reports'
};

export const BOARD_TYPE = {
  general: 'NORMAL',
  promotion: 'PROMOTION',
  hot: 'NORMAL' // HOT은 일반 게시판에서 좋아요 10개 이상인 것들
};