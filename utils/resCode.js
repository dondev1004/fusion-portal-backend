const resCode = {
    SUCCESS: 200,
    CREATED: 201,

    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    UNAUTHENTICATED: 402,
    FORBIDDEN: 403,
    NO_EXIST: 404,
    NO_PERMISSION: 405,
    VALIDATION_ERROR: 406,
    ALREADY_EXIST: 407,
    UNREGISTER_USER: 408,

    INVALID_USER: 410,
    PASSWORD_NOT_EQUAL: 411,
    USER_NOT_VERIFIED: 412,

    VERIFY_CODE_INCORRECT: 413,
    USER_IS_BANNED: 414,
    CURRENT_PASSWORD_INCORRECT: 415,

    ALREADY_LOGIN: 417,
    SERVER_ERROR: 500,
};

const resMessage = {
    BAD_REQUEST: "Bad request!",
    FORBIDDEN: "Not token provided",
    NO_PERMISSION: "Access Denied",
    UNAUTHENTICATED: "Unauthenticated!",
    UNAUTHORIZED: "Unauthorized!",
    NO_EXIST: "No Exist",
    CREATED: "Created Success",
    SUCCESS: "Success",
    INVALID_USER: "Username or Password is incorrect",
    UNREGISTER_USER: 'The user is not registered',
    CURRENT_PASSWORD_INCORRECT: "Current Password is incorrect",
    PASSWORD_NOT_EQUAL: "Confirm password must be equal with password",
    ALREADY_EXIST: "The Email already exist",
    NOT_EMAIL: "The Email is not correct email format",
    USER_NOT_VERIFIED: "This user is not verified",
    VERIFY_CODE_INCORRECT: "Verification code is incorrect",
    USER_IS_BANNED: "User is not active",
    CREATE_FAILED: "Create failed",
    UPDATE_FAILED: "Update failed",
    DELETE_FAILED: "Delete failed",
    ALREADY_LOGIN: "User is already logged in.",
    CHECK_ALL_FIELD: 'Please enter all fields',
    NOT_PASSWORD: 'Password must be 10 characters and include Number, Lowercase, Uppercase, Special',
    SERVER_ERROR: 'Interal server error',
};

module.exports = {
    resCode,
    resMessage,
};
