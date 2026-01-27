import '@testing-library/jest-dom';

// jsdom in the test environment may not implement scrollIntoView
// Provide a no-op implementation to avoid errors in components that call it
if (typeof window !== 'undefined' && !('scrollIntoView' in Element.prototype)) {
	// @ts-ignore
	Element.prototype.scrollIntoView = function () { /* no-op for tests */ };
}
