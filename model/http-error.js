class HttpError extends Error {
	constructor(message, errorCode) {
		super(message);
		this.code = errorCode || 500;
	}
}

module.exports = HttpError;
