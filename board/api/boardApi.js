
import { API_ENDPOINTS, BOARD_TYPE } from './apiConfig.js';

// 게시글 목록 조회 (일반, 홍보)
export const getBoardList = async (fetchData, category = 'general', page = 0, size = 20) => {
  const boardType = BOARD_TYPE[category];
  
  const response = await fetchData(
    `${API_ENDPOINTS.BOARDS}?boardType=${boardType}&page=${page}&size=${size}`,
    'GET'
  );

  return response;
};

// 핫게시판 조회 (좋아요 10개 이상)
export const getHotBoards = async (fetchData) => {
  const response = await fetchData(API_ENDPOINTS.HOT_BOARDS, 'GET');
  return response;
};

// 게시글 상세 조회
export const getBoardDetail = async (fetchData, boardId) => {
  const response = await fetchData(`${API_ENDPOINTS.BOARDS}/${boardId}`, 'GET');
  return response;
};

// 게시글 작성
export const createBoard = async (fetchData, boardData) => {
  const response = await fetchData(API_ENDPOINTS.BOARDS, 'POST', boardData);
  return response;
};

// 게시글 수정
export const updateBoard = async (fetchData, boardId, boardData) => {
  const response = await fetchData(`${API_ENDPOINTS.BOARDS}/${boardId}`, 'PUT', boardData);
  return response;
};

// 게시글 삭제
export const deleteBoard = async (fetchData, boardId) => {
  await fetchData(`${API_ENDPOINTS.BOARDS}/${boardId}`, 'DELETE');
  return { success: true };
};

// 게시글 좋아요 토글
export const toggleBoardLike = async (fetchData, boardId) => {
  const response = await fetchData(API_ENDPOINTS.BOARD_LIKE(boardId), 'POST');
  return response;
};

// 게시글 검색
export const searchBoards = async (fetchData, keyword, category = 'general', page = 0, size = 20) => {
  const boardType = BOARD_TYPE[category];
  
  const response = await fetchData(
    `${API_ENDPOINTS.BOARD_SEARCH}?keyword=${encodeURIComponent(keyword)}&boardType=${boardType}&page=${page}&size=${size}`,
    'GET'
  );
  
  return response;
};

// 댓글 목록 조회
export const getComments = async (fetchData, boardId) => {
  const response = await fetchData(API_ENDPOINTS.COMMENTS(boardId), 'GET');
  return response;
};

// 댓글 작성
export const createComment = async (fetchData, boardId, commentData) => {
  const response = await fetchData(API_ENDPOINTS.COMMENTS(boardId), 'POST', commentData);
  return response;
};

// 댓글 수정 (boardId도 함께 전달)
export const updateComment = async (fetchData, boardId, commentId, content) => {
  const response = await fetchData(API_ENDPOINTS.COMMENT_UPDATE(boardId, commentId), 'PATCH', content);
  return response;
};

// 댓글 삭제 (boardId도 함께 전달)
export const deleteComment = async (fetchData, boardId, commentId) => {
  await fetchData(API_ENDPOINTS.COMMENT_DELETE(boardId, commentId), 'DELETE');
  return { success: true };
};

// 댓글 좋아요 토글 (boardId 필요)
export const toggleCommentLike = async (fetchData, boardId, commentId) => {
  const response = await fetchData(API_ENDPOINTS.COMMENT_LIKE(boardId, commentId), 'POST');
  return response;
};

export { BOARD_TYPE };