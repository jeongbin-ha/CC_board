
import { useState, useEffect, useCallback, useRef } from 'react';
import useResponsive from '@/pages/board/hooks/useResponsive';
import useCustomFetch from '@/utils/hooks/useCustomFetch';
import * as boardApi from '@/pages/board/api/boardApi.js';
import * as imageApi from '@/pages/board/api/imageApi.js';
import * as authApi from '@/pages/board/api/authApi.js';

const usePosts = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);
  const [userType, setUserType] = useState('normalUser');
  const isPC = useResponsive();
  
  // useCustomFetch 훅 사용
  const { fetchData } = useCustomFetch();
  
  // fetchData가 매번 새로 생성되는 것을 방지
  const fetchDataRef = useRef(fetchData);
  fetchDataRef.current = fetchData;

  // 현재 사용자 정보 로드
  const loadCurrentUser = useCallback(async () => {
    try {
      const userInfo = await authApi.getCurrentUser(fetchDataRef.current);
      if (userInfo) {
        setCurrentUser(userInfo);
        setUserType('registerUser');
      }
    } catch (error) {
      console.error('사용자 정보 로드 실패:', error);
    }
  }, []); 

  // 컴포넌트 마운트 시 사용자 정보 로드
  useEffect(() => {
    loadCurrentUser();
  }, [loadCurrentUser]);

  // API 응답 데이터 변환
  const transformBoardData = useCallback((apiBoard) => {
    return {
      id: apiBoard.boardId,
      title: apiBoard.title,
      content: apiBoard.content,
      author: apiBoard.writer,
      date: new Date(apiBoard.createdAt).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).replace(/\. /g, '.').replace('.', ''),
      likes: apiBoard.likeCount,
      comments: apiBoard.commentCount,
      category: apiBoard.boardType.toLowerCase() === 'normal' ? 'general' : 'promotion',
      isHot: apiBoard.likeCount >= 10,
      image: apiBoard.imgUrls || [],
      userId: apiBoard.memberId,
      createdAt: apiBoard.createdAt,
      updatedAt: apiBoard.updatedAt,
      isLiked: apiBoard.liked || false
    };
  }, []);

  // 댓글 데이터 변환
  const transformCommentData = useCallback((apiComment, boardId, depth = 0) => {
    const transformed = {
      id: apiComment.commentId,
      boardId: boardId,
      author: apiComment.writer,
      content: apiComment.deleted ? '삭제된 댓글입니다.' : apiComment.content,
      date: apiComment.createdAt ? 
        new Date(apiComment.createdAt).toLocaleDateString('ko-KR', { 
          month: '2-digit', 
          day: '2-digit' 
        }) : 
        new Date().toLocaleDateString('ko-KR', { 
          month: '2-digit', 
          day: '2-digit' 
        }),
      userId: apiComment.memberId || 'unknown',
      replyLevel: depth,
      parentId: apiComment.parentId,
      likes: apiComment.likeCount || 0,
      isLiked: apiComment.liked || false,
      isDeleted: apiComment.deleted || false,
      children: []
    };

    if (apiComment.children && apiComment.children.length > 0) {
      transformed.children = apiComment.children.map(child => 
        transformCommentData(child, boardId, depth + 1)
      );
    }

    return transformed;
  }, []);

  // 댓글을 평면 배열로 변환
  const flattenComments = useCallback((comments, boardId) => {
    const result = [];
    
    const flatten = (commentList, level = 0) => {
      commentList.forEach(comment => {
        result.push({ ...comment, replyLevel: level });
        if (comment.children && comment.children.length > 0) {
          flatten(comment.children, level + 1);
        }
      });
    };
    
    flatten(comments);
    return result;
  }, []);

  // 글작성 권한확인
  const canCreatePost = useCallback((category) => {
    if (category === 'promotion') {
      return userType === 'registerUser';
    }
    return true;
  }, [userType]);

  // 게시글 목록 로드
  const loadPosts = useCallback(async (category = 'general', pageNum = 0, reset = false) => {
    if (loading) return;
    
    setLoading(true);
    try {
      const pageSize = isPC ? 6 : 20;
      let incomingPosts = [];

      if (category === 'hot') {
        const res = await boardApi.getHotBoards(fetchDataRef.current);
        const hotBoardsData = res.isSuccess ? res.result : res;
        incomingPosts = hotBoardsData.map(transformBoardData);
        setHasMore(false);
      } else {
        const res = await boardApi.getBoardList(fetchDataRef.current, category, pageNum, pageSize);
        const boardData = res.isSuccess ? res.result : res;
        incomingPosts = boardData.content.map(transformBoardData);
        setHasMore(!boardData.last);
      }

      if (reset) {
        setPosts(incomingPosts);
      } else {
        setPosts(prev => {
          const merged = [...prev, ...incomingPosts];
          return merged.filter((post, idx, self) => idx === self.findIndex(p => p.id === post.id));
        });
      }
    } catch (error) {
      console.error('게시글 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  }, [isPC, transformBoardData, loading]); 

  // 더보기 
  const loadMore = useCallback((category) => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadPosts(category, nextPage, false);
    }
  }, [loading, hasMore, page, loadPosts]);

  // 게시글 상세 조회
  const getPost = useCallback(async (id) => {
    try {
      const response = await boardApi.getBoardDetail(fetchDataRef.current, id);
      const postData = response.isSuccess ? response.result : response;
      return transformBoardData(postData);
    } catch (error) {
      console.error('게시글 상세 조회 실패:', error);
      return null;
    }
  }, [transformBoardData]);

  // 댓글 목록 조회
  const getComments = useCallback(async (postId) => {
    try {
      const response = await boardApi.getComments(fetchDataRef.current, postId);
      const commentsData = response.isSuccess ? response.result : response;
      const transformedComments = commentsData.map(comment => transformCommentData(comment, postId));
      return flattenComments(transformedComments, postId);
    } catch (error) {
      console.error('댓글 조회 실패:', error);
      return [];
    }
  }, [transformCommentData, flattenComments]);

  // 게시글 작성
  const addPost = useCallback(async (postData) => {
    try {
      console.log('게시글 작성 시작:', postData);
      
      let imageRequestDTOs = [];
      
      if (postData.images && postData.images.length > 0) {
        console.log('이미지 처리 시작, 파일 수:', postData.images.length);
        
        const files = postData.images
          .filter(img => img.file instanceof File)
          .map(img => img.file);
        
        if (files.length > 0) {
          imageRequestDTOs = await imageApi.processImagesForCreate(fetchDataRef.current, files);
          console.log('이미지 처리 완료:', imageRequestDTOs);
        }
      }

      const boardData = {
        title: postData.title,
        content: postData.content,
        boardType: boardApi.BOARD_TYPE[postData.category] || 'NORMAL',
        imageRequestDTOs
      };

      console.log('게시글 API 호출:', boardData);
      const response = await boardApi.createBoard(fetchDataRef.current, boardData);
      console.log('게시글 작성 완료:', response);
      
      const createdPostData = response.isSuccess ? response.result : response;
      return transformBoardData(createdPostData);
    } catch (error) {
      console.error('게시글 작성 실패:', error);
      throw error;
    }
  }, [transformBoardData]);

  // 게시글 수정
  const updatePost = useCallback(async (postId, updates) => {
    try {
      console.log('게시글 수정 시작:', { postId, updates });
      
      const existingImages = updates.images?.filter(img => !img.file && img.url) || [];
      const newFiles = updates.images?.filter(img => img.file instanceof File).map(img => img.file) || [];
      
      console.log('기존 이미지:', existingImages.length, '새 파일:', newFiles.length);
      
      const imageRequestDTOs = await imageApi.processImagesForUpdate(fetchDataRef.current, existingImages, newFiles);
      console.log('수정용 이미지 처리 완료:', imageRequestDTOs);
      
      const boardData = {
        title: updates.title,
        content: updates.content,
        boardType: boardApi.BOARD_TYPE[updates.category] || 'NORMAL',
        imageRequestDTOs
      };
      
      console.log('게시글 수정 API 호출:', boardData);
      const response = await boardApi.updateBoard(fetchDataRef.current, postId, boardData);
      console.log('게시글 수정 완료:', response);
      
      const updatedPostData = response.isSuccess ? response.result : response;
      return transformBoardData(updatedPostData);
    } catch (error) {
      console.error('게시글 수정 실패:', error);
      throw error;
    }
  }, [transformBoardData]);

  // 게시글 삭제
  const deletePost = useCallback(async (postId) => {
    try {
      await boardApi.deleteBoard(fetchDataRef.current, postId);
      return { success: true };
    } catch (error) {
      console.error('게시글 삭제 실패:', error);
      throw error;
    }
  }, []);

  // 게시글 좋아요 토글
  const togglePostLike = useCallback(async (postId) => {
    try {
      await boardApi.toggleBoardLike(fetchDataRef.current, postId);
      return { success: true };
    } catch (error) {
      console.error('게시글 좋아요 실패:', error);
      throw error;
    }
  }, []);

  // 댓글 추가
  const addComment = useCallback(async (postId, commentData) => {
    try {
      const response = await boardApi.createComment(fetchDataRef.current, postId, {
        content: commentData.content,
        parentCommentId: commentData.parentId || null
      });
      
      const commentResult = response.isSuccess ? response.result : response;
      return {
        id: commentResult.commentId,
        boardId: commentResult.boardId,
        author: commentResult.writer,
        content: commentResult.content,
        date: new Date().toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' }),
        userId: currentUser?.id || 'currentUser',
        replyLevel: commentData.replyLevel || 0,
        parentId: commentResult.parentId,
        likes: 0,
        isLiked: false
      };
    } catch (error) {
      console.error('댓글 작성 실패:', error);
      throw error;
    }
  }, [currentUser]);

  // 댓글 수정
  const updateComment = useCallback(async (postId, commentId, updates) => {
    try {
      const response = await boardApi.updateComment(fetchDataRef.current, postId, commentId, updates.content);
      const commentResult = response.isSuccess ? response.result : response;
      return {
        id: commentResult.commentId,
        content: commentResult.content,
        writer: commentResult.writer
      };
    } catch (error) {
      console.error('댓글 수정 실패:', error);
      throw error;
    }
  }, []);

  // 댓글 삭제
  const deleteComment = useCallback(async (postId, commentId) => {
    try {
      await boardApi.deleteComment(fetchDataRef.current, postId, commentId);
      return { success: true };
    } catch (error) {
      console.error('댓글 삭제 실패:', error);
      throw error;
    }
  }, []);

  // 댓글 좋아요 토글
  const toggleCommentLike = useCallback(async (postId, commentId) => {
    try {
      const result = await boardApi.toggleCommentLike(fetchDataRef.current, postId, commentId);
      const likeResult = result.isSuccess ? result.result : result;
      return { 
        success: true, 
        liked: likeResult === 1,
        likeChange: likeResult 
      };
    } catch (error) {
      console.error('댓글 좋아요 실패:', error);
      throw error;
    }
  }, []);

  // 검색 함수 
  const searchPosts = useCallback(async (keyword, category = 'general', page = 0, size = 20) => {
    try {
      setLoading(true);
      const searchSize = size || (isPC ? 6 : 20);
      const response = await boardApi.searchBoards(fetchDataRef.current, keyword, category, page, searchSize);
      const searchData = response.isSuccess ? response.result : response;
      const searchResults = searchData.content.map(transformBoardData);
      
      setPosts(searchResults);
      setHasMore(!searchData.last);
      return searchResults;
    } catch (error) {
      console.error('게시글 검색 실패:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [isPC, transformBoardData]);

  // 내 게시글/댓글인지 확인하는 헬퍼 함수들
  const isMyPost = useCallback((post) => {
    return currentUser && post?.userId === currentUser?.id;
  }, [currentUser]);

  const isMyComment = useCallback((comment) => {
    return currentUser && comment?.userId === currentUser?.id;
  }, [currentUser]);

  return {
    // 상태값들
    posts,
    loading,
    hasMore,
    userType,
    currentUser,
    
    // 기본 게시글 함수들
    canCreatePost,
    loadPosts,
    loadMore,
    setPage,
    getPost,
    addPost,
    updatePost,
    deletePost,
    togglePostLike,
    searchPosts,
    
    // 댓글 관련 함수들
    getComments,
    addComment,
    updateComment,
    deleteComment,
    toggleCommentLike,
    
    // 권한 확인 헬퍼 함수들
    isMyPost,
    isMyComment,
    loadCurrentUser
  };
};

export default usePosts;