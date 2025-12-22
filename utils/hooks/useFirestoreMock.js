// hooks/useFirestoreMock.js
import { useState } from 'react';

export const useFirestoreMock = (collection) => {
	const [response, setResponse] = useState({
		document: null,
		isPending: false,
		error: null,
		success: null,
	});

	const addDocument = async (doc) => {
		setResponse({ ...response, isPending: true });
		try {
			// 실제 DB 없이 그냥 console.log
			console.log(`[${collection}]에 저장됨:`, doc);

			// 상태 업데이트
			setResponse({
				document: doc,
				isPending: false,
				success: true,
				error: null,
			});
		} catch (err) {
			setResponse({
				document: null,
				isPending: false,
				success: false,
				error: err.message,
			});
		}
	};

	return { addDocument, response };
};
