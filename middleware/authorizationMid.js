const { resCode, resMessage } = require('../utils/resCode');
const { isEmpty } = require('../utils/isEmpty');
const { userRole } = require('../utils/userRole');

exports.checkAdmin = async (req, res, next) => {
    const { user } = req;

    if (isEmpty(user)) return res.status(resCode.UNAUTHORIZED).json({ msg: resMessage.UNAUTHORIZED });

    if (user.group_level < userRole.ADMIN - 1)
        return res.status(resCode.NO_PERMISSION).json({ msg: resMessage.NO_PERMISSION });

    next();
}
