import { useRef, useMemo, useEffect } from 'react';

function debounce(fn, delay) {
	let timer;
	return (...args) => {
		clearTimeout(timer);
		timer = setTimeout(() => fn(...args), delay);
	};
}

export function useDebounce(callback, delay = 500) {
	const callbackRef = useRef();

	const debouncedCallback = useMemo(() => {
		return debounce(() => callbackRef.current(), delay);
	}, [delay]);

	useEffect(() => {
		callbackRef.current = callback;
	}, [callback]);

	return debouncedCallback;
}
