exports.checkPassword = (password) => {
    return password.length > 10
        && /[0-9]/.test(password)
        && /[a-z]/.test(password)
        && /[A-Z]/.test(password)
        && /[^a-zA-Z0-9]/.test(password);
}