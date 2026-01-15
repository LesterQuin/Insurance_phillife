export const success = (res, data, message = 'Success', statusCode = 200) =>
    res.status(statusCode).json({ message, data });

export const error = (res, message = 'Server Error', statusCode = 500) =>
    res.status(statusCode).json({ message });
