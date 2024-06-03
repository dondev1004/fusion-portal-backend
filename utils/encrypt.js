const crypto = require('crypto');

exports.encryptSha256 = (message) => {
    return crypto.createHash('sha256').update(message).digest('hex');
}

exports.encryptMd5 = async (message) => {
    return crypto.createHash('md5').update(message).digest('hex');
}