const validator = require('validator');

exports.checkDomain = (domain) => {
    return domain && validator.isFQDN(domain);
}