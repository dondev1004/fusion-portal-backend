const { verifyToken } = require('../utils/tokenGenerators');
const { prisma } = require('../utils/prisma');
const { resCode, resMessage } = require('../utils/resCode');
const { isEmpty } = require('../utils/isEmpty');

exports.isValidToken = async (req, res, next) => {
    const token = req.headers.authorization;
    if (isEmpty(token)) return res.status(resCode.FORBIDDEN).json({ msg: resMessage.FORBIDDEN });

    try {
        const decoded = await verifyToken(token);
        if (isEmpty(decoded))
            return res.status(resCode.UNAUTHENTICATED).json({ msg: resMessage.UNAUTHENTICATED });

        // Get the user
        const user = await prisma.view_users.findUnique({ where: { user_uuid: decoded.id } });

        if (isEmpty(user))
            return res.status(resCode.UNREGISTER_USER).json({ msg: resMessage.UNREGISTER_USER });

        if (user.user_enabled !== 'true') return res.status(resCode.USER_IS_BANNED).json(resMessage.USER_IS_BANNED);

        // Set the user
        req.user = user;

        next();
    } catch (err) {
        console.log(err);
        return res.status(resCode.SERVER_ERROR).json({ msg: err });
    }
}
